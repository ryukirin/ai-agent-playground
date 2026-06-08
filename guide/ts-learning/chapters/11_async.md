# 第11章 非同期処理(async / await)

> TypeScript の非同期処理は JavaScript の Promise をベースに、型情報が加わります。「何が返るのか」をコンパイル時に保証できるのが TypeScript の強みです。

## 🎯 この章のゴール

- `Promise<T>` の型が何を意味するか説明できる
- `async` 関数が必ず `Promise` を返すことを理解する
- `await` で型がどう変化するかを把握する
- `try/catch` で `unknown` 型のエラーを安全に扱える
- `Promise.all` のタプル型と、直列 vs 並列の違いを使い分けられる

---

## `Promise<T>` の型

`Promise<T>` の `T` は「非同期処理が**成功したとき**に解決される値の型」です。

```ts
// T = string の Promise: 最終的に string が手に入る
const greeting: Promise<string> = new Promise((resolve) => {
  resolve("こんにちは！");
});

// T = number の Promise
const delay = (ms: number): Promise<number> =>
  new Promise((resolve) => setTimeout(() => resolve(ms), ms));
```

`Promise<void>` は「成功するが値を返さない」処理に使います(例:データ書き込み)。

---

## `async` 関数は必ず `Promise` を返す

`async` キーワードを付けた関数の戻り値は、必ず `Promise` でラップされます。

```ts
// async 関数の戻り値型は自動的に Promise<string> になる
async function fetchMessage(): Promise<string> {
  return "hello"; // 実際には Promise.resolve("hello") として返る
}

// 戻り値型を省略しても推論される
async function add(a: number, b: number) {
  return a + b;
  // 推論: Promise<number>
}
```

`async` 関数内で `throw` すると、返された Promise は reject されます。

---

## `await` と型の変化

`await` は `Promise<T>` から `T` を「取り出す」演算子です。型が剥がれます。

```ts
async function example(): Promise<void> {
  const p: Promise<string> = Promise.resolve("TypeScript!");

  const result: string = await p; // Promise<string> → string
  console.log(result);            // TypeScript!
}
```

`await` は `async` 関数の中か、モジュールのトップレベルで使えます(top-level await)。

---

## 自作の遅延関数で非同期を体感する

ネットワークに繋がらない環境でも確実に動く「遅延してデータを返す関数」を作ります。実際のアプリではこのパターンが `fetch` や DB アクセスの代わりになります。

```ts
// ms ミリ秒後に value を解決する汎用遅延関数
function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

// 使い方
async function main() {
  console.log("処理開始");
  const result = await delay("完了!", 500); // 500ms 後に解決
  console.log(result); // 完了!
}

await main();
```

`delay` はジェネリクス関数なので `delay(42, 100)` なら `Promise<number>` を返します。

---

## エラー処理: `try/catch` と `unknown` 型

TypeScript 4.4 以降、`catch` の変数は `unknown` 型になります。「何が投げられたか分からない」ことを型で表現しています。

```ts
async function riskyOperation(shouldFail: boolean): Promise<string> {
  await delay("", 100); // 少し待つ
  if (shouldFail) {
    throw new Error("操作に失敗しました");
  }
  return "成功!";
}

// NG: e が unknown なので e.message は直接アクセスできない
// async function badHandler() {
//   try { ... } catch (e) {
//     console.log(e.message); // 型エラー: Object is of type 'unknown'
//   }
// }

// OK: instanceof で絞り込んでから使う
async function goodHandler(shouldFail: boolean): Promise<void> {
  try {
    const result = await riskyOperation(shouldFail);
    console.log("結果:", result);
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log("エラー:", e.message); // ここでは string と分かる
    } else {
      console.log("不明なエラー:", String(e));
    }
  }
}
```

`catch (e)` に明示的に `: unknown` を書かなくても `strict` モードでは `unknown` として扱われます。

---

## 直列 `await` と並列 `Promise.all`

### 直列実行(順番に待つ)

