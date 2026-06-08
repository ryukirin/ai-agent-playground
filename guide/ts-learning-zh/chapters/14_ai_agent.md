# 第14章 AI 智能体篇（Vercel AI SDK + Zod）

> 之前学到的「类型・泛型・可辨识联合・Zod Schema」，在 AI 智能体开发中会直接成为利器。通过**无需 API 密钥即可离线运行**的示例，体验工具调用型智能体的工作机制。

## 🎯 本章目标

- 能够解释「智能体 = LLM + 工具 + 循环」这一结构
- 理解 **1 个 Zod Schema 同时承担「类型・运行时验证・LLM 的指示」三种角色**
- 能用 Vercel AI SDK v6 的 `tool()` / `generateText()` 编写智能体
- 掌握「不信任 LLM 的输出（必须验证）」这一安全要点

---

## 智能体是什么？

简单来说，就是**「LLM 在必要时使用"工具"，持续思考直到达成目标的机制」**。流程如下：

```
用户的请求
   ↓
LLM 决定「调用哪个工具・用什么参数」
   ↓
您的代码验证参数并执行工具
   ↓
将结果返回给 LLM
   ↓（若还需要则继续循环）
LLM 生成最终答案
```

LLM 输出的「工具名和参数」只是**纯文本/JSON**，可能存在错误。因此 **TypeScript 的类型和 Zod 的验证**才能发挥作用。

---

## 关键在于 Zod Schema（这是最重要的部分）

用 **1 个 Zod Schema** 定义工具的输入，它可以同时承担 **3 种角色**：

```ts
import { z } from "zod";

const weatherInput = z.object({
  city: z.string().describe("城市名（例：北京）"),
});
```

| 角色 | 使用方式 | 效果 |
|---|---|---|
| ① 成为类型 | `type WeatherInput = z.infer<typeof weatherInput>` | 获得 `{ city: string }` 这一 TS 类型 |
| ② 运行时验证 | `weatherInput.safeParse(模型的输出)` | 即使 LLM 返回错误值也能拦截 |
| ③ 对 LLM 的指示 | AI SDK 将其转换为 JSON Schema | LLM 明白「应该用这种形式传递」 |

第3章学到的 `unknown`、第7章的 `safeParse`（可辨识联合）、第9章的 `z.infer`（类型提取）——全都在这里用到。

```ts
// ② 的演示：即使模型返回错误类型，也能用 safeParse 阻止
const bad = weatherInput.safeParse({ city: 123 });
console.log(bad.success); // false ← 执行前就能发现问题
```

> **safeParse 的返回值是可辨识联合**。用 `if (parsed.success)` 收窄后，`parsed.data`（经过验证的类型化数据）就可以安全使用。这正是第7・12章的模式。

---

## 定义工具（`tool()`）

向 Vercel AI SDK 的 `tool()` 传入 Zod Schema，**`execute` 的参数会自动获得类型**。

```ts
import { tool } from "ai";

const getWeather = tool({
  description: "返回指定城市的当前气温（摄氏度）", // LLM 读取此说明来判断是否使用
  inputSchema: weatherInput,
  execute: async (input) => {
    // input 被推断为 WeatherInput 类型（= { city: string }）！
    return { city: input.city, tempC: 19 };
  },
});
```

