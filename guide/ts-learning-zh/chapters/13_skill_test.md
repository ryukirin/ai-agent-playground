# 综合能力测试（第1～12章总复习）

> 用一个文件检验全部章节的内容。实现 `src/13_skill_test.ts` 中的 TODO，目标是通过自动评分获得全部 ✅。

## 🎯 这是什么？

- `src/13_skill_test.ts` 包含 **13 个主题、共 26 项检查**的编程题。
- 将每道题的 `throw new Error("未实现")` 替换为正确实现，运行后会显示**自动评分（✅/❌ 及分数）**。
- 本页包含**各章解说 + 折叠参考答案**，以及附加的**类型设计挑战**。

## ▶ 进行方式

```bash
# 1. 运行测试（一开始全部 ❌，显示 0 / 26）
npm run test            # = npx tsx src/13_skill_test.ts

# 2. 填写 src/13_skill_test.ts 中【✏️ 请在此处实现】区域的 TODO

# 3. 再次运行 → ✅ 增加。全部 ✅ 达到 26 / 26 即通关！
npm run test

# 最后确认没有类型错误
npm run check
```

> 请勿编辑评分区域（文件下半部分）。只需实现上半部分的 TODO。

---

## 📝 题目与答案

每道题的「参考答案」已折叠。请**先自己作答**，再展开对照。

### Q1【第3・4章】`square(n)`
对数值进行平方并返回。需为参数和返回值添加类型。

<details><summary>参考答案</summary>

```ts
function square(n: number): number {
  return n * n;
}
```
</details>

### Q2【第3章】`safeLength(x: unknown)`
接收 `unknown`，若为 `string` 则返回其字符数，否则返回 `-1`。

<details><summary>参考答案</summary>

```ts
function safeLength(x: unknown): number {
  return typeof x === "string" ? x.length : -1;
}
```
`unknown` 不能直接调用 `.length`，关键是用 `typeof` 收窄为 `string` 后再使用。
</details>

### Q3【第4章】`joinWith(items, sep?)`
将字符串数组用分隔符连接。分隔符省略时默认为 `","`。

<details><summary>参考答案</summary>

```ts
function joinWith(items: string[], sep: string = ","): string {
  return items.join(sep);
}
```
`sep: string = ","` 是默认参数。调用时省略则使用 `","`。
</details>

### Q4【第5章】`formatUser(u: User)`
若有 `email` 则返回 `"姓名 <邮箱>"`，否则返回 `"姓名"`（`User` 已定义）。

<details><summary>参考答案</summary>

```ts
function formatUser(u: User): string {
  return u.email ? `${u.name} <${u.email}>` : u.name;
}
```
`email?` 是可选属性。不存在时为 `undefined`，因此用 truthy 判断进行分支。
</details>

### Q5【第6章】`rgbToHex(rgb)`
将 `readonly [number, number, number]` 转换为 `"#rrggbb"`（小写、2位补零）。

<details><summary>参考答案</summary>

```ts
function rgbToHex(rgb: readonly [number, number, number]): string {
  return "#" + rgb.map((n) => n.toString(16).padStart(2, "0")).join("");
}
```
`toString(16)` 转为十六进制，`padStart(2, "0")` 补齐2位。
</details>

### Q6【第7章】`area(shape)`
返回可辨识联合 `Shape` 的面积。在 `default` 中加入 `never` 穷举性检查。

<details><summary>参考答案</summary>

```ts
function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rect":
      return shape.width * shape.height;
    default: {
      const _exhaustive: never = shape; // 若漏加新的 kind，此处会报错
      return _exhaustive;
    }
  }
}
```
用 `kind` 分支后，在对应 case 中类型会自动收窄（`circle` 内可使用 `radius`）。
</details>

### Q7【第7章】`isNonEmptyString(x): x is string`
用户定义类型守卫。若值为「非空 string」则返回 `true`。

<details><summary>参考答案</summary>

```ts
function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.length > 0;
}
```
返回值类型 `x is string` 是类型守卫的核心。返回 `true` 时，调用方的 `x` 被收窄为 `string`。
</details>

### Q8【第8章】`lastItem<T>(arr)`
返回数组最后一个元素的泛型函数（空数组返回 `undefined`）。

<details><summary>参考答案</summary>

```ts
function lastItem<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}
```
有了类型参数 `T`，传入 `number[]` 时返回 `number | undefined`，传入 `string[]` 时返回 `string | undefined`。
</details>

### Q9【第8章】`pluck<T, K extends keyof T>(obj, key)`
从对象和键中取出对应的值。键用 `keyof` 约束为「仅存在的键」。

<details><summary>参考答案</summary>

