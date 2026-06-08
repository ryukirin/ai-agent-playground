# 1-1. Chunking戦略 — 学習ノート

## 概念

RAGでは文書をChunk（断片）に分割してベクトル化する。
**分割の仕方で検索精度が根本的に変わる。**

## 3種類のChunking

### Fixed-size（固定長分割）
- 文字数で機械的に切る（例: 500文字ごと）
- 長所: シンプル、高速
- 短所: 文の途中で切れる → 意味が壊れる
- 実験結果: `BがリストAを参照している場合...` のように前文の途中から始まるChunkが生まれた

### Recursive（再帰的分割）
- `\n\n` → `\n` → `。` → `、` → ` ` → `""` の順で階層的に分割を試みる
- 長所: 文の区切りを尊重する。日本語なら `。` で切れるので文が壊れにくい
- 短所: 意味の境界は見ていない（段落内でも文字数超過なら切る）
- overlap（重複）を設定すると、前のChunkの末尾を次のChunkの先頭に含めて文脈の断絶を緩和できる

### Semantic（意味境界分割）
- Embeddingの類似度が大きく変わる箇所 = 話題の転換点で分割
- 簡易版: Markdownのヘッダー（見出し）で分割する方法もある
- 長所: 意味的にまとまったChunkになる → 検索精度が最も高くなりやすい
- 短所: Embeddingモデルが必要、処理が遅い、Chunkサイズがばらつく

## 実験結果

同じ文書（Pythonのメモリ管理、約850文字）をchunk_size=200で分割:

| 手法 | チャンク数 | 文の途中で切れるか | 意味のまとまり |
|---|---|---|---|
| Fixed-size | 5 | 切れる | 悪い |
| Recursive | 7 | 切れない | まあまあ |
| Semantic | 3 | 切れない | 良い |

## chunk_overlap（チャンクの重複）

前のChunkの末尾を次のChunkの先頭に重複させる仕組み。

```
overlap=0 の場合（重複なし）:
  Chunk 1: [AAAAAAAAAA]
  Chunk 2:             [BBBBBBBBBB]
  → AとBの境界で文脈が断絶する

overlap=30 の場合（30文字重複）:
  Chunk 1: [AAAAAAAAAA]
  Chunk 2:        [===BBBBBBBBBB]
                   ^^^
                   この部分がChunk 1の末尾と同じ
```

- Chunkの境界をまたぐ情報がある場合、overlapがないとどちらのChunkにも完全な情報が入らない
- overlapを大きくするとChunk数が増えてストレージ・検索コストが上がる
- 目安: **chunk_size の 10〜20%**

## SemanticChunker（本格版）の3つの分割方法

`langchain_experimental.text_splitter.SemanticChunker` を使うと、Embeddingの類似度ベースで分割できる。

| 方法 | 仕組み | 使いどころ |
|---|---|---|
| **percentile** | 文間の類似度の下位X%を境界にする | 最も一般的。まずこれから試す |
| **standard_deviation** | 平均から標準偏差N倍離れた点で切る | 類似度の分布が正規分布に近い場合 |
| **interquartile** | 四分位範囲で外れ値的な変化点を検出 | 外れ値に強い。ノイズが多い文書向け |

- Embeddingモデル（OpenAI `text-embedding-3-small` 等）が必要
- コードは [compare_chunking.py](compare_chunking.py) にコメントとして記載

## 重要な気づき

- **chunk_sizeとchunk_overlapはハイパーパラメータ**。文書の性質（短い文が多い/長い段落が多い）によって最適値が変わる
- Recursiveが実務では最も使われる（バランスが良い）
- Semanticは精度重視の場面で有効だが、コストとのトレードオフがある
- 日本語の場合、`separators`に `。` `、` を含めるのが重要（デフォルトは英語向け）

## 使ったコード

- [compare_chunking.py](compare_chunking.py) — 3種類の比較実験
