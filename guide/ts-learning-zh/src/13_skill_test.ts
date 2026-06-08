/**
 * ===== TypeScript 综合能力测试（第1～12章总复习）=====
 *
 * 使用方法：
 *   1. 将此文件【✏️ 请在此处实现】区域中各函数/类的
 *      `throw new Error("未实现")` 替换为正确的实现。
 *   2. 用 `npm run test`（或 `npx tsx src/13_skill_test.ts`）运行。
 *   3. 全部 ✅ 即通关！❌ 还有剩余时继续挑战。
 *
 * ・参考答案在 chapters/13_skill_test.md 中，附有各章解说。
 * ・仅写类型的挑战（附加）也在同一 md 文件中。
 * ・请勿编辑评分逻辑（下半部分）。
 */

// ============================================================
// ✏️ 请在此处实现（只编辑此区域）
// ============================================================

// --- Q1【第3・4章】对数值进行平方并返回。需为参数和返回值添加类型 ---
function square(n: number): number {
  throw new Error("未实现"); // TODO: 对 n 进行平方并返回
}

// --- Q2【第3章】接收 unknown，若为 string 则返回字符数，否则返回 -1 ---
function safeLength(x: unknown): number {
  throw new Error("未实现"); // TODO: 用 typeof 收窄类型
}

// --- Q3【第4章】将字符串数组用分隔符连接。分隔符省略时默认为 "," ---
function joinWith(items: string[], sep: string = ","): string {
  throw new Error("未实现"); // TODO: 使用可选参数 sep
}

// --- Q4【第5章】User 已定义。实现 formatUser ---
//     有 email 则返回 "姓名 <邮箱>"，无则返回 "姓名"
interface User {
  id: number;
  name: string;
  email?: string;
}
function formatUser(u: User): string {
  throw new Error("未实现"); // TODO: 根据 email 是否存在进行分支
}

// --- Q5【第6章】将 RGB 元组 [r,g,b]（0-255）转换为 "#rrggbb"（小写・2位补零）---
function rgbToHex(rgb: readonly [number, number, number]): string {
  throw new Error("未实现"); // TODO: 使用 toString(16) 和 padStart
}

// --- Q6【第7章】可辨识联合 Shape 的面积。default 中加入 never 穷举性检查 ---
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number };
function area(shape: Shape): number {
  throw new Error("未实现"); // TODO: 用 switch (shape.kind) 进行分支
}

// --- Q7【第7章】用户定义类型守卫：若值为「非空 string」则返回 true ---
function isNonEmptyString(x: unknown): x is string {
  throw new Error("未实现"); // TODO: 用 typeof 和 length 判断
}

// --- Q8【第8章】返回数组最后一个元素的泛型函数（空数组返回 undefined）---
function lastItem<T>(arr: T[]): T | undefined {
  throw new Error("未实现"); // TODO: 活用类型参数 T
}

// --- Q9【第8章】从对象和键中取出值。键用 keyof 约束 ---
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  throw new Error("未实现"); // TODO: 返回 obj[key]
}

// --- Q10【第9章】将字符串数组的出现次数以 Record<string, number> 返回 ---
function countBy(items: string[]): Record<string, number> {
  throw new Error("未实现"); // TODO: 统计并构建 Record
}

// --- Q11【第10章】完成泛型栈 Stack<T> ---
class Stack<T> {
  private items: T[] = [];
  push(item: T): void {
    throw new Error("未实现"); // TODO
  }
  pop(): T | undefined {
    throw new Error("未实现"); // TODO
  }
  size(): number {
    throw new Error("未实现"); // TODO
  }
}

// --- Q12【第11章】实现 delay 和 fetchUserName（模拟异步）---
function delay(ms: number): Promise<void> {
  throw new Error("未实现"); // TODO: 用 Promise 包装 setTimeout
}
async function fetchUserName(id: number): Promise<string> {
  throw new Error("未实现"); // TODO: 等待 50ms 后返回 `user-${id}`
}

// --- Q13【第12章・综合】计数器的 reducer。用可辨识联合 Action 进行分支 ---
//     "inc" 加1 / "dec" 减1 / "set" 设置 payload
type CounterAction =
  | { type: "inc" }
  | { type: "dec" }
  | { type: "set"; payload: number };
