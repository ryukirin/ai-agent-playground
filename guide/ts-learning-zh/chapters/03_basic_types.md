# 第03章 基本类型

> 理解支撑 TypeScript 类型系统的基础——"原始类型"与"类型推断 (type inference)"，并学习 `any` / `unknown` / `never` 的使用场景。

## 🎯 本章目标

- 能够熟练使用 `string` / `number` / `boolean` / `null` / `undefined`
- 能够利用类型推断判断"哪里要写、哪里可以省略"
- 能够解释 `any` 的危险性和 `unknown` 的用法
- 能够正确理解 `as` 类型断言

---

## 类型注解的写法

```ts
// 用"变量名: 类型名"添加注解
let message: string = "你好";
let count: number = 42;
let active: boolean = true;
```

类型注解不仅用于变量，也用于函数的参数和返回值。

```ts
function greet(name: string, times: number): string {
  return name.repeat(times);
}
```

---

## 原始类型

### string

字符串。用单引号、双引号或反引号创建。

```ts
const s1: string = "hello";
const s2: string = 'world';
const s3: string = `${s1} ${s2}`;
console.log(s3); // → hello world
```

### number

整数和小数统一为 `number`，不做区分。

```ts
const n1: number = 42;
const n2: number = 3.14;
const n3: number = 0xff;   // 16进制
const n4: number = NaN;    // 非数字（这也是 number 类型）
const n5: number = Infinity;
console.log(n1, n2, n3, n4, n5); // → 42 3.14 255 NaN Infinity
```

### boolean

```ts
const isLoggedIn: boolean = true;
const isEmpty: boolean = false;
console.log(isLoggedIn, isEmpty); // → true false
```

### null 与 undefined

```ts
// null：有意表示"值不存在"
// undefined：表示"值尚未设置"的未初始化状态
let a: null = null;
let b: undefined = undefined;

console.log(a, b); // → null undefined

// 常用的是 "string | null" 这样的联合类型（第7章）
let nickname: string | null = null;
nickname = "小张";
console.log(nickname); // → 小张
```

### bigint 与 symbol（简要了解）

```ts
// bigint：处理比 number 更大的整数（末尾加 n）
const big: bigint = 9999999999999999999999n;
console.log(big); // → 9999999999999999999999n

// symbol：唯一的标识符（主要在库内部使用）
const sym: symbol = Symbol("my-symbol");
console.log(sym.toString()); // → Symbol(my-symbol)
```

---

## 类型推断 (type inference)

TypeScript 会根据赋值的值自动推断类型。

```ts
// 从初始值推断为 string
const greeting = "Hello";  // 类型为 string

// 从初始值推断为 number
const year = 2025;          // 类型为 number

// 推断后尝试赋值其他类型会报错
// @ts-expect-error 不能向推断为 string 的 greeting 赋值 number
greeting = 123;
```

### 哪里要写类型注解，哪里可以省略

| 位置 | 推荐做法 |
|------|------|
| 有初始值的变量 | 省略（交给推断） |
| 函数的参数 | **必须写**（无法推断） |
| 函数的返回值 | 尽量写（明确意图） |
| `let` 声明后续赋值的变量 | 写上更安全 |

```ts
// 好的写法
const ratio = 0.5;                             // 省略 OK（从 0.5 推断为 number）
function multiply(n: number, by: number): number {  // 参数必须写
  return n * by;
}

// 类型后续可能变化时加上注解
let status: "active" | "inactive" = "active"; // 第7章的字面量类型
```

---

## `any` — 关闭类型检查的"最后手段"

使用 `any` 会完全禁用 TypeScript 的类型检查。

```ts
let x: any = "字符串";
x = 42;          // OK
x = true;        // OK
x.foo.bar.baz;   // OK（即使运行时出错，TS 也不会报错）

// any 会传染：使用 any 的值，返回值也变为 any
function parseData(json: any) {
  return json.value; // 返回值也是 any
}
```

> `any` 意味着"虽然在用 TypeScript，却跟用 JS 是一样的状态"。这会放弃发现 bug 的能力，因此**原则上不使用 `any`**。不得不用时，请留下 `// TODO: 添加类型` 之类的注释。

---

## `unknown` — 安全版 `any`

`unknown` 与 `any` 一样，"可以放入任何值"。但 `unknown` 类型的值**在缩小类型范围之前无法使用**，因此更安全。

