# フェーズ 2:エージェントの中核ループ ── ReAct

> [← 01 LLM の基礎](01_フェーズ1_LLMの基礎.md) ｜ [03 ツール設計 →](03_フェーズ3_ツール設計.md)

## 2-1. 解説

### エージェントの定義

Anthropic は AI エージェントを次のように定義します。

> **AI エージェント = LLM がツールをループの中で自律的に使うもの。**

この一文がすべての出発点です。どんなに複雑なエージェントフレームワークも、本質はこの「ループ」に行き着きます。逆に言えば、このループを理解すれば、Claude Code も Cursor も「同じループの精緻な拡張」だと見抜けるようになります。

### ReAct ループ

最も基本的で、かつ今も現役の実行パターンが **ReAct(Reason + Act)** です。日本語にすると「考えて(Reason)、行動する(Act)」。実際には次の 3 段階を繰り返します。

```
① Thought(思考)    : モデルが「次に何をすべきか」を考える
② Action(行動)     : ツールを「この引数で呼びたい」と JSON で出力する
③ Observation(観察): ハーネスがツールを実行し、その結果をモデルに返す
   → ① に戻る(完了条件を満たすまで)
```

人間が仕事をするときと同じです。「ファイルの中身を見たい(思考)→ ファイルを開く(行動)→ 中身を読む(観察)→ じゃあ次はこの関数を直そう(思考)…」。この観察→思考のフィードバックループこそがエージェントの知能の源です。

### なぜ「ループ」なのか

1 回の呼び出しでは、モデルは「ファイルを読みたい」と言うだけで終わります。ハーネスがそれを実行し、結果を返して**もう一度モデルに考えさせる**。この往復を繰り返すから、モデルは前のステップの結果を踏まえて次の手を打てる。これがフェーズ 1 の素の呼び出し(1 問 1 答)との決定的な違いです。

### 停止条件(最重要の安全装置)

ループには必ず「止まる条件」が要ります。基本は「モデルがツールを呼ばずに、最終回答のテキストだけを返したら完了」。しかし、モデルが延々とツールを呼び続ける「暴走」も起こりえます。そのため**反復回数の上限(iteration cap)**を必ず設けます。これを忘れると無限ループでトークンを焼き尽くします。

### production ハーネスではもっと精緻

実物のハーネスでは、ReAct ループは 6 フェーズに細分化されます(LangChain の解剖より):

1. **pre-check & compaction**(事前チェック・コンテキスト圧縮) ── 窓が一杯になりそうなら履歴を要約
2. **thinking**(思考)
3. **self-critique**(自己批判) ── 「この計画で正しいか」を自問
4. **action**(ツール呼び出し)
5. **tool execution**(ツール実行) ── sandbox・timeout を扱う
6. **post-processing**(後処理) ── 結果を整形して次ターンへ

最初は単純な 3 段階で十分です。まずそれを自作してから、精緻版を理解しましょう。

## 2-2. 例コード ── ReAct ループを自作する(この教科書の核心)

ツールを 2 つ(電卓・ファイル読み込み)だけ持つ、最小のエージェントを書きます。**これがフェーズ全体で最も学習効果の高いコードです。**

```python
import anthropic
import json
import os

client = anthropic.Anthropic()

# ── ① ツールの「定義」(スキーマ)。モデルにこういうツールがあると伝える ──
TOOLS = [
    {
        "name": "calculator",
        "description": "数式を評価して結果を返す。例: '1+2*3'",
        "input_schema": {
            "type": "object",
            "properties": {
                "expression": {"type": "string", "description": "評価する数式"}
            },
            "required": ["expression"],
        },
    },
    {
        "name": "read_file",
        "description": "指定パスのテキストファイルを読んで内容を返す。",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "ファイルの絶対パス"}
            },
            "required": ["path"],
        },
    },
]

# ── ② ツールの「実体」。ハーネスが実際に実行する関数 ──
def run_tool(name, args):
    if name == "calculator":
        # 注意: eval は学習用。本番では絶対に使わない(任意コード実行の危険)
        return str(eval(args["expression"]))
    elif name == "read_file":
        if not os.path.exists(args["path"]):
            return f"エラー: ファイルが見つかりません: {args['path']}"
        with open(args["path"], encoding="utf-8") as f:
            return f.read()
    return f"未知のツール: {name}"

# ── ③ ReAct ループ本体 ──
def run_agent(user_message, max_iterations=10):
    messages = [{"role": "user", "content": user_message}]

    for i in range(max_iterations):          # ← 停止条件(iteration cap)
        response = client.messages.create(
            model="claude-opus-4-8",
            max_tokens=2048,
            tools=TOOLS,
            messages=messages,
        )

        # アシスタントの発話(思考 + ツール呼び出し)を履歴に追加
        messages.append({"role": "assistant", "content": response.content})

        # ツールを呼ばず、テキストだけ返した → 完了
        if response.stop_reason != "tool_use":
            final = "".join(
                block.text for block in response.content if block.type == "text"
            )
            print(f"\n✅ 完了({i+1} 回のループ):\n{final}")
            return final

        # ツール呼び出しを実行し、結果(Observation)を作る
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                print(f"  🔧 {block.name}({block.input}) を実行")
                result = run_tool(block.name, block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                })

        # Observation を user ロールで履歴に追加し、ループ継続
        messages.append({"role": "user", "content": tool_results})

    print("⚠️ 反復上限に達しました(暴走防止)")

# ── 実行 ──
run_agent("12345 と 67890 を足して、その結果を 2 で割るといくつ?")
```

実行すると、モデルが `calculator` を呼ぶ → 結果を観察 → 必要なら再度呼ぶ → 最終回答、という流れがログに出ます。**この往復こそが ReAct ループ**です。

### 何が起きているか(1 行ずつの対応)

| ReAct の段階 | コード上の場所 |
|---|---|
| ① Thought + ② Action | `client.messages.create(...)` の応答 |
| ③ 実行 | `run_tool(block.name, block.input)` |
| Observation を返す | `messages.append({"role": "user", "content": tool_results})` |
| ループ | `for i in range(max_iterations)` |
| 停止条件 | `if response.stop_reason != "tool_use"` と `max_iterations` |

## 2-3. 課題

1. **【必須・基礎】** 上のコードを実際に動かし、ログでツールが呼ばれる様子を観察せよ。`max_iterations` を 1 にすると何が起きるか試せ。
2. **【必須・実装】** 3 つ目のツール `write_file(path, content)` を追加し、「計算結果をファイルに書き出して」と頼んで動かせ。`TOOLS` の定義と `run_tool` の両方に手を入れる必要がある。
3. **【理解】** `messages` 配列を 1 ターンごとに `print` して、会話履歴がどう伸びていくか観察せよ。assistant の `tool_use` ブロックと、user の `tool_result` ブロックがペアになっていることを確認せよ。
4. **【発展】** モデルがわざと存在しないファイルを読もうとしたとき、`run_tool` がエラー文字列を返す。モデルがそのエラーを観察して、どう振る舞うか観察せよ(=エラーも Observation として学習材料になる)。
5. **【発展】** 「doom loop(同じ失敗を繰り返す無限ループ)」を再現してみよ。例えば `read_file` が常に同じエラーを返すよう細工し、モデルが同じツールを繰り返し呼ぶ様子を観察し、なぜ iteration cap が安全装置として必須かを体感せよ。

---

> [← 01 LLM の基礎](01_フェーズ1_LLMの基礎.md) ｜ [03 ツール設計 →](03_フェーズ3_ツール設計.md)
