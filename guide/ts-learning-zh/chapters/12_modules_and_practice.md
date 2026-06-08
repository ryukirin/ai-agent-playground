# 第12章 模块 (module) 与综合练习

> 理解 import/export 的机制以及 `.d.ts` / `@types` 的作用，最后通过一个综合运用所有 TypeScript 特性的小型应用来收尾。

## 🎯 本章目标

- 能够说明 named export / default export / `import type` 的区别
- 理解 `.d.ts` 文件和 `@types/*` 为什么必要
- 掌握 `strict` 相关选项的含义
- 能够组合使用可辨识联合、泛型、工具类型进行类型设计

---

## import / export 的基础

### named export（具名导出）

```ts
// math.ts
export const PI = 3.14159;

export function add(a: number, b: number): number {
  return a + b;
}

export type MathResult = { value: number; operation: string };
```

```ts
// main.ts
import { PI, add, type MathResult } from "./math.js";

const result: MathResult = { value: add(1, 2), operation: "add" };
console.log(PI, result);
```

### default export（默认导出）

```ts
// greeter.ts
export default function greet(name: string): string {
  return `你好，${name}！`;
}
```

```ts
// main.ts
import greet from "./greeter.js";   // 可以用任意名称接收
import myGreet from "./greeter.js"; // 其他名称也可以
```

named export「模块的公开 API 清晰」，`import *` 和 re-export 更方便，因此在库中 named export 是主流。default export 用于「此文件只有一个主角」时。

### `import type` — 只导入类型

```ts
// 只想使用类型时
import type { MathResult } from "./math.js";

// ↑ 编译后的 JS 中不会保留。不影响打包体积
```

`import type` 仅在编译时使用类型信息，不在运行时代码中生成任何内容。与 `strict` 配合使用效果好，可以明确区分类型和值。

---

## 模块解析简介

TypeScript 在看到 `import "./foo"` 时，决定「读取哪个文件」的过程叫做模块解析。

本项目的 `tsconfig.json` 使用 `moduleResolution: "Bundler"`，因此也能解析 `.ts` 扩展名。这与生产打包工具（Vite / webpack 等）的行为一致。

`moduleDetection: "force"` 是「将每个文件强制视为模块 (ESM)」的配置。没有这个配置，没有 `export` 的文件会被视为全局脚本，可能发生变量名冲突。

---

## 类型定义文件 `.d.ts` 与 `@types/*`

### 为什么必要

用 JavaScript 编写的库没有类型信息。TypeScript 使用该库时无法进行类型检查。这时登场的就是**类型定义文件（`.d.ts`）**。

```
库（JS）+ 类型定义文件（.d.ts）= 可以从 TypeScript 类型安全地使用
```

### `@types/*` 包

DefinitelyTyped 社区管理着主要 JS 库的 `.d.ts` 文件。

```sh
npm install --save-dev @types/node   # Node.js 的类型定义
npm install --save-dev @types/react  # React 的类型定义
```

安装后，TypeScript 编译器会自动读取，类型补全和类型检查就会生效。本项目安装了 `@types/node`，所以 `process.env` 和 `Buffer` 都有类型。

### 库自带类型定义的情况

最近许多库通过 `package.json` 的 `types` 或 `exports` 字段同时打包 `.d.ts`（例如：TypeScript 本身、Zod、Vite）。这种情况下不需要 `@types/*`。

---

## `strict` 相关选项的含义

`strict: true` 会一并启用以下选项：

| 选项 | 含义 |
|-----------|------|
| `strictNullChecks` | 将 `null` / `undefined` 与其他类型区分。最重要 |
| `strictFunctionTypes` | 对函数参数类型进行逆变检查 |
| `strictBindCallApply` | 对 `bind` / `call` / `apply` 的参数进行类型检查 |
| `strictPropertyInitialization` | 类属性未初始化时报错 |
| `noImplicitAny` | 禁止无法推断类型时的隐式 `any` |
| `noImplicitThis` | `this` 的类型不明确时报错 |
| `useUnknownInCatchVariables` | 将 `catch` 的变量设为 `unknown`（TS 4.4+）|

`strictNullChecks` 影响最大，`string | null` 和 `string` 会被明确区分。这样可以在编译时检测到「不小心使用了 null」的 bug。

---

## 综合小型应用：类型安全的任务管理

组合运用之前学到的以下要素：

- **可辨识联合**（第7章）：类型安全地表示任务状态
- **泛型 (Generics)**（第8章）：通用的仓库函数
- **工具类型 (Utility Types)**（第9章）：`Readonly<T>` / `Pick<T, K>` / `Omit<T, K>`
- **类 (Classes)**（第10章）：任务管理类
- **异步处理**（第11章）：模拟异步的保存与获取

### 设计

```ts
// 用可辨识联合表示任务状态
type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  createdAt: Date;
}
```

这是一个类型安全地进行任务添加、状态变更、统计的小型应用。详情请参考 `src/12_modules_and_practice.ts`。

---

## 下一步学习

掌握 TypeScript 基础后，可以进入以下步骤：