> ⚠️ **版本注意**：本示例基于 **AI SDK v6**（`ai@6`）。v5/v6 属性名有所变化。
> - 旧：`parameters` → 新：**`inputSchema`**
> - 旧：`maxSteps` → 新：**`stopWhen: stepCountIs(n)`**
> 旧文章的代码可能无法直接运行，请参考[官方文档](https://ai-sdk.dev/)确认最新 API。

---

## 运行智能体（`generateText`）

传入工具并调用 `generateText`，AI SDK 会自动循环执行「LLM ↔ 工具」的交互。

```ts
import { generateText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const res = await generateText({
  model: anthropic("claude-sonnet-4-5"), // 请替换为最新版模型 ID
  system: "您是一位能干的助手。",
  prompt: "北京的天气怎么样？",
  tools: { getWeather, calculate },
  stopWhen: stepCountIs(5), // 工具调用→结果→…最多循环5步
});

console.log(res.text);   // 最终回答（string）
console.log(res.steps);  // 每个步骤（调用了哪个工具、怎么调用的）
```

不指定 `stopWhen` 时**默认为 1 步**（`stepCountIs(1)`），调用工具后就会停止。若要根据工具结果给出答案，必须增加步数。

---

## 实际运行：`src/14_ai_agent.ts`

本仓库的 [`src/14_ai_agent.ts`](../src/14_ai_agent.ts) **根据是否有 API 密钥自动切换**运行模式。

### 离线（模拟）运行 — 无需密钥

```bash
npm run ch14
```

用简单规则代替 LLM 演示「调用哪个工具」的**模拟智能体**会运行。输出示例：

```
【验证】非法参数 {city:123} 能通过吗?: false
用户：北京的天气？另外 12 * 8 也帮我算一下。
[模拟模式] ...
智能体：
  - getWeather(北京) → 19℃
  - calculate(12 * 8) → 96
```

无需网络也无需 API，可安全学习**智能体的流程（规划→验证→执行→观测→回答）**。

### 使用真实 Claude 运行 — 需要 API 密钥

1. 在 [console.anthropic.com](https://console.anthropic.com/) 获取 API 密钥（按量计费）
2. 设置环境变量后运行（PowerShell）：

```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
npm run ch14
```

检测到密钥后，使用相同的工具定义运行**真实的 `generateText`**。`@ai-sdk/anthropic` 会自动读取 `ANTHROPIC_API_KEY`。

---

## 模拟版 ↔ 真实版 的对应关系

| 角色 | 模拟版（学习用） | 真实版（AI SDK） |
|---|---|---|
| 决定调用工具 | `mockModelPlan()`（正则规则） | LLM（`generateText` 内部执行） |
| 参数验证 | 手动调用 `schema.safeParse()` | AI SDK 用 `inputSchema` 自动验证 |
| 工具执行 | 直接调用 `lookupWeather()` | `tool()` 的 `execute` 被调用 |
| 循环控制 | `for` 循环 | `stopWhen: stepCountIs(n)` |

**工具的「内容」（`lookupWeather` / `doCalc`）在两者之间共用**。因此切换到真实版时不需要重写逻辑。

---

## ⚠️ 常见误区

- **使用了 `parameters` / `maxSteps`**（v4 及以前的写法）。v6 使用 `inputSchema` / `stopWhen`。
- **忘记添加 `stopWhen`** → 调用一次工具后 `res.text` 为空。
- **直接信任 LLM 的输出** → 必须先用 Zod 验证，再执行（使用 `tool()` 则自动验证；手动循环则用 `safeParse`）。
- **将 API 密钥硬编码在代码中** → 通过环境变量传递。不要提交到仓库。

---

## ✍️ 练习题

### 题目 1

请在 `src/14_ai_agent.ts` 中添加**货币转换工具 `convertJpyToUsd`**。输入为 `{ jpy: number }`，输出为 `{ usd: number }`（汇率固定为 `1 USD = 150 JPY` 即可）。请编写 Zod Schema、普通函数、`tool()` 定义三个部分。

<details><summary>参考答案</summary>

```ts
const convertInput = z.object({ jpy: z.number().nonnegative() });
type ConvertInput = z.infer<typeof convertInput>;

function convert({ jpy }: ConvertInput): { usd: number } {
  return { usd: Math.round((jpy / 150) * 100) / 100 };
}

const convertJpyToUsd = tool({
  description: "将日元（JPY）转换为美元（USD）",
  inputSchema: convertInput,
  execute: async (input) => convert(input),
});
```

还可以像 `z.number().nonnegative()` 这样添加约束。将 `convertJpyToUsd` 加入 `tools` 后，真实智能体也可以使用该工具。

</details>

### 题目 2

利用 `safeParse` 的返回值是**可辨识联合**这一特性，编写一个函数 `validate<T>(schema, input)`：验证成功时返回 `data`，失败时返回第一个错误消息（提示：接受 `z.ZodType<T>` 作为参数的泛型函数）。

<details><summary>参考答案</summary>

```ts
function validate<T>(schema: z.ZodType<T>, input: unknown):
  | { ok: true; data: T }
  | { ok: false; message: string } {
  const r = schema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };
  return { ok: false, message: r.error.issues[0]?.message ?? "验证错误" };
}

const r = validate(z.object({ age: z.number() }), { age: "x" });
console.log(r.ok ? r.data : r.message);
```

这是第8章泛型与第7章可辨识联合的组合技。用 `r.ok` 分支后，`data` / `message` 会被类型安全地收窄。

</details>

### 题目 3

请从 `eval` 式危险、类型不匹配、意外值三个角度，用2～3行说明「不应直接执行 LLM 输出的原因」（简答题）。

<details><summary>参考答案</summary>

LLM 的输出是概率性文本，无法保证符合 Schema。可能包含类型错误的值（应为数字却是字符串）、超出范围的值、不存在的工具名，甚至恶意指令。因此要在执行前用 `inputSchema`（Zod）**必须验证**，只将通过验证的安全数据传递给工具。这样可以不使用 `any`，同时确保类型安全和运行时安全。

</details>

---

## 📌 总结

- 智能体 = **LLM + 工具 + 循环**。LLM 选择工具和参数，您的代码负责验证和执行
- **1 个 Zod Schema 兼具「类型（`z.infer`）・验证（`safeParse`）・对 LLM 的指示（JSON Schema）」**——这是 TS × 智能体的最大优势
- AI SDK v6：`tool({ description, inputSchema, execute })` 与 `generateText({ model, tools, stopWhen: stepCountIs(n) })`
- **不信任 LLM 的输出**。只使用通过 Schema 验证的类型化数据
- 本示例无需密钥也可运行（模拟模式）。真实模式只需设置 `ANTHROPIC_API_KEY`

## 🚀 接下来学习的内容

- **流式输出**（`streamText`）：逐 token 显示
- **结构化输出**（`generateObject` + Zod）：以类型化 JSON 接收回答本身
- **多工具 / 多步骤**的更复杂智能体，以及会话历史（`messages`）的保持
- 若要与前端结合，可用第13章以前的类型知识 + **React + TypeScript**

## ▶ 运行

```bash
npm run ch14
# 使用真实 Claude 时（PowerShell）：
#   $env:ANTHROPIC_API_KEY = "sk-ant-..."; npm run ch14
```
