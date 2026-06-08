"""
Parent-Document Retrieval 比較実験
通常のRAG vs Parent-Document Retrieval で回答の質がどう変わるかを比較する。
"""

import numpy as np
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter

# =============================================================
# サンプル文書（前回より長い文書。段落間の文脈が重要）
# =============================================================
DOCUMENT = """
# Pythonの並行処理

## GIL（Global Interpreter Lock）

PythonのCPython実装には、GIL（Global Interpreter Lock）という仕組みがあります。GILは一度に1つのスレッドのみがPythonバイトコードを実行できるようにするロック機構です。

GILが存在する理由は、CPythonのメモリ管理がスレッドセーフではないためです。参照カウントの更新を複数スレッドから同時に行うと、競合状態（race condition）が発生し、メモリリークやクラッシュの原因になります。

この制限により、CPUバウンドな処理ではマルチスレッドを使っても並列実行されず、シングルスレッドと同程度の性能しか出ません。ただし、I/Oバウンドな処理（ファイル読み書き、ネットワーク通信）ではGILが一時的に解放されるため、マルチスレッドの恩恵を受けられます。

## GILの回避策

GILの制限を回避する方法はいくつかあります。

第一に、multiprocessingモジュールを使う方法があります。各プロセスが独自のPythonインタプリタ（と独自のGIL）を持つため、真の並列実行が可能です。ただし、プロセス間通信のオーバーヘッドがあるため、データの受け渡しが多い場合は注意が必要です。

第二に、C拡張を使ってGILを解放する方法があります。NumPyやPandasなどの科学計算ライブラリは、重い計算をC言語で実装し、計算中はGILを解放しています。これにより、Python側のコードはシングルスレッドでも、内部的にはマルチスレッドで高速に計算できます。

第三に、asyncioを使った非同期プログラミングがあります。asyncioはシングルスレッドでイベントループを回し、I/O待ちの間に他のタスクを実行します。GILの影響を受けず、大量のI/Oバウンド処理を効率的に捌けます。

## Python 3.13のフリースレッド実験

Python 3.13では、実験的にGILを無効化する「フリースレッド」モードが導入されました。これはPEP 703で提案されたもので、GILなしでもスレッドセーフにPythonコードを実行できるようにする取り組みです。

フリースレッドモードでは、参照カウントの代わりにバイアス付き参照カウント（biased reference counting）という新しい手法が使われます。これにより、ほとんどの場合でアトミック操作なしに参照カウントを更新でき、パフォーマンスへの影響を最小限に抑えています。

ただし、フリースレッドモードはまだ実験的な機能であり、一部のC拡張ライブラリとの互換性に問題がある可能性があります。本番環境での使用は推奨されていません。
""".strip()


# =============================================================
# Embeddingモデル（前回のベストを使用）
# =============================================================
print("⏳ Embeddingモデルを読み込み中...")
model = SentenceTransformer("intfloat/multilingual-e5-base")


def cosine_similarity(a, b):
    """コサイン類似度を計算"""
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def search(query: str, chunks: list[str], top_k: int = 2) -> list[tuple[int, float, str]]:
    """チャンクから類似度上位top_kを返す"""
    q_vec = model.encode(query) # クエリのベクトル化
    c_vecs = model.encode(chunks) # チャンクのベクトル化
    scores = [cosine_similarity(q_vec, cv) for cv in c_vecs] # 類似度計算
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    return [(idx, score, chunks[idx]) for idx, score in ranked[:top_k]]


# =============================================================
# 質問（段落をまたぐ文脈が必要な質問）
# =============================================================
QUERY = "GILを回避するにはどうすればいい？具体的な方法を教えて"

print(f"\n質問: 「{QUERY}」\n")

# =============================================================
# 方法1: 通常のRAG（小さいChunkで検索、そのまま渡す）
# =============================================================
print("=" * 60)
print(" 方法1: 通常のRAG（小さいChunk = 150文字）")
print("=" * 60)

small_splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", "。", " ", ""],
    chunk_size=150,
    chunk_overlap=20,
)
small_chunks = small_splitter.split_text(DOCUMENT)
print(f"  チャンク数: {len(small_chunks)}")

results_normal = search(QUERY, small_chunks, top_k=2)
print(f"\n  検索結果（LLMに渡される情報）:")
total_context = 0
for rank, (idx, score, text) in enumerate(results_normal, 1):
    total_context += len(text)
    print(f"\n  --- Hit {rank} [{score:.4f}] ({len(text)}文字) ---")
    print(f"  {text}")

print(f"\n  → LLMに渡される合計: {total_context}文字")


# =============================================================
# 方法2: Parent-Document Retrieval
#   Child (小さいChunk) で検索 → Parent (大きいChunk) をLLMに渡す
# =============================================================
print(f"\n{'=' * 60}")
print(" 方法2: Parent-Document Retrieval")
print("=" * 60)

# Parent: 大きめに分割（セクション単位）
parent_splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n## ", "\n\n", "\n"],
    chunk_size=500,
    chunk_overlap=0,
)
parent_chunks = parent_splitter.split_text(DOCUMENT)

# Child: 各Parentをさらに小さく分割
child_splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", "。", " ", ""],
    chunk_size=150,
    chunk_overlap=20,
)

# Child → Parent のマッピングを作る
child_chunks = []
child_to_parent = {}  # child_index → parent_index

for parent_idx, parent in enumerate(parent_chunks):
    children = child_splitter.split_text(parent)
    for child in children:
        child_idx = len(child_chunks)
        child_chunks.append(child)
        child_to_parent[child_idx] = parent_idx

print(f"  Parentチャンク数: {len(parent_chunks)}")
print(f"  Childチャンク数: {len(child_chunks)}")

# Childで検索
results_child = search(QUERY, child_chunks, top_k=2)

# ヒットしたChildのParentを取得（重複排除）
seen_parents = set()
parent_results = []
for idx, score, text in results_child:
    p_idx = child_to_parent[idx]
    if p_idx not in seen_parents:
        seen_parents.add(p_idx)
        parent_results.append((p_idx, score, parent_chunks[p_idx]))

print(f"\n  Childの検索結果 → 対応するParentをLLMに渡す:")
total_context_parent = 0
for rank, (p_idx, score, parent_text) in enumerate(parent_results, 1):
    total_context_parent += len(parent_text)
    print(f"\n  --- Parent {rank} (Child類似度: {score:.4f}) ({len(parent_text)}文字) ---")
    print(f"  {parent_text[:200]}...")

print(f"\n  → LLMに渡される合計: {total_context_parent}文字")


# =============================================================
# 比較
# =============================================================
print(f"\n{'=' * 60}")
print(" 比較")
print(f"{'=' * 60}")
print(f"  通常RAG:              {total_context}文字をLLMに渡す")
print(f"  Parent-Document:      {total_context_parent}文字をLLMに渡す")
print()
print("【観察ポイント】")
print("  1. 通常RAGで渡される情報だけで、質問に十分答えられるか？")
print("  2. Parent-Documentでは、回避策の具体的な方法が全て含まれているか？")
print("  3. 情報量が増える分、ノイズ（無関係な情報）も増えていないか？")
