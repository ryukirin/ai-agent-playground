# 第02章 JS 基础回顾

> TypeScript 的根基是 JavaScript。在"给 TS 加类型"之前，让我们先回顾一下常用的 JS 语法。

## 🎯 本章目标

- 能够区分使用 `let` / `const`（不使用 `var`）
- 能够编写模板字面量、解构赋值、展开运算符
- 理解数组方法（`map` / `filter` / `reduce` 等）
- 能够熟练使用 `?.` 和 `??`
- 掌握 Promise / async・await 的执行流程

---

## let / const — 不再使用 `var`

JavaScript 有3种变量声明方式，但**不使用 `var`**。

| 声明 | 重新赋值 | 作用域 |
|------|--------|----------|
| `const` | 不可 | 块级 |
| `let` | 可 | 块级 |
| `var` | 可 | 函数（旧式）|

```ts
const PI = 3.14;      // 常量，不会改变的值用这个
let count = 0;         // 需要重新赋值的变量

count = 10;            // OK
// PI = 3.15;          // 错误：const 不可重新赋值

// 块级作用域：不会泄漏到 if / for 的 {} 外面
if (true) {
  const block = "仅在块内有效";
  console.log(block); // → 仅在块内有效
}
// console.log(block); // 错误：不能在作用域外使用
```

> `var` 会忽略块级作用域而泄漏到整个函数，是产生意外 bug 的温床。TypeScript 中也可以写 `var`，但没有理由这么做。

---

## 模板字面量

用反引号（`` ` ``）括起来，通过 `${表达式}` 嵌入值的语法。

```ts
const name = "张三";
const age = 30;

// 传统字符串拼接
const old = "你好，" + name + "（" + age + "岁）";

// 模板字面量（更易读）
const modern = `你好，${name}（${age}岁）`;

console.log(modern); // → 你好，张三（30岁）

// 可以直接写换行
const multiline = `第一行
第二行
第三行`;
console.log(multiline);
```

---

## 函数的3种写法

### 函数声明

```ts
function square(n: number): number {
  return n * n;
}
console.log(square(4)); // → 16
```

### 函数表达式

```ts
const double = function (n: number): number {
  return n * 2;
};
console.log(double(5)); // → 10
```

### 箭头函数

```ts
// 只有一个参数且单行时，可以写得非常简短
const triple = (n: number): number => n * 3;
console.log(triple(3)); // → 9

// 多行的情况
const greet = (name: string): string => {
  const msg = `你好，${name}`;
  return msg;
};
console.log(greet("李四")); // → 你好，李四
```

### 默认参数

```ts
function greetWithTitle(name: string, title: string = "先生/女士"): string {
  return `${name}${title}，你好`;
}
console.log(greetWithTitle("张三"));          // → 张三先生/女士，你好
console.log(greetWithTitle("张三", "老师"));  // → 张三老师，你好
```

### 剩余参数与展开运算符

```ts
// 剩余参数：以数组形式接收可变数量的参数
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}
console.log(sum(1, 2, 3, 4)); // → 10

// 展开运算符：将数组展开后传入
const nums = [1, 2, 3];
console.log(sum(...nums)); // → 6
```

---

## 数组方法

集中回顾数组操作的核心方法。

```ts
const fruits = ["苹果", "香蕉", "橘子", "葡萄"];
const prices = [100, 200, 150, 300];
```

### `map` — 将每个元素转换后返回新数组

```ts
const upper = fruits.map((f) => f.toUpperCase());
console.log(upper); // → ['苹果', '香蕉', '橘子', '葡萄']

const doubled = prices.map((p) => p * 2);
console.log(doubled); // → [200, 400, 300, 600]
```

### `filter` — 只保留满足条件的元素

```ts
const expensive = prices.filter((p) => p >= 200);
console.log(expensive); // → [200, 300]
```

### `reduce` — 将所有元素折叠为单个值

```ts
const total = prices.reduce((acc, p) => acc + p, 0);
console.log(total); // → 750
```

### `find` — 返回满足条件的第一个元素（不存在则返回 `undefined`）

```ts
const found = prices.find((p) => p > 100);
console.log(found); // → 200
```

### `forEach` — 用于副作用的循环（不返回值）

```ts
fruits.forEach((f, i) => {
  console.log(`${i}: ${f}`);
});
// → 0: 苹果  1: 香蕉  2: 橘子  3: 葡萄
```

---

## 对象

### 属性简写

当变量名与属性名相同时可以省略。

```ts
const name = "张三";
const age = 30;

// 不省略
const user1 = { name: name, age: age };

// 省略（含义相同）
const user2 = { name, age };
console.log(user2); // → { name: '张三', age: 30 }
```

### 解构赋值

```ts
// 对象解构赋值
const { name: userName, age: userAge } = user2;
console.log(userName, userAge); // → 张三 30

