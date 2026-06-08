# 第06章 数组、元组 (tuple) 与枚举 (enum)

> 从数组的类型表达，到长度和顺序固定的元组，再到表示常量集合的枚举。同时掌握使用 `as const` 的现代替代模式。

## 🎯 本章目标

- 能区分使用数组类型 `number[]` / `Array<number>`
- 能处理 `readonly` 数组和多维数组
- 能用元组表达"第几个位置是什么类型"
- 了解枚举的基础与常见陷阱
- 能用 `as const` + 字面量联合类型替代枚举

---

## 数组类型 `number[]` 与 `Array<number>`

两种写法含义相同。

```ts
const nums1: number[] = [1, 2, 3];
const nums2: Array<number> = [4, 5, 6];

console.log(nums1); // [1, 2, 3]
console.log(nums2); // [4, 5, 6]
```

通常 `number[]` 更简短易读，因此更常用。`Array<T>` 是泛型（第8章）语法，在类型较复杂时使用。

---

## 多维数组 `number[][]`

数组的数组用 `T[][]` 表示。

```ts
// 二维数组（矩阵、棋盘等）
const matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

console.log(matrix[1][2]); // 6（第2行第3列）

// 字符串的二维数组
const grid: string[][] = [
  ["○", "×", "○"],
  ["×", "○", "×"],
];
console.log(grid[0][1]); // ×
```

---

## `readonly` 数组 — 不可变数组

不希望修改数组内容时，加上 `readonly`。

```ts
const frozen: readonly number[] = [1, 2, 3];

console.log(frozen[0]); // 1

// @ts-expect-error readonly 数组不能使用 push 等破坏性方法
frozen.push(4);

// @ts-expect-error readonly 数组的元素也不能重新赋值
frozen[0] = 99;
```

`ReadonlyArray<T>` 写法相同。用于防止函数中意外修改传入的数组。

---

## 元组 (tuple) `[string, number]`

元组是**长度和每个位置类型固定的数组**。

```ts
// 表示"姓名和分数"的元组
const entry: [string, number] = ["小明", 85];

console.log(entry[0]); // 小明
console.log(entry[1]); // 85

// 也可以用解构赋值
const [name, score] = entry;
console.log(`${name}：${score}分`); // 小明：85分
```

与普通数组不同，每个索引位置的类型各不相同。

### 命名元组（TypeScript 4.0+）

为每个元素添加标签可以提高可读性。

```ts
type NamedEntry = [name: string, score: number];

const student: NamedEntry = ["小红", 92];
console.log(student); // [ '小红', 92 ]
```

### 可选元素

用 `?` 可以使末尾元素可选。

```ts
type WithOptional = [string, number, boolean?];

const a: WithOptional = ["hello", 1];       // OK（省略 boolean）
const b: WithOptional = ["world", 2, true]; // OK
console.log(a, b);
```

### 可变长（rest）元组

元组中可以包含剩余元素。

```ts
type AtLeastTwo = [string, string, ...number[]];

const c: AtLeastTwo = ["first", "second"];         // OK（number 部分0个以上）
const d: AtLeastTwo = ["first", "second", 1, 2, 3]; // OK
console.log(c, d);
```

---

## 枚举 (enum) — 枚举类型

将相关常量集中管理。

### 数值枚举

```ts
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}

const dir: Direction = Direction.Up;
console.log(dir);             // 0
console.log(Direction[0]);    // "Up"（可以反向查找）
console.log(Direction.Right); // 3
```

默认从0开始分配整数。修改第一个值后，后续也会连续编号。

### 字符串枚举

比数值枚举意图更明确，调试时更易读。

```ts
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}

const c2: Color = Color.Green;
console.log(c2); // "GREEN"
```

字符串枚举不支持反向查找（`Color["GREEN"]`）。

### 枚举的注意事项

```ts
enum Status {
  Active = 0,
  Inactive = 1,
}

// 数值枚举允许赋值类型外的数值（陷阱）
const s: Status = 99; // TypeScript 中不会警告（设计上的问题）
console.log(s); // 99
```

数值枚举的类型安全性较低，这是其被批评的原因。使用字符串枚举或下面介绍的替代方案更安全。

---

## 字面量联合类型 + `as const` — 枚举的替代方案

