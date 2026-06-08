# 第04章 函数的类型

> 为函数的参数和返回值添加类型，可以在编译阶段防止调用方出错。这是体感 TypeScript 好处最明显的地方。

## 🎯 本章目标

- 能为参数和返回值编写类型注解
- 能区分使用可选参数、默认参数和剩余参数
- 能用类型别名表达函数类型（签名）
- 能为回调函数添加类型
- 了解函数重载的概念

---

## 参数与返回值的类型注解

从最简单的例子开始。

```ts
function add(a: number, b: number): number {
  return a + b;
}

console.log(add(2, 3)); // 5
```

- `a: number` — 参数 `a` 是数值类型
- `: number`（右括号之后）— 返回值是数值类型

**为什么要写？**  
不写参数类型，TypeScript 会将其推断为 `any`（在 strict 模式下会报错）。  
返回值可以被推断出来，可以省略，但建议养成**明确写出作为函数规格说明**的习惯。

---

## 返回值 `void` — 不返回任何值的函数

不需要返回值的函数，将返回值类型设为 `void`。

```ts
function greet(name: string): void {
  console.log(`你好，${name}！`);
  // 不 return
}

greet("小明"); // 你好，小明！
```

返回 `undefined` 的函数也使用 `void`。`void` 表示"不打算使用返回值"的含义。

---

## 可选参数 `?` 与默认参数

### 可选参数 `?`

加上 `?` 后，参数可以省略。省略时值为 `undefined`。

```ts
function greetWithTitle(name: string, title?: string): string {
  if (title !== undefined) {
    return `${title} ${name}`;
  }
  return name;
}

console.log(greetWithTitle("小明"));          // 小明
console.log(greetWithTitle("小明", "Dr."));   // Dr. 小明
```

### 默认参数

如果省略时有固定的默认值，使用默认参数更方便。类型注解可以省略（从默认值推断）。

```ts
function greetWithDefault(name: string, greeting = "你好"): string {
  return `${greeting}，${name}！`;
}

console.log(greetWithDefault("小明"));          // 你好，小明！
console.log(greetWithDefault("小明", "早上好")); // 早上好，小明！
```

**`?` 与默认参数的区别**

| | 省略时的值 | 类型 |
|---|---|---|
| `title?: string` | `undefined` | `string \| undefined` |
| `greeting = "你好"` | `"你好"` | `string` |

---

## 剩余参数 `...nums: number[]`

将可变数量的参数作为数组统一接收。

```ts
function sum(...nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}

console.log(sum(1, 2, 3));       // 6
console.log(sum(10, 20, 30, 40)); // 100
```

剩余参数**必须放在最后**。前面有普通参数也没问题。

```ts
function log(prefix: string, ...messages: string[]): void {
  for (const msg of messages) {
    console.log(`[${prefix}] ${msg}`);
  }
}

log("INFO", "服务已启动", "连接完成");
// [INFO] 服务已启动
// [INFO] 连接完成
```

---

## 用类型别名表达函数类型（签名）

可以为"接受这些参数、返回这种类型的函数"的形式命名为类型。

```ts
// 二元运算的类型别名
type BinOp = (a: number, b: number) => number;

const multiply: BinOp = (a, b) => a * b;
const divide: BinOp = (a, b) => a / b;

console.log(multiply(3, 4)); // 12
console.log(divide(10, 2));  // 5
```

使用类型别名，在定义多个相同签名的函数时可以保持一致性。

---

## 回调函数的类型

传给数组 `map`、`filter` 的函数也可以添加类型。

```ts
const numbers = [1, 2, 3, 4, 5];

// 显式声明回调函数的参数和返回值类型的示例
const doubled = numbers.map((n: number): number => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// 用类型别名定义回调类型的示例
type Predicate = (value: number) => boolean;

function filterNumbers(arr: number[], pred: Predicate): number[] {
  return arr.filter(pred);
}

const evens = filterNumbers(numbers, (n) => n % 2 === 0);
console.log(evens); // [2, 4]
```

实际上，`map` 等方法的参数类型会被推断出来，在回调内省略类型注解也不会报错。

---

## 箭头函数 vs 函数声明的类型写法

同一个函数用两种方式写类型注解。

```ts
// 函数声明
function addDecl(a: number, b: number): number {
  return a + b;
}

// 箭头函数（赋值给变量）
const addArrow = (a: number, b: number): number => a + b;

// 在变量上注解类型，省略箭头函数参数类型的写法
const addAnnotated: (a: number, b: number) => number = (a, b) => a + b;

console.log(addDecl(1, 2));      // 3
console.log(addArrow(1, 2));     // 3
console.log(addAnnotated(1, 2)); // 3
```

三种方式效果相同。团队/项目统一即可。

---

## 函数重载（示例）

同一函数名接受不同参数模式的即为重载。在 TypeScript 中，先列出**重载签名**，最后写**实现签名**。

```ts
// 重载签名（用于类型检查）
function format(value: number): string;
function format(value: string): string;

// 实现签名（实际处理逻辑）
function format(value: number | string): string {
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  return value.trim();
}

console.log(format(3.14159)); // "3.14"
console.log(format("  hello  ")); // "hello"
```

需要重载的场景仅限于"根据参数类型返回值类型不同"等情况。大多数情况下用**联合类型**（第7章）就够了。

---

## ⚠️ 常见错误

### 1. 忘记写参数类型注解，strict 模式下会报错

