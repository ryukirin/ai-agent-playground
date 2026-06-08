/**
 * ===== 第15章 ストリーミング & 構造化出力(Vercel AI SDK v6 + Zod)=====
 *
 * このファイルは 2 つのテーマを体験するサンプルです。
 *   1. ストリーミング — テキストをチャンク単位で逐次受信する
 *   2. 構造化出力   — Zod スキーマで「型付き・検証済みオブジェクト」を受け取る
 *
 *   ・APIキー無し  → オフラインのモックで両方の体験ができる(既定)
 *   ・APIキーあり  → 本物の Claude を使った版が動く
 *
 * 実行:
 *   npm run ch15                        … モックで実行(ネット不要)
 *   $env:ANTHROPIC_API_KEY="sk-..."     … キーを設定(PowerShell)してから
 *   npm run ch15                        … 本物の Claude で実行
 *
 * インストールは済み(zod / ai / @ai-sdk/anthropic は package.json にあります)。
 */

import { streamText, generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

// ============================================================
// 1. ユーティリティ: delay — setTimeout を Promise 化(第11章の応用)
// ============================================================
// Promise<void> を返すシンプルな待機関数。AsyncGenerator の yield と組み合わせる。
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// 2. 構造化出力に使う Zod スキーマ
// ============================================================
// 記事メタデータの例。LLM から「型付き・検証済みオブジェクト」を受け取るイメージ。
const articleMetaSchema = z.object({
  title: z.string().describe("記事のタイトル"),
  summary: z.string().describe("100 字以内の要約"),
  tags: z.array(z.string()).describe("関連タグ(1〜5 個)"),
  priority: z.enum(["low", "mid", "high"]).describe("優先度"),
});

// z.infer で TypeScript の型を自動生成する — スキーマが唯一の真実
type ArticleMeta = z.infer<typeof articleMetaSchema>;
// → { title: string; summary: string; tags: string[]; priority: "low" | "mid" | "high" }

// ============================================================
// 3. オフラインのストリーミング体験
//    — AsyncGenerator<string> で文字列を少しずつ "流す"
// ============================================================
// AsyncGenerator<string> = 非同期に string を yield するジェネレータ
// 「ストリーム = for await...of で順に受け取れる非同期なシーケンス」と覚えると分かりやすい
async function* mockStream(text: string): AsyncGenerator<string> {
  // 単語(スペース区切り)に分割して 1 語ずつ yield する
  const words = text.split(" ");
  for (const word of words) {
    yield word + " ";          // 1 語 + スペースを 1 チャンクとして流す
    await delay(80);           // チャンク間に少し待機 → "打鍵されていく" 感を演出
  }
}

async function demoMockStreaming(): Promise<void> {
  console.log("=== [モック] ストリーミング体験 ===");
  console.log("(80ms ずつ単語を流しています)\n");

  const sentence =
    "TypeScript の AsyncGenerator を使うと LLM のストリーミングと同じ体験をオフラインで再現できます。";

  // for await...of で AsyncGenerator から順に値を取り出す
  // process.stdout.write は改行なしで出力するので、文字が流れてくる感が出る
  for await (const chunk of mockStream(sentence)) {
    process.stdout.write(chunk);
  }

  // 全文を別途まとめて取り出したいとき: AsyncGenerator は 1 度しか走れないので
  // もう 1 度 mockStream を呼んで文字列に集約する例
  const collected: string[] = [];
  for await (const chunk of mockStream("集約のデモ")) {
    collected.push(chunk);
  }
  const fullText = collected.join("").trim();
  console.log("\n\n全文を後から取得:", fullText);
}

// ============================================================
// 4. オフラインの構造化出力体験
//    — モックが返す固定値を Zod スキーマで検証 → 型付きオブジェクトとして使う
// ============================================================
async function demoMockStructured(): Promise<void> {
  console.log("\n=== [モック] 構造化出力体験 ===");

  // 本物の generateObject では LLM がこのような JSON を返す。
  // ここでは「固定値を LLM の出力」として扱い、parse で検証する。
  const mockLlmOutput: unknown = {
    title: "AsyncGenerator で学ぶ TypeScript ストリーミング",
    summary: "非同期ジェネレータと for await...of を使って LLM ストリーミングの仕組みを理解する入門記事。",
    tags: ["TypeScript", "AsyncGenerator", "ストリーミング", "AI SDK"],
    priority: "high",
  };

  // schema.parse() → 成功なら型付きオブジェクト、失敗なら例外
  // 本番では safeParse を使うことが多い(例外を投げない安全版)
  const meta: ArticleMeta = articleMetaSchema.parse(mockLlmOutput);
  // ↑ meta は ArticleMeta 型として推論される(= z.infer<typeof articleMetaSchema>)

  console.log("LLM 出力を検証・型付けした結果:");
  console.log("  タイトル:", meta.title);
  console.log("  要約    :", meta.summary);
  console.log("  タグ    :", meta.tags.join(", "));
  console.log("  優先度  :", meta.priority);

  // Zod は不正な値をきちんと弾く — 「LLM の出力は信頼しない」の実演
  const badOutput: unknown = {
    title: "テスト",
    summary: "テスト",
    tags: ["ok"],
    priority: "urgent",  // "urgent" は enum に無い → 検証失敗
  };
  const result = articleMetaSchema.safeParse(badOutput);
  console.log('\n不正な priority "urgent" を渡したら?');
  console.log("  result.success:", result.success);   // false
  if (!result.success) {
    console.log("  エラー:", result.error.issues[0]?.message);
  }
}

// ============================================================
// 5. 本物のストリーミング(APIキーがあるときだけ実行)
//    streamText — await 不要で同期的に結果オブジェクトを返す
// ============================================================
async function demoRealStreaming(): Promise<void> {
  console.log("=== [本物] ストリーミング(streamText) ===\n");

  // streamText は await しない — 呼んだ瞬間に結果オブジェクトが返る
  // モデル ID は Anthropic の最新ドキュメントで確認して置き換えてください
  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    prompt:
      "TypeScript の AsyncGenerator とストリーミングについて、3 文で簡潔に日本語で説明してください。",
  });

  // result.textStream は AsyncIterable<string>
  // for await...of でチャンクを逐次受け取り、stdout に書き出す
  process.stdout.write("Claude: ");
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  // 全文が必要な場合は Promise<string> を await する
  const fullText: string = await result.text;
  console.log("\n\n全文の文字数:", fullText.length, "字");
}

