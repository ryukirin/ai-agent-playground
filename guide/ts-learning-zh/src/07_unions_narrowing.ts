// ============================================================
// 第07章 联合类型·类型收窄·可辨识联合
// npx tsx src/07_unions_narrowing.ts
// ============================================================

// ─────────────────────────────────────────
// 1. 联合类型 string | number
// ─────────────────────────────────────────

// 接受"任意一种类型"
function printId(id: string | number): void {
  console.log("ID:", id);
}

printId(42);       // ID: 42
printId("abc-1");  // ID: abc-1

// @ts-expect-error boolean 不在联合中，所以报错
printId(true);

// ─────────────────────────────────────────
// 2. 交叉类型 A & B
// ─────────────────────────────────────────

// 创建"同时具备两种属性"的类型
type HasName = { name: string };
type HasAge  = { age: number };
type Person  = HasName & HasAge;    // name 和 age 都必须

const alice: Person = { name: "Alice", age: 30 };
console.log("交叉类型示例:", alice.name, alice.age);  // Alice 30

// ─────────────────────────────────────────
// 3. 字面量类型·数值字面量联合
// ─────────────────────────────────────────

// 字符串字面量联合: 只能填入固定的字符串
type Direction = "north" | "south" | "east" | "west";
const dir: Direction = "north";
console.log("方向:", dir);

// @ts-expect-error 不在字面量联合范围内的值会报错
const badDir: Direction = "up";

// 数值字面量联合: 只接受固定的数值
type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;
const roll: DiceValue = 3;
console.log("骰子:", roll);

// 注意：没有类型注释时字面量类型会发生类型拓宽 (widening)
const withoutAnnotation = "north";  // 类型为 string（已拓宽）
const withAnnotation: Direction = "north"; // 类型保持为 "north"
console.log(withoutAnnotation, withAnnotation);

// ─────────────────────────────────────────
// 4. 用 typeof 收窄类型 (narrowing)
// ─────────────────────────────────────────

// TypeScript 在 typeof 检查后会收窄类型
function describe(value: string | number): string {
  if (typeof value === "string") {
    // 此块内 value 确定为 string
    return `字符串: ${value.toUpperCase()}`;
  }
  // 此处 value 确定为 number
  return `数值的2倍: ${value * 2}`;
}

console.log(describe("hello"));  // 字符串: HELLO
console.log(describe(21));       // 数值的2倍: 42

// ─────────────────────────────────────────
// 5. 真值 (truthiness) 收窄
// ─────────────────────────────────────────

// 常用于排除 null | undefined
function greet(name: string | null): string {
  if (name) {
    // name 为真值 → 不是 null 也不是 "" → 确定为 string
    return `你好，${name}`;
  }
  return "你好，访客";
}

console.log(greet("Bob"));   // 你好，Bob
console.log(greet(null));    // 你好，访客

// ─────────────────────────────────────────
// 6. 用 === 比较收窄
// ─────────────────────────────────────────

type Status = "ok" | "error" | "loading";

function handleStatus(s: Status): void {
  if (s === "ok") {
    console.log("成功!");
  } else if (s === "error") {
    console.log("发生了错误");
  } else {
    // 此处 s 确定为 "loading"
    console.log("加载中...");
  }
}

handleStatus("ok");      // 成功!
handleStatus("loading"); // 加载中...

// ─────────────────────────────────────────
// 7. 用 in 运算符收窄
// ─────────────────────────────────────────

// 检查对象是否有特定属性来收窄类型
type Cat = { kind: "cat"; meow(): void };
type Dog = { kind: "dog"; bark(): void };
type Animal = Cat | Dog;

function makeSound(animal: Animal): void {
  if ("meow" in animal) {
    // 有 meow 属性 → 确定为 Cat
    animal.meow();
  } else {
    animal.bark();
  }
}

const cat: Cat = {
  kind: "cat",
  meow() { console.log("喵~"); }
};
makeSound(cat);  // 喵~

// ─────────────────────────────────────────
// 8. 用 instanceof 收窄
// ─────────────────────────────────────────

function formatError(err: Error | string): string {
  if (err instanceof Error) {
    // 确定为 Error 类的实例 → 可使用 .message
    return `错误对象: ${err.message}`;
  }
  return `字符串错误: ${err}`;
}

console.log(formatError(new Error("文件未找到")));
// 错误对象: 文件未找到
console.log(formatError("请求超时"));
// 字符串错误: 请求超时

// ─────────────────────────────────────────
// 9. 用户自定义类型守卫 (x is T)
// ─────────────────────────────────────────

// 当内置的 typeof/instanceof 无法处理时，自己编写类型守卫
type Fish = { swim(): void };
type Bird = { fly(): void };

