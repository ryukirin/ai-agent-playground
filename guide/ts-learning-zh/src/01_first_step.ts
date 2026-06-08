// ============================================================
// 第01章 TypeScript 入门第一步
// 通过 npx tsx src/01_first_step.ts 运行
// ============================================================

// ----------------------------------------------------------
// 1. 为什么需要 TypeScript：JS 中常见 bug 示例
// ----------------------------------------------------------

// 在 JS 中，字符串 "500" 和数字相乘会通过隐式转换运行
// TS 可以提前检测到这类问题（这里故意演示与 JS 相同的行为）
const price = "500" as unknown as number; // 故意欺骗类型的示例
const tax = 0.1;
console.log("【类似 JS 的 bug 示例】 price * tax =", (price as unknown as string) + "*" + tax);
console.log("  → 实际计算结果:", (price as unknown as number) * tax);
// 输出: 50（字符串被隐式转换为数字）

console.log();

// ----------------------------------------------------------
// 2. 变量的类型注解（基础）
// ----------------------------------------------------------

// "变量名: 类型名 = 值" 的写法
let message: string = "你好 TypeScript";
let count: number = 10;
let isDone: boolean = false;

console.log("【带类型注解的变量】");
console.log(message); // → 你好 TypeScript
console.log(count);   // → 10
console.log(isDone);  // → false

console.log();

// ----------------------------------------------------------
// 3. 函数的类型注解
// ----------------------------------------------------------

// 为参数和返回值写类型
function add(a: number, b: number): number {
  return a + b;
}

console.log("【带类型的函数 add】");
console.log("add(3, 4) =", add(3, 4)); // → 7
console.log("add(10, -2) =", add(10, -2)); // → 8

console.log();

// ----------------------------------------------------------
// 4. 用 @ts-expect-error "体验类型错误"
// ----------------------------------------------------------
// ※ @ts-expect-error 是告诉 TS "下一行是故意的类型错误" 的注释
// ※ 没有这个注释的话 tsc --noEmit 会失败

// 示例1：向 number 参数传入字符串
// @ts-expect-error 向 number 类型参数传入字符串的类型错误示例
const badResult = add("3", 4);
console.log("【@ts-expect-error 示例1（向数字参数传入了字符串）】");
console.log("结果:", badResult); // 运行时可以执行，但类型上是错误的

console.log();

// 示例2：向 string 类型变量赋值 number
let greeting: string = "Hello";
// @ts-expect-error 尝试向 string 类型赋值 number
greeting = 123;
console.log("【@ts-expect-error 示例2（向 string 变量赋值 number）】");
console.log("greeting =", greeting); // 运行时变为 123

console.log();

// ----------------------------------------------------------
// 5. 类型推断：即使没有注解，TypeScript 也能推断类型
// ----------------------------------------------------------

// 初始化时有值，TypeScript 会自动推断类型
const inferred = "TypeScript 推断为 string 类型";
// inferred 的类型自动变为 string

console.log("【类型推断示例】");
console.log(inferred);
// 因为类型被推断为 string，所以尝试赋值 number 会报错

// 类型推断示例：用 @ts-expect-error 演示向推断类型变量错误赋值
let inferredVar = "被推断为字符串类型";
// @ts-expect-error 向被推断为 string 的变量赋值 number
inferredVar = 42;
console.log("inferredVar =", inferredVar);

console.log();

// ----------------------------------------------------------
// 6. 类型在运行时会消失（type erasure，类型擦除）
// ----------------------------------------------------------

// TypeScript 的类型注解在编译为 JS 后会消失
// 运行时要确认类型需使用 JavaScript 的 typeof

let value: number = 42;
console.log("【用 typeof 确认运行时类型】");
console.log("value =", value);
console.log("typeof value =", typeof value); // → "number"（JS 的 typeof）
// TS 的类型注解 ": number" 与 JS 的 typeof "number" 是两回事。
// TS 的类型仅在开发时（编译时）存在。

console.log();

// ----------------------------------------------------------
// 7. 简单实用示例：使用姓名和年龄的函数
// ----------------------------------------------------------

function greet(name: string, age: number): string {
  return `${name}今年${age}岁`;
}

console.log("【实用示例 greet】");
console.log(greet("张三", 30));  // → 张三今年30岁
console.log(greet("李四", 25));  // → 李四今年25岁

// 参数类型不对会报错
// @ts-expect-error age 传入了 string 的错误示例
console.log(greet("王五", "三十"));

console.log();
console.log("=== 第01章 完成 ===");
