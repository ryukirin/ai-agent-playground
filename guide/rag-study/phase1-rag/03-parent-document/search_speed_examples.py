"""
検索速度向上のための6つの技術 — 実装例

各技術を独立して学べるようにサンプルコードを集めた。
コメントアウトされた部分は必要なパッケージをインストールすれば動く。
"""

import time
import numpy as np
from sentence_transformers import SentenceTransformer

# 共通: サンプルデータ
documents = [f"これは{i}番目のサンプル文書です。Pythonについての情報を含みます。" for i in range(1000)]
QUERY = "Pythonの並行処理について教えて"


# =============================================================
# 技術1: ベクトルインデックスの最適化（Flat vs HNSW）
# =============================================================
print("=" * 60)
print(" 技術1: ベクトルインデックス (Flat vs HNSW)")
print("=" * 60)

model = SentenceTransformer("intfloat/multilingual-e5-small")
doc_vecs = model.encode(documents, show_progress_bar=False)
q_vec = model.encode(QUERY)

# --- Flat（総当たり）---
def flat_search(q_vec, doc_vecs, top_k=5):
    """全文書と類似度計算 — シンプルだが遅い"""
    scores = np.dot(doc_vecs, q_vec) / (
        np.linalg.norm(doc_vecs, axis=1) * np.linalg.norm(q_vec)
    )
    top_indices = np.argsort(-scores)[:top_k]
    return top_indices, scores[top_indices]


start = time.time()
for _ in range(100):
    flat_search(q_vec, doc_vecs)
flat_time = time.time() - start
print(f"  Flat検索: {flat_time*1000:.1f}ms (100回)")

# --- HNSW（ベクトルDBの定番）---
# pip install hnswlib
# import hnswlib
#
# dim = doc_vecs.shape[1]
# hnsw_index = hnswlib.Index(space='cosine', dim=dim)
# hnsw_index.init_index(max_elements=len(documents), ef_construction=200, M=16)
# hnsw_index.add_items(doc_vecs)
# hnsw_index.set_ef(50)  # 検索時の精度パラメータ
#
# start = time.time()
# for _ in range(100):
#     labels, distances = hnsw_index.knn_query(q_vec, k=5)
# hnsw_time = time.time() - start
# print(f"  HNSW検索: {hnsw_time*1000:.1f}ms (100回)")

# --- FAISS IVF（Facebook製ベクトル検索ライブラリ）---
# pip install faiss-cpu
# import faiss
#
# dim = doc_vecs.shape[1]
# nlist = 10  # クラスタ数
# quantizer = faiss.IndexFlatL2(dim)
# index = faiss.IndexIVFFlat(quantizer, dim, nlist)
# index.train(doc_vecs)
# index.add(doc_vecs)
# index.nprobe = 3  # 検索するクラスタ数
#
# D, I = index.search(q_vec.reshape(1, -1), k=5)

print("  → 本番ではChromaDB/Pinecone/Weaviate/Qdrantが自動でHNSWを使う")


# =============================================================
# 技術2: キャッシュ戦略（Embeddingキャッシュ）
# =============================================================
print(f"\n{'=' * 60}")
print(" 技術2: Embeddingキャッシュ")
print("=" * 60)

from functools import lru_cache


@lru_cache(maxsize=10000)
def cached_encode(text: str) -> tuple:
    """同じテキストのEmbeddingは再計算しない"""
    return tuple(model.encode(text))


# 初回（遅い）
start = time.time()
vec1 = cached_encode(QUERY)
first_time = (time.time() - start) * 1000

# 2回目以降（キャッシュヒット、超高速）
start = time.time()
for _ in range(100):
    vec2 = cached_encode(QUERY)
cached_time = (time.time() - start) * 1000

print(f"  初回:    {first_time:.3f}ms")
print(f"  キャッシュ: {cached_time:.3f}ms (100回合計)")
if cached_time > 0:
    print(f"  → 同じクエリは{first_time/(cached_time/100):.0f}倍高速化")
else:
    print(f"  → キャッシュヒットは測定不能なほど高速（ほぼ即時）")

# --- Redis でのキャッシュ（本番版）---
# import redis
# import json
# r = redis.Redis()
#
# def redis_cached_encode(text: str):
#     key = f"emb:{hash(text)}"
#     cached = r.get(key)
#     if cached:
#         return np.array(json.loads(cached))
#     vec = model.encode(text)
#     r.setex(key, 3600, json.dumps(vec.tolist()))  # 1時間TTL
#     return vec


# =============================================================
# 技術3: バッチ処理
# =============================================================
print(f"\n{'=' * 60}")
print(" 技術3: バッチ処理")
print("=" * 60)

small_batch = documents[:100]

# --- 悪い例: 1件ずつ ---
start = time.time()
for doc in small_batch:
    _ = model.encode(doc, show_progress_bar=False)
one_by_one = time.time() - start

# --- 良い例: 一括処理 ---
start = time.time()
_ = model.encode(small_batch, batch_size=32, show_progress_bar=False)
batched = time.time() - start

