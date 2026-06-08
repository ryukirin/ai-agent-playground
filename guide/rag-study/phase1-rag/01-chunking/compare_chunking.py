"""
Chunking戦略の比較実験
3種類のChunking（Fixed-size / Recursive / Semantic）を同じ文書に適用し、
分割結果の違いを確認する。
"""

from langchain_text_splitters import (
    CharacterTextSplitter,
    RecursiveCharacterTextSplitter,
)

# =============================================================
# サンプル文書（日本語の技術文書を想定）
# =============================================================
SAMPLE_TEXT = """
# Pythonのメモリ管理

## ガベージコレクション

Pythonは参照カウント方式を基本としたメモリ管理を行います。各オブジェクトには参照カウンタがあり、参照されるたびにカウントが増加し、参照が外れるとカウントが減少します。カウントがゼロになると、そのオブジェクトは即座に解放されます。

しかし、参照カウント方式だけでは循環参照を検出できません。例えば、リストAがリストBを参照し、リストBがリストAを参照している場合、どちらの参照カウントもゼロにならず、メモリリークが発生します。

この問題を解決するために、Pythonには世代別ガベージコレクタ（generational garbage collector）が搭載されています。オブジェクトを3つの世代（generation 0, 1, 2）に分類し、新しいオブジェクトほど頻繁にチェックされます。

## GIL（Global Interpreter Lock）

PythonのCPython実装には、GIL（Global Interpreter Lock）という仕組みがあります。GILは一度に1つのスレッドのみがPythonバイトコードを実行できるようにするロック機構です。

GILが存在する理由は、CPythonのメモリ管理がスレッドセーフではないためです。参照カウントの更新を複数スレッドから同時に行うと、競合状態が発生する可能性があります。

GILの影響で、CPUバウンドな処理ではマルチスレッドの恩恵を受けられません。代替手段として、multiprocessingモジュールを使用するか、C拡張でGILを解放する方法があります。

## メモリプール

Pythonは小さなオブジェクト（512バイト以下）のために、専用のメモリアロケータを持っています。これはpymallocと呼ばれ、OSのmallocよりも高速にメモリを割り当てることができます。

pymallocはアリーナ（256KB）→プール（4KB）→ブロックという階層構造でメモリを管理します。同じサイズのオブジェクトは同じプールから割り当てられるため、フラグメンテーションが軽減されます。
""".strip()


def show_chunks(chunks: list[str], method_name: str) -> None:
    """チャンクの分割結果を表示する"""
    print(f"\n{'=' * 60}")
    print(f" {method_name}")
    print(f" チャンク数: {len(chunks)}")
    print(f"{'=' * 60}")
    for i, chunk in enumerate(chunks):
        print(f"\n--- Chunk {i + 1} ({len(chunk)}文字) ---")
        # 最初の100文字だけ表示（長すぎる場合）
        preview = chunk[:100] + "..." if len(chunk) > 100 else chunk
        print(preview)


# =============================================================
# 1. Fixed-size Chunking（文字数で機械的に分割）
# =============================================================
fixed_splitter = CharacterTextSplitter(
    separator="",  # 区切り文字なし = 純粋に文字数で切る
    chunk_size=200,
    chunk_overlap=0,  # オーバーラップなし
)
fixed_chunks = fixed_splitter.split_text(SAMPLE_TEXT)
show_chunks(fixed_chunks, "1. Fixed-size Chunking（200文字ごと）")


# =============================================================
# 2. Recursive Chunking（段落→文→文字の順で階層的に分割）
# =============================================================
recursive_splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", "。", "、", " ", ""],  # 日本語向けに調整
    chunk_size=200,
    chunk_overlap=30,  # 30文字のオーバーラップ
)
recursive_chunks = recursive_splitter.split_text(SAMPLE_TEXT)
show_chunks(recursive_chunks, "2. Recursive Chunking（200文字、overlap=30）")


# =============================================================
# 3. Semantic Chunking（意味の境界で分割）
# =============================================================
# 【簡易版】Markdownのヘッダーで分割（Embeddingモデル不要）
from langchain_text_splitters import MarkdownHeaderTextSplitter

headers_to_split_on = [
    ("#", "Header1"),
    ("##", "Header2"),
]
markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
semantic_chunks = markdown_splitter.split_text(SAMPLE_TEXT)
show_chunks(
    [doc.page_content for doc in semantic_chunks],
    "3a. 簡易版 — Markdownヘッダーで意味境界分割",
)

# 【本格版】SemanticChunker（Embeddingモデルが必要）
# 実行するには以下が必要:
#   pip install langchain-experimental langchain-openai
#   環境変数 OPENAI_API_KEY を設定
#
# from langchain_openai import OpenAIEmbeddings
# from langchain_experimental.text_splitter import SemanticChunker
#
# embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
#
# # --- 方法1: percentile（デフォルト）---
# # 文間の類似度を計算し、類似度が低い箇所（= 話題の変わり目）で分割
# # breakpoint_threshold_amount: パーセンタイル値。低いほど分割が多くなる
# semantic_splitter = SemanticChunker(
#     embeddings,
#     breakpoint_threshold_type="percentile",     # 類似度の下位X%を境界とする
#     breakpoint_threshold_amount=70,              # 下位70% = 上位30%の変化点で切る
# )
#
# # --- 方法2: standard_deviation ---
# # 類似度の平均から標準偏差N倍以上離れた箇所で分割
# # semantic_splitter = SemanticChunker(
# #     embeddings,
# #     breakpoint_threshold_type="standard_deviation",
# #     breakpoint_threshold_amount=1.5,           # 平均 - 1.5σ 以下で切る
# # )
#
# # --- 方法3: interquartile ---
# # 四分位範囲（IQR）を使って外れ値的な類似度低下点で分割
# # semantic_splitter = SemanticChunker(
# #     embeddings,
# #     breakpoint_threshold_type="interquartile",
# #     breakpoint_threshold_amount=1.5,           # IQR * 1.5 を閾値とする
# # )
#
# semantic_docs = semantic_splitter.create_documents([SAMPLE_TEXT])
# show_chunks(
#     [doc.page_content for doc in semantic_docs],
#     "3b. 本格版 — SemanticChunker（Embedding類似度で分割）",
# )


# =============================================================
# 比較サマリー
# =============================================================
print(f"\n{'=' * 60}")
print(" 比較サマリー")
print(f"{'=' * 60}")
print(f"  Fixed-size:  {len(fixed_chunks)} チャンク")
print(f"  Recursive:   {len(recursive_chunks)} チャンク")
print(f"  Semantic:    {len(semantic_chunks)} チャンク")
print()
print("【観察ポイント】")
print("  1. Fixed-sizeは文の途中で切れていないか？")
print("  2. Recursiveは段落や文の区切りを尊重しているか？")
print("  3. Semanticは意味的なまとまりを保っているか？")
