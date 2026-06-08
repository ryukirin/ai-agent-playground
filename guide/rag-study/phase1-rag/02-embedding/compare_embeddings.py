"""
Embeddingモデル比較実験
異なるEmbeddingモデルで同じテキストをベクトル化し、
検索精度の違いを確認する。
"""

import numpy as np
from sentence_transformers import SentenceTransformer

# =============================================================
# サンプル文書（検索対象）
# =============================================================
documents = [
    "Pythonのガベージコレクションは参照カウント方式を基本としている。",
    "GIL（Global Interpreter Lock）はCPythonの特徴的な仕組みである。",
    "pymallocは512バイト以下の小さなオブジェクト用のメモリアロケータである。",
    "Rustは所有権システムによりガベージコレクションなしでメモリ安全性を実現する。",
    "JavaScriptのV8エンジンはJITコンパイルを使用して高速に動作する。",
    "DockerコンテナはLinuxのcgroupsとnamespacesを利用して隔離環境を作る。",
    "SQLのインデックスはB-Tree構造を使って高速な検索を実現する。",
    "HTTPSはTLS/SSLプロトコルを使用して通信を暗号化する。",
]

# =============================================================
# 検索クエリ（これで検索して、関連文書を見つけたい）
# =============================================================
queries = [
    "Pythonのメモリ管理の仕組みは？",          # → doc[0], doc[2] が関連
    "マルチスレッドの制限について教えて",        # → doc[1] が関連
    "ガベージコレクションを使わない言語は？",    # → doc[3] が関連
]

# 各クエリの正解（関連する文書のインデックス）
ground_truth = [
    [0, 2],   # メモリ管理 → 参照カウント, pymalloc
    [1],      # マルチスレッド → GIL
    [3],      # GCなし → Rust
]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """コサイン類似度を計算する"""
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def search(query_vec: np.ndarray, doc_vecs: np.ndarray, top_k: int = 3) -> list[tuple[int, float]]:
    """クエリベクトルに最も近い文書をtop_k件返す"""
    scores = [cosine_similarity(query_vec, doc_vec) for doc_vec in doc_vecs]
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]


def evaluate_model(model_name: str) -> None:
    """モデルを読み込み、検索精度を評価する"""
    print(f"\n{'=' * 60}")
    print(f" モデル: {model_name}")
    print(f"{'=' * 60}")

    # モデル読み込み
    model = SentenceTransformer(model_name)

    # 文書とクエリをベクトル化
    doc_vecs = model.encode(documents)
    query_vecs = model.encode([q for q in queries])

    # ベクトルの次元数を表示
    print(f"  ベクトル次元数: {doc_vecs.shape[1]}")

    total_hits = 0
    total_expected = 0

    for i, (query, q_vec, truth) in enumerate(zip(queries, query_vecs, ground_truth)):
        results = search(q_vec, doc_vecs, top_k=3)
        hit_indices = [idx for idx, _ in results]

        # 正解がtop3に含まれているか
        hits = [idx for idx in truth if idx in hit_indices]
        total_hits += len(hits)
        total_expected += len(truth)

        print(f"\n  クエリ: 「{query}」")
        print(f"  正解文書: {truth}")
        print(f"  検索結果 (top3):")
        for rank, (idx, score) in enumerate(results, 1):
            marker = " ✓" if idx in truth else ""
            print(f"    {rank}. [{score:.4f}] {documents[idx][:40]}...{marker}")

    recall = total_hits / total_expected * 100
    print(f"\n  --- Recall@3: {recall:.0f}% ({total_hits}/{total_expected}) ---")
    return recall


# =============================================================
# 比較実験
# =============================================================
# モデル1: 多言語対応の小型モデル（高速、軽量）
# モデル2: 多言語対応の大型モデル（高精度）
models = [
    "intfloat/multilingual-e5-small",   # 118M params, 384次元
    "intfloat/multilingual-e5-base",    # 278M params, 768次元
    # "intfloat/multilingual-e5-large", # 560M params, 1024次元（重いのでコメント）
]

print("Embeddingモデル比較実験")
print(f"文書数: {len(documents)}, クエリ数: {len(queries)}")

results = {}
for model_name in models:
    print(f"\n⏳ {model_name} を読み込み中...")
    recall = evaluate_model(model_name)
    results[model_name] = recall

# =============================================================
# 比較サマリー
# =============================================================
print(f"\n{'=' * 60}")
print(" 比較サマリー")
print(f"{'=' * 60}")
for model_name, recall in results.items():
    print(f"  {model_name}: Recall@3 = {recall:.0f}%")

print()
print("【観察ポイント】")
print("  1. モデルサイズ（small vs base）で精度はどう変わるか？")
print("  2. 日本語の意味的な検索（例: 'マルチスレッドの制限' → GIL）ができているか？")
print("  3. ベクトル次元数とモデルサイズのトレードオフは？")

# =============================================================
# OpenAI Embedding を使う場合（APIキーが必要）
# =============================================================
# from langchain_openai import OpenAIEmbeddings
#
# openai_emb = OpenAIEmbeddings(model="text-embedding-3-small")
# doc_vecs = openai_emb.embed_documents(documents)
# query_vec = openai_emb.embed_query("Pythonのメモリ管理の仕組みは？")
#
# text-embedding-3-small: 1536次元, $0.02/1M tokens
# text-embedding-3-large: 3072次元, $0.13/1M tokens