function counterReducer(state: number, action: CounterAction): number {
  throw new Error("未实现"); // TODO: 用 switch (action.type) 分支（default 中用 never）
}

// ============================================================
// 🔒 评分区域（此处以下请勿编辑）
// ============================================================

let passed = 0;
let total = 0;

async function check(label: string, fn: () => boolean | Promise<boolean>): Promise<void> {
  total++;
  try {
    const ok = await fn();
    if (ok) {
      passed++;
      console.log(`✅ ${label}`);
    } else {
      console.log(`❌ ${label}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`❌ ${label}  (${msg})`);
  }
}

async function main(): Promise<void> {
  console.log("===== TypeScript 综合能力测试（第1～12章）=====");
  console.log("请填写 src/13_skill_test.ts 中的 TODO（未实现），目标是全部 ✅。\n");

  await check("Q1  square(5) === 25", () => square(5) === 25);
  await check("Q1  square(-3) === 9", () => square(-3) === 9);

  await check('Q2  safeLength("hello") === 5', () => safeLength("hello") === 5);
  await check("Q2  safeLength(123) === -1", () => safeLength(123) === -1);

  await check('Q3  joinWith(["a","b"]) === "a,b"', () => joinWith(["a", "b"]) === "a,b");
  await check('Q3  joinWith(["a","b"], "-") === "a-b"', () => joinWith(["a", "b"], "-") === "a-b");

  await check("Q4  有 email", () => formatUser({ id: 1, name: "Taro", email: "t@x.jp" }) === "Taro <t@x.jp>");
  await check("Q4  无 email", () => formatUser({ id: 2, name: "Hanako" }) === "Hanako");

  await check('Q5  [255,0,128] -> "#ff0080"', () => rgbToHex([255, 0, 128]) === "#ff0080");
  await check('Q5  [0,0,0] -> "#000000"', () => rgbToHex([0, 0, 0]) === "#000000");

  await check("Q6  circle 的面积", () => Math.abs(area({ kind: "circle", radius: 2 }) - Math.PI * 4) < 1e-9);
  await check("Q6  rect 的面积", () => area({ kind: "rect", width: 3, height: 4 }) === 12);

  await check('Q7  isNonEmptyString("a") === true', () => isNonEmptyString("a") === true);
  await check('Q7  isNonEmptyString("") === false', () => isNonEmptyString("") === false);
  await check("Q7  isNonEmptyString(123) === false", () => isNonEmptyString(123) === false);

  await check("Q8  lastItem([1,2,3]) === 3", () => lastItem([1, 2, 3]) === 3);
  await check('Q8  lastItem(["a","b"]) === "b"', () => lastItem(["a", "b"]) === "b");
  await check("Q8  lastItem([]) === undefined", () => lastItem([]) === undefined);

  await check("Q9  pluck(obj, 'id')", () => pluck({ id: 1, name: "Taro" }, "id") === 1);
  await check("Q9  pluck(obj, 'name')", () => pluck({ id: 1, name: "Taro" }, "name") === "Taro");

  await check("Q10 countBy 统计", () => {
    const r = countBy(["a", "b", "a", "a", "b"]);
    return r.a === 3 && r.b === 2;
  });

  await check("Q11 Stack push/pop/size", () => {
    const s = new Stack<number>();
    s.push(1);
    s.push(2);
    return s.size() === 2 && s.pop() === 2 && s.size() === 1;
  });

  await check("Q12 fetchUserName(7) === 'user-7'", async () => (await fetchUserName(7)) === "user-7");

  await check("Q13 inc", () => counterReducer(0, { type: "inc" }) === 1);
  await check("Q13 dec", () => counterReducer(5, { type: "dec" }) === 4);
  await check("Q13 set", () => counterReducer(0, { type: "set", payload: 42 }) === 42);

  console.log("\n" + "=".repeat(44));
  console.log(`结果：${passed} / ${total} 题正确`);
  if (passed === total) {
    console.log("🎉 全部正确！TypeScript 基础已掌握。");
  } else {
    console.log(`还差 ${total - passed} 题。填写 TODO（未实现）后再挑战！`);
    console.log("参考答案 → chapters/13_skill_test.md");
  }
}

await main();
