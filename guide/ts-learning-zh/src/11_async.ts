// ============================================================
// 第11章 异步处理 (async / await)
// npx tsx src/11_async.ts 运行
// 支持 top-level await（tsconfig: module=ESNext）
// ============================================================

// ─────────────────────────────────────────
// 1. 通用延迟函数（无需网络即可体验异步）
// ─────────────────────────────────────────

// 返回一个在 ms 毫秒后解析 T 类型 value 的 Promise
function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

// ─────────────────────────────────────────
// 2. Promise<T> 的类型 — 确认 T 是什么
// ─────────────────────────────────────────

console.log("=== Promise<T> 的类型 ===");

// Promise<string>：最终会得到 string
const greetingPromise: Promise<string> = delay("你好！", 50);

// 通过 await 将 Promise<string> 转换为 string
const greetingValue: string = await greetingPromise;
console.log("greeting：", greetingValue); // 你好！

// Promise<number>
const numPromise: Promise<number> = delay(42, 50);
const numValue: number = await numPromise;
console.log("number：", numValue); // 42

// ─────────────────────────────────────────
// 3. async 函数 — 必定返回 Promise
// ─────────────────────────────────────────

console.log("\n=== async 函数 ===");

// 显式指定返回值类型
async function fetchMessage(): Promise<string> {
  await delay("", 50); // 稍等一下（模拟异步）
  return "消息获取完成";
  // ↑ 实际上以 Promise.resolve(...) 返回
}

// 省略返回值类型也会被推断（推断为：Promise<number>）
async function add(a: number, b: number) {
  return a + b;
}

const msg = await fetchMessage();
console.log(msg); // 消息获取完成

const sum = await add(3, 4);
console.log("3 + 4 =", sum); // 7

// 确认 async 函数始终返回 Promise
const resultPromise: Promise<string> = fetchMessage(); // 不 await → 仍为 Promise
console.log("是 Promise 吗？", resultPromise instanceof Promise); // true
await resultPromise; // 清理

// ─────────────────────────────────────────
// 4. 错误处理：try/catch 与 unknown 类型
// ─────────────────────────────────────────

console.log("\n=== 错误处理 ===");

async function riskyOperation(shouldFail: boolean): Promise<string> {
  await delay("", 50);
  if (shouldFail) {
    throw new Error("操作失败");
  }
  return "操作成功！";
}

// catch 的 e 是 unknown 类型 → 需要用 instanceof 收窄
async function handleOperation(shouldFail: boolean): Promise<void> {
  try {
    const result = await riskyOperation(shouldFail);
    console.log("结果：", result);
  } catch (e: unknown) {
    // e.message → 类型错误（unknown 无法直接访问）
    if (e instanceof Error) {
      console.log("Error：", e.message); // 收窄后为 string
    } else {
      console.log("未知错误：", String(e));
    }
  }
}

await handleOperation(false); // 结果：操作成功！
await handleOperation(true);  // Error：操作失败

// 尝试直接访问 unknown 类型时会产生编译错误
async function badHandler(): Promise<void> {
  try {
    await riskyOperation(true);
  } catch (e: unknown) {
    // @ts-expect-error  unknown 类型不能直接访问属性
    console.log(e.message);
  }
}

// ─────────────────────────────────────────
// 5. 串行 await vs 并行 Promise.all
// ─────────────────────────────────────────

console.log("\n=== 串行 vs 并行 ===");

// 串行：前一个处理完成后才开始下一个（合计约 300ms）
async function sequential(): Promise<void> {
  const start = Date.now();
  const a = await delay("数据A", 100);
  const b = await delay("数据B", 100);
  const c = await delay("数据C", 100);
  const elapsed = Date.now() - start;
  console.log(`串行：${a}, ${b}, ${c}（约${elapsed}ms）`);
}

// 并行：全部同时开始（合计约 100ms）
async function parallel(): Promise<void> {
  const start = Date.now();
  const [a, b, c] = await Promise.all([
    delay("数据A", 100),
    delay("数据B", 100),
    delay("数据C", 100),
  ]);
  const elapsed = Date.now() - start;
  console.log(`并行：${a}, ${b}, ${c}（约${elapsed}ms）`);
}

