// ============================================================
// 第11章 非同期処理(async / await)
// npx tsx src/11_async.ts で実行
// top-level await が使えます(tsconfig: module=ESNext)
// ============================================================

// ─────────────────────────────────────────
// 1. 汎用遅延関数(ネットワーク不要で非同期を体感)
// ─────────────────────────────────────────

// T 型の value を ms ミリ秒後に解決する Promise を返す
function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

// ─────────────────────────────────────────
// 2. Promise<T> の型 — T が何かを確認する
// ─────────────────────────────────────────

console.log("=== Promise<T> の型 ===");

// Promise<string>: 最終的に string が手に入る
const greetingPromise: Promise<string> = delay("こんにちは!", 50);

// await で Promise<string> → string に型が変わる
const greetingValue: string = await greetingPromise;
console.log("greeting:", greetingValue); // こんにちは!

// Promise<number>
const numPromise: Promise<number> = delay(42, 50);
const numValue: number = await numPromise;
console.log("number:", numValue); // 42

// ─────────────────────────────────────────
// 3. async 関数 — 必ず Promise を返す
// ─────────────────────────────────────────

console.log("\n=== async 関数 ===");

// 戻り値型を明示した場合
async function fetchMessage(): Promise<string> {
  await delay("", 50); // 少し待つ(模擬非同期)
  return "メッセージ取得完了";
  // ↑ 実際には Promise.resolve(...) として返る
}

// 戻り値型を省略しても推論される(推論: Promise<number>)
async function add(a: number, b: number) {
  return a + b;
}

const msg = await fetchMessage();
console.log(msg); // メッセージ取得完了

const sum = await add(3, 4);
console.log("3 + 4 =", sum); // 7

// async 関数は常に Promise を返すことを確認
const resultPromise: Promise<string> = fetchMessage(); // await しない → Promise のまま
console.log("Promise か?", resultPromise instanceof Promise); // true
await resultPromise; // 後始末

// ─────────────────────────────────────────
// 4. エラー処理: try/catch と unknown 型
// ─────────────────────────────────────────

console.log("\n=== エラー処理 ===");

async function riskyOperation(shouldFail: boolean): Promise<string> {
  await delay("", 50);
  if (shouldFail) {
    throw new Error("操作に失敗しました");
  }
  return "操作成功!";
}

// catch の e は unknown 型 → instanceof で絞り込みが必要
async function handleOperation(shouldFail: boolean): Promise<void> {
  try {
    const result = await riskyOperation(shouldFail);
    console.log("結果:", result);
  } catch (e: unknown) {
    // e.message → 型エラー(unknown では直接アクセスできない)
    if (e instanceof Error) {
      console.log("Error:", e.message); // 絞り込み後は string
    } else {
      console.log("不明なエラー:", String(e));
    }
  }
}

await handleOperation(false); // 結果: 操作成功!
await handleOperation(true);  // Error: 操作に失敗しました

// unknown 型のままアクセスしようとするとコンパイルエラー
async function badHandler(): Promise<void> {
  try {
    await riskyOperation(true);
  } catch (e: unknown) {
    // @ts-expect-error  unknown 型には直接プロパティアクセスできない
    console.log(e.message);
  }
}

// ─────────────────────────────────────────
// 5. 直列 await vs 並列 Promise.all
// ─────────────────────────────────────────

console.log("\n=== 直列 vs 並列 ===");

// 直列: 前の処理が終わってから次が始まる(合計 ~300ms)
async function sequential(): Promise<void> {
  const start = Date.now();
  const a = await delay("データA", 100);
  const b = await delay("データB", 100);
  const c = await delay("データC", 100);
  const elapsed = Date.now() - start;
  console.log(`直列: ${a}, ${b}, ${c} (${elapsed}ms程度)`);
}

// 並列: 全てを同時に開始する(合計 ~100ms)
async function parallel(): Promise<void> {
  const start = Date.now();
  const [a, b, c] = await Promise.all([
    delay("データA", 100),
    delay("データB", 100),
    delay("データC", 100),
  ]);
  const elapsed = Date.now() - start;
  console.log(`並列: ${a}, ${b}, ${c} (${elapsed}ms程度)`);
}

