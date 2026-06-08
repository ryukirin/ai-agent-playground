"""
Self-Reflection（自己評価ループ）
エージェントが自分の出力を評価し、不十分なら再試行する仕組み。

LangGraphでGeneration → Grading → Re-generate のループを実装する。
"""

from typing import TypedDict
from langgraph.graph import StateGraph, END

# =============================================================
# State
# =============================================================
class RAGState(TypedDict):
    query: str
    context: str
    answer: str
    grade: str           # "pass" or "fail"
    retry_count: int     # 再試行回数
    max_retries: int     # 最大再試行回数


# =============================================================
# シミュレーション用データ
# =============================================================
# 検索結果のプール（retry毎に異なる結果を返すシミュレーション）
SEARCH_POOLS = [
    # 1回目: あまり関連性のない結果
    "Pythonは1991年にGuido van Rossumによって作られた汎用プログラミング言語です。",
    # 2回目: やや関連する結果
    "Pythonの非同期処理にはasyncioモジュールが使われます。async/awaitキーワードでコルーチンを定義します。",
    # 3回目: 正確な結果
    "asyncioのイベントループはシングルスレッドで動作し、I/O待ちの間に他のコルーチンに制御を移すことで並行処理を実現します。asyncio.run()で起動し、awaitで結果を待機します。",
]


# =============================================================
# Nodes
# =============================================================
def retrieve(state: RAGState) -> dict:
    """検索ノード: retry_countに応じて異なる結果を返す"""
    idx = min(state["retry_count"], len(SEARCH_POOLS) - 1)
    context = SEARCH_POOLS[idx]
    print(f"  [Retrieve] 検索実行 (試行 {state['retry_count'] + 1})")
    print(f"    → 「{context[:50]}...」")
    return {"context": context}


def generate(state: RAGState) -> dict:
    """回答生成ノード"""
    # 本番ではLLMで回答生成
    answer = f"回答: {state['context'][:80]}..."
    print(f"  [Generate] 回答生成")
    return {"answer": answer}


def grade_answer(state: RAGState) -> dict:
    """
    回答品質を評価するノード。
    本番ではLLMが「回答が質問に答えているか」「根拠が十分か」を判定する。
    ここではシミュレーションとしてretry_countで判定。
    """
    # シミュレーション: 3回目でようやく合格
    if state["retry_count"] >= 2:
        grade = "pass"
        reason = "十分な根拠と具体的な説明が含まれている"
    elif state["retry_count"] >= 1:
        grade = "fail"
        reason = "関連はあるが具体性が不足"
    else:
        grade = "fail"
        reason = "質問に直接答えていない"

    print(f"  [Grade] 評価: {grade} — {reason}")
    return {"grade": grade, "retry_count": state["retry_count"] + 1}


# 本番用のLLMグレーダー（コメント）
# from pydantic import BaseModel, Field
# from langchain_openai import ChatOpenAI
#
# class AnswerGrade(BaseModel):
#     grade: str = Field(description="'pass' or 'fail'")
#     reason: str = Field(description="評価の理由")
#
# llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
# grader = llm.with_structured_output(AnswerGrade)
#
# def llm_grade_answer(state: RAGState) -> dict:
#     result = grader.invoke(
#         f"質問: {state['query']}\n回答: {state['answer']}\n"
#         f"コンテキスト: {state['context']}\n"
#         f"回答が質問に正確に答えており、コンテキストに根拠があるか評価してください。"
#     )
#     return {"grade": result.grade, "retry_count": state["retry_count"] + 1}


def should_retry(state: RAGState) -> str:
    """Conditional Edge: 再試行するか終了するか"""
    if state["grade"] == "pass":
        return "accept"
    elif state["retry_count"] >= state["max_retries"]:
        print(f"  [Decision] 最大再試行回数に到達。現在の回答で終了。")
        return "accept"
    else:
        print(f"  [Decision] 不合格 → 再検索・再生成")
        return "retry"


# =============================================================
# グラフの構築
# =============================================================
workflow = StateGraph(RAGState)

workflow.add_node("retrieve", retrieve)
workflow.add_node("generate", generate)
workflow.add_node("grade", grade_answer)

workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", "grade")

# ★ ループのポイント: gradeの結果で「戻る」か「終了」かを決める
workflow.add_conditional_edges(
    "grade",
    should_retry,
    {
        "retry": "retrieve",   # 不合格 → 再検索に戻る
        "accept": END,         # 合格 → 終了
    }
)

app = workflow.compile()

# =============================================================
# 可視化
# =============================================================
print("=" * 60)
print(" Self-Reflection — 自己評価ループ")
print("=" * 60)
print()
print("Mermaid図:")
print(app.get_graph().draw_mermaid())

# =============================================================
# 実行
# =============================================================
print(f"\n{'=' * 60}")
print(f" 実行: 自己評価ループのデモ")
print(f"{'=' * 60}")

result = app.invoke({
    "query": "Pythonのasyncioはどう動作する？",
    "context": "",
    "answer": "",
    "grade": "",
    "retry_count": 0,
    "max_retries": 3,
})

print(f"\n  [最終結果]")
print(f"    質問: {result['query']}")
print(f"    回答: {result['answer']}")
print(f"    評価: {result['grade']}")
print(f"    試行回数: {result['retry_count']}")

print(f"\n{'=' * 60}")
print(" ポイント")
print(f"{'=' * 60}")
print("""
  Self-Reflectionのループ構造:

    retrieve → generate → grade ─── pass ──→ END
                            │
                           fail
                            │
                            └──→ retrieve（戻る）

  重要な設計判断:
  1. 最大再試行回数を設定する（無限ループ防止）
  2. 再試行時に検索クエリを変える工夫（同じ検索では同じ結果）
  3. グレーダーの基準を明確にする（何をもって「合格」とするか）
""")
