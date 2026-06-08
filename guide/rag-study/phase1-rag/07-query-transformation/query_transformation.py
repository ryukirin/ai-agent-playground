"""
Query Transformation 比較実験
ユーザーの曖昧な質問を検索しやすい形に変換する3つの手法を比較する。

※ LLMによる変換が必要なため、API版はコメントで記載。
   概念理解用のシミュレーションをメインで実行する。
"""

import numpy as np
from sentence_transformers import SentenceTransformer

# =============================================================
# サンプル文書
# =============================================================
documents = [
    "FastAPIはStarletteとPydanticをベースにした高性能なPython Webフレームワークである。自動的にOpenAPIドキュメントを生成する機能を持つ。",
    "Djangoは「バッテリー同梱」の哲学を持つフルスタックフレームワークで、ORM、認証、管理画面を標準で備える。",
    "Flaskは軽量なマイクロフレームワークで、必要な機能を拡張機能として追加する設計思想を持つ。",
    "FastAPIは型ヒントを活用してリクエストのバリデーションを自動化し、開発速度を向上させる。",
    "DjangoのORMはモデル定義からSQLを自動生成し、データベース操作をPythonコードで記述できる。",
    "FastAPIは非同期処理（async/await）をネイティブにサポートし、高い並行処理性能を実現する。",
    "ExpressはNode.jsの最も人気のあるWebフレームワークで、ミドルウェアパターンを採用している。",
    "Spring BootはJavaのWebフレームワークで、設定より規約を重視する。",
]

model = SentenceTransformer("intfloat/multilingual-e5-base")
doc_vecs = model.encode(documents)


def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def search(query_text: str, top_k: int = 3) -> list[tuple[int, float]]:
    q_vec = model.encode(query_text)
    scores = [cosine_similarity(q_vec, dv) for dv in doc_vecs]
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]


def show_results(method: str, query_used: str, results: list[tuple[int, float]], truth: list[int]) -> None:
    hit_indices = [idx for idx, _ in results]
    hits = sum(1 for t in truth if t in hit_indices)
    recall = hits / len(truth) * 100
    print(f"\n  {method} (Recall@3: {recall:.0f}%)")
    print(f"  検索に使ったテキスト: 「{query_used[:60]}...」" if len(query_used) > 60 else f"  検索に使ったテキスト: 「{query_used}」")
    for rank, (idx, score) in enumerate(results, 1):
        marker = " ✓" if idx in truth else ""
        print(f"    {rank}. [{score:.4f}] {documents[idx][:50]}...{marker}")


# =============================================================
# 実験1: 曖昧なクエリ
# =============================================================
QUERY = "速くてドキュメントが自動で出るやつ"
TRUTH = [0, 3]  # FastAPI関連

print(f"{'=' * 60}")
print(f" 元のクエリ: 「{QUERY}」")
print(f" 正解: FastAPI関連 ({TRUTH})")
print(f"{'=' * 60}")

# --- 方法1: そのまま検索 ---
results_raw = search(QUERY)
show_results("そのまま検索", QUERY, results_raw, TRUTH)

# --- 方法2: HyDE（仮の回答で検索）---
# 本来はLLMが生成するが、ここではシミュレーション
hyde_answer = (
    "高速でドキュメントが自動生成されるWebフレームワークとしては、"
    "FastAPIが代表的です。FastAPIはPythonの型ヒントを活用して"
    "OpenAPIドキュメントを自動生成し、非常に高いパフォーマンスを発揮します。"
)
results_hyde = search(hyde_answer)
show_results("HyDE（仮の回答で検索）", hyde_answer, results_hyde, TRUTH)

# --- 方法3: Multi-Query（複数の質問に展開）---
# 本来はLLMが生成するが、ここではシミュレーション
multi_queries = [
    "高速なPython Webフレームワーク",
    "APIドキュメントを自動生成するフレームワーク",
    "パフォーマンスが高いWebフレームワーク",
]
# 各クエリの結果を統合（union）
all_results = {}
for mq in multi_queries:
    for idx, score in search(mq, top_k=3):
        if idx not in all_results or score > all_results[idx]:
            all_results[idx] = score
multi_ranked = sorted(all_results.items(), key=lambda x: x[1], reverse=True)[:3]
show_results(
    "Multi-Query（3つに展開して統合）",
    " / ".join(multi_queries),
    multi_ranked,
    TRUTH,
)

# --- 方法4: Step-Back Prompting（抽象化して検索）---
# 具体的な質問を一段抽象化して検索
stepback_query = "Python Webフレームワークの特徴と比較"
results_stepback = search(stepback_query)
show_results("Step-Back（抽象化して検索）", stepback_query, results_stepback, TRUTH)


# =============================================================
# まとめ
# =============================================================
print(f"\n{'=' * 60}")
print(" 各手法の特徴")
print(f"{'=' * 60}")
print("""
  HyDE（Hypothetical Document Embeddings）:
    仕組み: LLMに仮の回答を生成させ、その回答で検索する
    利点:  文書と同じ文体になるため検索精度が上がる
    弱点:  LLMが間違った仮回答を生成すると逆効果
    向き:  事実に基づく質問、技術的な質問

  Multi-Query:
    仕組み: 1つの質問を複数の視点に展開して検索、結果を統合
    利点:  1つのクエリでは漏れる文書も別のクエリで拾える
    弱点:  検索回数が増えるため遅い
    向き:  幅広い情報を集めたい場合

  Step-Back Prompting:
    仕組み: 具体的な質問を一段抽象化して検索する
    利点:  具体的すぎるクエリで検索漏れを防ぐ
    弱点:  抽象化しすぎるとノイズが増える
    向き:  「なぜ」「どのように」系の質問
""")

# =============================================================
# LLMを使った本格実装（APIキーがある場合）
# =============================================================
# from langchain_openai import ChatOpenAI
# from langchain.prompts import ChatPromptTemplate
#
# llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
#
# # HyDE
# hyde_prompt = ChatPromptTemplate.from_template(
#     "以下の質問に対する回答を書いてください（実際の知識に基づかなくてOK）:\n{query}"
# )
# hyde_chain = hyde_prompt | llm
# hypothetical_doc = hyde_chain.invoke({"query": QUERY}).content
# results = search(hypothetical_doc)
#
# # Multi-Query
# multi_prompt = ChatPromptTemplate.from_template(
#     "以下の質問を3つの異なる視点から言い換えてください。1行1クエリで出力:\n{query}"
# )
# multi_chain = multi_prompt | llm
# expanded = multi_chain.invoke({"query": QUERY}).content.split("\n")
#
# # LangChainのMultiQueryRetriever
# from langchain.retrievers.multi_query import MultiQueryRetriever
# retriever = MultiQueryRetriever.from_llm(retriever=base_retriever, llm=llm)