await sequential();
await parallel();

// ─────────────────────────────────────────
// 6. Promise.all 的类型是元组
// ─────────────────────────────────────────

console.log("\n=== Promise.all 的类型（元组）===");

// 混合不同类型也能正确推断
const tupleResults = await Promise.all([
  delay("字符串", 50),    // Promise<string>
  delay(42, 50),          // Promise<number>
  delay(true, 50),        // Promise<boolean>
]);
// tupleResults 的类型：[string, number, boolean]

const [strVal, numVal, boolVal] = tupleResults;
console.log(`string：${strVal}, number：${numVal}, boolean：${boolVal}`);
// → string：字符串, number：42, boolean：true

// 类型确认：各元素保留原来的类型
const checkStr: string = strVal;
const checkNum: number = numVal;
const checkBool: boolean = boolVal;
console.log("类型检查 OK：", checkStr, checkNum, checkBool);

// ─────────────────────────────────────────
// 7. Promise.allSettled — 获取包括失败在内的所有结果
// ─────────────────────────────────────────

console.log("\n=== Promise.allSettled ===");

async function mayFail(id: number, fail: boolean): Promise<string> {
  await delay("", 50);
  if (fail) throw new Error(`任务${id} 失败`);
  return `任务${id} 成功`;
}

const settledResults = await Promise.allSettled([
  mayFail(1, false),
  mayFail(2, true),
  mayFail(3, false),
]);

// allSettled 即使有 reject 也会返回所有结果
for (const r of settledResults) {
  if (r.status === "fulfilled") {
    console.log("fulfilled：", r.value);
  } else {
    // r.reason 是 unknown
    const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
    console.log("rejected：", msg);
  }
}

// ─────────────────────────────────────────
// 8. fetch 的类型标注（仅说明用代码，不进行实际网络通信）
// ─────────────────────────────────────────

// 说明为 fetch 响应加类型的模式
interface Post {
  id: number;
  title: string;
  body: string;
}

// 模式1：类型断言（简便但不安全）
async function fetchPost(id: number): Promise<Post> {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Post; // unknown → Post 断言
}

// ↑ 实际调用时会发生网络请求，用 try/catch 包裹
// 即使网络不通，也可以通过代码确认类型
console.log("\n=== fetch 的类型标注（说明示例）===");
console.log("fetchPost 函数类型：", fetchPost.toString().slice(0, 50) + "...");
console.log("返回值类型：Promise<Post>（Post = { id: number, title: string, body: string }）");

// ─────────────────────────────────────────
// 9. 练习题参考答案
// ─────────────────────────────────────────

console.log("\n=== 练习题1：并行求和 ===");

async function sumParallel(delays: [number, number, number]): Promise<number> {
  const [a, b, c] = await Promise.all([
    delay(delays[0], delays[0]),
    delay(delays[1], delays[1]),
    delay(delays[2], delays[2]),
  ]);
  return a + b + c;
}

const total = await sumParallel([100, 200, 300]);
console.log("合计：", total); // 600

console.log("\n=== 练习题2：重试处理 ===");

// 70% 概率失败的模拟任务（用伪随机管理可复现性）
let attempt = 0;
async function unreliableTask(): Promise<string> {
  await delay("", 30);
  attempt++;
  if (attempt < 3) throw new Error(`第 ${attempt} 次尝试 失败`);
  return `第 ${attempt} 次尝试 成功！`;
}

async function fetchWithRetry(
  task: () => Promise<string>,
  maxRetry: number,
): Promise<string> {
  for (let i = 0; i <= maxRetry; i++) {
    try {
      return await task();
    } catch (e) {
      if (i === maxRetry) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  重试 ${i + 1}/${maxRetry}：${msg}`);
    }
  }
  throw new Error("不可到达"); // TypeScript 类型流所需
}

try {
  const finalResult = await fetchWithRetry(unreliableTask, 5);
  console.log("最终结果：", finalResult);
} catch (e) {
  if (e instanceof Error) console.log("最终失败：", e.message);
}
