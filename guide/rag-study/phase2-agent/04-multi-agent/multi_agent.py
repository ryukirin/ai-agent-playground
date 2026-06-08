"""
Multi-Agent（複数エージェント協調）
Supervisor/Workerパターンで3つのエージェントが協調してレポートを生成する。

構成:
  Supervisor: タスクの割り振りと最終判断
  Researcher: 情報収集
  Writer:     文章生成
  Critic:     品質チェック
"""

from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END

# =============================================================
# State
# =============================================================
class MultiAgentState(TypedDict):
    topic: str                  # レポートのテーマ
    research: str               # リサーチ結果
    draft: str                  # ドラフト
    feedback: str               # クリティックのフィードバック
    final_report: str           # 最終レポート
    current_agent: str          # 現在のエージェント
    iteration: int              # 反復回数
    max_iterations: int         # 最大反復回数
    status: str                 # "in_progress" / "approved" / "done"


# =============================================================
# Agent Nodes
# =============================================================
def supervisor(state: MultiAgentState) -> dict:
    """
    Supervisor: 全体の進行を管理し、次のエージェントを決定する。
    """
    print(f"\n  [Supervisor] 状況を確認中...")

    if not state["research"]:
        print(f"    → Researcher にリサーチを依頼")
        return {"current_agent": "researcher"}
    elif not state["draft"]:
        print(f"    → Writer にドラフト作成を依頼")
        return {"current_agent": "writer"}
    elif state["status"] != "approved":
        print(f"    → Critic にレビューを依頼")
        return {"current_agent": "critic"}
    else:
        print(f"    → レポート承認済み。完了。")
        return {"current_agent": "done", "final_report": state["draft"]}


def researcher(state: MultiAgentState) -> dict:
    """
    Researcher: テーマについて情報を収集する。
    本番ではWeb検索やRAGを使う。
    """
    topic = state["topic"]
    print(f"  [Researcher] 「{topic}」について調査中...")

    # シミュレーション
    research = f"""調査結果:
- {topic}は近年急速に発展している分野である
- 主要な技術スタック: LangGraph, CrewAI, AutoGen
- 課題: 状態管理の複雑さ、エラーハンドリング、コスト管理
- 最新動向: マルチモーダル対応、長期記憶の統合"""

    print(f"    → 調査完了")
    return {"research": research, "current_agent": "supervisor"}


def writer(state: MultiAgentState) -> dict:
    """
    Writer: リサーチ結果をもとにレポートを作成する。
    """
    print(f"  [Writer] ドラフト作成中...")

    feedback = state.get("feedback", "")
    if feedback:
        print(f"    フィードバックを反映: {feedback[:50]}...")

    # シミュレーション（フィードバックがあれば改善版）
    if feedback and "具体例" in feedback:
        draft = f"""# {state['topic']} レポート

## 概要
{state['research']}

## 具体例
- LangGraphを使ったAdaptive RAGシステムの構築
- CrewAIによる論文要約ワークフロー
- AutoGenを使ったコード生成エージェント

## 結論
これらの技術を組み合わせることで、実用的なAIエージェントが構築できる。"""
    else:
        draft = f"""# {state['topic']} レポート

## 概要
{state['research']}

## 結論
今後さらなる発展が期待される。"""

    print(f"    → ドラフト完了 ({len(draft)}文字)")
    return {"draft": draft, "current_agent": "supervisor"}


def critic(state: MultiAgentState) -> dict:
    """
    Critic: ドラフトの品質をチェックし、フィードバックを返す。
    """
    print(f"  [Critic] レビュー中...")
    draft = state["draft"]
    iteration = state["iteration"]

    # シミュレーション: 1回目は不合格、2回目で合格
    if iteration == 0 and "具体例" not in draft:
        feedback = "具体例が不足している。各技術スタックの具体的なユースケースを追加してください。"
        status = "in_progress"
        print(f"    → 不合格: {feedback}")
    else:
        feedback = "十分な内容です。承認します。"
        status = "approved"
        print(f"    → 合格!")

    return {
        "feedback": feedback,
        "status": status,
        "iteration": iteration + 1,
        "current_agent": "supervisor",
    }


# =============================================================
# ルーティング
# =============================================================
def route_to_agent(state: MultiAgentState) -> str:
    """Supervisorの判断に基づいて次のエージェントにルーティング"""
    agent = state["current_agent"]
    if agent == "done":
        return "end"
    return agent


# =============================================================
# グラフの構築
# =============================================================
workflow = StateGraph(MultiAgentState)

workflow.add_node("supervisor", supervisor)
workflow.add_node("researcher", researcher)
workflow.add_node("writer", writer)
workflow.add_node("critic", critic)

workflow.set_entry_point("supervisor")

# Supervisor → 各エージェント or 終了
workflow.add_conditional_edges(
    "supervisor",
    route_to_agent,
    {
        "researcher": "researcher",
        "writer": "writer",
        "critic": "critic",
        "end": END,
    }
)

# 各エージェント → Supervisor に戻る
workflow.add_edge("researcher", "supervisor")
workflow.add_edge("writer", "supervisor")
workflow.add_edge("critic", "supervisor")

app = workflow.compile()

# =============================================================
# 実行
# =============================================================
print("=" * 60)
print(" Multi-Agent — Supervisor/Worker パターン")
print("=" * 60)
print()
print("Mermaid図:")
print(app.get_graph().draw_mermaid())

print(f"\n{'=' * 60}")
print(f" 実行: レポート生成ワークフロー")
print(f"{'=' * 60}")

result = app.invoke({
    "topic": "AIエージェント開発の最前線",
    "research": "",
    "draft": "",
    "feedback": "",
    "final_report": "",
    "current_agent": "",
    "iteration": 0,
    "max_iterations": 3,
    "status": "in_progress",
})

print(f"\n{'=' * 60}")
print(f" 最終レポート")
print(f"{'=' * 60}")
print(result["final_report"])

print(f"\n{'=' * 60}")
print(" アーキテクチャ")
print(f"{'=' * 60}")
print("""
  Supervisor/Worker パターン:

       ┌──────────────┐
       │  Supervisor   │ ← 全体を管理、次のエージェントを決定
       └──────┬───────┘
              │
     ┌────────┼────────┐
     ↓        ↓        ↓
  Researcher  Writer   Critic
     │        │        │
     └────────┼────────┘
              │
              ↓
          Supervisor（に戻る）

  メッセージパッシング:
  - 各エージェントは State を通じてデータを共有
  - Supervisor が State を見て次のアクションを決定
  - Critic のフィードバックが Writer に反映される
""")