// 返回值类型 "value is Fish" 是类型守卫的签名
function isFish(value: Fish | Bird): value is Fish {
  return "swim" in value;
}

function move(creature: Fish | Bird): void {
  if (isFish(creature)) {
    // 此处确定为 Fish
    creature.swim();
  } else {
    creature.fly();
  }
}

const fish: Fish = { swim() { console.log("游泳"); } };
const bird: Bird = { fly()  { console.log("飞翔"); } };
move(fish);  // 游泳
move(bird);  // 飞翔

// 对 unknown 类型编写类型守卫的实用示例
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(v => typeof v === "string");
}

const data: unknown = ["a", "b", "c"];
if (isStringArray(data)) {
  // data 确定为 string[]
  console.log("字符串数组的第一个元素:", data[0]);  // a
}

// ─────────────────────────────────────────
// 10. 可辨识联合 (discriminated union) ★最重要★
// ─────────────────────────────────────────

// 具有作为"标签"的字面量类型属性的对象联合
// 使用此模式，TypeScript 会自动收窄类型

// --- 示例: 表达 API 响应 ---
type ApiSuccess = {
  kind: "success";  // ← 这是标签（判别子）
  data: string[];
};

type ApiError = {
  kind: "error";    // ← 相同属性名、不同字面量值
  message: string;
  code: number;
};

type ApiLoading = {
  kind: "loading";
};

// 三种状态的联合类型
type ApiResult = ApiSuccess | ApiError | ApiLoading;

// 只需在 switch 中查看 kind，TypeScript 就能确定各分支的类型
function renderResult(result: ApiResult): string {
  switch (result.kind) {
    case "success":
      // result 确定为 ApiSuccess → 可使用 result.data
      return `成功: ${result.data.join(", ")}`;
    case "error":
      // result 确定为 ApiError → 可使用 result.message, result.code
      return `错误(${result.code}): ${result.message}`;
    case "loading":
      // result 确定为 ApiLoading
      return "加载中...";
  }
}

const success: ApiResult = { kind: "success", data: ["A", "B", "C"] };
const error: ApiResult   = { kind: "error", message: "未认证", code: 401 };
const loading: ApiResult = { kind: "loading" };

console.log(renderResult(success));  // 成功: A, B, C
console.log(renderResult(error));    // 错误(401): 未认证
console.log(renderResult(loading));  // 加载中...

// 标签的属性名除了 kind 还可以是任何名称（type / tag / variant 等，命名习惯各异）
type Square   = { shape: "square";   side: number };
type Circle   = { shape: "circle";   radius: number };
type Triangle = { shape: "triangle"; base: number; height: number };
type Shape = Square | Circle | Triangle;

function area(s: Shape): number {
  switch (s.shape) {
    case "square":   return s.side ** 2;
    case "circle":   return Math.PI * s.radius ** 2;
    case "triangle": return (s.base * s.height) / 2;
  }
}

console.log("正方形面积:", area({ shape: "square",   side: 4 }));          // 16
console.log("圆形面积:",   area({ shape: "circle",   radius: 3 }).toFixed(4)); // 28.2743
console.log("三角形面积:", area({ shape: "triangle", base: 6, height: 4 }));   // 12

// ─────────────────────────────────────────
// 11. 穷举检查 (exhaustiveness check) with never
// ─────────────────────────────────────────

// never 类型表示"不应该到达的地方"
// 在 switch 的 default 分支中赋值给 never，
// 当将来 Shape 新增种类时，编译时会报错提醒

function areaWithExhaustiveCheck(s: Shape): number {
  switch (s.shape) {
    case "square":   return s.side ** 2;
    case "circle":   return Math.PI * s.radius ** 2;
    case "triangle": return (s.base * s.height) / 2;
    default: {
      // 若到达此处，s 应为 never
      // 若 Shape 新增变体，
      // 赋值给 never 会导致编译错误
      const _exhaustive: never = s;
      throw new Error(`未支持的形状: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

// 运行验证
console.log("带穷举检查的面积:", areaWithExhaustiveCheck({ shape: "square", side: 5 })); // 25

// ─────────────────────────────────────────
// 12. 联合类型实用模式汇总
// ─────────────────────────────────────────

// null 安全的工具函数
function parseNumber(input: string | null | undefined): number | null {
  if (input == null) return null;  // 同时排除 null 和 undefined
  const n = parseFloat(input);
  return isNaN(n) ? null : n;
}

console.log(parseNumber("3.14"));  // 3.14
console.log(parseNumber(null));    // null
console.log(parseNumber("abc"));   // null