await sequential();
await parallel();

// ─────────────────────────────────────────
// 6. Promise.all の型はタプル
// ─────────────────────────────────────────

console.log("\n=== Promise.all の型(タプル) ===");

// 異なる型を混ぜても正しく推論される
const tupleResults = await Promise.all([
  delay("文字列", 50),    // Promise<string>
  delay(42, 50),          // Promise<number>
  delay(true, 50),        // Promise<boolean>
]);
// tupleResults の型: [string, number, boolean]

const [strVal, numVal, boolVal] = tupleResults;
console.log(`string: ${strVal}, number: ${numVal}, boolean: ${boolVal}`);
// → string: 文字列, number: 42, boolean: true

// 型確認: それぞれ元の型が保たれている
const checkStr: string = strVal;
const checkNum: number = numVal;
const checkBool: boolean = boolVal;
console.log("型チェック OK:", checkStr, checkNum, checkBool);

// ─────────────────────────────────────────
// 7. Promise.allSettled — 失敗を含めて全結果を取得
// ─────────────────────────────────────────

console.log("\n=== Promise.allSettled ===");

async function mayFail(id: number, fail: boolean): Promise<string> {
  await delay("", 50);
  if (fail) throw new Error(`タスク${id} 失敗`);
  return `タスク${id} 成功`;
}

const settledResults = await Promise.allSettled([
  mayFail(1, false),
  mayFail(2, true),
  mayFail(3, false),
]);

// allSettled は reject されても全結果が返る
for (const r of settledResults) {
  if (r.status === "fulfilled") {
    console.log("fulfilled:", r.value);
  } else {
    // r.reason は unknown
    const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
    console.log("rejected:", msg);
  }
}

// ─────────────────────────────────────────
// 8. fetch の型付け(説明専用コード。実際のネットワーク通信は行わない)
// ─────────────────────────────────────────

// fetch レスポンスに型を付けるパターンの説明
interface Post {
  id: number;
  title: string;
  body: string;
}

// パターン1: 型アサーション(手軽だが unsafe)
async function fetchPost(id: number): Promise<Post> {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Post; // unknown → Post へアサーション
}

// ↑ 実際に呼ぶとネットワークアクセスが発生するため try/catch で囲む
// 環境によってはネットワーク不達でもコードの型は確認できます
console.log("\n=== fetch の型付け(説明例) ===");
console.log("fetchPost 関数の型:", fetchPost.toString().slice(0, 50) + "...");
console.log("戻り値型: Promise<Post> (Post = { id: number, title: string, body: string })");

// ─────────────────────────────────────────
// 9. 練習問題の解答例
// ─────────────────────────────────────────

console.log("\n=== 練習問題1: 並列合計 ===");

async function sumParallel(delays: [number, number, number]): Promise<number> {
  const [a, b, c] = await Promise.all([
    delay(delays[0], delays[0]),
    delay(delays[1], delays[1]),
    delay(delays[2], delays[2]),
  ]);
  return a + b + c;
}

const total = await sumParallel([100, 200, 300]);
console.log("合計:", total); // 600

console.log("\n=== 練習問題2: リトライ処理 ===");

// 70% の確率で失敗する模擬タスク(再現性のためシードを疑似管理)
let attempt = 0;
async function unreliableTask(): Promise<string> {
  await delay("", 30);
  attempt++;
  if (attempt < 3) throw new Error(`試行 ${attempt} 回目 失敗`);
  return `試行 ${attempt} 回目 成功!`;
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
      console.log(`  リトライ ${i + 1}/${maxRetry}: ${msg}`);
    }
  }
  throw new Error("到達不能"); // TypeScript の型フロー上必要
}

try {
  const finalResult = await fetchWithRetry(unreliableTask, 5);
  console.log("最終結果:", finalResult);
} catch (e) {
  if (e instanceof Error) console.log("最終失敗:", e.message);
}
