# 2-4. Multi-Agent（複数エージェント協調） — 学習ノート

## 概念

1つの巨大なPromptではなく、役割を分離した複数のエージェントが協調して1つのタスクを完遂する。

## Supervisor/Worker パターン

```
     ┌──────────────┐
     │  Supervisor   │ ← 全体管理・次のエージェント決定
     └──────┬───────┘
            │
   ┌────────┼────────┐
   ↓        ↓        ↓
Researcher  Writer   Critic
   │        │        │
   └────────┼────────┘
            ↓
        Supervisor（に戻る）
```

### 各エージェントの役割

| エージェント | 役割 | 入力 | 出力 |
|---|---|---|---|
| **Supervisor** | 進行管理、次のアクション決定 | 全体のState | 次のエージェント名 |
| **Researcher** | 情報収集 | テーマ | リサーチ結果 |
| **Writer** | 文章生成 | リサーチ結果 + フィードバック | ドラフト |
| **Critic** | 品質チェック | ドラフト | フィードバック + 承認/却下 |

## エージェント間のメッセージパッシング

- LangGraphでは **State（共有状態）** を通じてデータを受け渡す
- 各エージェントはStateの一部を読み書きする
- Supervisorが全体のStateを見て次のアクションを決定

## なぜ分割するのか

| 単一Prompt | Multi-Agent |
|---|---|
| 全ての指示を1つのPromptに詰める | 役割ごとにPromptを分離 |
| Promptが巨大化 → 指示の見落とし | 各エージェントのPromptはシンプル |
| 失敗時にどこが悪いか分からない | 失敗したエージェントを特定しやすい |
| チューニングが困難 | 個別にチューニング可能 |

## 実験結果

> 実行して結果を記入する

### 期待される実行フロー

1. Supervisor → Researcher（調査依頼）
2. Researcher → Supervisor（調査完了報告）
3. Supervisor → Writer（ドラフト作成依頼）
4. Writer → Supervisor（ドラフト完了報告）
5. Supervisor → Critic（レビュー依頼）
6. Critic → Supervisor（不合格 + フィードバック）
7. Supervisor → Writer（フィードバック反映依頼）
8. Writer → Supervisor（改善版完了報告）
9. Supervisor → Critic（再レビュー依頼）
10. Critic → Supervisor（合格）
11. Supervisor → END

## 重要な気づき

- **Supervisorの判断ロジックが全体の品質を左右する**
- エージェント数が増えるとStateの管理が複雑になる
- Criticのフィードバックが具体的でないとWriterが改善できない
- 本番ではCrewAIなどのフレームワークがエージェント間通信を簡素化してくれる

## 使ったコード

- [multi_agent.py](multi_agent.py) — Supervisor/Worker パターンの実装
