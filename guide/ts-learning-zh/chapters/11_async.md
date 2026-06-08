# 第11章 异步处理 (async / await)

> TypeScript 的异步处理以 JavaScript 的 Promise 为基础，并加入了类型信息。能够在编译时保证「返回什么」，这正是 TypeScript 的优势所在。

## 🎯 本章目标

- 能够说明 `Promise<T>` 的类型含义
- 理解 `async` 函数必定返回 `Promise`
- 掌握 `await` 如何改变类型
- 能够用 `try/catch` 安全处理 `unknown` 类型的错误
- 能够区分 `Promise.all` 的元组类型，以及串行 vs 并行的使用场景

---

## `Promise<T>` 的类型

`Promise<T>` 中的 `T` 是「异步处理**成功时**解析的值的类型」。

```ts
// T = string 的 Promise：最终会得到 string
const greeting: Promise<string> = new Promise((resolve) => {
  resolve("你好！");
});

// T = number 的 Promise
const delay = (ms: number): Promise<number> =>
  new Promise((resolve) => setTimeout(() => resolve(ms), ms));
```

`Promise<void>` 用于「成功但不返回值」的处理（例如：数据写入）。

---

## `async` 函数必定返回 `Promise`

加了 `async` 关键字的函数，其返回值必定被 `Promise` 包裹。

```ts
// async 函数的返回值类型自动变为 Promise<string>
async function fetchMessage(): Promise<string> {
  return "hello"; // 实际上以 Promise.resolve("hello") 返回
}

// 省略返回值类型也会被推断
async function add(a: number, b: number) {
  return a + b;
  // 推断为：Promise<number>
}
```

在 `async` 函数内 `throw` 时，返回的 Promise 会被 reject。

---

## `await` 与类型变化

`await` 是从 `Promise<T>` 中「取出」`T` 的运算符。类型被剥离。

```ts
async function example(): Promise<void> {
  const p: Promise<string> = Promise.resolve("TypeScript!");

  const result: string = await p; // Promise<string> → string
  console.log(result);            // TypeScript!
}
```

`await` 可以在 `async` 函数内部或模块的顶层使用（top-level await）。

---

## 用自定义延迟函数体验异步

创建一个即使没有网络连接也能稳定运行的「延迟后返回数据的函数」。在实际应用中，这个模式可以替代 `fetch` 或数据库访问。

```ts
// ms 毫秒后解析 value 的通用延迟函数
function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

// 使用方法
async function main() {
  console.log("处理开始");
  const result = await delay("完成！", 500); // 500ms 后解析
  console.log(result); // 完成！
}

await main();
```

`delay` 是泛型函数，所以 `delay(42, 100)` 会返回 `Promise<number>`。

---

## 错误处理：`try/catch` 与 `unknown` 类型

TypeScript 4.4 之后，`catch` 的变量类型变为 `unknown`。用类型表达「不知道抛出了什么」。

```ts
async function riskyOperation(shouldFail: boolean): Promise<string> {
  await delay("", 100); // 稍等一下
  if (shouldFail) {
    throw new Error("操作失败");
  }
  return "成功！";
}

// 不推荐：e 是 unknown，不能直接访问 e.message
// async function badHandler() {
//   try { ... } catch (e) {
//     console.log(e.message); // 类型错误：Object is of type 'unknown'
//   }
// }

// 推荐：用 instanceof 收窄后再使用
async function goodHandler(shouldFail: boolean): Promise<void> {
  try {
    const result = await riskyOperation(shouldFail);
    console.log("结果：", result);
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log("错误：", e.message); // 此处已确定为 string
    } else {
      console.log("未知错误：", String(e));
    }
  }
}
```

即使 `catch (e)` 不显式写 `: unknown`，在 `strict` 模式下也会被视为 `unknown`。

---

## 串行 `await` 与并行 `Promise.all`

### 串行执行（按顺序等待）

