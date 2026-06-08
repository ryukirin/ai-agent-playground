"""
Hybrid Search 比較実験
BM25（キーワード検索）と Semantic Search（ベクトル検索）を組み合わせ、
片方では拾えないケースをカバーする。
"""

import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

# =============================================================
# サンプル文書
# =============================================================
documents = [
    "FastAPIはPythonの高速なWebフレームワークで、Starletteをベースにしている。",
    "Djangoは大規模なWebアプリケーションに適したフルスタックフレームワークである。",
    "FlaskはPythonの軽量なマイクロフレームワークで、拡張性が高い。",
    "React.jsはFacebook（Meta）が開発したJavaScriptのUIライブラリである。",
    "TypeScriptはJavaScriptに型システムを追加した言語で、大規模開発に向いている。",
    "PostgreSQLはオープンソースのリレーショナルデータベースで、JSON型もサポートする。",
    "Redisはインメモリのキーバリューストアで、キャッシュやセッション管理に使われる。",
    "DockerはコンテナベースのLinuxアプリケーション実行環境である。",
    "KubernetesはDockerコンテナのオーケストレーションツールである。",
    "Starlette は ASGI フレームワークで、非同期処理に優れたPythonライブラリである。",
]

# =============================================================
# 検索クエリ
# =============================================================
queries = [
    # ケース1: キーワード検索が得意（固有名詞 "Starlette" が直接ある）
    "Starletteを使ったフレームワークは？",
    # ケース2: 意味検索が得意（"高速なAPI開発" → FastAPI の意味的関連）
    "Pythonで高速なAPI開発に向いているのは？",
    # ケース3: 両方必要（"コンテナ管理" → Docker/Kubernetes の意味 + 固有名詞）
    "Dockerコンテナを管理するツールは？",
]

# 各クエリの正解
ground_truth = [
    [0, 9],   # Starlette → FastAPI, Starlette本体
    [0],      # 高速なAPI → FastAPI
    [8],      # コンテナ管理 → Kubernetes
]


# =============================================================
# Embeddingモデル
# =============================================================
print("⏳ Embeddingモデルを読み込み中...")
model = SentenceTransformer("intfloat/multilingual-e5-base")


def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


# =============================================================
# 1. BM25 検索（キーワードベース）
# =============================================================
def bm25_search(query: str, top_k: int = 3) -> list[tuple[int, float]]:
    """BM25によるキーワード検索"""
    # 日本語は文字単位で分割（簡易的なトークナイズ）
    tokenized_docs = [list(doc) for doc in documents]
    tokenized_query = list(query)
    bm25 = BM25Okapi(tokenized_docs)
    scores = bm25.get_scores(tokenized_query)
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]


# =============================================================
# 2. Semantic 検索（ベクトルベース）
# =============================================================
doc_vecs = model.encode(documents)


def semantic_search(query: str, top_k: int = 3) -> list[tuple[int, float]]:
    """ベクトル検索"""
    q_vec = model.encode(query)
    scores = [cosine_similarity(q_vec, dv) for dv in doc_vecs]
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]


# =============================================================
# 3. Hybrid Search（Reciprocal Rank Fusion で統合）
# =============================================================
def hybrid_search(query: str, top_k: int = 3, rrf_k: int = 60) -> list[tuple[int, float]]:
    """
    Reciprocal Rank Fusion (RRF) で BM25 と Semantic の結果を統合する。
    RRFスコア = Σ 1 / (k + rank) で各検索結果のランクを統合。
    """
    bm25_results = bm25_search(query, top_k=len(documents))
    sem_results = semantic_search(query, top_k=len(documents))

    # 各文書のRRFスコアを計算
    rrf_scores = {}
    for rank, (idx, _) in enumerate(bm25_results):
        rrf_scores[idx] = rrf_scores.get(idx, 0) + 1.0 / (rrf_k + rank + 1)
    for rank, (idx, _) in enumerate(sem_results):
        rrf_scores[idx] = rrf_scores.get(idx, 0) + 1.0 / (rrf_k + rank + 1)

    ranked = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]


# =============================================================
# 比較実験
# =============================================================
methods = {
    "BM25（キーワード）": bm25_search,
    "Semantic（ベクトル）": semantic_search,
    "Hybrid（RRF統合）": hybrid_search,
}

for q_idx, (query, truth) in enumerate(zip(queries, ground_truth)):
    print(f"\n{'=' * 60}")
    print(f" クエリ: 「{query}」")
    print(f" 正解: {[documents[i][:30] + '...' for i in truth]}")
    print(f"{'=' * 60}")

    for method_name, search_fn in methods.items():
        results = search_fn(query, top_k=3)
        hit_indices = [idx for idx, _ in results]
        hits = sum(1 for t in truth if t in hit_indices)
        recall = hits / len(truth) * 100

        print(f"\n  {method_name} (Recall@3: {recall:.0f}%)")
        for rank, (idx, score) in enumerate(results, 1):
            marker = " ✓" if idx in truth else ""
            print(f"    {rank}. [{score:.4f}] {documents[idx][:50]}...{marker}")


# =============================================================
# サマリー
# =============================================================
print(f"\n{'=' * 60}")
print(" まとめ")
print(f"{'=' * 60}")
print("  BM25が得意:    固有名詞（Starlette）を含むクエリ")
print("  Semanticが得意: 意味的な関連（高速なAPI開発 → FastAPI）")
print("  Hybridの強み:  両方の長所を組み合わせて漏れを減らす")
print()
print("【RRF (Reciprocal Rank Fusion) とは】")
print("  各検索手法でのランク順位を逆数に変換して合算する手法。")
print("  スコアのスケールが異なるBM25とコサイン類似度を公平に統合できる。")
