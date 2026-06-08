# 1-3. Parent-Document Retrieval — 学習ノート

## 概念

Chunkingのジレンマ:
- 小さいChunk → 検索精度は高いが、LLMに渡す文脈が不足
- 大きいChunk → 文脈は十分だが、検索精度が落ちる

**Parent-Document Retrieval はこの両方を解決する:**

```
1. 文書を大きなChunk（Parent）に分割
2. Parentをさらに小さなChunk（Child）に分割
3. Childでベクトル検索する（精度が高い）
4. ヒットしたChildのParentをLLMに渡す（文脈が豊富）
```

## 実験結果

質問: 「GILを回避するにはどうすればいい？具体的な方法を教えて」

| | 通常RAG (150文字Chunk) | Parent-Document |
|---|---|---|
| LLMに渡す量 | 178文字 | 820文字 |
| 検索でヒットした内容 | 「回避する方法はいくつかあります」（導入文のみ） | 導入文と同じChildにヒット |
| LLMに渡される情報 | 導入文だけ → **具体的方法なし** | Parentセクション全体 → **3つの方法すべて含む** |
| multiprocessing | なし | あり |
| C拡張 | なし | あり |
| asyncio | なし | あり |

### 通常RAGの失敗パターン

- 「方法はいくつかあります」でヒットするが、具体的な方法は別Chunkにある
- 小さいChunkでは導入文と具体的説明が別々に分かれてしまう
- LLMは渡された情報しか使えないので「方法がある」としか答えられない

### Parent-Document Retrievalの成功パターン

- 同じChildにヒットするが、Parent（セクション全体）がLLMに渡される
- 導入文 + 具体的方法3つが全て含まれる
- LLMは十分な情報をもとに完全な回答ができる

## 本番での separators 設定

文書の種類ごとに separators を変える必要がある。separators は **「どこで優先的に切りたいか」の優先順リスト**。

### Markdown / 技術文書

```python
separators=[
    "\n\n## ", "\n\n### ",     # 見出し最優先
    "\n\n", "\n",
    "。", "、", " ", "",
]
```

### コード含む文書（Python）

```python
# 言語別の専用splitterを使うのが推奨
from langchain_text_splitters import RecursiveCharacterTextSplitter, Language

splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=500,
)
```

### プレーンな日本語文書

```python
separators=[
    "\n\n", "。\n", "。", "、", " ", "",
]
```

### 法律・契約書

```python
separators=[
    "\n第", "\n\n", "。", "、", "",
]
```

### 設定の原則

| 原則 | 理由 |
|---|---|
| 大きな意味単位を先に | セクション → 段落 → 文 → 単語 の順 |
| 言語固有の区切りを入れる | 英語デフォルトの `.!?` は日本語では効かない |
| 最後は必ず `""` | どうしても切れない時の最終手段 |
| Parentは粗く、Childは細かく | Parent: 見出し単位、Child: 文単位 |

### 実務のコツ

1. まず文書を目で見て自然な区切りを確認する
2. サンプル数件で `split_text()` の結果を実際に見る
3. Chunk境界で意味が壊れていないかチェック。壊れていたら separator を追加

## separators設定は必ず人間がやる？

いいえ、3つのパターンから選べる。

| パターン | 内容 | 向き |
|---|---|---|
| デフォルトに任せる | `RecursiveCharacterTextSplitter(chunk_size=500)` のみ | プロトタイプ、英語 |
| 言語プリセット | `.from_language(Language.PYTHON, ...)` | Python/JS/Markdown等 |
| Semantic Chunker | Embedding類似度で自動分割 | 複雑な構造、コスト許容 |
| 手動設定 | separatorsを指定 | 日本語、特殊文書 |

**実務の定石:** 言語プリセットをベースに、日本語の `"。"` `"、"` を手動追加。完全自動化（Semantic Chunker）は遅い・高いため本番では選ばれないことも多い。

## 自然言語文書（ブログ、記事、小説、会話等）の設定

構造化された見出しがないため、文の区切りを頼りにする。

### 日本語の自然言語

```python
separators=[
    "\n\n",       # 段落の区切り
    "\n",         # 改行
    "。",          # 文末
    "！",          # 感嘆文
    "？",          # 疑問文
    "、",          # 読点（最終手段に近い）
    " ",
    "",
]
```

### 英語の自然言語

```python
separators=[
    "\n\n", "\n",
    ". ", "! ", "? ",    # ピリオド + スペース（小数点と区別）
    ", ", " ", "",
]
```

### 多言語混在

```python
separators=[
    "\n\n", "\n",
    "。", ". ",   # 両方入れる
    "！", "! ",
    "？", "? ",
    "、", ", ",
    " ", "",
]
```

