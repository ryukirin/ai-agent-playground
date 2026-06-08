# 第14章 AI エージェント編(Vercel AI SDK + Zod)

> これまで学んだ「型・ジェネリクス・判別可能ユニオン・Zod スキーマ」が、AI エージェント開発でそのまま武器になります。**APIキー無しでもオフラインで動く**サンプルで、ツール呼び出し型エージェントの仕組みを体験します。

## 🎯 この章のゴール

- 「エージェント = LLM + ツール + ループ」という構造を説明できる
- **1 つの Zod スキーマが「型・実行時検証・LLM への指示」を兼ねる**ことを理解する
- Vercel AI SDK v6 の `tool()` / `generateText()` でエージェントを書ける
- 「LLM の出力は信頼しない(必ず検証する)」という安全の勘所をつかむ

---

## エージェントって何?

ざっくり言うと **「LLM が、必要に応じて “道具(ツール)” を使いながら、目的を達成するまで考え続ける仕組み」** です。流れはこうです。

```
ユーザーの依頼
   ↓
LLM が「どのツールを・どんな引数で呼ぶか」を決める
   ↓
あなたのコードが その引数を検証して ツールを実行
   ↓
結果を LLM に戻す
   ↓ (まだ必要ならループ)
LLM が最終的な答えを作る
```

LLM が出す「ツール名と引数」は**ただのテキスト/JSON**で、間違っていることもあります。だから **TypeScript の型と Zod の検証**が効くわけです。

---

## カギは Zod スキーマ(ここが一番大事)

ツールの入力を **Zod スキーマ 1 個**で定義すると、それが **3 つの役割**を同時に果たします。

```ts
import { z } from "zod";

const weatherInput = z.object({
  city: z.string().describe("都市名(例: 東京)"),
});
```

| 役割 | どう使う | 効果 |
|---|---|---|
| ① 型になる | `type WeatherInput = z.infer<typeof weatherInput>` | `{ city: string }` という TS 型が手に入る |
| ② 実行時に検証 | `weatherInput.safeParse(モデルの出力)` | LLM が変な値を返しても弾ける |
| ③ LLM への指示 | AI SDK が JSON Schema に変換 | LLM が「この形で渡せばいい」と分かる |

第3章で学んだ `unknown`、第7章の `safeParse`(判別可能ユニオン)、第9章の `z.infer`(型の抽出)——全部ここで使います。

```ts
// ② の実演:モデルが間違った型を返しても safeParse で防げる
const bad = weatherInput.safeParse({ city: 123 });
console.log(bad.success); // false ← 実行前に気づける
```

> **safeParse の戻り値は判別可能ユニオン**です。`if (parsed.success)` で絞り込むと `parsed.data`(検証済みの型付きデータ)が安全に使えます。第7・12章のパターンそのものです。

---

## ツールを定義する(`tool()`)

Vercel AI SDK の `tool()` に Zod スキーマを渡すと、**`execute` の引数が自動で型付け**されます。

```ts
import { tool } from "ai";

const getWeather = tool({
  description: "指定した都市の現在の気温(摂氏)を返す", // LLM はこの説明を読んで使うか判断する
  inputSchema: weatherInput,
  execute: async (input) => {
    // input は WeatherInput 型(= { city: string })に推論される!
    return { city: input.city, tempC: 19 };
  },
});
```

