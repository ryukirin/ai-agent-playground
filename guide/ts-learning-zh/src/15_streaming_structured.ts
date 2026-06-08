/**
 * ===== 第15章 流式传输 & 结构化输出（Vercel AI SDK v6 + Zod）=====
 *
 * 本文件是体验两个主题的示例。
 *   1. 流式传输 (streaming)   — 以 chunk 为单位逐次接收文本
 *   2. 结构化输出              — 通过 Zod schema 接收「带类型、经过验证的对象」
 *
 *   ・无 API Key  → 可通过离线 mock 体验两者效果（默认）
 *   ・有 API Key  → 使用真实 Claude 的版本运行
 *
 * 运行：
 *   npm run ch15                        … 使用 mock 运行（无需联网）
 *   $env:ANTHROPIC_API_KEY="sk-..."     … 设置 Key（PowerShell）后
 *   npm run ch15                        … 使用真实 Claude 运行
 *
 * 依赖已安装（zod / ai / @ai-sdk/anthropic 已在 package.json 中）。
 */

import { streamText, generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

// ============================================================
// 1. 工具函数：delay — 将 setTimeout Promise 化（第11章的应用）
// ============================================================
// 返回 Promise<void> 的简单等待函数。与 AsyncGenerator 的 yield 配合使用。
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// 2. 结构化输出使用的 Zod schema
// ============================================================
// 文章元数据示例。用于从 LLM 接收「带类型、经过验证的对象」。
const articleMetaSchema = z.object({
  title: z.string().describe("文章标题"),
  summary: z.string().describe("100字以内的摘要"),
  tags: z.array(z.string()).describe("相关标签（1～5个）"),
  priority: z.enum(["low", "mid", "high"]).describe("优先级"),
});

// 用 z.infer 自动生成 TypeScript 类型——schema 是唯一的事实来源
type ArticleMeta = z.infer<typeof articleMetaSchema>;
// → { title: string; summary: string; tags: string[]; priority: "low" | "mid" | "high" }

// ============================================================
// 3. 离线流式传输体验
//    — 用 AsyncGenerator<string> 逐步「流出」字符串
// ============================================================
// AsyncGenerator<string> = 异步地 yield string 的生成器
// 「流 = 可用 for await...of 按顺序接收的异步序列」——这样理解更容易记住
async function* mockStream(text: string): AsyncGenerator<string> {
  // 按空格分割为单词，每次 yield 一个词
  const words = text.split(" ");
  for (const word of words) {
    yield word + " ";          // 将「一个词 + 空格」作为一个 chunk 流出
    await delay(80);           // chunk 之间稍作等待 → 演出「逐字打出」的感觉
  }
}

async function demoMockStreaming(): Promise<void> {
  console.log("=== [mock] 流式传输体验 ===");
  console.log("（每隔 80ms 流出一个词）\n");

  const sentence =
    "使用 TypeScript 的 AsyncGenerator 可以在离线状态下重现与 LLM 流式传输相同的体验。";

  // 用 for await...of 从 AsyncGenerator 中依次取出值
  // process.stdout.write 不换行输出，产生文字流淌感
  for await (const chunk of mockStream(sentence)) {
    process.stdout.write(chunk);
  }

  // 如果需要单独汇总全文：AsyncGenerator 只能运行一次，
  // 需要再次调用 mockStream 并将结果收集为字符串
  const collected: string[] = [];
  for await (const chunk of mockStream("汇总演示")) {
    collected.push(chunk);
  }
  const fullText = collected.join("").trim();
  console.log("\n\n之后获取全文:", fullText);
}

// ============================================================
// 4. 离线结构化输出体验
//    — 用 Zod schema 验证 mock 返回的固定值 → 作为带类型对象使用
// ============================================================
async function demoMockStructured(): Promise<void> {
  console.log("\n=== [mock] 结构化输出体验 ===");

  // 真实的 generateObject 中，LLM 会返回这样的 JSON。
  // 这里将「固定值」当作 LLM 的输出，用 parse 进行验证。
  const mockLlmOutput: unknown = {
    title: "通过 AsyncGenerator 学习 TypeScript 流式传输",
    summary: "使用异步生成器和 for await...of 理解 LLM 流式传输机制的入门文章。",
    tags: ["TypeScript", "AsyncGenerator", "流式传输", "AI SDK"],
    priority: "high",
  };

  // schema.parse() → 成功则返回带类型的对象，失败则抛出异常
  // 生产环境通常使用 safeParse（不抛出异常的安全版本）
  const meta: ArticleMeta = articleMetaSchema.parse(mockLlmOutput);
  // ↑ meta 被推断为 ArticleMeta 类型（= z.infer<typeof articleMetaSchema>）

  console.log("验证并标注类型后的 LLM 输出：");
  console.log("  标题:", meta.title);
  console.log("  摘要:", meta.summary);
  console.log("  标签:", meta.tags.join(", "));
  console.log("  优先级:", meta.priority);

  // Zod 会正确拒绝非法值——演示「不信任 LLM 输出」的实践
  const badOutput: unknown = {
    title: "测试",
    summary: "测试",
    tags: ["ok"],
    priority: "urgent",  // "urgent" 不在 enum 中 → 验证失败
  };
  const result = articleMetaSchema.safeParse(badOutput);
  console.log('\n传入非法的 priority "urgent" 会怎样？');
  console.log("  result.success:", result.success);   // false
  if (!result.success) {
    console.log("  错误:", result.error.issues[0]?.message);
  }
}

// ============================================================
// 5. 真实流式传输（仅在有 API Key 时运行）
//    streamText — 无需 await，同步返回结果对象
// ============================================================
async function demoRealStreaming(): Promise<void> {
  console.log("=== [真实] 流式传输（streamText） ===\n");

  // streamText 不 await——调用的瞬间返回结果对象
  // 请在 Anthropic 官方文档中确认最新模型 ID 并替换
  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    prompt:
      "请用三句简洁的中文说明 TypeScript 的 AsyncGenerator 与流式传输。",
  });

  // result.textStream 是 AsyncIterable<string>
  // 用 for await...of 逐次接收 chunk 并写入 stdout
  process.stdout.write("Claude: ");
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  // 如果需要全文，await Promise<string>
  const fullText: string = await result.text;
  console.log("\n\n全文字符数:", fullText.length, "字");
}

