"""
Adaptive RAG 実験
質問の種類に応じて「検索する/しない」を判断するルーターを作る。

※ LangGraphを使った本格実装はPhase 2で行う。
   ここでは概念を理解するためのシンプルな実装。
   LLM APIが必要な部分はコメントで記載。
"""

from enum import Enum

# =============================================================
# 質問ルーティングの概念
# =============================================================

class RouteType(Enum):
    """質問のルーティング先"""
    RAG = "RAG検索"          # 文書に答えがある → ベクトル検索
    LLM_DIRECT = "直接回答"   # LLMの知識で答えられる → 検索不要
    WEB_SEARCH = "Web検索"   # 最新情報が必要 → Web検索API


# =============================================================
# ルールベースのルーター（LLM不要版）
# =============================================================
def rule_based_router(query: str) -> RouteType:
    """
    キーワードベースの簡易ルーター。
    本番ではLLMで分類するが、概念理解のためにルールベースで実装。
    """
    # 最新情報を求めるキーワード
    web_keywords = ["最新", "今日", "ニュース", "現在", "2024", "2025", "2026", "株価", "天気"]
    # 一般知識で答えられるキーワード
    general_keywords = ["とは", "意味", "定義", "何ですか", "教えて"]

    query_lower = query.lower()

    for kw in web_keywords:
        if kw in query_lower:
            return RouteType.WEB_SEARCH

    # 文書固有の質問（社内文書、プロジェクト固有の情報）
    doc_keywords = ["仕様", "設計", "ドキュメント", "マニュアル", "手順", "規約"]
    for kw in doc_keywords:
        if kw in query_lower:
            return RouteType.RAG

    # それ以外は直接回答を試みる
    return RouteType.LLM_DIRECT


# =============================================================
# テスト
# =============================================================
test_queries = [
    # RAGに振り分けるべき質問
    ("プロジェクトの設計ドキュメントにある認証フローを教えて", RouteType.RAG),
    ("社内のコーディング規約でインデントは何スペース？", RouteType.RAG),
    ("デプロイ手順のマニュアルを見せて", RouteType.RAG),

    # LLM直接回答に振り分けるべき質問
    ("Pythonのリスト内包表記の書き方は？", RouteType.LLM_DIRECT),
    ("HTTPステータスコード404とは何ですか？", RouteType.LLM_DIRECT),
    ("1 + 1 は？", RouteType.LLM_DIRECT),

    # Web検索に振り分けるべき質問
    ("2026年のPython最新バージョンは？", RouteType.WEB_SEARCH),
    ("今日のBitcoinの株価は？", RouteType.WEB_SEARCH),
    ("最新のLangChainのリリースノートは？", RouteType.WEB_SEARCH),
]

print("=" * 60)
print(" Adaptive RAG — ルーティング実験")
print("=" * 60)

correct = 0
total = len(test_queries)

for query, expected in test_queries:
    result = rule_based_router(query)
    is_correct = result == expected
    correct += is_correct
    marker = "✓" if is_correct else "✗"

    print(f"\n  {marker} 「{query}」")
    print(f"    期待: {expected.value} → 結果: {result.value}")

print(f"\n  正解率: {correct}/{total} ({correct/total*100:.0f}%)")


# =============================================================
# LLMベースのルーター（APIキーがある場合）
# =============================================================
# from langchain_openai import ChatOpenAI
# from pydantic import BaseModel, Field
#
# class RouteQuery(BaseModel):
#     """質問のルーティング結果"""
#     route: str = Field(
#         description="ルーティング先: 'rag', 'llm_direct', 'web_search' のいずれか"
#     )
#     reason: str = Field(description="ルーティングの理由")
#
# llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
# structured_llm = llm.with_structured_output(RouteQuery)
#
# def llm_router(query: str) -> RouteQuery:
#     prompt = f"""以下の質問を分類してください。
#
# - rag: 社内文書やプロジェクト固有の情報に答えがある場合
# - llm_direct: 一般的な知識で答えられる場合
# - web_search: 最新の情報やリアルタイムのデータが必要な場合
#
# 質問: {query}
# """
#     return structured_llm.invoke(prompt)


# =============================================================
# LangGraphを使ったAdaptive RAG（Phase 2 の予告）
# =============================================================
# Phase 2では、このルーターをLangGraphのConditional Edgeとして組み込み、
# ルーティング結果に応じて異なるノードに遷移する状態グラフを作る。
#
# from langgraph.graph import StateGraph
#
# def route_question(state):
#     route = llm_router(state["query"])
#     return route.route
#
# graph = StateGraph(State)
# graph.add_conditional_edges(
#     "router",
#     route_question,
#     {
#         "rag": "retrieve",
#         "llm_direct": "generate",
#         "web_search": "web_search",
#     }
# )


print(f"\n{'=' * 60}")
print(" まとめ")
print(f"{'=' * 60}")
print("""
  Adaptive RAGの3つのルーティング先:

  ┌──────────┐     RAG      ┌──────────────┐
  │          │──────────────→│ ベクトル検索  │
  │  質問    │  LLM Direct  ┌──────────────┐
  │ ルーター  │──────────────→│ LLM直接回答  │
  │          │  Web Search  ┌──────────────┐
  │          │──────────────→│ Web検索API   │
  └──────────┘              └──────────────┘

  本番ではLLM（Structured Output）でルーティングし、
  LangGraphで状態遷移を管理する。
""")