### 自然言語特有の悩み

1. **段落が長すぎる問題** — ブログや論文では1段落が500文字超もある。`\n\n` で切れず `。` にフォールバック
2. **会話文の扱い** — `」\n「` を separator に入れると発話単位で切れる
3. **引用・カギ括弧の途中で切れる** — カギ括弧内の `。` で切れて引用が壊れる。Semantic Chunkerの方が向く

### 文書タイプ別の推奨

| 文書タイプ | 推奨 |
|---|---|
| ブログ、ニュース記事 | 日本語デフォルトでOK |
| 小説、会話多め | Semantic Chunker または separator調整 |
| SNS投稿、チャットログ | メッセージ単位で自前分割（splitter不使用） |
| 論文、レポート | Markdown構造があるならそちらの設定 |

**原則は同じ: 段落 → 文 → 読点 → 単語 → 文字 の順で階層的に切る。**

## 検索速度を向上するための技術

### 1. ベクトルインデックスの最適化（最大のボトルネック）

| 手法 | 仕組み | 速度 | 精度 |
|---|---|---|---|
| 総当たり（Flat） | 全文書と類似度計算 | 遅い | 100% |
| IVF | 文書をクラスタに分け、近いクラスタだけ検索 | 5〜50倍速い | ~95% |
| **HNSW** | グラフ構造で近傍探索 | 10〜100倍速い | ~98% |
| PQ（Product Quantization） | ベクトルを圧縮 | 更に高速、省メモリ | ~90% |

実用的にはベクトルDB（ChromaDB, Pinecone, Weaviate, Qdrant等）が裏でHNSWを使っている。

### 2. キャッシュ戦略

| キャッシュ対象 | 効果 |
|---|---|
| Embedding結果 | 同じテキストの再計算を防ぐ（効果大） |
| 検索結果 | 人気クエリの結果をRedisに保存 |
| LLM回答 | Prompt Caching（Claude/OpenAI）で入力部分のキャッシュ |

### 3. バッチ処理

```python
# 悪い例: 1件ずつ
for doc in documents:
    vec = model.encode(doc)

# 良い例: 一括処理（10〜100倍速い）
vecs = model.encode(documents, batch_size=32)
```

### 4. 次元削減

- **Matryoshka Embeddings**（OpenAI text-embedding-3）: 次元を切り詰められる設計
- **PCA / UMAP**: 後処理で次元削減

```python
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    dimensions=512,  # 1536の一部だけ使う
)
```

### 5. 非同期・並列化

```python
async def parallel_search(queries):
    tasks = [search_async(q) for q in queries]
    return await asyncio.gather(*tasks)
```

### 6. 2段階検索（1-5 Rerankingで学習）

```
Stage 1: 軽量モデルで広く候補取得（50件） — 高速
Stage 2: 重いCross-Encoderで精密に絞る（5件） — 精度重視
```

### 実務での優先順位

| 優先度 | 施策 | 効果 |
|---|---|---|
| ★★★ | ベクトルDB（HNSW）を使う | 検索が10倍以上速くなる |
| ★★★ | Embeddingをキャッシュ | 再計算ゼロ |
| ★★☆ | バッチ処理 | 初期構築が高速化 |
| ★★☆ | 次元削減 | メモリ削減 + 速度向上 |
| ★☆☆ | Prompt Caching | LLM呼び出し部分の高速化 |

### 典型的な本番構成

```
クライアント
    ↓
[Redis] ← 検索結果キャッシュ
    ↓ cache miss
[ベクトルDB(HNSW)] ← 高速類似検索
    ↓
[Reranker] ← 少数候補だけ精密採点
    ↓
[LLM + Prompt Cache] ← 回答生成
```

## 実装のポイント

- `child_to_parent` マッピングが必要 — どのChildがどのParentに属するかを管理する
- LangChainでは `ParentDocumentRetriever` がこのマッピングを自動管理してくれる
- Parentのサイズ目安: セクション単位（300〜500文字）
- Childのサイズ目安: 通常のChunkサイズ（100〜200文字）
- ヒットした複数のChildが同じParentに属する場合は重複排除する

## 重要な気づき

- **通常RAGで「答えの入り口」だけヒットして「本体」が渡されない**のは非常によくある失敗パターン
- Parent-Documentは情報量が増えるが、同じセクション内の情報なのでノイズは少ない
- ただしParentが大きすぎると Lost in the Middle 問題が発生する可能性がある（1-6で学ぶ）

## 使ったコード

- [compare_retrieval.py](compare_retrieval.py) — 通常RAG vs Parent-Document の比較実験
- [search_speed_examples.py](search_speed_examples.py) — 検索速度向上6技術の実装例
