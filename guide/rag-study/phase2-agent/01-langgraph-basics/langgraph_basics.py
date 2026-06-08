"""
LangGraph 基礎
State / Node / Edge / Conditional Edge の4概念を学び、
Adaptive RAGをグラフ構造で書き直す。

※ LLM APIが必要な部分はコメントで記載。
   まずはグラフ構造の概念を理解するための最小実装。
"""

from typing import TypedDict
from langgraph.graph import StateGraph, END

# =============================================================
# 概念1: State（状態）
# グラフ全体で共有されるデータ。各ノードが読み書きする。
# =============================================================
class AgentState(TypedDict):
    """エージェントの状態"""
    query: str              # ユーザーの質問
    route: str              # ルーティング結果 ("rag" / "direct" / "web")
    context: str            # 検索結果（RAGの場合）
    answer: str             # 最終回答


# =============================================================
# 概念2: Node（ノード）
# 状態を受け取り、処理して、更新された状態を返す関数。
# =============================================================
def router_node(state: AgentState) -> dict:
    """質問を分類するノード"""
    query = state["query"]

    # 簡易ルーティング（本番ではLLMで分類）
    if any(kw in query for kw in ["最新", "ニュース", "今日"]):
        route = "web"
    elif any(kw in query for kw in ["仕様", "設計", "マニュアル"]):
        route = "rag"
    else:
        route = "direct"

    print(f"  [Router] 質問: 「{query}」 → ルート: {route}")
    return {"route": route}


def rag_retrieve_node(state: AgentState) -> dict:
    """RAG検索ノード"""
    print(f"  [RAG] 文書を検索中...")
    # 本番ではベクトル検索を実行
    context = f"[検索結果] 「{state['query']}」に関連する文書が見つかりました。"
    return {"context": context}


def rag_generate_node(state: AgentState) -> dict:
    """RAG回答生成ノード"""
    print(f"  [Generate] コンテキストを使って回答生成中...")
    # 本番ではLLMで回答生成
    answer = f"検索結果に基づく回答: {state['context']}"
    return {"answer": answer}


def direct_answer_node(state: AgentState) -> dict:
    """LLM直接回答ノード"""
    print(f"  [Direct] LLMの知識で直接回答中...")
    answer = f"直接回答: 「{state['query']}」についてはLLMの知識で回答します。"
    return {"answer": answer}


def web_search_node(state: AgentState) -> dict:
    """Web検索ノード"""
    print(f"  [Web] Web検索中...")
    answer = f"Web検索結果: 「{state['query']}」の最新情報です。"
    return {"answer": answer}


# =============================================================
# 概念3 & 4: Edge（エッジ）と Conditional Edge（条件分岐）
# ノード間の接続。条件分岐で動的にルートを変える。
# =============================================================
def route_decision(state: AgentState) -> str:
    """Conditional Edge: routeの値に応じて次のノードを決定"""
    return state["route"]


# =============================================================
# グラフの構築
# =============================================================
workflow = StateGraph(AgentState)

# ノードの追加
workflow.add_node("router", router_node)
workflow.add_node("rag_retrieve", rag_retrieve_node)
workflow.add_node("rag_generate", rag_generate_node)
workflow.add_node("direct_answer", direct_answer_node)
workflow.add_node("web_search", web_search_node)

# エントリーポイント
workflow.set_entry_point("router")

# Conditional Edge: routerの結果で分岐
workflow.add_conditional_edges(
    "router",
    route_decision,
    {
        "rag": "rag_retrieve",
        "direct": "direct_answer",
        "web": "web_search",
    }
)

# 通常のEdge
workflow.add_edge("rag_retrieve", "rag_generate")
workflow.add_edge("rag_generate", END)
workflow.add_edge("direct_answer", END)
workflow.add_edge("web_search", END)

# コンパイル
app = workflow.compile()

# =============================================================
# グラフの可視化（Mermaid形式）
# =============================================================
print("=" * 60)
print(" LangGraph — Adaptive RAG グラフ構造")
print("=" * 60)
print()
print("Mermaid図:")
print(app.get_graph().draw_mermaid())

# =============================================================
# 実行テスト
# =============================================================
test_queries = [
    "設計ドキュメントの認証フローは？",
    "Pythonのリスト内包表記の書き方は？",
    "最新のPythonバージョンは？",
]

for query in test_queries:
    print(f"\n{'=' * 60}")
    print(f" 実行: 「{query}」")
    print(f"{'=' * 60}")

    result = app.invoke({
        "query": query,
        "route": "",
        "context": "",
        "answer": "",
    })
    print(f"  [結果] {result['answer']}")


# =============================================================
# まとめ
# =============================================================
print(f"\n{'=' * 60}")
print(" LangGraph の4つの概念")
print(f"{'=' * 60}")
print("""
  1. State:           グラフ全体で共有されるデータ（TypedDict）
  2. Node:            状態を受け取り処理する関数
  3. Edge:            ノード間の固定接続（A → B）
  4. Conditional Edge: 状態に応じて動的にルートを変える分岐

  これらを組み合わせて、複雑なワークフローを宣言的に記述できる。
""")