```ts
async function sequential(): Promise<void> {
  console.log("串行：开始");
  const a = await delay("数据A", 300);
  const b = await delay("数据B", 300);
  // 合计耗时 600ms
  console.log(a, b);
}
```

### 并行执行（`Promise.all`）

```ts
async function parallel(): Promise<void> {
  console.log("并行：开始");
  const [a, b] = await Promise.all([
    delay("数据A", 300),
    delay("数据B", 300),
  ]);
  // 约 300ms 完成（同时运行）
  console.log(a, b);
}
```

### `Promise.all` 的类型是元组

`Promise.all` 根据传入数组的元素，将返回值推断为元组类型。

```ts
const results = await Promise.all([
  delay("字符串", 100),    // Promise<string>
  delay(42, 100),          // Promise<number>
  delay(true, 100),        // Promise<boolean>
]);
// results 的类型：[string, number, boolean]
// ↑ 元组类型，保留各元素的类型
```

混合不同类型也能正确推断，这是因为 `Promise.all` 的类型定义具有元组重载。

---

## `Promise.allSettled` — 汇总包括失败在内的所有结果

`Promise.all` 中只要有一个 reject 就整体 reject。「想要包括失败在内的所有结果」时使用 `Promise.allSettled`。

```ts
const results2 = await Promise.allSettled([
  delay("OK", 100),
  Promise.reject(new Error("失败！")),
]);

for (const r of results2) {
  if (r.status === "fulfilled") {
    console.log("成功：", r.value);
  } else {
    console.log("失败：", r.reason);
  }
}
```

各结果的类型为 `PromiseSettledResult<T>`，是 `{ status: "fulfilled", value: T }` 或 `{ status: "rejected", reason: unknown }` 的联合类型。

---

## `fetch` 的类型标注（说明示例）

在 Node.js 18+ / 浏览器中可以使用全局 `fetch`。`Response.json()` 的返回值是 `Promise<unknown>`，因此需要类型断言或带类型的转换。

```ts
// 仅说明类型（不进行实际网络通信）
interface Post {
  id: number;
  title: string;
  body: string;
}

// 使用 fetch 的模式（是否实际执行由用户决定）
async function fetchPost(id: number): Promise<Post> {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status}`);
  }
  // res.json() 返回 Promise<unknown> → 通过类型断言转换为 Post
  const data = (await res.json()) as Post;
  return data;
}

// ↑ 实际调用时会发生网络请求，
//   因此此处将调用注释掉。
// const post = await fetchPost(1);
```

在生产代码中，比起从 `unknown` 断言为 `Post`，使用 Zod 等验证库更为安全。

---

## ⚠️ 常见陷阱

1. **忘记 `await` 直接使用 Promise**：`const data = fetchData()` 仍然是 `Promise<Data>`。尝试访问 `data.id` 会产生类型错误。这正是类型错误给我们的恩惠。

2. **把 `catch (e)` 的 `e` 当 `any` 处理**：这是 TypeScript 4.4 之前的习惯，直接写 `e.message` 的代码时有可见，但在 strict 模式下请先用 `e instanceof Error` 收窄后再使用。

3. **将应该串行的处理变成并行**：「B 依赖 A 的结果」时必须串行编写。`Promise.all` 用于**相互独立的处理**。

4. **在 `async` 函数内用 `Promise.resolve()` 包裹 `return` 值**：没有必要。`async` 会自动包裹为 `Promise`。重复包裹不会变成 `Promise<Promise<T>>`（TypeScript 会自动展平）。

---

## ✍️ 练习题

### 题目1

使用 `delay<T>` 编写「并行执行3个数据获取并将结果求和」的函数 `sumParallel`。参数为 `[number, number, number]`（毫秒延迟），返回值为数值之和。

<details><summary>参考答案</summary>

```ts
async function sumParallel(delays: [number, number, number]): Promise<number> {
  const [a, b, c] = await Promise.all([
    delay(delays[0], delays[0]),  // 延迟 ms 后返回延迟 ms 的值
    delay(delays[1], delays[1]),
    delay(delays[2], delays[2]),
  ]);
  return a + b + c;
}