```ts
// @ts-expect-error strict 模式下禁止参数隐式为 any
function bad(x) {
  return x + 1;
}
```

返回值可以被推断，但**参数没有推断依据，所以必须写**是基本原则。

### 2. 可选参数必须放在后面

```ts
// @ts-expect-error 可选参数后面不能有必需参数
function wrong(a?: string, b: number): void {}
```

`a?: string` 后面不能有必需的 `b: number`。可选参数始终要放在末尾。

### 3. 返回值为 `void` 的函数通过 `return` 返回值会报类型错误

```ts
function noReturn(): void {
  // @ts-expect-error void 类型的函数不能返回值
  return 42;
}
```

### 4. 向默认参数传入 `undefined` 时会使用默认值

```ts
function withDefault(n = 10): number {
  return n;
}

console.log(withDefault());          // 10 ← 使用默认值
console.log(withDefault(undefined)); // 10 ← undefined 也会使用默认值
console.log(withDefault(0));         // 0  ← 0 不会使用默认值
```

---

## ✍️ 练习题

### 题1

请编写一个函数 `longer`，接收两个字符串，返回较长的那个。长度相同时返回第一个参数。不要忘记类型注解。

<details>
<summary>参考答案</summary>

```ts
function longer(a: string, b: string): string {
  return a.length >= b.length ? a : b;
}

console.log(longer("cat", "elephant")); // "elephant"
console.log(longer("ab", "cd"));        // "ab"
```

</details>

---

### 题2

请定义类型别名 `type Transformer = (s: string) => string`，并实现该类型的函数 `toUpperFirst`（将首字母大写）。

<details>
<summary>参考答案</summary>

```ts
type Transformer = (s: string) => string;

const toUpperFirst: Transformer = (s) =>
  s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);

console.log(toUpperFirst("hello")); // "Hello"
console.log(toUpperFirst(""));      // ""
```

</details>

---

### 题3

请编写一个函数 `average`，接收任意数量的数值，返回它们的平均值。参数为0个时可以返回 `NaN`。

<details>
<summary>参考答案</summary>

```ts
function average(...nums: number[]): number {
  if (nums.length === 0) return NaN;
  return nums.reduce((acc, n) => acc + n, 0) / nums.length;
}

console.log(average(1, 2, 3, 4, 5)); // 3
console.log(average(10, 20));         // 15
console.log(average());               // NaN
```

</details>

---

### 题4

请编写高阶函数 `applyTwice`。类型为 `(f: (x: number) => number, x: number) => number`，返回将 `f` 应用两次后的结果。请先定义函数类型别名 `NumTransform` 再使用。

<details><summary>参考答案</summary>

```ts
type NumTransform = (x: number) => number;

function applyTwice(f: NumTransform, x: number): number {
  return f(f(x));
}

const double: NumTransform = (x) => x * 2;
const addTen: NumTransform = (x) => x + 10;

console.log(applyTwice(double, 3));  // 12  (3→6→12)
console.log(applyTwice(addTen, 5)); // 25  (5→15→25)
```

通过函数类型别名统一参数类型，`applyTwice` 侧的代码更加简洁。

</details>

---

### 题5

请编写 `greet` 函数。第1参数为 `name: string`（必需），第2参数为 `title?: string`（可选），第3参数为 `suffix = "!"`（默认参数）。有 `title` 时返回 `"你好，{title} {name}{suffix}"`，没有时返回 `"你好，{name}{suffix}"`。

<details><summary>参考答案</summary>

```ts
function greet(name: string, title?: string, suffix = "!"): string {
  if (title !== undefined) {
    return `你好，${title} ${name}${suffix}`;
  }
  return `你好，${name}${suffix}`;
}

console.log(greet("小明"));                    // 你好，小明!
console.log(greet("小明", "Dr."));             // 你好，Dr. 小明!
console.log(greet("小明", undefined, "。"));   // 你好，小明。
console.log(greet("小明", "Dr.", "。"));       // 你好，Dr. 小明。
```

`title?` 省略时为 `undefined`。`suffix` 是默认参数，省略时使用 `"!"`，显式传入 `undefined` 时也会使用默认值。

</details>

---

### 题6

请编写函数 `maxMin`，接收可变数量的数值，以 `[max: number, min: number]` 的元组返回最大值和最小值。参数为0个时返回 `[-Infinity, Infinity]`。

<details><summary>参考答案</summary>

```ts
function maxMin(...nums: number[]): [max: number, min: number] {
  if (nums.length === 0) return [-Infinity, Infinity];
  let max = nums[0];
  let min = nums[0];
  for (const n of nums) {
    if (n > max) max = n;
    if (n < min) min = n;
  }
  return [max, min];
}

console.log(maxMin(3, 1, 4, 1, 5, 9, 2, 6)); // [9, 1]
console.log(maxMin(42));                       // [42, 42]
console.log(maxMin());                         // [-Infinity, Infinity]
```

用剩余参数将可变参数作为数组接收，用命名元组表达含义清晰的返回值。

</details>

---

## 📌 总结

- 参数类型注解**必须写**。返回值可以省略，但建议明确写出
- 可选参数 `?` 省略时为 `undefined`。默认参数可以指定省略时的值
- 剩余参数 `...nums: number[]` 以数组方式接收可变数量的参数
- `type BinOp = (a: number, b: number) => number` 可以为函数类型命名
- 重载适用于有限场景。大多数情况下可用联合类型替代

## ▶ 运行

```bash
npm run ch04
# 或者
npx tsx src/04_functions.ts
```