```ts
async function sequential(): Promise<void> {
  console.log("直列: 開始");
  const a = await delay("データA", 300);
  const b = await delay("データB", 300);
  // 合計 600ms かかる
  console.log(a, b);
}
```

### 並列実行(`Promise.all`)

```ts
async function parallel(): Promise<void> {
  console.log("並列: 開始");
  const [a, b] = await Promise.all([
    delay("データA", 300),
    delay("データB", 300),
  ]);
  // 約 300ms で完了(同時に走る)
  console.log(a, b);
}
```

### `Promise.all` の型はタプル

`Promise.all` に渡した配列の要素に応じて、戻り値はタプル型として推論されます。

```ts
const results = await Promise.all([
  delay("文字列", 100),    // Promise<string>
  delay(42, 100),          // Promise<number>
  delay(true, 100),        // Promise<boolean>
]);
// results の型: [string, number, boolean]
// ↑ タプル型なので各要素の型が保たれる
```

異なる型を混ぜても正しく推論されるのは、`Promise.all` の型定義がタプルのオーバーロードを持つためです。

---

## `Promise.allSettled` — 失敗してもまとめる

`Promise.all` はひとつでも reject されると全体が reject されます。「失敗も含めて全結果が欲しい」場合は `Promise.allSettled` を使います。

```ts
const results2 = await Promise.allSettled([
  delay("OK", 100),
  Promise.reject(new Error("失敗!")),
]);

for (const r of results2) {
  if (r.status === "fulfilled") {
    console.log("成功:", r.value);
  } else {
    console.log("失敗:", r.reason);
  }
}
```

各結果の型は `PromiseSettledResult<T>` で、`{ status: "fulfilled", value: T }` または `{ status: "rejected", reason: unknown }` のユニオン型になります。

---

## `fetch` の型付け(説明例)

Node.js 18+ / ブラウザではグローバル `fetch` が使えます。`Response.json()` の戻り値は `Promise<unknown>` なので、型アサーションか型付き変換が必要です。

```ts
// 型だけの説明例(実際のネットワーク通信は行わない)
interface Post {
  id: number;
  title: string;
  body: string;
}

// fetch を使う場合のパターン(実行は任意)
async function fetchPost(id: number): Promise<Post> {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status}`);
  }
  // res.json() は Promise<unknown> を返す → 型アサーションで Post に変換
  const data = (await res.json()) as Post;
  return data;
}

// ↑ 実際に呼ぶとネットワークアクセスが発生するため、
//   ここでは呼び出しをコメントアウトしています。
// const post = await fetchPost(1);
```

本番コードでは `unknown` から `Post` へのアサーションより、Zod などのバリデーションライブラリを使うとより安全です。

---

## ⚠️ よくあるつまずき

1. **`await` を忘れて Promise のまま使う**: `const data = fetchData()` は `Promise<Data>` のままです。`data.id` にアクセスしようとすると型エラーになります。型エラーが教えてくれる恩恵です。

2. **`catch (e)` の `e` を `any` 扱いしてしまう**: TypeScript 4.4 以前の慣習で `e.message` とそのまま書くコードを見かけますが、strict モードでは `e instanceof Error` で絞り込んでから使いましょう。

3. **直列にすべき処理を並列にしてしまう**: 「B は A の結果に依存する」場合は直列に書く必要があります。`Promise.all` は **互いに独立した処理** をまとめるときに使います。

4. **`async` 関数内の `return` 値を `Promise.resolve()` で包まない**: 不要です。`async` が自動的に `Promise` にします。二重に包むと `Promise<Promise<T>>` になりません(TypeScript が自動でフラットにしますが)。

---

## ✍️ 練習問題

### 問題1

`delay<T>` を使って「3つのデータ取得を並列実行し、結果を合計する」関数 `sumParallel` を書いてください。引数は `[number, number, number]`(ms の遅延)、戻り値は数値の合計。

<details><summary>解答例</summary>

```ts
async function sumParallel(delays: [number, number, number]): Promise<number> {
  const [a, b, c] = await Promise.all([
    delay(delays[0], delays[0]),  // 遅延ms の値を遅延ms 後に返す
    delay(delays[1], delays[1]),
    delay(delays[2], delays[2]),
  ]);
  return a + b + c;
}

