# 3-1. Ragas による RAG 評価 — 学習ノート

## 概念

Ragasは RAG パイプラインの品質を**4つの数値指標**で測定するフレームワーク。

## 4つの指標

| 指標 | 何を測るか | 低いときの改善策 |
|---|---|---|
| **Faithfulness** | 回答がコンテキストに裏付けられているか | プロンプトに「コンテキストのみに基づいて回答」を強調 |
| **Answer Relevancy** | 回答が質問に的確か | プロンプト改善、質問理解の向上 |
| **Context Precision** | 検索結果の上位に正解が含まれるか | Reranking追加、Embeddingモデル変更 |
| **Context Recall** | 必要な情報が全て検索できているか | Chunking改善、検索件数増加、Hybrid Search |

## 評価データセットの作成

```
必要なデータ:
  question     — ユーザーの質問（20〜50件）
  answer       — RAGが生成した回答
  contexts     — 検索で取得したコンテキスト
  ground_truth — 正解（人間が用意）
```

- ground_truthの作成が最も時間がかかるが、最も重要
- 代表的な質問パターン（事実質問、比較質問、手順質問等）をカバーする

## 改善サイクル

```
ベースライン測定 → ボトルネック特定 → 改善実施 → 再測定 → 繰り返す
```

- 「なんとなく良くなった」ではなく、**数値で改善を証明する**
- 各変更（Embeddingモデル変更、Reranking追加等）が**どの指標をどれだけ改善したか**を記録する

## Phase 1-2 との接続

| Phase 1-2 の学習内容 | Ragasのどの指標に効くか |
|---|---|
| Chunking戦略 (1-1) | Context Recall |
| Embeddingモデル選定 (1-2) | Context Precision |
| Parent-Document (1-3) | Context Recall |
| Hybrid Search (1-4) | Context Precision, Context Recall |
| Reranking (1-5) | Context Precision |
| Lost in the Middle (1-6) | Faithfulness |
| Query Transformation (1-7) | Context Recall |

## 実験結果

> APIキーを設定して実行し、結果を記入する

## 使ったコード

- [ragas_evaluation.py](ragas_evaluation.py) — 概念説明 + 実行コード（コメント内）
