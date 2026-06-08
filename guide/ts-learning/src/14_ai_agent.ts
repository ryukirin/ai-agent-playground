/**
 * ===== 第14章 AI エージェント編(Vercel AI SDK + Zod)=====
 *
 * このファイルは「ツール呼び出し型エージェント」の最小実装です。
 *
 *   ・APIキー無し  → オフラインの「モック・エージェント」が動く(既定)
 *   ・APIキーあり  → 本物の Claude を使うエージェントが動く
 *
 * 実行:
 *   npm run ch14                      … モックで実行(ネット不要)
 *   $env:ANTHROPIC_API_KEY="sk-..."   … キーを設定(PowerShell)してから
 *   npm run ch14                      … 本物の Claude で実行
 *
 * インストールは済み(zod / ai / @ai-sdk/anthropic は package.json にあります)。
 */

import { generateText, tool, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

// ============================================================
// 1. Zod スキーマ —— エージェントの「型」「検証」「説明」を 1 つで担う
// ============================================================
// 1 つの Zod スキーマが 3 つの役割を兼ねるのが、TS × エージェントの肝です。
//   (a) z.infer で TypeScript の型になる
//   (b) safeParse で「信頼できないモデル出力」を実行時に検証できる
//   (c) AI SDK が JSON Schema に変換して LLM に「この形で渡して」と伝える

const weatherInput = z.object({
  city: z.string().describe("都市名(例: 東京)"),
});
type WeatherInput = z.infer<typeof weatherInput>; // → { city: string }

const calcInput = z.object({
  a: z.number(),
  op: z.enum(["+", "-", "*", "/"]),
  b: z.number(),
});
type CalcInput = z.infer<typeof calcInput>; // → { a: number; op: "+"|"-"|"*"|"/"; b: number }

// (b) の実演: モデルが間違った型を返しても safeParse で弾ける
const bad = weatherInput.safeParse({ city: 123 });
console.log("【検証】不正な引数 {city:123} は通る?:", bad.success); // false

// ============================================================
// 2. ツールの「中身」(普通の関数)—— オフラインでも本物でも共用する
// ============================================================
const weatherDB: Record<string, number> = { 東京: 19, 大阪: 22, 札幌: 8 };

function lookupWeather({ city }: WeatherInput): { city: string; tempC: number } {
  return { city, tempC: weatherDB[city] ?? 15 };
}

// op は "+"|"-"|"*"|"/" に絞られているので、switch を never で網羅チェック(第7・12章)
function doCalc({ a, op, b }: CalcInput): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? NaN : a / b;
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}

// ============================================================
// 3. AI SDK の tool() でツールを定義(本物のエージェントが使う)
// ============================================================
// inputSchema に Zod を渡すと、execute の引数が自動で型付けされる(ここが気持ちいい)。
const tools = {
  getWeather: tool({
    description: "指定した都市の現在の気温(摂氏)を返す",
    inputSchema: weatherInput,
    execute: async (input) => lookupWeather(input), // input は WeatherInput に推論される
  }),
  calculate: tool({
    description: "四則演算を 1 つ計算する",
    inputSchema: calcInput,
    execute: async (input) => ({ result: doCalc(input) }),
  }),
};

// ============================================================
// 4. オフラインのモック・エージェント(APIキー無しで動く学習用)
// ============================================================
// 本物では LLM が「どのツールをどんな引数で呼ぶか」を決めます。
// ここではその部分を簡単なルールで“演じる”ことで、エージェントの流れを体験します。
//   ユーザー文 → (疑似モデルが計画) → Zod 検証 → ツール実行 → 観測 → 最終回答

type PlannedCall =
  | { tool: "getWeather"; rawArgs: unknown }
  | { tool: "calculate"; rawArgs: unknown };

function mockModelPlan(prompt: string): PlannedCall[] {
  const calls: PlannedCall[] = [];

  const city = prompt.match(/(東京|大阪|札幌)/);
  if (/天気|気温/.test(prompt) && city) {
    calls.push({ tool: "getWeather", rawArgs: { city: city[1] } });
  }

  const math = prompt.match(/(\d+)\s*([+\-*/×])\s*(\d+)/);
  if (math) {
    const op = math[2] === "×" ? "*" : math[2];
    calls.push({ tool: "calculate", rawArgs: { a: Number(math[1]), op, b: Number(math[3]) } });
  }

  return calls;
}

async function runMockAgent(prompt: string): Promise<string> {
  const plan = mockModelPlan(prompt);
  const observations: string[] = [];

  for (const call of plan) {
    if (call.tool === "getWeather") {
      const parsed = weatherInput.safeParse(call.rawArgs); // ← LLM の出力は必ず検証する
      if (!parsed.success) {
        observations.push("getWeather: 引数の検証に失敗しました");
        continue;
      }
      const r = lookupWeather(parsed.data);
      observations.push(`getWeather(${r.city}) → ${r.tempC}℃`);
    } else {
      const parsed = calcInput.safeParse(call.rawArgs);
      if (!parsed.success) {
        observations.push("calculate: 引数の検証に失敗しました");
        continue;
      }
      const r = doCalc(parsed.data);
      observations.push(`calculate(${parsed.data.a} ${parsed.data.op} ${parsed.data.b}) → ${r}`);
    }
  }

  if (observations.length === 0) return "(呼ぶべきツールが見つかりませんでした)";
  return "ツールの実行結果から回答します:\n  - " + observations.join("\n  - ");
}

// ============================================================
// 5. 本物のエージェント(APIキーがあるときだけ実行)
// ============================================================
async function runRealAgent(prompt: string): Promise<string> {
  const res = await generateText({
    // モデル ID は Anthropic の最新ドキュメントで確認して置き換えてください
    model: anthropic("claude-sonnet-4-5"),
    system: "あなたは有能なアシスタントです。必要なときだけツールを使い、日本語で簡潔に答えます。",
    prompt,
    tools,
    stopWhen: stepCountIs(5), // ツール呼び出し→結果→…を最大5ステップまで自動で回す
  });
  return res.text;
}

// ============================================================
// main —— キーの有無で自動切り替え
// ============================================================
async function main(): Promise<void> {
  const userPrompt = "東京の天気は? あと 12 * 8 も計算して。";
  console.log("\nユーザー:", userPrompt, "\n");

  if (process.env.ANTHROPIC_API_KEY) {
    console.log("[本物モード] ANTHROPIC_API_KEY を検出。Claude を呼び出します…\n");
    console.log("エージェント:\n" + (await runRealAgent(userPrompt)));
  } else {
    console.log("[モックモード] APIキー未設定。オフラインの疑似エージェントで実行します。");
    console.log("(本物を試すには ANTHROPIC_API_KEY を設定して再実行)\n");
    console.log("エージェント:\n" + (await runMockAgent(userPrompt)));
  }
}

await main();