```ts
let val: unknown = "你好";

// @ts-expect-error 无法直接在 unknown 上调用 string 方法
val.toUpperCase();

// 用 typeof 缩小范围后再使用（详见第7章）
if (typeof val === "string") {
  console.log(val.toUpperCase()); // → 你好（此处确定为 string）
}

// 用于外部 API 响应等"不知道会来什么值"的情况
function processInput(input: unknown): string {
  if (typeof input === "string") return input;
  if (typeof input === "number") return String(input);
  return "未知输入";
}
console.log(processInput("hello"));  // → hello
console.log(processInput(42));        // → 42
console.log(processInput(true));      // → 未知输入
```

---

## `never` — 没有值的类型

`never` 是"绝对不存在值"的类型。主要出现在两种场景中。

```ts
// 1. 函数绝对不会 return（必然抛出异常）
function fail(message: string): never {
  throw new Error(message);
}

// 2. 在 switch / if 的"不应到达的分支"中使用（穷举性检查）
type Color = "red" | "green" | "blue";
function getColorCode(color: Color): string {
  switch (color) {
    case "red":   return "#ff0000";
    case "green": return "#00ff00";
    case "blue":  return "#0000ff";
    default:
      // 如果到达这里，说明 Color 中有未处理的值，会产生编译错误
      const _exhaustive: never = color;
      return _exhaustive;
  }
}
```

`never` 会在第7章（类型收窄）中以实用的形式再次出现。

---

## 类型断言 `as`

用来将 TypeScript 推断的类型"覆盖"为"我知道它是某某类型"的语法。

```ts
// 示例：DOM 操作（浏览器环境）
// document.getElementById 返回 HTMLElement | null
// const input = document.getElementById("name") as HTMLInputElement;
// input.value; // 断言为 HTMLInputElement 后就可以使用 .value

// 将数值伪装成其他类型的示例
const raw: unknown = 42;
const num = raw as number;
console.log(num + 1); // → 43
```

### 注意 `as` 的滥用

```ts
// @ts-expect-error 完全不相关的类型需要两步 as unknown as ... 才行
// （一步 as 会被 TS 警告）
const str = "hello" as unknown as number;
console.log(str + 1); // 运行时: "hello1"（变成字符串拼接了！）
```

> `as` 只用于"自己比 TypeScript 更清楚类型"的场景。轻易使用会成为隐藏运行时错误的温床。`as any` 是真正的最后手段。

---

## 用 `typeof` 确认运行时类型

JavaScript 的 `typeof` 运算符在 TypeScript 中也可以使用（是第7章类型收窄的铺垫）。

```ts
const values: unknown[] = [42, "hello", true, null, undefined];

for (const v of values) {
  console.log(typeof v, ":", v);
}
// number : 42
// string : hello
// boolean : true
// object : null   ← null 由于历史原因是 "object"（需注意）
// undefined : undefined
```

> `typeof null === "object"` 是 JavaScript 的著名 bug。检查 null 需要单独用 `v === null` 来判断。

---

## ⚠️ 常见踩坑点

### `null` 的 `typeof` 结果是 `"object"`

```ts
console.log(typeof null);        // → "object"（是 bug 但已成规范）
console.log(typeof undefined);   // → "undefined"
console.log(null === null);      // → true（null 检查请用这个）
```

### 混淆 `any` 和 `unknown`

```ts
// any：跳过类型检查（可以用但有风险）
const a: any = "hello";
a.foo(); // TS 不会报错，但运行时会报错

// unknown：使用前必须缩小类型范围（安全）
const u: unknown = "hello";
// u.foo(); // 错误：unknown 不能直接使用
if (typeof u === "string") {
  u.toUpperCase(); // OK：缩小范围后可以使用
}
```

### 同时写类型推断和类型注解（冗余）

```ts
// 冗余（有初始值时注解是多余的）
const x: number = 42;

// 这样就够了
const y = 42;
```

不过，为了团队规范或可读性而写上注解也是可以的。

---

## ✍️ 练习题

### 题目 1

请将下面的变量分类为"可以省略类型注解"和"应该写类型注解"。

```ts
const PI = 3.14;                  // (a)
let score;                        // (b)
function double(n) { return n * 2; } // (c) 参数
const result = double(5);         // (d)
```

<details><summary>参考答案</summary>

- (a) 可以省略：从 `3.14` 推断为 `number`
- (b) 应该写：没有初始值，所以要写成 `let score: number` 这样的形式
- (c) 应该写：函数参数无法推断，需要写 `n: number`
- (d) 可以省略：从 `double(5)` 的返回值类型推断

</details>

---

### 题目 2

编写一个函数 `transform`，接收 `unknown` 类型的参数，如果是 `number` 则返回2倍，如果是 `string` 则返回大写，否则返回 `"unsupported"`。