在现代 TypeScript 中，常用**字面量联合类型**与 **`as const`** 的组合替代枚举。

### 字面量联合类型

```ts
// 用 type 定义字面量联合类型替代枚举
type Direction2 = "Up" | "Down" | "Left" | "Right";

function move(dir: Direction2): void {
  console.log(`移动：${dir}`);
}

move("Up");   // 移动：Up
// @ts-expect-error 不在字面量联合类型中的值会报错
move("Diagonal");
```

### `as const` — 固定为字面量类型

加上 `as const` 后，TypeScript 会将值视为**最窄的类型（字面量类型）**。

```ts
// 没有 as const：推断为 string
const color1 = "red";    // 类型：string ← 实际上是 "red"（会推断为字面量类型）
const arr1 = ["a", "b"]; // 类型：string[] ← 判断内容可能变化

// 有 as const：固定为字面量类型
const arr2 = ["a", "b"] as const;
// 类型：readonly ["a", "b"] — 只能是 "a" | "b"
console.log(arr2); // ['a', 'b']

// @ts-expect-error as const 的数组是 readonly，不能修改
arr2.push("c");
```

### 对象常量 + as const 提取键类型

```ts
// 用 as const 定义对象常量
const COLORS = {
  Red: "RED",
  Green: "GREEN",
  Blue: "BLUE",
} as const;

// 用 typeof + keyof 提取键的类型
type ColorKey = keyof typeof COLORS;           // "Red" | "Green" | "Blue"
type ColorValue = (typeof COLORS)[ColorKey];   // "RED" | "GREEN" | "BLUE"

const myColor: ColorValue = "GREEN";
console.log(myColor); // GREEN
```

这种模式比枚举编译后的 JavaScript 结果更简洁，也支持 Tree Shaking（消除无用代码）。

---

## ⚠️ 常见错误

### 1. 数组越界访问类型上为 `T`，但实际为 `undefined`

除非开启 strict 模式的 `noUncheckedIndexedAccess`，否则数组元素访问类型为 `T`（而非 `T | undefined`）。

```ts
const items = ["a", "b", "c"];
const item = items[10]; // 类型上是 string，但运行时是 undefined
console.log(item); // undefined
console.log(typeof item); // "undefined"

// 养成先检查存在性的习惯
if (item !== undefined) {
  console.log(item.toUpperCase());
}
```

### 2. 超出元组长度的赋值会报错

```ts
const pair: [string, number] = ["hello", 1];
// @ts-expect-error 元组长度为2，访问索引2会报错
pair[2] = "extra";
```

### 3. 数值枚举允许类型外的数值

使用字符串枚举或字面量联合类型更安全（前文已述）。

### 4. 忘记 `as const` 会导致类型变宽

```ts
const directions = ["Up", "Down", "Left", "Right"]; // 类型：string[]
// 想要 "Up" | "Down" ... 需要 as const
const directions2 = ["Up", "Down", "Left", "Right"] as const; // 类型：readonly ["Up", ...]
```

---

## ✍️ 练习题

### 题1

请编写函数 `toUpperAll`，接收 `string` 的只读数组，返回每个元素大写后的**新数组**。不能修改原数组。

<details>
<summary>参考答案</summary>

```ts
function toUpperAll(arr: readonly string[]): string[] {
  return arr.map((s) => s.toUpperCase());
}

const words = ["hello", "world"] as const;
console.log(toUpperAll(words)); // ['HELLO', 'WORLD']
```

</details>

---

### 题2

请定义 `type RGB = [r: number, g: number, b: number]`，并编写函数 `blendColors`，接收两个 `RGB`，返回各通道平均后的新 `RGB`。

<details>
<summary>参考答案</summary>

```ts
type RGB = [r: number, g: number, b: number];

function blendColors(c1: RGB, c2: RGB): RGB {
  return [
    Math.round((c1[0] + c2[0]) / 2),
    Math.round((c1[1] + c2[1]) / 2),
    Math.round((c1[2] + c2[2]) / 2),
  ];
}

const red2: RGB = [255, 0, 0];
const blue: RGB = [0, 0, 255];
console.log(blendColors(red2, blue)); // [128, 0, 128]
```

</details>

---

### 题3

