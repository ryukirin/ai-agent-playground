# 第01章 TypeScript 入门第一步

> TypeScript 是"在 JavaScript 的基础上添加了类型系统的语言"。它最大的优势在于能够在代码运行之前就发现 bug。

## 🎯 本章目标

- 能够解释 TypeScript 是什么以及为什么要使用它
- 能够为变量和函数编写类型注解
- 能够使用 `// @ts-expect-error` 来"故意体验类型错误"
- 能够通过 `npm run ch01` 运行示例代码

---

## 什么是 TypeScript

TypeScript 是微软开发的编程语言。一句话概括：它是 **JavaScript 的超集**。也就是说，

- 正确的 JavaScript 代码可以直接作为 TypeScript 运行
- TypeScript 中编写的"类型"信息，在最终转换（编译）为 JavaScript 时会被移除

```
TypeScript 文件 (.ts)
        ↓  通过 tsc 编译 / 或用 tsx 直接运行
JavaScript 文件 (.js)  ← 类型信息会被移除（type erasure，类型擦除）
        ↓
在浏览器 / Node.js 中运行
```

### 为什么只写 JS 会遇到问题

JavaScript 的类型检查很宽松，因此下面这类 bug 只有在运行时才能被发现。

```js
// JavaScript 示例：运行之前察觉不到问题

const price = "500";      // 字符串 "500"
const tax = 0.1;
console.log(price * tax); // → 50（通过隐式类型转换竟然能运行！）

const user = undefined;
console.log(user.name);   // → 运行时错误 TypeError: Cannot read properties of undefined
```

而 TypeScript 能在**运行前**、在编辑器中就提示错误。

---

## 运行原理：类型在运行时会消失

```ts
// TypeScript 的代码
let count: number = 42;   // ": number" 是类型注解

// 编译后生成的 JavaScript
// let count = 42;         ← 类型注解被移除
```

> **重要：** `count: number` 这个类型信息在运行时并不存在。类型检查仅发生在编译（构建）阶段。如果需要在运行时检查类型，需要另外的机制（在第7章中讲解）。

---

## 本项目的使用方法

```bash
# 仅进行类型检查（如有错误则列出）
npm run check

# 运行第01章的示例（tsx 在内部编译后立即执行）
npm run ch01

# 直接使用 tsx 效果相同
npx tsx src/01_first_step.ts
```

`tsx` 是将 TypeScript 编译后在 Node.js 中运行的工具。平时学习时使用 `npm run chNN` 即可。

---

## 第一段代码：来写类型注解吧

### 变量的类型注解

```ts
// 在变量名后面写 ": 类型名"
let message: string = "你好 TypeScript";
let count: number = 10;
let isDone: boolean = false;

console.log(message, count, isDone);
// → 你好 TypeScript 10 false
```

### 函数的类型注解

```ts
// 参数和返回值都要写类型
function add(a: number, b: number): number {
  return a + b;
}

console.log(add(3, 4)); // → 7
```

当参数有类型注解时，一旦传错参数，编辑器会立即用红线标出。

```ts
// @ts-expect-error 传入字符串会产生类型错误的体验
add("3", 4);
```

> **`// @ts-expect-error` 是什么？**
> 这是用来告诉 TypeScript"下一行代码会故意产生类型错误"的注释。
> 如果没有这个注释而存在类型错误的行，`tsc` 就会失败。
> 用于学习时安全地记录"反面示例"。

---

## 类型推断 (type inference)：可以省略注解的情况

TypeScript 会根据赋值的值来推断类型。

```ts
// 初始化时有值的话，即使不写类型注解也能推断出来
let greeting = "Hello";  // TypeScript 推断为 string

// 推断后尝试赋值 number 会报错
// @ts-expect-error 尝试向 string 类型赋值 number
greeting = 123;
```

如果初始化变量时有值，可以省略类型注解（第3章会详细讲解）。

---

## ⚠️ 常见踩坑点

### 容易忘记"类型在运行时会消失"

