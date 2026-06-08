"""
LangSmith によるトレース・デバッグ
エージェントの内部動作を可視化し、問題箇所を特定する。

※ LangSmithの利用にはアカウント登録とAPIキーが必要です。
   https://smith.langchain.com/
   APIがない場合は概念理解で完了としてOKです。
"""

# =============================================================
# 概念説明（API不要）
# =============================================================

print("=" * 60)
print(" LangSmith — エージェントの観測可能性")
print("=" * 60)
print("""
LangSmithが提供する4つの機能:

1. トレース (Tracing)
   エージェントの各ステップを時系列で記録・可視化する。
   ┌─────────────────────────────────────────┐
   │ Router (12ms)                            │
   │   └→ Retrieve (234ms)                   │
   │       └→ Generate (1,523ms)             │
   │           └→ Grade (456ms) → PASS       │
   └─────────────────────────────────────────┘
   どのステップで何が起きたか、どれくらい時間がかかったかが一目で分かる。

2. レイテンシ分析
   各ステップの実行時間を計測し、ボトルネックを特定する。
   - 検索が遅い → Embeddingモデルの変更、キャッシュの導入
   - LLM呼び出しが遅い → モデルの変更、ストリーミング対応

3. コスト追跡
   各LLM呼び出しのトークン数と費用を記録する。
   - どのステップでトークンを多く消費しているか
   - Self-Reflectionのループが何回回っているか

4. A/Bテスト
   異なる設定（Embeddingモデル、プロンプト、chunk_size等）の
   パフォーマンスを比較する。
""")

# =============================================================
# セットアップ方法
# =============================================================
print("=" * 60)
print(" セットアップ")
print("=" * 60)
print("""
  1. https://smith.langchain.com/ でアカウント作成
  2. APIキーを取得
  3. 環境変数を設定:
     export LANGCHAIN_TRACING_V2=true
     export LANGCHAIN_API_KEY="your-api-key"
     export LANGCHAIN_PROJECT="rag-study"
  4. コードの変更は不要！
     LangChain/LangGraphのコードはそのままで、
     環境変数を設定するだけで自動的にトレースが送信される。
""")

# =============================================================
# コード例（APIキーがある場合）
# =============================================================
# import os
# os.environ["LANGCHAIN_TRACING_V2"] = "true"
# os.environ["LANGCHAIN_API_KEY"] = "your-api-key"
# os.environ["LANGCHAIN_PROJECT"] = "rag-study"
#
# # これだけで、LangChain/LangGraphの全ての操作が自動的にトレースされる
# # LangSmithのダッシュボードで可視化できる
#
# from langchain_openai import ChatOpenAI
# llm = ChatOpenAI(model="gpt-4o-mini")
# result = llm.invoke("Hello")
# # → この呼び出しがLangSmithに自動記録される
#
# # カスタムトレースの追加
# from langsmith import traceable
#
# @traceable(name="my_custom_step")
# def my_function(input_data):
#     # 任意の関数にトレースを追加
#     return process(input_data)
#
# # 評価の実行
# from langsmith.evaluation import evaluate
#
# def correctness(run, example):
#     """正解との一致を評価"""
#     predicted = run.outputs["answer"]
#     expected = example.outputs["answer"]
#     return {"score": 1 if predicted == expected else 0}
#
# results = evaluate(
#     my_rag_pipeline,
#     data="my-dataset",
#     evaluators=[correctness],
# )


print("=" * 60)
print(" トレースの読み方")
print("=" * 60)
print("""
  LangSmithダッシュボードで確認できる情報:

  ┌─ Run ──────────────────────────────────┐
  │ Name: adaptive_rag_chain               │
  │ Duration: 2.3s                         │
  │ Tokens: 1,234 (input: 890, output: 344)│
  │ Cost: $0.002                           │
  │                                        │
  │ ┌─ Child Run ────────────────────────┐ │
  │ │ Name: router                       │ │
  │ │ Duration: 0.1s                     │ │
  │ │ Input: "Pythonの非同期処理は？"     │ │
  │ │ Output: {"route": "rag"}           │ │
  │ └────────────────────────────────────┘ │
  │ ┌─ Child Run ────────────────────────┐ │
  │ │ Name: retrieve                     │ │
  │ │ Duration: 0.3s                     │ │
  │ │ Input: query                       │ │
  │ │ Output: [doc1, doc2, doc3]         │ │
  │ └────────────────────────────────────┘ │
  │ ┌─ Child Run ────────────────────────┐ │
  │ │ Name: generate                     │ │
  │ │ Duration: 1.9s  ← ボトルネック！    │ │
  │ │ Tokens: 1,100                      │ │
  │ └────────────────────────────────────┘ │
  └────────────────────────────────────────┘

  よくあるボトルネック:
  - LLM呼び出しが全体の80%以上を占める → モデル変更 or ストリーミング
  - 検索が遅い → Embeddingのキャッシュ、インデックス最適化
  - Self-Reflectionが3回以上ループ → グレーダーの基準を見直す
""")
