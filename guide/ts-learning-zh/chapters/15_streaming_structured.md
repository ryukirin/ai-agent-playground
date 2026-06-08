# 第15章 流式传输 & 结构化输出（AI SDK + Zod）

> 将 LLM 的响应作为「流式文本」接收的**流式传输 (streaming)**，以及作为「带类型、经过验证的对象」接收的**结构化输出 (structured output)**——本章使用 TypeScript 的异步迭代器（`AsyncGenerator` / `for await...of`）与 Zod schema 来实现这两个功能。即使没有 API Key，也可以通过离线 mock 体验两者的效果。

---

> ⚠️ **版本说明**：本章示例基于 **AI SDK v6**（`ai@6`）和 **Zod 4**。由于 API 可能发生变更，请参阅[官方文档（ai-sdk.dev）](https://ai-sdk.dev/)获取最新信息。

---

## 🎯 本章目标

- **为什么需要流式传输** ——能够从 UX 角度说明原因，并理解 `streamText` 的工作机制
- 理解 `AsyncGenerator<string>` 与 `for await...of` 在 TypeScript 中的含义
- 能够实现 `generateObject` + Zod schema 接收**带类型、经过验证的对象**的流程
- 结合第14章，说明 `z.infer` 从 schema 自动生成类型的机制
- 掌握在离线 mock 与真实 API 之间切换的方法

---

## 为什么需要流式传输？

聊天 AI 返回文本时，LLM 从第一个词开始**逐 token** 生成。如果等到全文生成完毕再显示，遇到较长的响应可能需要沉默数秒甚至数十秒。

使用**流式传输**后，LLM 一边生成、token 一边到达，用户可以立即开始阅读。

```
无流式：[=== 等待全文生成 ===]→ 一次性显示
有流式：「TypeScript」「的」「异步是…」 ← 像打字一样逐字流出
```

在 ChatGPT 和 Claude.ai 中感受到的「文字流淌感」正是如此。

---

## `streamText` 与 `textStream`

Vercel AI SDK 的 `streamText` 最大的特点是**不需要 `await`**。

```ts
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

// 不 await——调用的瞬间就返回结果对象
const result = streamText({
  model: anthropic("claude-sonnet-4-5"), // 请替换为最新的模型 ID
  prompt: "请用两句话解释 TypeScript 的 async/await。",
});

// result.textStream 是 AsyncIterable<string>
// 使用 for await...of 逐次接收 chunk
for await (const chunk of result.textStream) {
  process.stdout.write(chunk); // 不换行输出 → 产生文字流淌感
}

// 如果之后需要一次性获取全文，await Promise<string>
const fullText: string = await result.text;
console.log("\n全文字符数:", fullText.length);
```

| 要点 | 说明 |
|---|---|
| `streamText(...)` **不 await** | 内部开始与 LLM 的连接，但结果对象同步返回 |
| `result.textStream` 是 `AsyncIterable<string>` | 可用 `for await...of` 依次接收 chunk |
| `result.text` 是 `Promise<string>` | 需要在流完成后获取全文时 await |

---

## `AsyncGenerator<string>` 与 `for await...of` 的 TS 说明

流式传输的核心是**异步迭代器**。在 TypeScript 中可以用 `async function*`（异步生成器）来创建。

```ts
// delay 是第11章学过的「将 setTimeout Promise 化」的模式
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// AsyncGenerator<string> = 异步地 yield string 的生成器
async function* mockStream(text: string): AsyncGenerator<string> {
  const words = text.split(" ");
  for (const word of words) {
    yield word + " ";   // 每次 yield 一个词作为 chunk
    await delay(80);    // 等待 80ms 再发送下一个 chunk
  }
}

// 用 for await...of 接收——streamText 的 textStream 也是同样的机制
for await (const chunk of mockStream("你好 TypeScript 的世界")) {
  process.stdout.write(chunk);
}
```

`AsyncGenerator<string>` 是「异步地逐个输出 string 的序列」。`for await...of` 是**按顺序**取出它们的循环。

```
AsyncGenerator<string>     for await...of
┌──────────────────┐        ┌─────────────────────────┐
│  yield "你好"    │──→│ chunk = "你好 "         │
│  yield "TypeScript"│──→│ chunk = "TypeScript "   │
│  yield "的世界"  │──→│ chunk = "的世界 "       │
└──────────────────┘        └─────────────────────────┘
```

> **streamText 的 `textStream` 也是相同的类型**（`AsyncIterable<string>`）。通过 mock 理解其运作方式后，迁移到真实 API 时不会感到困惑。

---

## `generateObject` + Zod 实现结构化输出

与返回自由文本（如「天气怎么样？」）的 `generateText` 不同，`generateObject` 会**指示 LLM 返回 JSON 对象**，并使用 Zod schema 自动进行验证和类型标注。

### 定义 schema

```ts
import { z } from "zod";

const articleMetaSchema = z.object({
  title:    z.string().describe("文章标题"),
  summary:  z.string().describe("100字以内的摘要"),
  tags:     z.array(z.string()).describe("相关标签（1～5个）"),
  priority: z.enum(["low", "mid", "high"]).describe("优先级"),
});

// 用 z.infer 从 schema 自动生成 TypeScript 类型
type ArticleMeta = z.infer<typeof articleMetaSchema>;
// → { title: string; summary: string; tags: string[]; priority: "low" | "mid" | "high" }
```

`describe(...)` 附加的说明会作为提示传递给 LLM。schema 同时充当「类型定义文档」和「LLM 的指令文档」。

### 用 `generateObject` 接收

```ts
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

// generateObject 需要 await
const { object } = await generateObject({
  model: anthropic("claude-sonnet-4-5"),
  schema: articleMetaSchema,      // 只需传入 Zod schema
  prompt: "请生成一篇关于 TypeScript 异步处理的技术文章的元数据。",
});

// object 被推断为 ArticleMeta 类型——无需 as 或 any
console.log(object.title);       // 可作为 string 使用
console.log(object.priority);    // 可作为 "low" | "mid" | "high" 使用
```

`generateObject` 在内部将 Zod schema 转换为 JSON Schema 传给 LLM，将返回的 JSON 通过 `schema.parse()` 验证后放入 `object`。类型一致性由 SDK 保证。

### 用 mock 确认运作方式

即使没有真实的 LLM，将固定值通过 `schema.parse()` 也能获得相同体验。

```ts
const mockOutput: unknown = {
  title:    "通过 AsyncGenerator 学习 TypeScript",
  summary:  "使用异步生成器的流式传输入门",
  tags:     ["TypeScript", "AsyncGenerator"],
  priority: "high",
};

const meta: ArticleMeta = articleMetaSchema.parse(mockOutput);
// ↑ 成功则获得 ArticleMeta 类型的对象

// 非法值会被拒绝
const bad: unknown = { title: "测试", summary: "测试", tags: [], priority: "urgent" };
const result = articleMetaSchema.safeParse(bad);
console.log(result.success); // false → "urgent" 不在 enum 中
```

`safeParse` 的返回值是**可辨识联合 (discriminated union)**（第7・12章）。通过 `if (result.success)` 缩窄类型后，`result.data` 可作为 `ArticleMeta` 类型安全使用。

---

## 关于 `streamObject`（补充）

`generateObject` 也有流式版本 `streamObject`。

```ts
import { streamObject } from "ai";

const { partialObjectStream } = streamObject({
  model: anthropic("claude-sonnet-4-5"),
  schema: articleMetaSchema,
  prompt: "...",
});

// 部分完成的对象会陆续流出
for await (const partial of partialObjectStream) {
  console.log(partial); // 例如: { title: "AsyncGenerator..." } → 逐渐填充
}
```

在需要实时更新表单预览等场景下非常方便。详情请参阅[官方文档](https://ai-sdk.dev/)。

---

## 离线与真实 API 的切换

`src/15_streaming_structured.ts` 与第14章相同，采用「根据 Key 是否存在自动切换」的模式。

```ts
async function main(): Promise<void> {
  if (process.env.ANTHROPIC_API_KEY) {
    // 使用 streamText / generateObject 调用真实 Claude
    await demoRealStreaming();
    await demoRealStructured();
  } else {
    // 使用 AsyncGenerator mock 和 schema.parse() 体验离线效果
    await demoMockStreaming();
    await demoMockStructured();
  }
}
```

| 角色 | mock 版 | 真实版（AI SDK） |
|---|---|---|
| 生成流 | `async function* mockStream(...)` | `streamText()` → `result.textStream` |
| 接收 chunk | `for await...of mockStream(...)` | `for await...of result.textStream` |
| 结构化输出 | `schema.parse(固定值)` | `generateObject({ schema })` → `object` |
| 类型标注 | 用 `z.infer` 生成 `ArticleMeta` 类型 | 同样的 `z.infer`——SDK 自动验证后返回 |

**循环语法（`for await...of`）在真实 API 和 mock 中完全相同**。先用 mock 体验运作方式，再迁移到真实 API，代码结构不会改变。

---

## ⚠️ 常见误区

### 对 `streamText` 使用了 `await`

```ts
// ❌ await 后 textStream 将无法使用
const result = await streamText({ ... });

// ✅ 不 await——从结果对象中取出 textStream
const result = streamText({ ... });
for await (const chunk of result.textStream) { ... }
```

`streamText` 的特点是「调用的瞬间返回结果对象」。`await` 会阻塞直到所有 chunk 到达，流式传输的意义便会丧失。

### `generateText`（字符串）与 `generateObject`（JSON）的使用区别

```ts
// 返回自由文本 → generateText
const { text } = await generateText({ model, prompt: "请告诉我关于...的内容" });

// 返回带类型的对象 → generateObject + Zod schema
const { object } = await generateObject({ model, schema: mySchema, prompt: "..." });
```

「传入了 schema，`generateText` 也会返回 JSON」并不一定成立。结构化输出必须使用 `generateObject`。

### 直接信任 LLM 的输出

`generateObject` 内部会进行验证，相对安全，但如果使用 `generateText` 自行解析 JSON，**请务必用 Zod 验证**。

```ts
// ❌ 直接从 unknown 强制转换 LLM 的输出
const meta = JSON.parse(llmOutput) as ArticleMeta; // 运行时可能崩溃

// ✅ 用 safeParse 验证后再使用
const result = articleMetaSchema.safeParse(JSON.parse(llmOutput));
if (result.success) {
  // result.data 作为 ArticleMeta 类型安全使用
  console.log(result.data.title);
}
```

### 没有注意到 `z.infer` 能「从同一个 schema 自动生成类型」

schema、类型定义、LLM 的指令**不需要分别写在3个地方**。

```ts
const schema = z.object({ name: z.string(), age: z.number() });
type Person = z.infer<typeof schema>; // ← 只写这里就够了

// schema 变更时 Person 类型也会自动跟随 → 手动更新遗漏归零
```

---

## ✍️ 练习题

### 题目 1

改造 `mockStream`，编写一个**逐字符**流式传输的 `charStream`。每次 `yield` 一个字符，中间加入 `await delay(30)`。确认可以用 `for await...of` 使用。

<details><summary>参考答案</summary>

```ts
async function* charStream(text: string): AsyncGenerator<string> {
  for (const char of text) {
    yield char;
    await delay(30);
  }
}

// 使用方式
for await (const ch of charStream("Hello TS!")) {
  process.stdout.write(ch);
}
```

可以用 `for...of` 遍历字符串（字符串是 `Iterable<string>`）也是 TypeScript 的有趣特性。

</details>

---

### 题目 2

定义以下 Zod schema，并用 `z.infer` 提取类型。然后使用 `safeParse` 编写验证「正常值」和「非法值」的代码。

```ts
// weather 的 schema:
//   city: 字符串
//   tempC: 数值（-50 ～ 60 的范围）
//   condition: "sunny" | "cloudy" | "rainy" 三选一
```

<details><summary>参考答案</summary>

```ts
import { z } from "zod";

const weatherSchema = z.object({
  city:      z.string(),
  tempC:     z.number().min(-50).max(60),
  condition: z.enum(["sunny", "cloudy", "rainy"]),
});

type Weather = z.infer<typeof weatherSchema>;
// → { city: string; tempC: number; condition: "sunny" | "cloudy" | "rainy" }

// 正常值
const ok = weatherSchema.safeParse({ city: "北京", tempC: 24, condition: "sunny" });
console.log(ok.success);             // true
if (ok.success) console.log(ok.data.city); // "北京"（类型安全）

// 非法值：tempC 超出范围
const ng = weatherSchema.safeParse({ city: "火星", tempC: 999, condition: "sunny" });
console.log(ng.success);             // false
if (!ng.success) console.log(ng.error.issues[0]?.message);
```

可以用 `z.number().min().max()` 这样的链式调用添加约束。`safeParse` 的返回值是可辨识联合（第7章），通过 `if (ok.success)` 可以缩窄类型。

</details>

---

### 题目 3

请各举2个使用场景，说明 `generateObject` 与 `generateText` 的使用区别（论述题）。

<details><summary>参考答案</summary>

**`generateObject`（需要带类型对象的情况）**
- 文章自动分类（以 JSON 形式接收标题、标签、优先级并保存到数据库）
- 表单输入自动补全（以结构化数据接收姓名、地址、电话号码）

**`generateText`（需要返回自由文本的情况）**
- 对用户的回复文本（聊天助手）
- 代码说明或代码审查评论的生成

关键在于「接收到的数据是**由程序处理**，还是**直接给人查看**」。如果由程序处理，使用 `generateObject` + Zod schema 确保类型安全；如果是人阅读的自由文本，则适合使用 `generateText`。

</details>

---

## 📌 总结

- **流式传输（`streamText`）**：不 `await` 直接调用 → 通过 `for await...of` 接收 `result.textStream`（`AsyncIterable<string>`）。改善 UX 的标准做法
- **`AsyncGenerator<string>`**：用 `async function*` 创建的异步迭代器。可用 `for await...of` 依次接收。作为 mock 构建后与真实 textStream 使用体验完全相同
- **结构化输出（`generateObject`）**：将 Zod schema 传入 `schema`，即可一次完成对 LLM 的指令、运行时验证和 TypeScript 类型标注。`object` 无需强制转换，直接带类型
- **`z.infer`**：从 schema 自动生成类型。可在一处管理 schema、类型和 LLM 指令——第14章的知识直接适用
- **「不信任 LLM 的输出」**：`generateObject` 由 SDK 内部验证，但手动处理 JSON 时必须使用 `safeParse`

---

## ▶ 运行

```bash
npm run ch15
# 使用真实 Claude（PowerShell）：
#   $env:ANTHROPIC_API_KEY = "sk-ant-..."; npm run ch15
```