// 数组解构赋值
const [first, second, ...rest] = fruits;
console.log(first);  // → 苹果
console.log(second); // → 香蕉
console.log(rest);   // → ['橘子', '葡萄']
```

### 展开运算符（对象的复制与合并）

```ts
const base = { x: 1, y: 2 };
const extended = { ...base, z: 3 };
console.log(extended); // → { x: 1, y: 2, z: 3 }

// 同名键后者优先
const overridden = { ...base, x: 99 };
console.log(overridden); // → { x: 99, y: 2 }
```

---

## 三元运算符 / `?.` / `??`

### 三元运算符

```ts
const score = 75;
const result = score >= 60 ? "合格" : "不合格";
console.log(result); // → 合格
```

### `?.`（可选链）

当属性或方法不存在时，不抛出 `TypeError`，而是返回 `undefined`。

```ts
const user = { profile: { nickname: "小张" } };
const noProfile: typeof user | undefined = undefined;

console.log(user?.profile?.nickname);      // → 小张
console.log(noProfile?.profile?.nickname); // → undefined（不会报错）
```

### `??`（空值合并运算符）

只有在 `null` 或 `undefined` 时才使用右侧的值。与 `||` 不同，`0` 和 `""` 不在其范围内。

```ts
const input = null;
const value = input ?? "默认值";
console.log(value); // → 默认值

const zero = 0;
console.log(zero ?? 99);  // → 0（0 既不是 null 也不是 undefined，所以用左侧）
console.log(zero || 99);  // → 99（|| 针对所有 falsy 值。注意区别）
```

---

## ES Modules 的 import / export（简要了解）

```ts
// 在另一个文件中写函数的情况（示例）
// utils.ts
export function add(a: number, b: number): number {
  return a + b;
}

// main.ts
import { add } from "./utils.js";
```

详细内容在**第12章**讲解。本章只需了解这种写法即可。

---

## 异步处理入门（Promise / async・await）

```ts
// Promise：包装异步处理结果的对象
const promise = new Promise<string>((resolve) => {
  setTimeout(() => resolve("1秒后完成"), 1000);
});

// async・await：让 Promise 像同步代码一样书写的语法糖
async function fetchData(): Promise<string> {
  const result = await promise;
  return result;
}
```

异步处理的详细内容在**第11章**中仔细讲解。这里只需知道"有这种写法"就足够了。

---

## "这些是 TS 的根基。TS 只是在这里加上了类型"

以上所有语法都是纯 JavaScript。TypeScript 只是在此基础上添加了以下内容：

- 对变量、参数、返回值的类型注解（`: string`、`: number` 等）
- 类型推断（从值自动判断类型）
- 类型错误的提前检测

从下一章开始进入"类型"的世界。

---

## ⚠️ 常见踩坑点

### `const` 声明的对象仍然可以修改

```ts
const obj = { count: 0 };
obj.count = 1; // OK：obj 本身（引用的目标）没有改变
// obj = {};   // 错误：不能对变量重新赋值
```

注意 `const` 只是"固定变量所指向的引用"，并不能防止修改内部属性。

### 混淆 `||` 和 `??` 的区别

```ts
const count = 0;
console.log(count || 10); // → 10（0 是 falsy，所以使用右侧）
console.log(count ?? 10); // → 0（0 不是 null/undefined，所以使用左侧）
```

当需要将 `0` 或 `""` 作为默认值处理时，请使用 `??`。

### 箭头函数的 `this` 继承自父作用域

与普通函数不同，箭头函数没有自己的 `this`。在作为类方法使用时会有影响，但在第10章（类）中会详细说明。

### `reduce` 的初始值必须写

```ts
// 不写初始值时，数组为空会抛出 TypeError
// const bad = [].reduce((acc, n) => acc + n);  // 危险

const safe = ([] as number[]).reduce((acc, n) => acc + n, 0); // 传入初始值 0
console.log(safe); // → 0
```

---

## ✍️ 练习题

### 题目 1

从 `["Alice", "Bob", "Charlie"]` 这个数组中，取出名字长度在5个字符以内的元素并转为大写。请使用 `filter` 和 `map`。

<details><summary>参考答案</summary>

```ts
const names = ["Alice", "Bob", "Charlie"];
const result = names
  .filter((n) => n.length <= 5)
  .map((n) => n.toUpperCase());