> ⚠️ **バージョン注意**: 本サンプルは **AI SDK v6**(`ai@6`)前提です。v5/v6 でプロパティ名が変わっています。
> - 旧: `parameters` → 新: **`inputSchema`**
> - 旧: `maxSteps` → 新: **`stopWhen: stepCountIs(n)`**
> 古い記事のコードはそのままだと動かないことがあるので、[公式ドキュメント](https://ai-sdk.dev/)で最新 API を確認してください。

---

## エージェントを動かす(`generateText`)

ツールを渡して `generateText` を呼ぶと、AI SDK が「LLM ↔ ツール」のループを自動で回します。

```ts
import { generateText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const res = await generateText({
  model: anthropic("claude-sonnet-4-5"), // モデル ID は最新版に置き換える
  system: "あなたは有能なアシスタントです。",
  prompt: "東京の天気は?",
  tools: { getWeather, calculate },
  stopWhen: stepCountIs(5), // ツール呼び出し→結果→… を最大5ステップ回す
});

console.log(res.text);   // 最終的な回答(string)
console.log(res.steps);  // 各ステップ(どのツールをどう呼んだか)
```

`stopWhen` を指定しないと**既定は 1 ステップ**(`stepCountIs(1)`)で、ツールを呼んだだけで止まってしまいます。ツール結果を踏まえて答えさせたいなら必ず増やします。

---

## 実際に動かす:`src/14_ai_agent.ts`

このリポジトリの [`src/14_ai_agent.ts`](../src/14_ai_agent.ts) は、**APIキーの有無で自動的に切り替わる**作りになっています。

### オフライン(モック)で動かす — キー不要

```bash
npm run ch14
```

LLM の代わりに簡単なルールで「どのツールを呼ぶか」を演じる**モック・エージェント**が動きます。出力例:

```
【検証】不正な引数 {city:123} は通る?: false
ユーザー: 東京の天気は? あと 12 * 8 も計算して。
[モックモード] ...
エージェント:
  - getWeather(東京) → 19℃
  - calculate(12 * 8) → 96
```

ネットにも API にもつながず、**エージェントの流れ(計画→検証→実行→観測→回答)**だけを安全に学べます。

### 本物の Claude で動かす — APIキーが必要

1. [console.anthropic.com](https://console.anthropic.com/) で API キーを取得(従量課金)
2. 環境変数に設定して実行(PowerShell):

```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
npm run ch14
```

キーを検出すると、同じツール定義のまま**本物の `generateText`** が走ります。`@ai-sdk/anthropic` が `ANTHROPIC_API_KEY` を自動で読み取ります。

---

## モック版 ↔ 本物版 の対応

| 役割 | モック版(学習用) | 本物版(AI SDK) |
|---|---|---|
| ツールを呼ぶ判断 | `mockModelPlan()`(正規表現ルール) | LLM(`generateText` が内部で実行) |
| 引数の検証 | `schema.safeParse()` を自分で呼ぶ | AI SDK が `inputSchema` で自動検証 |
| ツール実行 | `lookupWeather()` を直接呼ぶ | `tool()` の `execute` が呼ばれる |
| ループ制御 | `for` ループ | `stopWhen: stepCountIs(n)` |

**ツールの「中身」(`lookupWeather` / `doCalc`)は両者で共通**です。だから本物に切り替えてもロジックを書き直す必要がありません。

---

## ⚠️ よくあるつまずき

- **`parameters` / `maxSteps` を使ってしまう**(v4 以前の書き方)。v6 は `inputSchema` / `stopWhen`。
- **`stopWhen` を付け忘れる** → ツールを 1 回呼んだだけで `res.text` が空っぽに。
- **LLM の出力をそのまま信じる** → 必ず Zod で検証してから実行する(`tool()` を使えば自動。手動ループなら `safeParse`)。
- **APIキーをコードに直書き** → 環境変数で渡す。リポジトリにコミットしない。

---

## ✍️ 練習問題

### 問題 1

`src/14_ai_agent.ts` に、**為替変換ツール `convertJpyToUsd`** を追加してください。入力は `{ jpy: number }`、出力は `{ usd: number }`(レートは固定 `1 USD = 150 JPY` でよい)。Zod スキーマ・普通の関数・`tool()` 定義の 3 つを書きましょう。

<details><summary>解答例</summary>

```ts
const convertInput = z.object({ jpy: z.number().nonnegative() });
type ConvertInput = z.infer<typeof convertInput>;

function convert({ jpy }: ConvertInput): { usd: number } {
  return { usd: Math.round((jpy / 150) * 100) / 100 };
}

const convertJpyToUsd = tool({
  description: "日本円(JPY)を米ドル(USD)に変換する",
  inputSchema: convertInput,
  execute: async (input) => convert(input),
});
```

`z.number().nonnegative()` のように制約も付けられます。`tools` に `convertJpyToUsd` を足せば本物のエージェントも使えるようになります。

</details>

### 問題 2

`safeParse` の戻り値が**判別可能ユニオン**であることを使って、検証成功なら `data` を、失敗なら最初のエラーメッセージを返す関数 `validate<T>(schema, input)` を書いてください(ヒント:`z.ZodType<T>` を引数に取るジェネリック関数)。

<details><summary>解答例</summary>

```ts
function validate<T>(schema: z.ZodType<T>, input: unknown):
  | { ok: true; data: T }
  | { ok: false; message: string } {
  const r = schema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };
  return { ok: false, message: r.error.issues[0]?.message ?? "検証エラー" };
}

const r = validate(z.object({ age: z.number() }), { age: "x" });
console.log(r.ok ? r.data : r.message);
```

第8章のジェネリクスと第7章の判別可能ユニオンの合わせ技です。`r.ok` で分岐すると `data` / `message` が型安全に絞り込まれます。

</details>

### 問題 3

「LLM の出力をそのまま実行してはいけない理由」を、`eval` 的な危険・型の不一致・想定外の値、の観点から 2〜3 行で説明してください(記述問題)。

<details><summary>解答例</summary>

LLM の出力は確率的なテキストであり、スキーマ通りである保証がない。型が違う値(数値のはずが文字列)、範囲外の値、存在しないツール名、最悪は不正な命令が混じりうる。だから `inputSchema`(Zod)で**実行前に必ず検証**し、通った安全なデータだけをツールに渡す。これにより `any` を使わずに、型安全と実行時安全の両方を確保できる。

</details>

---

## 📌 まとめ

- エージェント = **LLM + ツール + ループ**。LLM がツールと引数を選び、あなたのコードが検証・実行する
- **Zod スキーマ 1 個が「型(`z.infer`)・検証(`safeParse`)・LLM への指示(JSON Schema)」を兼ねる**——これが TS × エージェントの最大の利点
- AI SDK v6: `tool({ description, inputSchema, execute })` と `generateText({ model, tools, stopWhen: stepCountIs(n) })`
- **LLM の出力は信頼しない**。スキーマ検証を通った型付きデータだけを使う
- 本サンプルはキー無しでも動く(モック)。本物は `ANTHROPIC_API_KEY` を設定するだけ

## 🚀 次に学ぶこと

- **ストリーミング**(`streamText`)でトークンを逐次表示する
- **構造化出力**(`generateObject` + Zod)で、回答そのものを型付き JSON で受け取る
- **マルチツール / マルチステップ**のより複雑なエージェント、会話履歴(`messages`)の保持
- フロントと組むなら第13章までの型知識 + **React + TypeScript**

## ▶ 動かす

```bash
npm run ch14
# 本物の Claude を使うなら(PowerShell):
#   $env:ANTHROPIC_API_KEY = "sk-ant-..."; npm run ch14
```
