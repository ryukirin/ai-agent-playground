# 第15章 ストリーミング & 構造化出力(AI SDK + Zod)

> LLM の応答を「流れてくるテキスト」として受け取る **ストリーミング** と、「型付き・検証済みオブジェクト」として受け取る **構造化出力** ——この 2 つを TypeScript の非同期イテレータ(`AsyncGenerator` / `for await...of`)と Zod スキーマで実装します。APIキーが無くてもオフラインのモックで両方の体験ができます。

---

> ⚠️ **バージョン注記**: 本章のサンプルは **AI SDK v6**(`ai@6`)と **Zod 4** を前提にしています。API は変更される可能性があるため、最新情報は [公式ドキュメント(ai-sdk.dev)](https://ai-sdk.dev/) で確認してください。

---

## 🎯 この章のゴール

- **なぜストリーミングか** ——UX 的な理由と `streamText` の仕組みを説明できる
- `AsyncGenerator<string>` と `for await...of` の TypeScript 的な意味を理解する
- `generateObject` + Zod スキーマで **型付き・検証済みオブジェクト** を受け取る流れを実装できる
- `z.infer` がスキーマから型を自動生成する仕組みを第14章と結びつけて説明できる
- オフラインのモックと本物を切り替える作法を身につける

---

## なぜストリーミング?

チャットAIが文章を返すとき、LLM は先頭の単語から**1 トークンずつ**生成しています。全文が揃うまで待ってから表示すると、長い応答では数秒〜数十秒が沈黙になります。

**ストリーミング**を使えば、LLM が生成したそばからトークンが届き、ユーザーはすぐに読み始めることができます。

```
ストリーム無し: [=== 全文生成を待つ ===]→ 一気に表示
ストリームあり: 「TypeScript」「の」「非同期は…」 ← 打鍵されるように流れてくる
```

ChatGPT や Claude.ai で感じる「文字が流れてくる感じ」はこれです。

---

## `streamText` と `textStream`

Vercel AI SDK の `streamText` は `await` **しない**のが最大のポイントです。

```ts
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

// await しない — 呼んだ瞬間に結果オブジェクトが返る
const result = streamText({
  model: anthropic("claude-sonnet-4-5"), // モデル ID は最新版に置き換えてください
  prompt: "TypeScript の async/await を 2 文で説明してください。",
});

// result.textStream は AsyncIterable<string>
// for await...of でチャンクを逐次受け取る
for await (const chunk of result.textStream) {
  process.stdout.write(chunk); // 改行なしで書き出す → 流れてくる感が出る
}

// 後から全文をまとめて取得したいなら Promise<string> を await する
const fullText: string = await result.text;
console.log("\n全文の文字数:", fullText.length);
```

| ポイント | 説明 |
|---|---|
| `streamText(...)` は **await しない** | 内部的には LLM への接続を開始するが、結果オブジェクトは同期的に返る |
| `result.textStream` は `AsyncIterable<string>` | `for await...of` で順にチャンクを受け取れる |
| `result.text` は `Promise<string>` | ストリームが完了してから全文を取得する場合に await する |

---

## `AsyncGenerator<string>` と `for await...of` の TS 解説

ストリーミングの核心は**非同期イテレータ**です。TypeScript では `async function*`(非同期ジェネレータ)で作れます。

```ts
// delay は第11章で学んだ「setTimeout を Promise 化」するパターン
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// AsyncGenerator<string> = 非同期に string を yield するジェネレータ
async function* mockStream(text: string): AsyncGenerator<string> {
  const words = text.split(" ");
  for (const word of words) {
    yield word + " ";   // 1 語ずつチャンクとして流す
    await delay(80);    // 次のチャンクまで 80ms 待つ
  }
}

// for await...of で受け取る — streamText の textStream も同じ仕組み
for await (const chunk of mockStream("こんにちは TypeScript の世界へ")) {
  process.stdout.write(chunk);
}
```

`AsyncGenerator<string>` は「非同期に string を 1 個ずつ出してくるシーケンス」です。`for await...of` はそれを**順番に**取り出すループです。

```
AsyncGenerator<string>     for await...of
┌──────────────────┐        ┌─────────────────────────┐
│  yield "こんにちは" │──→│ chunk = "こんにちは "  │
│  yield "TypeScript"│──→│ chunk = "TypeScript "   │
│  yield "の世界へ"  │──→│ chunk = "の世界へ "     │
└──────────────────┘        └─────────────────────────┘
```

> **streamText の `textStream` も同じ型**(`AsyncIterable<string>`)です。モックで動きを理解しておくと、本物の API に移行するときに混乱しません。

---

## `generateObject` + Zod で構造化出力

「天気は？」のような自由文を返す `generateText` に対し、`generateObject` は **「JSON オブジェクトを返して」と LLM に指示**し、Zod スキーマで自動的に検証・型付けします。

### スキーマを定義する

```ts
import { z } from "zod";

const articleMetaSchema = z.object({
  title:    z.string().describe("記事のタイトル"),
  summary:  z.string().describe("100 字以内の要約"),
  tags:     z.array(z.string()).describe("関連タグ(1〜5 個)"),
  priority: z.enum(["low", "mid", "high"]).describe("優先度"),
});

// z.infer でスキーマから TypeScript の型を自動生成
type ArticleMeta = z.infer<typeof articleMetaSchema>;
// → { title: string; summary: string; tags: string[]; priority: "low" | "mid" | "high" }
```

`describe(...)` で付けた説明は AI SDK が LLM へ渡すヒントになります。スキーマが「型の定義書」と「LLM への指示書」を兼ねます。

### `generateObject` で受け取る

```ts
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

// generateObject は await する
const { object } = await generateObject({
  model: anthropic("claude-sonnet-4-5"),
  schema: articleMetaSchema,      // Zod スキーマを渡すだけ
  prompt: "TypeScript の非同期処理に関する技術記事のメタデータを生成してください。",
});

// object は ArticleMeta 型に推論されている — as も any も不要
console.log(object.title);       // string として使える
console.log(object.priority);    // "low" | "mid" | "high" として使える
```

`generateObject` は内部で Zod スキーマを JSON Schema に変換して LLM に渡し、返ってきた JSON を `schema.parse()` で検証してから `object` に入れます。型の一貫性が SDK によって保証されます。

### モックで動きを確認する

本物の LLM が無くても、固定値を `schema.parse()` で通すと同じ体験ができます。

```ts
const mockOutput: unknown = {
  title:    "AsyncGenerator で学ぶ TypeScript",
  summary:  "非同期ジェネレータを使ったストリーミング入門",
  tags:     ["TypeScript", "AsyncGenerator"],
  priority: "high",
};

const meta: ArticleMeta = articleMetaSchema.parse(mockOutput);
// ↑ 成功すれば ArticleMeta 型のオブジェクトが手に入る

// 不正な値は弾かれる
const bad: unknown = { title: "テスト", summary: "テスト", tags: [], priority: "urgent" };
const result = articleMetaSchema.safeParse(bad);
console.log(result.success); // false → "urgent" は enum に無い
```

`safeParse` の戻り値は**判別可能ユニオン**です(第7・12章)。`if (result.success)` で絞り込むと `result.data` が `ArticleMeta` 型として安全に使えます。

---

## `streamObject` について(補足)

`generateObject` の ストリーミング版として `streamObject` もあります。

```ts
import { streamObject } from "ai";

const { partialObjectStream } = streamObject({
  model: anthropic("claude-sonnet-4-5"),
  schema: articleMetaSchema,
  prompt: "...",
});

// 部分的に完成したオブジェクトが流れてくる
for await (const partial of partialObjectStream) {
  console.log(partial); // 例: { title: "AsyncGenerator..." } → 徐々に埋まる
}
```

フォームのプレビューをリアルタイムで更新したい場合などに便利です。詳細は [公式ドキュメント](https://ai-sdk.dev/) を参照してください。

---

## オフラインと本物の切り替え

`src/15_streaming_structured.ts` は第14章と同じ「キーの有無で自動分岐」パターンです。

```ts
async function main(): Promise<void> {
  if (process.env.ANTHROPIC_API_KEY) {
    // streamText / generateObject で本物の Claude を使う
    await demoRealStreaming();
    await demoRealStructured();
  } else {
    // AsyncGenerator のモックと schema.parse() でオフライン体験
    await demoMockStreaming();
    await demoMockStructured();
  }
}
```

| 役割 | モック版 | 本物版(AI SDK) |
|---|---|---|
| ストリーム生成 | `async function* mockStream(...)` | `streamText()` → `result.textStream` |
| チャンク受け取り | `for await...of mockStream(...)` | `for await...of result.textStream` |
| 構造化出力 | `schema.parse(固定値)` | `generateObject({ schema })` → `object` |
| 型付け | `z.infer` で `ArticleMeta` 型 | 同じ `z.infer` — SDK が自動検証後に返す |

**ループ構文(`for await...of`)は本物でもモックでも全く同じ**です。モックで動きを体感してから本物に移行しても、コードの構造は変わりません。

---

## ⚠️ よくあるつまずき

### `streamText` を `await` してしまう

```ts
// ❌ await すると textStream が使えなくなる
const result = await streamText({ ... });

// ✅ await しない — 結果オブジェクトから textStream を取り出す
const result = streamText({ ... });
for await (const chunk of result.textStream) { ... }
```

`streamText` の特徴は「呼んだ瞬間に結果オブジェクトを返す」点です。`await` は全チャンクが揃うまでブロックしてしまうため、ストリーミングの意味が失われます。

### `generateText`(文字列)と `generateObject`(JSON)の使い分け

```ts
// 自由文のテキストを返させる → generateText
const { text } = await generateText({ model, prompt: "...について教えて" });

// 型付きオブジェクトを返させる → generateObject + Zod スキーマ
const { object } = await generateObject({ model, schema: mySchema, prompt: "..." });
```

「スキーマを渡したから `generateText` でも JSON が返る」とは限りません。構造化出力には必ず `generateObject` を使います。

### LLM の出力をそのまま信じる

`generateObject` は内部で検証するため比較的安全ですが、`generateText` で自分で JSON を解析する場合は **必ず Zod で検証**してください。

```ts
// ❌ LLM の出力を unknown から直接キャスト
const meta = JSON.parse(llmOutput) as ArticleMeta; // 実行時に壊れうる

// ✅ safeParse で検証してから使う
const result = articleMetaSchema.safeParse(JSON.parse(llmOutput));
if (result.success) {
  // result.data は ArticleMeta 型として安全
  console.log(result.data.title);
}
```

### `z.infer` が「同じスキーマから型を自動生成する」のに気づかない

スキーマ、型定義、LLM への指示を**3 か所で別々に書く必要はありません**。

```ts
const schema = z.object({ name: z.string(), age: z.number() });
type Person = z.infer<typeof schema>; // ← ここだけ書けばよい

// schema が変われば Person 型も自動で追従する → 手動更新漏れゼロ
```

---

## ✍️ 練習問題

### 問題 1

`mockStream` を改造して、**文字単位**でストリーミングする `charStream` を書いてください。1 文字ずつ `yield` して `await delay(30)` を挟みます。`for await...of` で使えることを確認しましょう。

<details><summary>解答例</summary>

```ts
async function* charStream(text: string): AsyncGenerator<string> {
  for (const char of text) {
    yield char;
    await delay(30);
  }
}

// 使い方
for await (const ch of charStream("Hello TS!")) {
  process.stdout.write(ch);
}
```

`for...of` で文字列を回せる(文字列は `Iterable<string>`)点も TypeScript の面白い特性です。

</details>

---

### 問題 2

以下の Zod スキーマを定義し、`z.infer` で型を取り出してください。その後、`safeParse` を使って「正常値」と「不正値」の両方を検証するコードを書いてください。

```ts
// weather のスキーマ:
//   city: 文字列
//   tempC: 数値(−50 〜 60 の範囲)
//   condition: "sunny" | "cloudy" | "rainy" の 3 択
```

<details><summary>解答例</summary>

```ts
import { z } from "zod";

const weatherSchema = z.object({
  city:      z.string(),
  tempC:     z.number().min(-50).max(60),
  condition: z.enum(["sunny", "cloudy", "rainy"]),
});

type Weather = z.infer<typeof weatherSchema>;
// → { city: string; tempC: number; condition: "sunny" | "cloudy" | "rainy" }

// 正常値
const ok = weatherSchema.safeParse({ city: "東京", tempC: 24, condition: "sunny" });
console.log(ok.success);             // true
if (ok.success) console.log(ok.data.city); // "東京"(型安全)

// 不正値: tempC が範囲外
const ng = weatherSchema.safeParse({ city: "火星", tempC: 999, condition: "sunny" });
console.log(ng.success);             // false
if (!ng.success) console.log(ng.error.issues[0]?.message);
```

`z.number().min().max()` のようなチェーンで制約を追加できます。`safeParse` の戻り値は判別可能ユニオン(第7章)なので `if (ok.success)` で型が絞り込まれます。

</details>

---

### 問題 3

`generateObject` と `generateText` の使い分けを、ユースケースの例を 2 つずつ挙げながら説明してください(記述問題)。

<details><summary>解答例</summary>

**`generateObject`(型付きオブジェクトが必要な場合)**
- 記事の自動分類(タイトル・タグ・優先度を JSON で受け取ってDBに保存)
- フォーム入力の自動補完(名前・住所・電話番号を構造化データで受け取る)

**`generateText`(自由文を返させたい場合)**
- ユーザーへの返答文(チャットアシスタント)
- コードの説明やコードレビューのコメント生成

決め手は「受け取ったデータを**プログラムで扱う**か、**そのまま人に見せる**か」です。プログラムで処理するなら `generateObject` + Zod スキーマで型安全性を確保し、人が読む自由文なら `generateText` が適しています。

</details>

---

## 📌 まとめ

- **ストリーミング(`streamText`)**: `await` しないで呼ぶ → `result.textStream`(`AsyncIterable<string>`)を `for await...of` で受け取る。UX 改善の定石
- **`AsyncGenerator<string>`**: `async function*` で作る非同期イテレータ。`for await...of` で順に受け取れる。モックとして作ると本物の textStream と全く同じ使い勝手
- **構造化出力(`generateObject`)**: Zod スキーマを `schema` に渡すと、LLM への指示・実行時検証・TypeScript 型付けが一括で完結する。`object` はキャスト不要で型付き
- **`z.infer`**: スキーマから型を自動生成。スキーマ・型・LLM 指示を 1 か所で管理できる——第14章の知識がそのまま使える
- **「LLM の出力は信頼しない」**: `generateObject` は SDK が内部検証するが、手動で JSON を扱う場合は必ず `safeParse`

---

## ▶ 動かす

```bash
npm run ch15
# 本物の Claude を使うなら(PowerShell):
#   $env:ANTHROPIC_API_KEY = "sk-ant-..."; npm run ch15
```