### 框架集成
- **React + TypeScript**：为组件的 props 加类型，类型安全地编写事件处理器。[官方文档](https://react.dev/learn/typescript)
- **Node.js + TypeScript**：用 `@types/node` 和 `tsx` / `ts-node` 编写服务端代码

### 深入类型系统
- **[Type Challenges](https://github.com/type-challenges/type-challenges)**：通过类型谜题体验类型系统的深度（从 easy 开始）
- **[TypeScript 官方 Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)**：官方的全面解说

### 实际开发中常用的技术
- **Zod**：运行时验证 + 类型推断。安全地为 `fetch` 的结果加类型
- **ESLint + typescript-eslint**：静态分析保证代码质量
- **Vitest / Jest**：用 `@types/jest` 编写带类型的测试

---

## ⚠️ 常见陷阱

1. **ESM 扩展名问题**：`module: "ESNext"` 时，在 Node.js 中运行可能需要 `.js` 扩展名（即使是 `.ts`，`tsx` 也能解析，但 `node` 直接执行需要 `.js`）。使用 `tsx` 或 `ts-node` 在开发时无需担心。

2. **`export default` 的名称发生变化**：`import greet from "./greeter.js"` 时，更改文件名不需要修改 `import` 语句很方便，但「导出了什么」变得不直观。团队中一般优先使用 named export。

3. **`@types/*` 与本体版本不匹配**：`@types/node@22` 是针对 Node.js 22 的。保持本体与 `@types` 的主版本号一致，可以减少类型不匹配的问题。

---

## ✍️ 练习题

### 题目1

请定义 `Result<T, E>` 类型。用 `{ ok: true; value: T }` 表示成功，用 `{ ok: false; error: E }` 表示失败的可辨识联合。使用此类型实现「执行除法的函数（除以0时返回错误）」。

<details><summary>参考答案</summary>

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function safeDivide(a: number, b: number): Result<number, string> {
  if (b === 0) return { ok: false, error: "不能除以0" };
  return { ok: true, value: a / b };
}

const r1 = safeDivide(10, 2);
const r2 = safeDivide(5, 0);

if (r1.ok) console.log("结果：", r1.value); // 5
if (!r2.ok) console.log("错误：", r2.error); // 不能除以0
```

</details>

### 题目2

实现泛型函数 `createRepository<T extends { id: number }>`，返回一个拥有 `findById(id: number): T | undefined`、`add(item: T): void` 和 `getAll(): readonly T[]` 的对象。

<details><summary>参考答案</summary>

```ts
function createRepository<T extends { id: number }>() {
  const items: T[] = [];
  return {
    add(item: T): void { items.push(item); },
    findById(id: number): T | undefined {
      return items.find((i) => i.id === id);
    },
    getAll(): readonly T[] { return items; },
  };
}

interface Product { id: number; name: string; price: number }
const repo = createRepository<Product>();
repo.add({ id: 1, name: "苹果", price: 150 });
repo.add({ id: 2, name: "香蕉", price: 100 });
console.log(repo.findById(1)); // { id: 1, name: '苹果', price: 150 }
console.log(repo.getAll().length); // 2
```

</details>

### 题目3

从以下 `User` 类型，**仅用工具类型**定义 `UpdateUserInput` 类型（去掉 id，将所有属性变为可选）和 `PublicUser` 类型（去掉 password）。

```ts
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}
```

<details><summary>参考答案</summary>

```ts
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// 用 Omit 去掉 id，再用 Partial 变为可选
type UpdateUserInput = Partial<Omit<User, "id">>;

// 用 Omit 去掉 password
type PublicUser = Omit<User, "password">;

const update: UpdateUserInput = { name: "新名字" }; // 部分更新 OK
const pub: PublicUser = { id: 1, name: "王五", email: "w@example.com" };
console.log(update, pub);
```

</details>

### 题目4

请填写以下代码的空白 (A)～(D)，完成 `import` / `export` / `import type` 的用法。

```ts
// shapes.ts
/* (A) */ const PI = 3.14159;
/* (A) */ function circleArea(r: number): number { return PI * r * r; }
/* (A) */ type Shape = { kind: string; area: number };

/* (B) */ function formatShape(s: Shape): string {
  return `${s.kind}：面积 ${s.area.toFixed(2)}`;
}
```

```ts
// main.ts
/* (C) */ { PI, circleArea } from "./shapes.js";
/* (D) */ { Shape } from "./shapes.js";  // 不需要值，只使用类型

const s: Shape = { kind: "圆", area: circleArea(5) };
console.log(PI);           // 3.14159
console.log(formatShape(s)); // 圆：面积 78.54
```

(A)：named export / default export 二选一，(B)：default export，(C)：named import 的语法，(D)：只导入类型的语法，请分别作答。

<details><summary>参考答案</summary>

```ts
// (A) named export — 单独导出多个符号
export const PI = 3.14159;
export function circleArea(r: number): number { return PI * r * r; }
export type Shape = { kind: string; area: number };

// (B) default export — 一个文件只有一个主角
export default function formatShape(s: Shape): string {
  return `${s.kind}：面积 ${s.area.toFixed(2)}`;
}
```

```ts
// (C) named import
import { PI, circleArea } from "./shapes.js";
// (D) import type — 编译后的 JS 中不会留下任何内容
import type { Shape } from "./shapes.js";
// default export 可以用任意名称接收
import formatShape from "./shapes.js";
```

named export 在每个声明上加 `export`，用 `import { 名称 }` 接收。只需要类型时使用 `import type`，有助于打包优化。default export 每个文件只有一个，接收方的名称可以自由指定。

</details>

---

### 题目5

请组合使用可辨识联合和工具类型。

```ts
type Notification =
  | { type: "email"; to: string; subject: string; body: string }
  | { type: "sms"; to: string; message: string }
  | { type: "push"; deviceId: string; title: string; body: string };
```

使用此类型实现以下内容：
1. `formatNotification(n: Notification): string` — 按 `type` 分支，将内容转换为人类可读的字符串
2. **仅用工具类型**定义 `EmailDraft` 类型：从 email 的 `Notification` 中去掉 `type`，只将 `subject` 和 `body` 变为可选的类型

<details><summary>参考答案</summary>

```ts
type Notification =
  | { type: "email"; to: string; subject: string; body: string }
  | { type: "sms"; to: string; message: string }
  | { type: "push"; deviceId: string; title: string; body: string };

function formatNotification(n: Notification): string {
  switch (n.type) {
    case "email":
      return `[邮件] 收件人：${n.to} / 主题：${n.subject}`;
    case "sms":
      return `[短信] 收件人：${n.to} / 内容：${n.message}`;
    case "push":
      return `[推送] 设备：${n.deviceId} / 标题：${n.title}`;
  }
}

// 用 Extract 取出 email 成员，用 Omit 去掉 type，
// 必填字段（to）保持不变，subject 和 body 用 Partial 包裹
type EmailBase = Omit<Extract<Notification, { type: "email" }>, "type">;
type EmailDraft = Omit<EmailBase, "subject" | "body"> &
  Partial<Pick<EmailBase, "subject" | "body">>;

const draft: EmailDraft = { to: "user@example.com" }; // subject/body 可省略
console.log(formatNotification({ type: "sms", to: "138-0000-0000", message: "测试" }));
// [短信] 收件人：138-0000-0000 / 内容：测试
```

类型系统保证 `switch` 覆盖所有 case（穷举检查）。`Extract<Union, { type: "email" }>` 取出联合类型的特定成员，组合 `Omit` / `Partial` / `Pick` 创建派生类型。

</details>

---

### 题目6

这是之前所学的综合题。请实现一个简单的验证函数。

```ts
type ValidationError = { field: string; message: string };
type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: ValidationError[] };
```

使用此类型实现 `validateUser(input: unknown): ValidationResult<{ name: string; age: number }>`。规则：
- `input` 不是对象 → `[{ field: "input", message: "不是对象" }]`
- `name` 不是字符串或为空 → `[{ field: "name", message: "名称为必填项" }]`
- `age` 不是 0～120 的整数 → `[{ field: "age", message: "年龄必须是0～120的整数" }]`
- 存在多个错误时全部汇总返回

<details><summary>参考答案</summary>

```ts
type ValidationError = { field: string; message: string };
type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: ValidationError[] };