const total = await sumParallel([100, 200, 300]);
console.log("合計:", total); // 600
```

</details>

### 問題2

`fetchWithRetry` 関数を実装してください。処理が失敗したとき、最大 `maxRetry` 回リトライします。`delay` を使って模擬的に「一定確率で失敗する処理」を作り、リトライ動作を確認してください。

<details><summary>解答例</summary>

```ts
async function unreliableTask(): Promise<string> {
  await delay("", 100);
  if (Math.random() < 0.7) throw new Error("一時的なエラー");
  return "成功!";
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
      console.log(`リトライ ${i + 1}/${maxRetry}`);
    }
  }
  throw new Error("到達不能");
}

try {
  const result = await fetchWithRetry(unreliableTask, 5);
  console.log("最終結果:", result);
} catch (e) {
  if (e instanceof Error) console.log("最終失敗:", e.message);
}
```

</details>

### 問題3

`sleep` 関数(ms ミリ秒待って resolve する `Promise<void>` を返す)を実装してください。次に `sleep` を使い、3つのメッセージを 200ms ずつ間を空けて順番にコンソールへ出力する `printSequentially` 関数を書いてください。

<details><summary>解答例</summary>

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

await printSequentially(["1番目", "2番目", "3番目"]);
// (200ms 後) 1番目
// (200ms 後) 2番目
// (200ms 後) 3番目
```

`setTimeout` に `resolve` を直接渡すことで `Promise<void>` を作れる。`for...of` + `await` で直列の順次実行を実現している。

</details>

---

### 問題4

`Promise.allSettled` を使って、複数の処理のうち一部が失敗しても全件の結果をまとめて報告する `runAll` 関数を実装してください。
- 引数: `tasks: Array<() => Promise<string>>`
- 戻り値: `Promise<void>`
- 成功した処理は `"成功: {値}"` 、失敗した処理は `"失敗: {エラーメッセージ}"` とコンソールへ出力する

```ts
// 呼び出し例
const tasks = [
  () => delay("結果A", 100),
  () => Promise.reject(new Error("処理Bが失敗")),
  () => delay("結果C", 100),
];
await runAll(tasks);
// 成功: 結果A
// 失敗: 処理Bが失敗
// 成功: 結果C
```

<details><summary>解答例</summary>

```ts
async function runAll(tasks: Array<() => Promise<string>>): Promise<void> {
  const results = await Promise.allSettled(tasks.map((t) => t()));
  for (const result of results) {
    if (result.status === "fulfilled") {
      console.log(`成功: ${result.value}`);
    } else {
      const msg = result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);
      console.log(`失敗: ${msg}`);
    }
  }
}

const tasks = [
  () => delay("結果A", 100),
  () => Promise.reject(new Error("処理Bが失敗")),
  () => delay("結果C", 100),
];
await runAll(tasks);
```

`Promise.allSettled` は全件が落ち着くまで待ち、`status` で成否を判別できる。`reason` は `unknown` なので `instanceof Error` で絞り込んでからメッセージを取り出す。

</details>

---

## 📌 まとめ

- `Promise<T>` の `T` は成功時の値の型
- `async` 関数の戻り値は自動的に `Promise` でラップされる
- `await` は `Promise<T>` → `T` に型を変換する
- `catch (e)` の `e` は `unknown`。`instanceof Error` で絞り込んでから使う
- `Promise.all` は並列実行でタプル型を返す。独立した処理に使う
- `Promise.allSettled` は失敗を含む全結果をまとめて受け取れる

## ▶ 動かす

```sh
npm run ch11
# または
npx tsx src/11_async.ts
```
