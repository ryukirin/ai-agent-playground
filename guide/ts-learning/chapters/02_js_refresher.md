# 第02章 JS リフレッシャー

> TypeScript の土台は JavaScript です。「TS に型を足す」前に、よく使う JS 構文を思い出しましょう。

## 🎯 この章のゴール

- `let` / `const` を使い分けられる（`var` は使わない）
- テンプレートリテラル・分割代入・スプレッドを書ける
- 配列メソッド（`map` / `filter` / `reduce` など）を理解できる
- `?.` と `??` を使いこなせる
- Promise / async・await の流れをつかめる

---

## let / const — `var` はもう使わない

JavaScript には変数宣言が3種類ありますが、**`var` は使いません**。

| 宣言 | 再代入 | スコープ |
|------|--------|----------|
| `const` | 不可 | ブロック |
| `let` | 可 | ブロック |
| `var` | 可 | 関数（古い）|

```ts
const PI = 3.14;      // 定数。値が変わらないものはこちら
let count = 0;         // 再代入する変数

count = 10;            // OK
// PI = 3.15;          // エラー：const は再代入不可

// ブロックスコープ：if / for の {} の外には漏れない
if (true) {
  const block = "ブロック内";
  console.log(block); // → ブロック内
}
// console.log(block); // エラー：スコープ外で使えない
```

> `var` はブロックスコープを無視して関数全体に漏れるため、予期しないバグの温床です。TypeScript でも `var` は書けますが、使う理由はありません。

---

## テンプレートリテラル

バッククォート（`` ` ``）で囲み、`${式}` で値を埋め込む記法です。

```ts
const name = "田中";
const age = 30;

// 従来の文字列連結
const old = "こんにちは、" + name + "さん（" + age + "歳）";

// テンプレートリテラル（読みやすい）
const modern = `こんにちは、${name}さん（${age}歳）`;

console.log(modern); // → こんにちは、田中さん（30歳）

// 改行もそのまま書ける
const multiline = `1行目
2行目
3行目`;
console.log(multiline);
```

---

## 関数の書き方3種

### 関数宣言

```ts
function square(n: number): number {
  return n * n;
}
console.log(square(4)); // → 16
```

### 関数式

```ts
const double = function (n: number): number {
  return n * 2;
};
console.log(double(5)); // → 10
```

### アロー関数

```ts
// 引数が1つ・1行なら非常に短く書ける
const triple = (n: number): number => n * 3;
console.log(triple(3)); // → 9

// 複数行の場合
const greet = (name: string): string => {
  const msg = `こんにちは、${name}さん`;
  return msg;
};
console.log(greet("佐藤")); // → こんにちは、佐藤さん
```

### デフォルト引数

```ts
function greetWithTitle(name: string, title: string = "さん"): string {
  return `${name}${title}、こんにちは`;
}
console.log(greetWithTitle("田中"));          // → 田中さん、こんにちは
console.log(greetWithTitle("田中", "先生"));  // → 田中先生、こんにちは
```

### レスト引数とスプレッド

```ts
// レスト引数：可変長引数を配列で受け取る
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}
console.log(sum(1, 2, 3, 4)); // → 10

// スプレッド：配列を展開して渡す
const nums = [1, 2, 3];
console.log(sum(...nums)); // → 6
```

---

## 配列メソッド

配列操作の鉄板メソッドをまとめて確認します。

```ts
const fruits = ["りんご", "バナナ", "みかん", "ぶどう"];
const prices = [100, 200, 150, 300];
```

### `map` — 各要素を変換して新しい配列を返す

```ts
const upper = fruits.map((f) => f.toUpperCase());
console.log(upper); // → ['りんご', 'バナナ', 'みかん', 'ぶどう']

const doubled = prices.map((p) => p * 2);
console.log(doubled); // → [200, 400, 300, 600]
```

### `filter` — 条件に合う要素だけ残す

```ts
const expensive = prices.filter((p) => p >= 200);
console.log(expensive); // → [200, 300]
```

### `reduce` — 全要素を畳み込んで1つの値にする

```ts
const total = prices.reduce((acc, p) => acc + p, 0);
console.log(total); // → 750
```

### `find` — 条件に合う最初の1件を返す（なければ `undefined`）

```ts
const found = prices.find((p) => p > 100);
console.log(found); // → 200
```

### `forEach` — 副作用のためにループ（値を返さない）

```ts
fruits.forEach((f, i) => {
  console.log(`${i}: ${f}`);
});
// → 0: りんご  1: バナナ  2: みかん  3: ぶどう
```

---

## オブジェクト

### プロパティ省略記法

変数名とプロパティ名が同じなら省略できます。

```ts
const name = "田中";
const age = 30;

// 省略なし
const user1 = { name: name, age: age };

