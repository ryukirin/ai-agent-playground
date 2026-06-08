/**
 * ===== 第14章 AI 智能体篇（Vercel AI SDK + Zod）=====
 *
 * 本文件是「工具调用型智能体」的最小实现。
 *
 *   ・无 API 密钥  → 运行离线「模拟智能体」（默认）
 *   ・有 API 密钥  → 运行使用真实 Claude 的智能体
 *
 * 运行：
 *   npm run ch14                      … 使用模拟模式运行（无需网络）
 *   $env:ANTHROPIC_API_KEY="sk-..."   … 设置密钥（PowerShell）后
 *   npm run ch14                      … 使用真实 Claude 运行
 *
 * 依赖已安装（zod / ai / @ai-sdk/anthropic 均在 package.json 中）。
 */

import { generateText, tool, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

// ============================================================
// 1. Zod Schema —— 同时承担智能体的「类型」「验证」「说明」
// ============================================================
// 1 个 Zod Schema 兼具 3 种角色，这是 TS × 智能体的核心。
//   (a) 通过 z.infer 成为 TypeScript 的类型
//   (b) 通过 safeParse 对「不可信的模型输出」进行运行时验证
//   (c) AI SDK 将其转换为 JSON Schema，告诉 LLM「请以此格式传递」

const weatherInput = z.object({
  city: z.string().describe("城市名（例：北京）"),
});
type WeatherInput = z.infer<typeof weatherInput>; // → { city: string }

const calcInput = z.object({
  a: z.number(),
  op: z.enum(["+", "-", "*", "/"]),
  b: z.number(),
});
type CalcInput = z.infer<typeof calcInput>; // → { a: number; op: "+"|"-"|"*"|"/"; b: number }

// (b) 的演示：即使模型返回错误类型，也能用 safeParse 拦截
const bad = weatherInput.safeParse({ city: 123 });
console.log("【验证】非法参数 {city:123} 能通过吗?:", bad.success); // false

// ============================================================
// 2. 工具的「内容」（普通函数）—— 离线版和真实版共用
// ============================================================
const weatherDB: Record<string, number> = { 北京: 19, 上海: 22, 哈尔滨: 8 };

function lookupWeather({ city }: WeatherInput): { city: string; tempC: number } {
  return { city, tempC: weatherDB[city] ?? 15 };
}

// op 被收窄为 "+"|"-"|"*"|"/"，用 switch 和 never 进行穷举检查（第7・12章）
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
// 3. 用 AI SDK 的 tool() 定义工具（供真实智能体使用）
// ============================================================
// 向 inputSchema 传入 Zod 后，execute 的参数会自动获得类型（这很舒适）。
const tools = {
  getWeather: tool({
    description: "返回指定城市的当前气温（摄氏度）",
    inputSchema: weatherInput,
    execute: async (input) => lookupWeather(input), // input 被推断为 WeatherInput
  }),
  calculate: tool({
    description: "计算一次四则运算",
    inputSchema: calcInput,
    execute: async (input) => ({ result: doCalc(input) }),
  }),
};

// ============================================================
// 4. 离线模拟智能体（无需 API 密钥的学习用）
// ============================================================
// 在真实版中，LLM 决定「调用哪个工具・用什么参数」。
// 这里用简单规则「演示」这部分，以体验智能体的运行流程。
//   用户文本 → （伪模型规划）→ Zod 验证 → 工具执行 → 观测 → 最终回答

type PlannedCall =
  | { tool: "getWeather"; rawArgs: unknown }
  | { tool: "calculate"; rawArgs: unknown };

function mockModelPlan(prompt: string): PlannedCall[] {
  const calls: PlannedCall[] = [];

  const city = prompt.match(/(北京|上海|哈尔滨)/);
  if (/天气|气温/.test(prompt) && city) {
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
      const parsed = weatherInput.safeParse(call.rawArgs); // ← LLM 的输出必须验证
      if (!parsed.success) {
        observations.push("getWeather：参数验证失败");
        continue;
      }
      const r = lookupWeather(parsed.data);
      observations.push(`getWeather(${r.city}) → ${r.tempC}℃`);
    } else {
      const parsed = calcInput.safeParse(call.rawArgs);
      if (!parsed.success) {
        observations.push("calculate：参数验证失败");
        continue;
      }
      const r = doCalc(parsed.data);
      observations.push(`calculate(${parsed.data.a} ${parsed.data.op} ${parsed.data.b}) → ${r}`);
    }
  }

  if (observations.length === 0) return "（未找到需要调用的工具）";
  return "根据工具执行结果回答：\n  - " + observations.join("\n  - ");
}

// ============================================================
// 5. 真实智能体（仅在有 API 密钥时运行）
// ============================================================
async function runRealAgent(prompt: string): Promise<string> {
  const res = await generateText({
    // 请参考 Anthropic 官方文档替换为最新模型 ID
    model: anthropic("claude-sonnet-4-5"),
    system: "您是一位能干的助手。仅在必要时使用工具，并用中文简洁地回答。",
    prompt,
    tools,
    stopWhen: stepCountIs(5), // 工具调用→结果→…最多自动循环5步
  });
  return res.text;
}

// ============================================================
// main —— 根据密钥是否存在自动切换
// ============================================================
async function main(): Promise<void> {
  const userPrompt = "北京的天气怎么样？另外 12 * 8 也帮我算一下。";
  console.log("\n用户：", userPrompt, "\n");

  if (process.env.ANTHROPIC_API_KEY) {
    console.log("[真实模式] 检测到 ANTHROPIC_API_KEY。正在调用 Claude…\n");
    console.log("智能体：\n" + (await runRealAgent(userPrompt)));
  } else {
    console.log("[模拟模式] 未设置 API 密钥。使用离线伪智能体运行。");
    console.log("（若要使用真实版，请设置 ANTHROPIC_API_KEY 后重新运行）\n");
    console.log("智能体：\n" + (await runMockAgent(userPrompt)));
  }
}

await main();
