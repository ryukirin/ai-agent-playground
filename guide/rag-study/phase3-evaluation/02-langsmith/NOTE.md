# 3-2. LangSmith によるトレース・デバッグ — 学習ノート

## 概念

LangSmithはエージェントの**内部動作を可視化**し、問題箇所を特定するツール。

## 4つの機能

| 機能 | 何ができるか |
|---|---|
| **トレース** | 各ステップを時系列で記録・可視化。どこで何が起きたか一目で分かる |
| **レイテンシ分析** | 各ステップの実行時間を計測。ボトルネックを特定 |
| **コスト追跡** | トークン数と費用を記録。どこでコストがかかっているか |
| **A/Bテスト** | 異なる設定のパフォーマンスを比較 |

## セットアップ

```bash
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY="your-api-key"
export LANGCHAIN_PROJECT="rag-study"
```

**コードの変更は不要。** 環境変数を設定するだけで自動的にトレースが送信される。

## よくあるボトルネックと対策

| ボトルネック | 対策 |
|---|---|
| LLM呼び出しが全体の80%以上 | モデル変更（小さいモデル）、ストリーミング |
| 検索が遅い | Embeddingのキャッシュ、インデックス最適化 |
| Self-Reflectionが3回以上ループ | グレーダーの基準を見直す |
| トークン消費が多い | コンテキスト件数を減らす、Reranking追加 |

## カスタムトレース

```python
from langsmith import traceable

@traceable(name="my_custom_step")
def my_function(input_data):
    return process(input_data)
```

`@traceable` デコレータで任意の関数にトレースを追加できる。

## 実験結果

> LangSmithアカウントを作成し、Phase 2のエージェントを接続して結果を記入する

## 使ったコード

- [langsmith_tracing.py](langsmith_tracing.py) — 概念説明 + セットアップガイド