// 省略あり（同じ意味）
const user2 = { name, age };
console.log(user2); // → { name: '田中', age: 30 }
```

### 分割代入

```ts
// オブジェクトの分割代入
const { name: userName, age: userAge } = user2;
console.log(userName, userAge); // → 田中 30

// 配列の分割代入
const [first, second, ...rest] = fruits;
console.log(first);  // → りんご
console.log(second); // → バナナ
console.log(rest);   // → ['みかん', 'ぶどう']
```

### スプレッド（オブジェクトのコピー・マージ）

```ts
const base = { x: 1, y: 2 };
const extended = { ...base, z: 3 };
console.log(extended); // → { x: 1, y: 2, z: 3 }

// 同名キーは後勝ち
const overridden = { ...base, x: 99 };
console.log(overridden); // → { x: 99, y: 2 }
```

---

## 三項演算子 / `?.` / `??`

### 三項演算子

```ts
const score = 75;
const result = score >= 60 ? "合格" : "不合格";
console.log(result); // → 合格
```

### `?.`（オプショナルチェイニング）

プロパティやメソッドが存在しない場合に `TypeError` を出さず `undefined` を返す。

```ts
const user = { profile: { nickname: "たなかん" } };
const noProfile: typeof user | undefined = undefined;

console.log(user?.profile?.nickname);      // → たなかん
console.log(noProfile?.profile?.nickname); // → undefined（エラーにならない）
```

### `??`（null 合体演算子）

`null` または `undefined` のときだけ右辺の値を使う。`||` と違い `0` や `""` は除外しない。

```ts
const input = null;
const value = input ?? "デフォルト値";
console.log(value); // → デフォルト値

const zero = 0;
console.log(zero ?? 99);  // → 0（0 は null でも undefined でもないので左辺）
console.log(zero || 99);  // → 99（|| は falsy を対象にする。注意点）
```

---

## ES Modules の import / export（軽く）

```ts
// 別ファイルに関数を書く場合（例）
// utils.ts
export function add(a: number, b: number): number {
  return a + b;
}

// main.ts
import { add } from "./utils.js";
```

詳細は**第12章**で扱います。この章ではパターンを見ておくだけで OK です。

---

## 非同期処理の触り（Promise / async・await）

```ts
// Promise：非同期処理の結果を包むオブジェクト
const promise = new Promise<string>((resolve) => {
  setTimeout(() => resolve("1秒後に完了"), 1000);
});

// async・await：Promise を同期っぽく書く構文糖
async function fetchData(): Promise<string> {
  const result = await promise;
  return result;
}
```

非同期処理の詳細は**第11章**で丁寧に扱います。ここでは「こういう書き方がある」だけ知っておけば十分です。

---

## 「これらは TS の土台。TS はここに型を足すだけ」

ここまで見てきた構文はすべて JavaScript そのものです。TypeScript は以下を追加するだけです。

- 変数・引数・戻り値への型注釈（`: string`、`: number` など）
- 型推論（値から型を自動判定）
- 型エラーの事前検出

次章から「型」の世界に踏み込みます。

---

## ⚠️ よくあるつまずき

### `const` なのにオブジェクトは変更できる

```ts
const obj = { count: 0 };
obj.count = 1; // OK：obj 自体（参照先）は変わっていない
// obj = {};   // エラー：変数への再代入はできない
```

`const` は「変数が指す参照を固定する」だけで、中身の変更は防がない点に注意。

### `||` と `??` の違いを混同する

```ts
const count = 0;
console.log(count || 10); // → 10（0 が falsy なので右辺が使われる）
console.log(count ?? 10); // → 0（0 は null・undefined ではないので左辺）
```

デフォルト値として `0` や `""` を扱うときは `??` を使いましょう。

### アロー関数の `this` は親スコープを引き継ぐ

通常の関数と違い、アロー関数は自分の `this` を持ちません。クラスのメソッドとして使う場合などに影響しますが、第10章（クラス）で詳しく説明します。

### `reduce` の初期値は必ず書く

```ts
// 初期値なしだと配列が空のとき TypeError になる
// const bad = [].reduce((acc, n) => acc + n);  // 危険

const safe = ([] as number[]).reduce((acc, n) => acc + n, 0); // 初期値 0 を渡す
console.log(safe); // → 0
```

---

## ✍️ 練習問題

### 問題 1

`["Alice", "Bob", "Charlie"]` という配列から、名前の長さが5文字以下の要素だけを取り出して大文字にしてください。`filter` と `map` を使いましょう。

<details><summary>解答例</summary>

```ts
const names = ["Alice", "Bob", "Charlie"];
const result = names
  .filter((n) => n.length <= 5)
  .map((n) => n.toUpperCase());