<details><summary>参考答案</summary>

```ts
function transform(input: unknown): number | string {
  if (typeof input === "number") return input * 2;
  if (typeof input === "string") return input.toUpperCase();
  return "unsupported";
}
console.log(transform(5));       // → 10
console.log(transform("hello")); // → HELLO
console.log(transform(true));    // → unsupported
```

</details>

---

### 题目 3

在下面的代码中，请在适当位置添加 `// @ts-expect-error`，使 `tsc --noEmit` 能够通过（有1行是故意的错误）。

```ts
let name: string = "张三";
name = 42;
console.log(name);
```

<details><summary>参考答案</summary>

```ts
let name: string = "张三";
// @ts-expect-error 尝试向 string 类型变量赋值 number
name = 42;
console.log(name);
```

</details>

---

### 题目 4

请回答下面每个变量各被推断为**什么类型**。另外，请回答尝试向 (d) 变量赋值 `"hello"` 时会发生什么。

```ts
const a = 100;            // (a)
const b = "TypeScript";   // (b)
const c = true;           // (c)
let   d = 3.14;           // (d)
```

<details><summary>参考答案</summary>

- (a) `100` 这个 **number 字面量类型**（因为是 `const`，值被固定）
- (b) `"TypeScript"` 这个 **string 字面量类型**（同上）
- (c) `true` 这个 **boolean 字面量类型**（同上）
- (d) `number`（因为是 `let`，值可能改变，推断为更宽泛的类型）

尝试 `d = "hello"` 赋值时，会因为无法将 `string` 赋值给 `number` 而产生类型错误。`const` 时值不可变所以推断为字面量类型，`let` 时预想会重新赋值所以推断为原始类型，这个区别是关键点。

</details>

---

### 题目 5

编写一个函数 `describe`，接收 `unknown` 类型的参数 `value`，按以下规则转换并返回。不能使用 `as`。

- 如果是 `number`，返回 `"数值: {value}"`
- 如果是 `string`，返回 `"字符串: {value}（长度 {length} 个字符）"`
- 如果是 `boolean`，返回 `"布尔值: {value}"`
- 其他情况返回 `"未知值"`

<details><summary>参考答案</summary>

```ts
function describe(value: unknown): string {
  if (typeof value === "number") return `数值: ${value}`;
  if (typeof value === "string") return `字符串: ${value}（长度 ${value.length} 个字符）`;
  if (typeof value === "boolean") return `布尔值: ${value}`;
  return "未知值";
}

console.log(describe(42));       // → 数值: 42
console.log(describe("hello"));  // → 字符串: hello（长度 5 个字符）
console.log(describe(false));    // → 布尔值: false
console.log(describe(null));     // → 未知值
```

用 `typeof` 缩小范围后，TypeScript 会确定类型，因此无需 `as` 就可以访问 `.length` 等属性。这是接收 `unknown` 并安全处理的基本模式。

</details>

---

### 题目 6

下面的代码使用 `as` 进行了危险的类型转换。请说明问题所在，并在不使用 `as` 的情况下改写为类型安全的代码。

```ts
function getLength(value: unknown): number {
  return (value as string).length;
}

console.log(getLength("hello")); // → 5
console.log(getLength(12345));   // → 运行时错误或 undefined
```

<details><summary>参考答案</summary>

```ts
function getLength(value: unknown): number {
  if (typeof value === "string") return value.length;
  if (Array.isArray(value)) return value.length;
  return 0;
}

console.log(getLength("hello")); // → 5
console.log(getLength(12345));   // → 0
console.log(getLength([1, 2, 3])); // → 3
```

原代码的问题：`value as string` 只是让 TypeScript "相信它是 string"，当实际传入 `number` 时，`(number).length` 会变成 `undefined`。虽然没有类型错误，但运行时会崩溃。通过 `typeof` 缩小类型范围，可以在确定真实类型后再安全访问 `.length`。

</details>

---

## 📌 总结

- 原始类型：`string` / `number` / `boolean` / `null` / `undefined`（也有 `bigint` / `symbol`）
- 类型推断：有初始值的变量可以省略，函数参数必须写
- `any`：关闭类型检查，原则上不使用
- `unknown`：安全版 any，使用前需用 `typeof` 等缩小类型范围
- `never`：没有值的类型，用于穷举性检查
- `as`：类型断言，限于自己清楚类型的场景使用
- `typeof`：确认运行时类型（注意 `null` 的结果是 `"object"`）

## ▶ 运行

```bash
npm run ch03
# 或者
npx tsx src/03_basic_types.ts
```