// ============================================================
// 6. 本物の構造化出力(APIキーがあるときだけ実行)
//    generateObject — await する。schema(Zod)で型と検証を兼ねる
// ============================================================
async function demoRealStructured(): Promise<void> {
  console.log("\n=== [本物] 構造化出力(generateObject) ===\n");

  // generateObject は await する
  // object の型は schema から推論される(ArticleMeta と同じ)
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-5"),
    schema: articleMetaSchema,   // Zod スキーマを渡すだけ — JSON Schema 変換は SDK が行う
    prompt:
      "TypeScript の AsyncGenerator に関する技術記事のメタデータを生成してください。",
  });

  // object は ArticleMeta 型に推論されている — キャストも as も不要
  console.log("LLM が返した型付きオブジェクト:");
  console.log("  タイトル:", object.title);
  console.log("  要約    :", object.summary);
  console.log("  タグ    :", object.tags.join(", "));
  console.log("  優先度  :", object.priority);
}

// ============================================================
// main — キーの有無で自動切り替え
// ============================================================
async function main(): Promise<void> {
  if (process.env.ANTHROPIC_API_KEY) {
    // -------- 本物モード --------
    console.log("[本物モード] ANTHROPIC_API_KEY を検出。Claude を呼び出します…\n");
    await demoRealStreaming();
    await demoRealStructured();
  } else {
    // -------- モックモード --------
    console.log("[モックモード] APIキー未設定。オフラインのモックで実行します。");
    console.log("(本物を試すには ANTHROPIC_API_KEY を設定して再実行)\n");

    await demoMockStreaming();
    await demoMockStructured();

    console.log("\n--- 型確認: z.infer の効果 ---");
    // priority は "low" | "mid" | "high" に推論されている
    // @ts-expect-error "urgent" は型に存在しないのでコンパイルエラー
    const _bad: ArticleMeta["priority"] = "urgent";
    void _bad; // 未使用変数の警告を抑制

    // 正しい値なら型エラーにならない
    const _ok: ArticleMeta["priority"] = "high";
    console.log('priority 型のチェック: "high" は OK →', _ok);
  }
}

await main();