console.log(result); // → ['ALICE', 'BOB']
```

</details>

---

### 問題 2

`const items = [{ name: "A", price: 100 }, { name: "B", price: 200 }, { name: "C", price: 50 }]` の合計金額を `reduce` で求めてください。

<details><summary>解答例</summary>

```ts
const items = [
  { name: "A", price: 100 },
  { name: "B", price: 200 },
  { name: "C", price: 50 },
];
const total = items.reduce((acc, item) => acc + item.price, 0);
console.log(total); // → 350
```

</details>

---

### 問題 3

引数 `user: { name: string; nickname?: string }` を受け取り、`nickname` があれば `"nickname さん"` を、なければ `"name さん"` を返す関数 `displayName` を書いてください。`?.` と `??` を使いましょう。

<details><summary>解答例</summary>

```ts
function displayName(user: { name: string; nickname?: string }): string {
  return `${user.nickname ?? user.name}さん`;
}
console.log(displayName({ name: "田中", nickname: "たなかん" })); // → たなかんさん
console.log(displayName({ name: "佐藤" }));                       // → 佐藤さん
```

</details>

---

### 問題 4

次の `orders` 配列から、`status` が `"shipped"` のものだけ取り出し、各 `total` を10%引きした新しい配列を `map` で作ってください。最後に `reduce` でその合計金額を求めてください。

```ts
const orders = [
  { id: 1, status: "shipped",  total: 1000 },
  { id: 2, status: "pending",  total: 500  },
  { id: 3, status: "shipped",  total: 2000 },
  { id: 4, status: "canceled", total: 800  },
];
```

<details><summary>解答例</summary>

```ts
const orders = [
  { id: 1, status: "shipped",  total: 1000 },
  { id: 2, status: "pending",  total: 500  },
  { id: 3, status: "shipped",  total: 2000 },
  { id: 4, status: "canceled", total: 800  },
];

const discountedTotal = orders
  .filter((o) => o.status === "shipped")
  .map((o) => o.total * 0.9)
  .reduce((acc, t) => acc + t, 0);

console.log(discountedTotal); // → 2700
```

`filter` で shipped だけ残し、`map` で10%引きに変換し、`reduce` で合計する三段チェーンが基本パターン。

</details>

---

### 問題 5

引数 `{ name: string; scores: number[]; bonus?: number }` を受け取り、`scores` の平均に `bonus`（省略時は `0`）を加えた値を返す関数 `calcFinalScore` を書いてください。分割代入とデフォルト値、`??` を使いましょう。

<details><summary>解答例</summary>

```ts
function calcFinalScore({
  scores,
  bonus = 0,
}: {
  name: string;
  scores: number[];
  bonus?: number;
}): number {
  const avg = scores.reduce((acc, s) => acc + s, 0) / scores.length;
  return avg + (bonus ?? 0);
}

console.log(calcFinalScore({ name: "田中", scores: [80, 90, 70] }));          // → 80
console.log(calcFinalScore({ name: "佐藤", scores: [60, 70], bonus: 5 }));    // → 70
```

引数の分割代入でプロパティを直接取り出し、`bonus = 0` のデフォルト値で省略ケースを吸収できる。`bonus` が `undefined` のまま渡される可能性がある場合は `?? 0` でも補完できる。

</details>

---

### 問題 6

次のネストしたオブジェクト `config` から、`theme.colors.primary` の値を **`?.` と `??`** を組み合わせて安全に取り出し、値がなければ `"#000000"` を使うコードを1行で書いてください。

```ts
const config1 = { theme: { colors: { primary: "#ff5733" } } };
const config2 = { theme: { colors: {} } };
const config3 = undefined;
```

<details><summary>解答例</summary>

```ts
const config1 = { theme: { colors: { primary: "#ff5733" } } };
const config2 = { theme: { colors: {} } } as typeof config1 | undefined;
const config3 = undefined as typeof config1 | undefined;

const c1 = config1?.theme?.colors?.primary ?? "#000000";
const c2 = config2?.theme?.colors?.primary ?? "#000000";
const c3 = config3?.theme?.colors?.primary ?? "#000000";

console.log(c1); // → #ff5733
console.log(c2); // → #000000
console.log(c3); // → #000000
```

`?.` でアクセスするたびに `undefined` になった時点で伝播が止まり、最終的に `undefined` になる。`??` でデフォルト値を補完すれば1行で安全に取り出せる。

</details>

---

## 📌 まとめ

- 変数は `const`（変わらない）/ `let`（変わる）で宣言。`var` は使わない
- テンプレートリテラルで文字列埋め込みをスッキリ書ける
- 関数は3種（宣言・関数式・アロー）。アロー関数が主流
- `map` / `filter` / `reduce` / `find` は配列操作の基本
- `?.` で安全アクセス、`??` で null/undefined の補完
- これらはすべて JS の機能。TS はここに型を足すだけ

## ▶ 動かす

```bash
npm run ch02
# または
npx tsx src/02_js_refresher.ts
```