function validateUser(
  input: unknown,
): ValidationResult<{ name: string; age: number }> {
  if (typeof input !== "object" || input === null) {
    return { valid: false, errors: [{ field: "input", message: "不是对象" }] };
  }

  const errors: ValidationError[] = [];
  const obj = input as Record<string, unknown>;

  if (typeof obj["name"] !== "string" || obj["name"].trim() === "") {
    errors.push({ field: "name", message: "名称为必填项" });
  }

  const age = obj["age"];
  if (typeof age !== "number" || !Number.isInteger(age) || age < 0 || age > 120) {
    errors.push({ field: "age", message: "年龄必须是0～120的整数" });
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: { name: obj["name"] as string, age: obj["age"] as number } };
}

const r1 = validateUser({ name: "王五", age: 25 });
if (r1.valid) console.log("OK：", r1.data); // OK：{ name: '王五', age: 25 }

const r2 = validateUser({ name: "", age: 200 });
if (!r2.valid) console.log("NG：", r2.errors);
// NG：[{ field: 'name', ... }, { field: 'age', ... }]
```

用可辨识联合（`valid` 标签）类型安全地表示成功/失败，用数组收集多个错误的模式。通过类型守卫收窄 `unknown`，无需 `any` 即可处理。

</details>

---

## 📌 总结

- named export 是主流。可以用 `import type` 只导入类型
- `.d.ts` / `@types/*` 是 JS 库与 TypeScript 之间的桥梁
- `strict: true` 中最重要的是 `strictNullChecks`——对 null/undefined 的处理变得严格
- 可辨识联合 × 泛型 × 工具类型的组合，可以实现表达力丰富的类型设计
- 下一步：React/Node.js + TS、Type Challenges、官方 Handbook！

## ▶ 运行

```sh
npm run ch12
# 或者
npx tsx src/12_modules_and_practice.ts
```