// ============================================================
// 6. 真实结构化输出（仅在有 API Key 时运行）
//    generateObject — 需要 await。用 schema（Zod）兼顾类型与验证
// ============================================================
async function demoRealStructured(): Promise<void> {
  console.log("\n=== [真实] 结构化输出（generateObject） ===\n");

  // generateObject 需要 await
  // object 的类型从 schema 推断（与 ArticleMeta 相同）
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-5"),
    schema: articleMetaSchema,   // 只需传入 Zod schema——JSON Schema 转换由 SDK 完成
    prompt:
      "请生成一篇关于 TypeScript AsyncGenerator 的技术文章的元数据。",
  });

  // object 被推断为 ArticleMeta 类型——无需强制转换或 as
  console.log("LLM 返回的带类型对象：");
  console.log("  标题:", object.title);
  console.log("  摘要:", object.summary);
  console.log("  标签:", object.tags.join(", "));
  console.log("  优先级:", object.priority);
}

// ============================================================
// main — 根据 Key 是否存在自动切换
// ============================================================
async function main(): Promise<void> {
  if (process.env.ANTHROPIC_API_KEY) {
    // -------- 真实模式 --------
    console.log("[真实模式] 检测到 ANTHROPIC_API_KEY。正在调用 Claude…\n");
    await demoRealStreaming();
    await demoRealStructured();
  } else {
    // -------- mock 模式 --------
    console.log("[mock 模式] 未设置 API Key。使用离线 mock 运行。");
    console.log("（要体验真实效果，请设置 ANTHROPIC_API_KEY 后重新运行）\n");

    await demoMockStreaming();
    await demoMockStructured();

    console.log("\n--- 类型确认：z.infer 的效果 ---");
    // priority 被推断为 "low" | "mid" | "high"
    // @ts-expect-error "urgent" 不存在于类型中，会产生编译错误
    const _bad: ArticleMeta["priority"] = "urgent";
    void _bad; // 抑制未使用变量的警告

    // 正确的值不会产生类型错误
    const _ok: ArticleMeta["priority"] = "high";
    console.log('priority 类型检查："high" 合法 →', _ok);
  }
}

await main();
