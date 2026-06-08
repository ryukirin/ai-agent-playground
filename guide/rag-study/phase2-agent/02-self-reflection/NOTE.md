# 2-2. Self-Reflection（自己評価ループ） — 学習ノート

## 概念

エージェントが自分の出力を評価し、不十分なら再試行するループ構造。

```
retrieve → generate → grade ─── pass ──→ END
                         │
                        fail
                         │
                         └──→ retrieve（戻る）
```

## なぜ必要か

- LLMは1回で完璧な回答を出せるとは限らない
- 検索結果が不十分な場合もある
- 「ダメだった」と判断して改善できるかが品質の分かれ目

## グレーダーの設計

LLM（Structured Output）で以下を判定する:

1. **根拠の十分さ**: 回答がコンテキストに裏付けられているか
2. **質問への応答**: 質問に対して直接答えているか
3. **具体性**: 抽象的すぎないか

```python
class AnswerGrade(BaseModel):
    grade: str   # "pass" or "fail"
    reason: str  # 評価の理由
```

## 重要な設計判断

| 判断 | 理由 |
|---|---|
| 最大再試行回数を設定 | 無限ループ防止。通常2-3回 |
| 再試行時にクエリを変える | 同じ検索は同じ結果を返す。Query Transformationと組み合わせる |
| グレーダーは別のLLMでもよい | 生成と評価を分離すると客観性が上がる |

## 実験結果

> 実行して結果を記入する

## LangGraphでの実装ポイント

- **Back Edge**: `grade` → `retrieve` に戻るエッジがループの核心
- **Conditional Edge**: `grade` ノードの結果で「戻る/終了」を分岐
- **State更新**: `retry_count` を状態に含めてループ回数を管理

## 使ったコード

- [self_reflection.py](self_reflection.py) — 自己評価ループの実装