print(f"  1件ずつ:    {one_by_one*1000:.0f}ms (100件)")
print(f"  バッチ処理: {batched*1000:.0f}ms (100件)")
print(f"  → {one_by_one/batched:.1f}倍高速")


# =============================================================
# 技術4: 次元削減（Matryoshka Embeddings）
# =============================================================
print(f"\n{'=' * 60}")
print(" 技術4: 次元削減")
print("=" * 60)

# OpenAI の Matryoshka Embeddings（APIキー必要）
# from langchain_openai import OpenAIEmbeddings
#
# # デフォルト: 1536次元
# full_emb = OpenAIEmbeddings(model="text-embedding-3-small")
#
# # 圧縮: 512次元（精度をほぼ保ったまま3倍高速）
# compact_emb = OpenAIEmbeddings(
#     model="text-embedding-3-small",
#     dimensions=512,
# )

# --- ローカルでの次元削減: PCA ---
from sklearn.decomposition import PCA

original_dim = doc_vecs.shape[1]  # 384
target_dim = 128

pca = PCA(n_components=target_dim)
compressed = pca.fit_transform(doc_vecs)

q_compressed = pca.transform(q_vec.reshape(1, -1))[0]

# 圧縮後で検索
start = time.time()
for _ in range(100):
    flat_search(q_compressed, compressed)
compressed_time = (time.time() - start) * 1000

print(f"  元の次元: {original_dim} → 圧縮後: {target_dim}")
print(f"  圧縮後の検索: {compressed_time:.1f}ms (100回)")
print(f"  元の検索:    {flat_time*1000:.1f}ms (100回)")
print(f"  → 次元削減で {flat_time*1000/compressed_time:.1f}倍高速化")
print(f"  ※ 精度は少し落ちる。要評価")


# =============================================================
# 技術5: 非同期・並列化
# =============================================================
print(f"\n{'=' * 60}")
print(" 技術5: 非同期並列化（概念コード）")
print("=" * 60)

# --- 同期版: 複数クエリを順番に処理 ---
# for query in queries:
#     result = search(query)  # 1つずつ待つ

# --- 非同期版: 複数クエリを並列処理 ---
# import asyncio
#
# async def search_async(query):
#     # 非同期でEmbedding取得 + 検索
#     vec = await async_encode(query)
#     return await async_vector_search(vec)
#
# async def main():
#     queries = ["質問1", "質問2", "質問3"]
#     results = await asyncio.gather(*[search_async(q) for q in queries])
#     return results
#
# # 実行
# results = asyncio.run(main())

# --- ThreadPoolExecutor で並列化 ---
from concurrent.futures import ThreadPoolExecutor


def search_one(query):
    vec = model.encode(query, show_progress_bar=False)
    return flat_search(vec, doc_vecs)


queries = [f"質問{i}" for i in range(10)]

# 順次実行
start = time.time()
_ = [search_one(q) for q in queries]
sequential_time = time.time() - start

# 並列実行
start = time.time()
with ThreadPoolExecutor(max_workers=4) as executor:
    _ = list(executor.map(search_one, queries))
parallel_time = time.time() - start

print(f"  順次:   {sequential_time*1000:.0f}ms (10クエリ)")
print(f"  並列:   {parallel_time*1000:.0f}ms (10クエリ)")
print(f"  → {sequential_time/parallel_time:.1f}倍高速")


# =============================================================
# 技術6: 2段階検索（Bi-Encoder → Cross-Encoder）
# =============================================================
print(f"\n{'=' * 60}")
print(" 技術6: 2段階検索")
print("=" * 60)
print("""
  1-5 Reranking で学習済み:

  Stage 1 (高速・広く):
    Bi-Encoder で 1000件 → 上位50件を取得（数10ms）

  Stage 2 (低速・精密):
    Cross-Encoder で 50件 → 上位5件を再採点（数100ms）

  全文書にCross-Encoderは使わない（遅すぎる）。
  候補を絞ってから精密採点するのが鉄則。
""")


# =============================================================
# 本番構成の例
# =============================================================
print("=" * 60)
print(" 本番構成の例")
print("=" * 60)
print("""
  ┌─────────────┐
  │ クライアント │
  └──────┬──────┘
         ↓
  ┌─────────────┐
  │    Redis    │ ← 検索結果キャッシュ（ヒットしたら即返す）
  └──────┬──────┘
         ↓ cache miss
  ┌─────────────┐
  │ Embedding   │ ← lru_cache または Redis でベクトルもキャッシュ
  │  キャッシュ  │
  └──────┬──────┘
         ↓
  ┌─────────────┐
  │ ChromaDB    │ ← HNSWインデックスで高速検索
  │ (HNSW)      │
  └──────┬──────┘
         ↓ top 50
  ┌─────────────┐
  │ Reranker    │ ← 50件 → 5件に絞る
  └──────┬──────┘
         ↓
  ┌─────────────┐
  │ LLM +       │ ← Prompt Caching で入力部分を再利用
  │ Prompt Cache│
  └─────────────┘
""")
