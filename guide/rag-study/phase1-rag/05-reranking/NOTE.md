# 1-5. Reranking（Cross-Encoder） — 学習ノート

## 概念

RAGの検索を2段階に分ける:

```
Stage 1: Bi-Encoder（高速・大量）
  全文書をベクトル化 → コサイン類似度で上位N件を取得

Stage 2: Cross-Encoder（低速・高精度）
  Stage 1の候補をクエリと一緒に入力 → 関連度を直接スコアリング → 再ランキング
```

### Bi-Encoder vs Cross-Encoder

| | Bi-Encoder | Cross-Encoder |
|---|---|---|
| 入力 | クエリと文書を**別々に**ベクトル化 | クエリと文書を**同時に**入力 |
| 速度 | 高速（事前計算可能） | 低速（ペアごとに計算） |
| 精度 | そこそこ | 高い |
| 用途 | 初期検索（大量の候補から絞る） | 再ランキング（少数の候補を精密に並べ替え） |

### なぜCross-Encoderの方が精度が高いのか

- Bi-Encoder: クエリ→ベクトル、文書→ベクトル、を**別々に**作る。相互の関係は類似度計算で間接的にしか見ない
- Cross-Encoder: クエリと文書を**連結して**Transformerに入力。両方の単語間のAttentionが直接計算されるため、意味の対応を正確に捉える

## 実験結果

> 実行して結果を記入する

質問: 「Pythonで非同期処理を実装するにはどうすればいい？」

| 段階 | Precision@3 | 備考 |
|---|---|---|
| Bi-Encoder のみ | - | ノイズ（無関係な文書）が上位に混入しやすい |
| + Cross-Encoder Reranking | - | 関連文書が上位に集まる |

## 実用的なRerankingモデル

| モデル | 特徴 |
|---|---|
| cross-encoder/ms-marco-MiniLM-L-6-v2 | 軽量、英語向け。本実験で使用 |
| Cohere Rerank | API提供、多言語対応。本番向き |
| bge-reranker-v2-m3 | オープンソース、多言語対応 |

## 重要な気づき

- **Rerankingは最もコスパの良い精度改善手法**。検索パイプラインに1ステップ追加するだけ
- 全文書にCross-Encoderを使うのは非現実的（遅すぎる）。必ず2段階にする
- 日本語の場合は多言語対応のRerankerを選ぶ必要がある
- Reranking対象の件数（top_k）もチューニングポイント。多すぎると遅い、少なすぎると候補を落とす

## 使ったコード

- [reranking.py](reranking.py) — Bi-Encoder + Cross-Encoder の2段階パイプライン実験
