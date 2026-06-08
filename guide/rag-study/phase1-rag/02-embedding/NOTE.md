# 1-2. Embeddingモデル選定 — 学習ノート

## 概念

Embeddingとは、テキストを数百〜数千次元のベクトル（数値の配列）に変換すること。
**RAGの検索精度はこのベクトルの質で決まる。**

## 主要なEmbeddingモデル

| モデル | 提供元 | 次元数 | 日本語 | コスト |
|---|---|---|---|---|
| text-embedding-3-small | OpenAI | 1536 | ○ | 有料（安い） |
| text-embedding-3-large | OpenAI | 3072 | ○ | 有料 |
| embed-v4 | Cohere | 1024 | ◎ | 有料 |
| multilingual-e5-large | HuggingFace | 1024 | ◎ | 無料 |
| multilingual-e5-base | HuggingFace | 768 | ◎ | 無料 |
| multilingual-e5-small | HuggingFace | 384 | ○ | 無料 |

## 選定の3つの軸

1. **精度** — [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard) で客観比較
2. **日本語対応** — 英語特化モデルは日本語で精度が大幅に落ちる
3. **コスト・速度** — API課金 vs ローカル実行、レイテンシ

## 実務での選定フロー

### ステップ1: 必須要件を決める

| 要件 | 確認事項 |
|---|---|
| **言語** | 日本語を扱うなら必ず `multilingual` 系。英語専用は候補から外す |
| **コスト構造** | API課金（OpenAI/Cohere）か、ローカル実行（HuggingFace）か |
| **レイテンシ要件** | リアルタイム応答なら軽量、バッチ処理なら大型 |
| **データ機密性** | 社外に出せないデータならローカル実行一択 |

### ステップ2: 精度を客観評価

- MTEB Leaderboard で自分の言語・タスクのスコアを確認
- 日本語なら JMTEB ベンチマークも参考
- 自分のデータで小規模な評価セット（20〜50件）を作って実測するのが最も確実

### ステップ3: トレードオフの3軸

```
精度 ─────── コスト
   ╲       ╱
    ╲     ╱
     ╲   ╱
      速度
```

- 精度↑ → コスト↑、速度↓（大型モデル）
- コスト↓ → 精度↓（小型OSS）
- 速度↑ → 精度↓（軽量モデル）

### シナリオ別推奨モデル

| シナリオ | 推奨モデル |
|---|---|
| とりあえず試す | `text-embedding-3-small`（OpenAI、安い、精度十分） |
| 日本語特化・機密データ | `multilingual-e5-large`（ローカル、高精度） |
| 低コスト・大量処理 | `multilingual-e5-base`（ローカル、バランス型） |
| 最高精度が必要 | `text-embedding-3-large` or `Cohere embed-v4` |

## 実験結果

同じ8文書・3クエリで比較（top3検索）:

| モデル | パラメータ数 | 次元数 | Recall@3 |
|---|---|---|---|
| multilingual-e5-small | 118M | 384 | **50%** |
| multilingual-e5-base | 278M | 768 | **100%** |

### 具体的な失敗例（e5-small）

- クエリ「マルチスレッドの制限について教えて」
- 期待: GIL（Global Interpreter Lock）の文書
- 実際の結果: HTTPS、Docker、Rustが上位に来てしまい、GILは圏外
- 原因: smallモデルは「マルチスレッド」と「GIL」の意味的関連を捉えられなかった

### e5-baseでの改善

- 同じクエリでGILが3位に入った（ギリギリだが正解）
- モデルサイズを上げるだけでRecallが50% → 100%に改善

## 重要な気づき

- **Embeddingモデルの選択はChunking戦略より影響が大きい場合がある**
- モデルが大きいほど「意味的な関連」（例: マルチスレッド→GIL）を捉える力が強い
- ただし大きいモデルは遅い・重い。用途に応じたトレードオフ判断が必要
- 日本語を扱うなら `multilingual` 系が必須。英語専用モデル（all-MiniLM等）は避ける
- MTEB Leaderboardで最新のベンチマークを確認する習慣をつける

## 使ったコード

- [compare_embeddings.py](compare_embeddings.py) — e5-small vs e5-base の比較実験