```ts
// 即使 TypeScript 类型检查通过，运行时的值也不会改变
let value: number = 1;
console.log(typeof value); // → "number"（这是 JS 的 typeof，与 TS 的类型是两回事）

// TS 的类型是给开发者看的"规格说明书"，不改变运行时的行为
```

### 想用 `var`（其实不需要用）

JS 的旧写法中有 `var`，但在 TypeScript 学习中只使用 `let` / `const`。详情在第2章说明。

### 不知道"类型要写在哪里"

一开始全部写上也没关系。熟悉之后，掌握"有初始值时省略，函数参数要写"的规则（第3章）。

---

## ✍️ 练习题

### 题目 1

声明 `name: string` 和 `age: number` 两个变量，用 console.log 输出类似 `"张三今年30岁"` 的字符串。使用模板字面量（反引号 `` ` ``）会更简洁。

<details><summary>参考答案</summary>

```ts
const name: string = "张三";
const age: number = 30;
console.log(`${name}今年${age}岁`);
```

</details>

---

### 题目 2

编写一个接收两个字符串并将其拼接后返回的函数 `concat`。要为参数和返回值都加上类型注解。

<details><summary>参考答案</summary>

```ts
function concat(a: string, b: string): string {
  return a + b;
}
console.log(concat("Hello", " World")); // → Hello World
```

</details>

---

### 题目 3

下面的代码哪里有问题？请加上 `// @ts-expect-error`，使其作为"故意的错误"成立。

```ts
let score: number = 100;
score = "满分";
```

<details><summary>参考答案</summary>

```ts
let score: number = 100;
// @ts-expect-error number 类型的变量无法赋值 string
score = "满分";
console.log(score); // 运行时可以执行，但类型上是错误的
```

</details>

---

### 题目 4

下面的代码需要在1处加上 `// @ts-expect-error`。请回答应该放在哪一行的**前面**，并写出实际可运行的代码。

```ts
function multiply(a: number, b: number): number {
  return a * b;
}

const result = multiply(3, "4");
console.log(result);
```

<details><summary>参考答案</summary>

```ts
function multiply(a: number, b: number): number {
  return a * b;
}

// @ts-expect-error 第2个参数传入了 string，因此产生类型错误
const result = multiply(3, "4");
console.log(result); // 运行值为 12，但类型上是错误的
```

`multiply` 声明参数为 `number`，所以传入 `"4"`（string）的那行会产生类型错误。`@ts-expect-error` 要放在报错行的正上方一行。

</details>

---

### 题目 5

编写一个函数 `getPlanLabel`，接收 `boolean` 类型的参数 `isPremium` 和 `string` 类型的参数 `planName`，返回 `"高级版: {planName}"` 或 `"标准版: {planName}"`。要明确写出参数和返回值的所有类型注解。

<details><summary>参考答案</summary>

```ts
function getPlanLabel(isPremium: boolean, planName: string): string {
  const prefix = isPremium ? "高级版" : "标准版";
  return `${prefix}: ${planName}`;
}
console.log(getPlanLabel(true, "黄金会员"));   // → 高级版: 黄金会员
console.log(getPlanLabel(false, "基础版")); // → 标准版: 基础版
```

为两个参数和返回值都加上类型注解，可以在编译时发现调用方的类型错误（例如：向 `isPremium` 传入字符串）。

</details>

---

## 📌 总结

- TypeScript 是在 JavaScript 上加了**类型**的语言，最终会转换为 JS
- 类型在**运行时会消失**，类型检查仅在编译时进行
- 变量用 `let x: number`，函数的参数和返回值都要写类型注解
- 有初始值的变量，类型推断会起作用，可以省略注解
- 使用 `// @ts-expect-error` 可以安全地编写"故意的错误"
- 通过 `npm run ch01` 或 `npx tsx src/01_first_step.ts` 运行

## ▶ 运行

```bash
npm run ch01
# 或者
npx tsx src/01_first_step.ts
```
