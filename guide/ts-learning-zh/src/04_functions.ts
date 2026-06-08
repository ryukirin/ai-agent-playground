// ============================================================
// 第04章 函数的类型
// npx tsx src/04_functions.ts 执行
// ============================================================

// ----------------------------------------------------------
// 1. 参数与返回值的类型注解
// ----------------------------------------------------------
// 最简单的函数：两个参数都是 number，返回值也是 number
function add(a: number, b: number): number {
  return a + b;
}
console.log("add(2, 3) =", add(2, 3)); // 5

// ----------------------------------------------------------
// 2. 返回值 void — 不返回任何值的函数
// ----------------------------------------------------------
function greet(name: string): void {
  console.log(`你好，${name}！`);
}
greet("小明"); // 你好，小明！

// ----------------------------------------------------------
// 3. 可选参数 ?
// ----------------------------------------------------------
// 省略 title 时值为 undefined
function greetWithTitle(name: string, title?: string): string {
  if (title !== undefined) {
    return `${title} ${name}`;
  }
  return name;
}
console.log("省略:", greetWithTitle("小明"));          // 小明
console.log("有title:", greetWithTitle("小明", "Dr."));   // Dr. 小明

// ----------------------------------------------------------
// 4. 默认参数
// ----------------------------------------------------------
// 即使省略 greeting 的类型注解，也会推断为 string
function greetWithDefault(name: string, greeting = "你好"): string {
  return `${greeting}，${name}！`;
}
console.log(greetWithDefault("小明"));          // 你好，小明！
console.log(greetWithDefault("小明", "早上好")); // 早上好，小明！

// 向默认参数传入 undefined 时也会使用默认值
function withDefault(n = 10): number {
  return n;
}
console.log("withDefault():", withDefault());          // 10
console.log("withDefault(undefined):", withDefault(undefined)); // 10
console.log("withDefault(0):", withDefault(0));        // 0 ← 不会使用默认值

// ----------------------------------------------------------
// 5. 剩余参数 ...nums: number[]
// ----------------------------------------------------------
// 将可变数量的参数作为数组统一接收
function sum(...nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}
console.log("sum(1,2,3):", sum(1, 2, 3));         // 6
console.log("sum(10,20,30,40):", sum(10, 20, 30, 40)); // 100

// 前面也可以放普通参数
function log(prefix: string, ...messages: string[]): void {
  for (const msg of messages) {
    console.log(`[${prefix}] ${msg}`);
  }
}
log("INFO", "服务已启动", "连接完成");
// [INFO] 服务已启动
// [INFO] 连接完成

// ----------------------------------------------------------
// 6. 用类型别名表达函数类型（签名）
// ----------------------------------------------------------
// "接收两个 number 返回 number 的函数"类型
type BinOp = (a: number, b: number) => number;

const multiply: BinOp = (a, b) => a * b;
const divide: BinOp = (a, b) => a / b;

console.log("multiply(3,4):", multiply(3, 4)); // 12
console.log("divide(10,2):", divide(10, 2));   // 5

// ----------------------------------------------------------
// 7. 回调函数的类型
// ----------------------------------------------------------
// 传给数组方法的函数也可以添加类型
const numbers = [1, 2, 3, 4, 5];

const doubled = numbers.map((n: number): number => n * 2);
console.log("doubled:", doubled); // [2, 4, 6, 8, 10]

// 用类型别名定义回调类型的示例
type Predicate = (value: number) => boolean;

function filterNumbers(arr: number[], pred: Predicate): number[] {
  return arr.filter(pred);
}

const evens = filterNumbers(numbers, (n) => n % 2 === 0);
console.log("evens:", evens); // [2, 4]

// ----------------------------------------------------------
// 8. 箭头函数 vs 函数声明的类型写法
// ----------------------------------------------------------
// 函数声明
function addDecl(a: number, b: number): number {
  return a + b;
}

// 箭头函数（为参数和返回值添加类型注解）
const addArrow = (a: number, b: number): number => a + b;

// 在变量侧注解函数类型，让实现侧依赖类型推断
const addAnnotated: (a: number, b: number) => number = (a, b) => a + b;

console.log("addDecl:", addDecl(1, 2));       // 3
console.log("addArrow:", addArrow(1, 2));      // 3
console.log("addAnnotated:", addAnnotated(1, 2)); // 3

// ----------------------------------------------------------
// 9. 函数重载（示例）
// ----------------------------------------------------------
// 重载签名：调用方可见的签名
function format(value: number): string;
function format(value: string): string;

// 实现签名：实际处理逻辑（外部不能直接调用）
function format(value: number | string): string {
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  return value.trim();
}

console.log("format(3.14159):", format(3.14159)); // "3.14"
console.log('format("  hello  "):', format("  hello  ")); // "hello"

// ----------------------------------------------------------
// 10. 常见错误：用 @ts-expect-error 展示禁止的模式
// ----------------------------------------------------------

// strict 模式下禁止参数隐式为 any
// @ts-expect-error 参数 x 没有类型注解，隐式为 any，报错
function bad(x) {
  return x + 1;
}

// 可选参数后面不能有必需参数
// @ts-expect-error 可选参数 a 后面不能有必需参数 b
function wrong(a?: string, b: number): void {}

// void 类型的函数不能返回值
function noReturn(): void {
  // @ts-expect-error void 函数中 return 值会报错
  return 42;
}

console.log("=== 第04章 完成 ===");