const total = await sumParallel([100, 200, 300]);
console.log("合计：", total); // 600
```

</details>

### 题目2

实现 `fetchWithRetry` 函数。处理失败时，最多重试 `maxRetry` 次。使用 `delay` 创建模拟「一定概率失败的处理」，并确认重试行为。

<details><summary>参考答案</summary>

```ts
async function unreliableTask(): Promise<string> {
  await delay("", 100);
  if (Math.random() < 0.7) throw new Error("临时错误");
  return "成功！";
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
      console.log(`重试 ${i + 1}/${maxRetry}`);
    }
  }
  throw new Error("不可到达");
}

try {
  const result = await fetchWithRetry(unreliableTask, 5);
  console.log("最终结果：", result);
} catch (e) {
  if (e instanceof Error) console.log("最终失败：", e.message);
}
```

</details>

### 题目3

实现 `sleep` 函数（返回等待 ms 毫秒后 resolve 的 `Promise<void>`）。然后使用 `sleep`，编写 `printSequentially` 函数，每隔 200ms 依次将3条消息输出到控制台。

<details><summary>参考答案</summary>

```ts
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function printSequentially(messages: string[]): Promise<void> {
  for (const msg of messages) {
    await sleep(200);
    console.log(msg);
  }
}

await printSequentially(["第1条", "第2条", "第3条"]);
// （200ms 后）第1条
// （200ms 后）第2条
// （200ms 后）第3条
```

可以通过将 `resolve` 直接传递给 `setTimeout` 来创建 `Promise<void>`。使用 `for...of` + `await` 实现串行的顺序执行。

</details>

---

### 题目4

使用 `Promise.allSettled` 实现 `runAll` 函数，即使部分处理失败，也能汇总报告所有结果。
- 参数：`tasks: Array<() => Promise<string>>`
- 返回值：`Promise<void>`
- 成功的处理输出 `"成功：{值}"`，失败的处理输出 `"失败：{错误消息}"` 到控制台

```ts
// 调用示例
const tasks = [
  () => delay("结果A", 100),
  () => Promise.reject(new Error("处理B失败")),
  () => delay("结果C", 100),
];
await runAll(tasks);
// 成功：结果A
// 失败：处理B失败
// 成功：结果C
```

<details><summary>参考答案</summary>

```ts
async function runAll(tasks: Array<() => Promise<string>>): Promise<void> {
  const results = await Promise.allSettled(tasks.map((t) => t()));
  for (const result of results) {
    if (result.status === "fulfilled") {
      console.log(`成功：${result.value}`);
    } else {
      const msg = result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);
      console.log(`失败：${msg}`);
    }
  }
}

const tasks = [
  () => delay("结果A", 100),
  () => Promise.reject(new Error("处理B失败")),
  () => delay("结果C", 100),
];
await runAll(tasks);
```

`Promise.allSettled` 等待所有结果完成，通过 `status` 判断成功与否。`reason` 是 `unknown`，需用 `instanceof Error` 收窄后再取出消息。

</details>

---

## 📌 总结

- `Promise<T>` 中的 `T` 是成功时的值的类型
- `async` 函数的返回值自动被 `Promise` 包裹
- `await` 将 `Promise<T>` 转换为 `T` 类型
- `catch (e)` 的 `e` 是 `unknown`。请用 `instanceof Error` 收窄后再使用
- `Promise.all` 并行执行并返回元组类型。用于相互独立的处理
- `Promise.allSettled` 可以汇总接收包括失败在内的所有结果

## ▶ 运行

```sh
npm run ch11
# 或者
npx tsx src/11_async.ts
```