```ts
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```
`K extends keyof T` 可在编译时拒绝非法键。返回值 `T[K]` 使每个键都有精确的类型。
</details>

### Q10【第9章】`countBy(items)`
将字符串数组的出现次数以 `Record<string, number>` 返回。

<details><summary>参考答案</summary>

```ts
function countBy(items: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    result[item] = (result[item] ?? 0) + 1;
  }
  return result;
}
```
`Record<string, number>` 表示「键为 string、值为 number 的对象」类型。
</details>

### Q11【第10章】`class Stack<T>`
完成泛型栈。实现 `push` / `pop` / `size`。

<details><summary>参考答案</summary>

```ts
class Stack<T> {
  private items: T[] = [];
  push(item: T): void {
    this.items.push(item);
  }
  pop(): T | undefined {
    return this.items.pop();
  }
  size(): number {
    return this.items.length;
  }
}
```
`private items` 隐藏内部数组。使用 `Stack<number>` 等形式可获得类型安全。
</details>

### Q12【第11章】`delay(ms)` 与 `fetchUserName(id)`
`delay` 是等待指定毫秒的 `Promise<void>`，`fetchUserName` 等待 50ms 后返回 `` `user-${id}` ``。

<details><summary>参考答案</summary>

```ts
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function fetchUserName(id: number): Promise<string> {
  await delay(50);
  return `user-${id}`;
}
```
用 `Promise` 包装 `setTimeout` 是「等待」处理的标准写法。`async` 函数始终返回 `Promise`。
</details>

### Q13【第12章・综合】`counterReducer(state, action)`
用可辨识联合 `CounterAction` 进行分支。`"inc"` 加1 / `"dec"` 减1 / `"set"` 设置 `payload`。

<details><summary>参考答案</summary>

```ts
function counterReducer(state: number, action: CounterAction): number {
  switch (action.type) {
    case "inc":
      return state + 1;
    case "dec":
      return state - 1;
    case "set":
      return action.payload; // 只有在 "set" 的 case 中才能使用 payload
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
```
这是 Redux 等状态管理中实际使用的模式。只有在 `"set"` 的 case 中才能访问 `payload`，这正是可辨识联合的威力。
</details>

---

## 🧩 类型设计挑战（附加・仅写类型的练习）

这里是**只写类型**的题目。在编辑器或 [Playground](https://www.typescriptlang.org/play) 中编写，`npm run check`（`tsc`）通过即为正确。不需要运行。

基础类型如下：

```ts
interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
}
```

### T1【第9章】从 `Product` 中去除 `description` 的类型 `RequiredProduct`

<details><summary>参考答案</summary>

```ts
type RequiredProduct = Omit<Product, "description">;
// = { id: number; name: string; price: number }
```
</details>

### T2【第9章】将 `Product` 所有属性变为可选的类型 `ProductPatch`（用于更新）

<details><summary>参考答案</summary>

```ts
type ProductPatch = Partial<Product>;
// 所有属性变为 ? 可选。常用于部分更新的参数
```
</details>

### T3【第9章】只取出 `id` 和 `name` 的类型 `ProductSummary`

<details><summary>参考答案</summary>

```ts
type ProductSummary = Pick<Product, "id" | "name">;
```
</details>

### T4【第9章】以商品ID为键、`Product` 为值的映射类型 `ProductMap`

<details><summary>参考答案</summary>

```ts
type ProductMap = Record<number, Product>;
```
</details>

### T5【第8・9章】`keyof Product` 的类型是什么？（用联合类型回答）

<details><summary>参考答案</summary>

```ts
type ProductKeys = keyof Product;
// = "id" | "name" | "price" | "description"
```
</details>

### T6【第11章】从 `Promise<string>` 中提取内部类型

<details><summary>参考答案</summary>

```ts
type Unwrapped = Awaited<Promise<string>>;
// = string（也能剥离嵌套的 Promise）
```
</details>

---

## 🏅 自我评分标准

| 分数 | 参考 |
|---|---|
| 26 / 26 + 类型挑战全部通过 | 基础已毕业。前往 React+TS、Node+TS 或 [Type Challenges](https://github.com/type-challenges/type-challenges) |
| 20～25 / 26 | 差一点。再复习一遍做错的章节 |
| ～19 / 26 | 复习对应章节（每题有章节标注）后再挑战 |

## 📌 接下来学习的内容

- **React + TypeScript** / **Node.js（API）+ TypeScript** — 在实际应用中使用类型
- **AI 智能体开发（Vercel AI SDK + Zod）** — 这里学到的类型、泛型、可辨识联合直接派上用场
- 官方 [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) / [TypeScript 深入理解](https://www.typescriptlang.org/docs/)