console.log(result); // → ['ALICE', 'BOB']
```

</details>

---

### 题目 2

使用 `reduce` 求 `const items = [{ name: "A", price: 100 }, { name: "B", price: 200 }, { name: "C", price: 50 }]` 的总金额。

<details><summary>参考答案</summary>

```ts
const items = [
  { name: "A", price: 100 },
  { name: "B", price: 200 },
  { name: "C", price: 50 },
];
const total = items.reduce((acc, item) => acc + item.price, 0);
console.log(total); // → 350
```

</details>

---

### 题目 3

编写一个函数 `displayName`，接收参数 `user: { name: string; nickname?: string }`，如果有 `nickname` 则返回 `"nickname 先生/女士"`，否则返回 `"name 先生/女士"`。请使用 `?.` 和 `??`。

<details><summary>参考答案</summary>

```ts
function displayName(user: { name: string; nickname?: string }): string {
  return `${user.nickname ?? user.name}先生/女士`;
}
console.log(displayName({ name: "张三", nickname: "小张" })); // → 小张先生/女士
console.log(displayName({ name: "李四" }));                   // → 李四先生/女士
```

</details>

---

### 题目 4

从下面的 `orders` 数组中，取出 `status` 为 `"shipped"` 的订单，用 `map` 将每个 `total` 打九折后生成新数组，最后用 `reduce` 求这些订单的总金额。

```ts
const orders = [
  { id: 1, status: "shipped",  total: 1000 },
  { id: 2, status: "pending",  total: 500  },
  { id: 3, status: "shipped",  total: 2000 },
  { id: 4, status: "canceled", total: 800  },
];
```

<details><summary>参考答案</summary>

```ts
const orders = [
  { id: 1, status: "shipped",  total: 1000 },
  { id: 2, status: "pending",  total: 500  },
  { id: 3, status: "shipped",  total: 2000 },
  { id: 4, status: "canceled", total: 800  },
];

const discountedTotal = orders
  .filter((o) => o.status === "shipped")
  .map((o) => o.total * 0.9)
  .reduce((acc, t) => acc + t, 0);

console.log(discountedTotal); // → 2700
```

用 `filter` 保留 shipped 订单，用 `map` 打九折，再用 `reduce` 求和，这是三步链式调用的基本模式。

</details>

---

### 题目 5

编写一个函数 `calcFinalScore`，接收参数 `{ name: string; scores: number[]; bonus?: number }`，返回 `scores` 的平均值加上 `bonus`（省略时为 `0`）的结果。请使用解构赋值、默认值和 `??`。

<details><summary>参考答案</summary>

```ts
function calcFinalScore({
  scores,
  bonus = 0,
}: {
  name: string;
  scores: number[];
  bonus?: number;
}): number {
  const avg = scores.reduce((acc, s) => acc + s, 0) / scores.length;
  return avg + (bonus ?? 0);
}

console.log(calcFinalScore({ name: "张三", scores: [80, 90, 70] }));          // → 80
console.log(calcFinalScore({ name: "李四", scores: [60, 70], bonus: 5 }));    // → 70
```

通过参数解构赋值直接取出属性，利用 `bonus = 0` 的默认值处理省略的情况。如果 `bonus` 有可能以 `undefined` 形式传入，也可以用 `?? 0` 补充。

</details>

---

### 题目 6

对下面嵌套的对象 `config`，请用**`?.` 和 `??`**组合安全地取出 `theme.colors.primary` 的值，如果没有则使用 `"#000000"`，用一行代码实现。

```ts
const config1 = { theme: { colors: { primary: "#ff5733" } } };
const config2 = { theme: { colors: {} } };
const config3 = undefined;
```

<details><summary>参考答案</summary>

```ts
const config1 = { theme: { colors: { primary: "#ff5733" } } };
const config2 = { theme: { colors: {} } } as typeof config1 | undefined;
const config3 = undefined as typeof config1 | undefined;

const c1 = config1?.theme?.colors?.primary ?? "#000000";
const c2 = config2?.theme?.colors?.primary ?? "#000000";
const c3 = config3?.theme?.colors?.primary ?? "#000000";

console.log(c1); // → #ff5733
console.log(c2); // → #000000
console.log(c3); // → #000000
```

每次用 `?.` 访问时，一旦变为 `undefined` 就会停止传播，最终结果为 `undefined`。用 `??` 补充默认值，就可以用一行代码安全地取出值。

</details>

---

## 📌 总结

- 变量用 `const`（不变）/ `let`（会变）声明，不使用 `var`
- 使用模板字面量可以简洁地嵌入字符串
- 函数有3种写法（声明式、函数表达式、箭头函数），箭头函数是主流
- `map` / `filter` / `reduce` / `find` 是数组操作的基础
- `?.` 用于安全访问，`??` 用于补充 null/undefined
- 这些都是 JS 的功能，TS 只是在这里加上类型

## ▶ 运行

```bash
npm run ch02
# 或者
npx tsx src/02_js_refresher.ts
```
