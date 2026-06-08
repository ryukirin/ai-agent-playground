"""
Error Feedback Loop（自己修復）
ツール実行の失敗を検知し、エラー内容をLLMに渡して修正・再実行する。
"""

from typing import TypedDict
from langgraph.graph import StateGraph, END
import random

# =============================================================
# State
# =============================================================
class ToolState(TypedDict):
    task: str               # 実行したいタスク
    tool_input: str         # ツールへの入力
    tool_output: str        # ツールの出力
    error: str              # エラーメッセージ
    retry_count: int
    max_retries: int
    status: str             # "success" / "error" / "max_retries_exceeded"


# =============================================================
# シミュレーション用: 失敗するツール
# =============================================================
class FlakyAPI:
    """
    意図的にエラーを起こすAPI（シミュレーション用）。
    3種類のエラーパターンを再現する。
    """

    def __init__(self):
        self.call_count = 0
        self.errors = [
            # 1回目: タイムアウト
            ("TimeoutError", "API request timed out after 30 seconds"),
            # 2回目: 不正な入力
            ("ValidationError", "Invalid parameter: 'date' must be in YYYY-MM-DD format, got '2026/04/15'"),
            # 3回目: 成功
            None,
        ]

    def call(self, input_data: str) -> tuple[bool, str]:
        """API呼び出し。(success, result_or_error) を返す"""
        idx = min(self.call_count, len(self.errors) - 1)
        self.call_count += 1

        if self.errors[idx] is None:
            return True, f"成功: {input_data} のデータを取得しました。"
        else:
            error_type, error_msg = self.errors[idx]
            return False, f"{error_type}: {error_msg}"


api = FlakyAPI()


# =============================================================
# Nodes
# =============================================================
def execute_tool(state: ToolState) -> dict:
    """ツールを実行するノード"""
    print(f"  [Execute] ツール実行 (試行 {state['retry_count'] + 1})")
    print(f"    入力: {state['tool_input']}")

    success, result = api.call(state["tool_input"])

    if success:
        print(f"    → 成功: {result}")
        return {"tool_output": result, "error": "", "status": "success"}
    else:
        print(f"    → エラー: {result}")
        return {"tool_output": "", "error": result, "status": "error"}


def analyze_error(state: ToolState) -> dict:
    """
    エラーを分析し、修正策を提案するノード。
    本番ではLLMがエラーメッセージを解析して修正案を生成する。
    """
    error = state["error"]
    print(f"  [Analyze] エラー分析中...")
    print(f"    エラー: {error}")

    # シミュレーション: エラー種類に応じた修正
    if "TimeoutError" in error:
        fix = "タイムアウト → リトライ（入力は変更なし）"
        new_input = state["tool_input"]  # 同じ入力で再試行
    elif "ValidationError" in error:
        fix = "バリデーションエラー → 日付フォーマットをYYYY-MM-DDに修正"
        # エラーメッセージから修正方法を推測して入力を修正
        new_input = state["tool_input"].replace("2026/04/15", "2026-04-15")
    elif "RateLimitError" in error:
        fix = "レート制限 → 待機後にリトライ"
        new_input = state["tool_input"]
    else:
        fix = "不明なエラー → 入力を変えずにリトライ"
        new_input = state["tool_input"]

    print(f"    修正策: {fix}")
    print(f"    修正後の入力: {new_input}")

    return {
        "tool_input": new_input,
        "retry_count": state["retry_count"] + 1,
    }


# 本番用のLLMエラー分析（コメント）
# def llm_analyze_error(state: ToolState) -> dict:
#     prompt = f"""ツール実行でエラーが発生しました。
#
# タスク: {state['task']}
# 入力: {state['tool_input']}
# エラー: {state['error']}
#
# エラーの原因を分析し、修正した入力を生成してください。
# """
#     result = llm.with_structured_output(FixPlan).invoke(prompt)
#     return {"tool_input": result.fixed_input, "retry_count": state["retry_count"] + 1}


def should_retry(state: ToolState) -> str:
    """Conditional Edge: 成功/再試行/諦め"""
    if state["status"] == "success":
        return "success"
    elif state["retry_count"] >= state["max_retries"]:
        print(f"  [Decision] 最大再試行回数に到達。諦めます。")
        return "give_up"
    else:
        return "retry"


# =============================================================
# グラフの構築
# =============================================================
workflow = StateGraph(ToolState)

workflow.add_node("execute", execute_tool)
workflow.add_node("analyze", analyze_error)

workflow.set_entry_point("execute")

workflow.add_conditional_edges(
    "execute",
    should_retry,
    {
        "success": END,
        "retry": "analyze",
        "give_up": END,
    }
)
workflow.add_edge("analyze", "execute")  # 修正後に再実行

app = workflow.compile()

# =============================================================
# 実行
# =============================================================
print("=" * 60)
print(" Error Feedback Loop — 自己修復デモ")
print("=" * 60)
print()
print("Mermaid図:")
print(app.get_graph().draw_mermaid())

print(f"\n{'=' * 60}")
print(f" 実行: 3回のAPI呼び出し（2回失敗 → 1回成功）")
print(f"{'=' * 60}")

result = app.invoke({
    "task": "2026年4月15日の売上データを取得する",
    "tool_input": "fetch_sales date=2026/04/15",
    "tool_output": "",
    "error": "",
    "retry_count": 0,
    "max_retries": 5,
    "status": "",
})

print(f"\n  [最終結果]")
print(f"    ステータス: {result['status']}")
print(f"    出力: {result['tool_output']}")
print(f"    試行回数: {result['retry_count'] + 1}")

print(f"\n{'=' * 60}")
print(" 3種類のエラーパターンと対処")
print(f"{'=' * 60}")
print("""
  1. TimeoutError（タイムアウト）
     対処: 同じ入力でリトライ。バックオフを入れるとさらに良い。

  2. ValidationError（バリデーションエラー）
     対処: エラーメッセージから修正方法を推測し、入力を修正して再試行。
     例: 日付フォーマットの修正 (2026/04/15 → 2026-04-15)

  3. RateLimitError（レート制限）
     対処: 一定時間待機してからリトライ。指数バックオフが有効。

  ★ 重要: LLMにエラーメッセージを渡すことで、
     人間が書くif-elseでは対応できない未知のエラーにも対応できる。
""")