请用 `as const` 定义 `WEEKDAYS` 对象（周一至周五的英文名），并提取其值的类型 `Weekday`。还要编写接收 `Weekday` 参数、返回中文星期名的函数 `toChinese`。

<details>
<summary>参考答案</summary>

```ts
const WEEKDAYS = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
} as const;

type Weekday = (typeof WEEKDAYS)[keyof typeof WEEKDAYS];

function toChinese(day: Weekday): string {
  const map: Record<Weekday, string> = {
    Monday: "星期一",
    Tuesday: "星期二",
    Wednesday: "星期三",
    Thursday: "星期四",
    Friday: "星期五",
  };
  return map[day];
}

console.log(toChinese("Monday"));    // 星期一
console.log(toChinese("Wednesday")); // 星期三
```

</details>

---

### 题4

请编写接收 `readonly string[]` 的函数 `firstAndLast`。以 `[first: string, last: string]` 元组返回数组的第一个和最后一个元素。数组为空时返回 `["", ""]`。请在函数内尝试修改原数组的行加上 `@ts-expect-error` 注释，确认 `readonly` 约束。

<details><summary>参考答案</summary>

```ts
function firstAndLast(arr: readonly string[]): [first: string, last: string] {
  // @ts-expect-error readonly 数组不能使用 push
  // arr.push("x");
  if (arr.length === 0) return ["", ""];
  return [arr[0], arr[arr.length - 1]];
}

const fruits = ["apple", "banana", "cherry"] as const;
console.log(firstAndLast(fruits));   // ['apple', 'cherry']
console.log(firstAndLast([]));       // ['', '']
console.log(firstAndLast(["only"])); // ['only', 'only']
```

`readonly` 数组在类型层面禁止 `push` / `pop` 等破坏性方法。`as const` 数组可以赋值给 `readonly` 数组。

</details>

---

### 题5

请定义字符串枚举 `LogLevel`（Debug = "DEBUG"、Info = "INFO"、Warn = "WARN"、Error = "ERROR"）。编写接收 `LogLevel` 和消息字符串、输出 `"[{级别}] {消息}"` 的函数 `log`。

<details><summary>参考答案</summary>

```ts
enum LogLevel {
  Debug = "DEBUG",
  Info = "INFO",
  Warn = "WARN",
  Error = "ERROR",
}

function log(level: LogLevel, message: string): void {
  console.log(`[${level}] ${message}`);
}

log(LogLevel.Info, "服务器已启动");  // [INFO] 服务器已启动
log(LogLevel.Warn, "内存占用率高");  // [WARN] 内存占用率高
log(LogLevel.Error, "连接失败");     // [ERROR] 连接失败
```

字符串枚举在调试时输出可读的值，意图比数值枚举更明确。

</details>

---

### 题6

请用 `as const` 定义 `HTTP_METHODS` 对象（GET / POST / PUT / DELETE 的字符串值）。提取其值的类型 `HttpMethod`，并编写接收 `HttpMethod`、返回是否幂等（GET / PUT 幂等，POST / DELETE 非幂等）的函数 `isIdempotent`。

<details><summary>参考答案</summary>

```ts
const HTTP_METHODS = {
  Get: "GET",
  Post: "POST",
  Put: "PUT",
  Delete: "DELETE",
} as const;

type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

function isIdempotent(method: HttpMethod): boolean {
  return method === "GET" || method === "PUT";
}

console.log(isIdempotent("GET"));    // true
console.log(isIdempotent("POST"));   // false
console.log(isIdempotent("PUT"));    // true
console.log(isIdempotent("DELETE")); // false
```

`as const` + `typeof` + `keyof` 的组合，无需枚举即可定义类型安全的常量集合，也更易于 Tree Shaking。

</details>

---

## 📌 总结

- `number[]` 与 `Array<number>` 同义，通常用 `number[]`
- `readonly T[]` 表示不可变数组
- 元组 `[string, number]` 是每个位置类型固定的定长数组
- 数值枚举类型安全性较低，推荐使用字符串枚举或字面量联合类型
- `as const` 可将对象/数组固定为字面量类型
- 数组越界访问运行时为 `undefined`，但类型上仍是 `T`（注意）

## ▶ 运行

```bash
npm run ch06
# 或者
npx tsx src/06_arrays_tuples_enums.ts
```
