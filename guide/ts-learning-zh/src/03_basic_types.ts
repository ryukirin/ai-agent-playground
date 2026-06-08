// ============================================================
// 第03章 基本类型
// 通过 npx tsx src/03_basic_types.ts 运行
// ============================================================

// ----------------------------------------------------------
// 1. 原始类型：string / number / boolean
// ----------------------------------------------------------

console.log("=== 1. 原始类型 ===");

// string
const s1: string = "hello";
const s2: string = "world";
const s3: string = `${s1} ${s2}`;
console.log("string:", s3); // → hello world

// number（整数、小数、特殊值统一为 number）
const n1: number = 42;
const n2: number = 3.14;
const n3: number = 0xff;    // 16进制
const n4: number = NaN;     // Not a Number（这也是 number 类型）
const n5: number = Infinity;
console.log("number:", n1, n2, n3, n4, n5); // → 42 3.14 255 NaN Infinity

// boolean
const isLoggedIn: boolean = true;
const isEmpty: boolean = false;
console.log("boolean:", isLoggedIn, isEmpty); // → true false

console.log();

// ----------------------------------------------------------
// 2. null 与 undefined
// ----------------------------------------------------------

console.log("=== 2. null / undefined ===");

// null：有意表示"值不存在"
const a: null = null;
// undefined：值未设置的状态
const b: undefined = undefined;
console.log("null:", a);      // → null
console.log("undefined:", b); // → undefined

// 常用的是 "string | null" 这样的联合类型（详见第7章）
let nickname: string | null = null;
console.log("nickname（null）:", nickname); // → null
nickname = "小张";
console.log("nickname（set）:", nickname);  // → 小张

console.log();

// ----------------------------------------------------------
// 3. bigint 与 symbol
// ----------------------------------------------------------

console.log("=== 3. bigint / symbol ===");

// bigint：非常大的整数（末尾加 n）
const big: bigint = 9007199254740993n; // Number.MAX_SAFE_INTEGER + 2
console.log("bigint:", big); // → 9007199254740993n

// symbol：唯一的标识符
const sym1: symbol = Symbol("key");
const sym2: symbol = Symbol("key");
console.log("symbol equals:", sym1 === sym2); // → false（描述相同也是不同的值）
console.log("symbol:", sym1.toString());       // → Symbol(key)

console.log();

// ----------------------------------------------------------
// 4. 类型推断：从初始值确定类型
// ----------------------------------------------------------

console.log("=== 4. 类型推断 ===");

// 从初始值推断为 string（无需类型注解）
const greeting = "Hello TypeScript";
console.log("greeting:", greeting); // → Hello TypeScript

// 从初始值推断为 number
const year = 2025;
console.log("year:", year); // → 2025

// 尝试向推断类型的变量赋值不同类型时会报错
let mutableGreeting = "Hello TypeScript"; // 推断为 string
// @ts-expect-error 不能向推断为 string 的变量赋值 number
mutableGreeting = 123;
console.log("mutableGreeting（类型错误）:", mutableGreeting); // 运行时变为 123

// 函数参数无法推断，必须写上
function multiply(n: number, by: number): number {
  return n * by;
}
console.log("multiply:", multiply(3, 4)); // → 12

console.log();

// ----------------------------------------------------------
// 5. any：关闭类型检查（有风险）
// ----------------------------------------------------------

console.log("=== 5. any ===");

// any 可以放入任何值
let x: any = "字符串";
console.log("any string:", x); // → 字符串

x = 42;
console.log("any number:", x); // → 42

x = { nested: { prop: "值" } };
console.log("any object:", x.nested.prop); // → 值（无类型检查即可使用）

// any 的传染：使用 any 后返回值也变为 any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseUnsafe(data: any) {
  return data.value; // 返回值也变为 any
}
const result = parseUnsafe({ value: "找到了" });
console.log("any result:", result); // → 找到了（类型信息已丢失）

console.log();

// ----------------------------------------------------------
// 6. unknown：安全版 any（使用前需缩小类型范围）
// ----------------------------------------------------------

console.log("=== 6. unknown ===");

let val: unknown = "你好";

// @ts-expect-error 不能直接在 unknown 上调用 string 方法（安全）
val.toUpperCase();

// 用 typeof 缩小范围后再使用
if (typeof val === "string") {
  console.log("unknown → string:", val.toUpperCase()); // → 你好
}

// 用于外部输入等"不知道会来什么值"的实用示例
function processInput(input: unknown): string {
  if (typeof input === "string") return `string: ${input}`;
  if (typeof input === "number") return `number: ${String(input)}`;
  if (typeof input === "boolean") return `boolean: ${String(input)}`;
  return "未知输入";
}

console.log(processInput("hello")); // → string: hello
console.log(processInput(42));      // → number: 42
console.log(processInput(true));    // → boolean: true
console.log(processInput(null));    // → 未知输入

console.log();

// ----------------------------------------------------------
// 7. never：没有值的类型
// ----------------------------------------------------------

console.log("=== 7. never ===");

// 示例1：必然抛出异常的函数（不 return = never）
function fail(message: string): never {
  throw new Error(message);
}

// 示例2：用于 switch 的穷举性检查
type Color = "red" | "green" | "blue";

function getColorCode(color: Color): string {
  switch (color) {
    case "red":   return "#ff0000";
    case "green": return "#00ff00";
    case "blue":  return "#0000ff";
    default: {
      // 如果 Color 添加了新值而到达这里，会产生编译错误
      const _exhaustive: never = color;
      return _exhaustive; // 执行不会到达这里（因为是 never）
    }
  }
}

console.log("getColorCode red:", getColorCode("red"));     // → #ff0000
console.log("getColorCode blue:", getColorCode("blue"));   // → #0000ff

// fail 的调用示例（运行时会报错，所以注释掉）
// fail("这是一个错误");

console.log();

// ----------------------------------------------------------
// 8. 类型断言 as
// ----------------------------------------------------------

console.log("=== 8. 类型断言 as ===");

// 将 unknown 当作 number 使用
const raw: unknown = 42;
const num = raw as number;
console.log("as number:", num + 1); // → 43

// 将 string as 为 number（危险示例）
const strAsNum = "hello" as unknown as number;
console.log("strAsNum + 1:", strAsNum + 1);
// → "hello1"（变成字符串拼接了！类型断言不改变运行时的值）

// @ts-expect-error 对完全不相关的类型一步 as 会报错
const bad = "hello" as number;
console.log("bad:", bad);

console.log();

// ----------------------------------------------------------
// 9. 用 typeof 确认运行时类型（第7章的铺垫）
// ----------------------------------------------------------

console.log("=== 9. typeof ===");

const values: unknown[] = [42, "hello", true, null, undefined, { key: "obj" }];

for (const v of values) {
  // 注意 typeof null === "object" 这个 JS 历史遗留 bug
  const typeStr = typeof v;
  const displayType = v === null ? "null（typeof 是'object'）" : typeStr;
  console.log(`typeof [${String(v)}] → "${typeStr}"  (${displayType})`);
}
// → "number"  "string"  "boolean"  "object"（null）  "undefined"  "object"

console.log();
console.log("=== 第03章 完成 ===");
