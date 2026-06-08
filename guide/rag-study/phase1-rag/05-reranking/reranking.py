"""
Reranking 比較実験
Bi-Encoder（検索用）で広く取得 → Cross-Encoder（精密採点用）で絞り込む
2段階パイプラインの効果を確認する。
"""

import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder

# =============================================================
# サンプル文書（意図的にノイズを多めに含む）
# =============================================================
documents = [
    "Pythonのasyncioは非同期I/O処理を実現するための標準ライブラリである。",
    "PythonのGILはマルチスレッドの並列実行を制限する仕組みである。",
    "Pythonのmultiprocessingモジュールは複数プロセスで並列処理を行う。",
    "asyncioのイベントループはシングルスレッドで動作し、コルーチンを切り替えて並行処理する。",
    "JavaのスレッドモデルはOSのネイティブスレッドにマッピングされる。",
    "Node.jsはイベント駆動の非同期I/Oモデルを採用している。",
    "GoのgoroutineはOSスレッドより軽量な並行処理の仕組みである。",
    "Pythonのconcurrent.futuresは高レベルな非同期実行APIを提供する。",
    "Rustのasync/awaitは所有権システムと組み合わせてメモリ安全な非同期処理を実現する。",
    "Pythonでは、awaitキーワードを使ってコルーチンの結果を待機する。",
    "C++のstd::threadはPOSIXスレッドのラッパーとして機能する。",
    "asyncioのTaskオブジェクトはコルーチンをラップし、並行実行を管理する。",
]

QUERY = "Pythonで非同期処理を実装するにはどうすればいい？"

# 正解（関連度が高い順）
# 最も関連: asyncio関連 (0, 3, 9, 11), concurrent.futures (7)
# やや関連: multiprocessing (2), GIL (1)
# 無関係: Java, Node.js, Go, Rust, C++
highly_relevant = {0, 3, 9, 11, 7}

print(f"質問: 「{QUERY}」")
print(f"関連文書: {len(highly_relevant)}件 / 全{len(documents)}件\n")

# =============================================================
# Stage 1: Bi-Encoder で広く検索（top 6）
# =============================================================
print("=" * 60)
print(" Stage 1: Bi-Encoder（intfloat/multilingual-e5-base）で検索")
print("=" * 60)

bi_encoder = SentenceTransformer("intfloat/multilingual-e5-base")
doc_vecs = bi_encoder.encode(documents)
q_vec = bi_encoder.encode(QUERY)

bi_scores = [
    float(np.dot(q_vec, dv) / (np.linalg.norm(q_vec) * np.linalg.norm(dv)))
    for dv in doc_vecs
]
bi_ranked = sorted(enumerate(bi_scores), key=lambda x: x[1], reverse=True)

print(f"\n  Top 6 検索結果:")
top6_indices = []
for rank, (idx, score) in enumerate(bi_ranked[:6], 1):
    marker = " ✓" if idx in highly_relevant else " ✗"
    print(f"    {rank}. [{score:.4f}]{marker} {documents[idx][:50]}...")
    top6_indices.append(idx)

bi_precision = sum(1 for idx in top6_indices[:3] if idx in highly_relevant) / 3
print(f"\n  Precision@3 (Bi-Encoder): {bi_precision:.0%}")

# =============================================================
# Stage 2: Cross-Encoder で精密に再採点
# =============================================================
print(f"\n{'=' * 60}")
print(" Stage 2: Cross-Encoder で Top 6 を再採点")
print("=" * 60)

# Cross-Encoderはクエリと文書を同時に入力し、関連度スコアを直接出力する
# Bi-Encoderより精度が高いが、全文書に適用するには遅すぎるため、
# Bi-Encoderで絞った候補にだけ適用する
cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

# top6の文書をCross-Encoderで再採点
pairs = [(QUERY, documents[idx]) for idx in top6_indices]
cross_scores = cross_encoder.predict(pairs)

# 再ランキング
reranked = sorted(
    zip(top6_indices, cross_scores),
    key=lambda x: x[1],
    reverse=True,
)

print(f"\n  再採点後の順位:")
reranked_top3 = []
for rank, (idx, score) in enumerate(reranked, 1):
    marker = " ✓" if idx in highly_relevant else " ✗"
    print(f"    {rank}. [{score:.4f}]{marker} {documents[idx][:50]}...")
    if rank <= 3:
        reranked_top3.append(idx)

cross_precision = sum(1 for idx in reranked_top3 if idx in highly_relevant) / 3
print(f"\n  Precision@3 (Cross-Encoder reranked): {cross_precision:.0%}")

# =============================================================
# 比較
# =============================================================
print(f"\n{'=' * 60}")
print(" 比較")
print(f"{'=' * 60}")
print(f"  Bi-Encoder Precision@3:  {bi_precision:.0%}")
print(f"  + Reranking Precision@3: {cross_precision:.0%}")
print()
print("【Bi-Encoder vs Cross-Encoder の違い】")
print("  Bi-Encoder:    クエリと文書を別々にベクトル化 → コサイン類似度で比較")
print("                 高速だが、相互の関係を直接見ない")
print("  Cross-Encoder: クエリと文書を同時に入力 → 関連度スコアを直接出力")
print("                 精度が高いが、遅い（全文書には使えない）")
print()
print("【2段階パイプライン】")
print("  1. Bi-Encoder で広く候補を取得（例: 50件）")
print("  2. Cross-Encoder で上位を精密に並べ替え（例: top 5に絞る）")
print("  → 速度と精度の両立")
