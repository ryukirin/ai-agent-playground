# 第06章 配列・タプル・enum

> 配列の型表現から、長さと順序が決まったタプル、定数集合を表す enum まで。`as const` を使ったモダンな代替パターンも押さえる。

## 🎯 この章のゴール

- 配列型 `number[]` / `Array<number>` を使い分けられる
- `readonly` 配列・多次元配列を扱える
- タプルで「何番目に何の型が入るか」を表現できる
- enum の基本と落とし穴を知っている
- `as const` + リテラルユニオンで enum を代替できる

---

## 配列型 `number[]` と `Array<number>`

2つの書き方がありますが意味は同じです。

```ts
const nums1: number[] = [1, 2, 3];
const nums2: Array<number> = [4, 5, 6];

console.log(nums1); // [1, 2, 3]
console.log(nums2); // [4, 5, 6]
```

一般的に `number[]` の方が短くて読みやすいため、こちらが好まれます。`Array<T>` はジェネリクス(第8章)の構文で、型が複雑なときに使われることがあります。

---

## 多次元配列 `number[][]`

配列の配列は `T[][]` で表します。

```ts
// 2次元配列(行列・盤面など)
const matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

console.log(matrix[1][2]); // 6 (2行目の3列目)

// 文字列の2次元配列
const grid: string[][] = [
  ["○", "×", "○"],
  ["×", "○", "×"],
];
console.log(grid[0][1]); // ×
```

---

## `readonly` 配列 — 変更不可の配列

配列の中身を変更させたくない場合は `readonly` を付けます。

```ts
const frozen: readonly number[] = [1, 2, 3];

console.log(frozen[0]); // 1

// @ts-expect-error readonly 配列には push などの破壊的メソッドは使えない
frozen.push(4);

// @ts-expect-error readonly 配列の要素への再代入もできない
frozen[0] = 99;
```

`ReadonlyArray<T>` と書いても同じです。関数の引数に渡す配列を意図せず変更させないために使います。

---

## タプル `[string, number]`

タプルは**長さと各位置の型が固定された配列**です。

```ts
// 「名前と点数」のペアを表すタプル
const entry: [string, number] = ["田中", 85];

console.log(entry[0]); // 田中
console.log(entry[1]); // 85

// 分割代入でもOK
const [name, score] = entry;
console.log(`${name}: ${score}点`); // 田中: 85点
```

普通の配列と違い、インデックスごとに型が異なります。

### 名前付きタプル(TypeScript 4.0+)

各要素にラベルを付けると可読性が上がります。

```ts
type NamedEntry = [name: string, score: number];

const student: NamedEntry = ["鈴木", 92];
console.log(student); // [ '鈴木', 92 ]
```

### オプショナル要素

`?` で末尾の要素を省略可能にできます。

```ts
type WithOptional = [string, number, boolean?];

const a: WithOptional = ["hello", 1];       // OK(boolean省略)
const b: WithOptional = ["world", 2, true]; // OK
console.log(a, b);
```

### 可変長(rest)タプル

タプルの中にレスト要素を含めることができます。

```ts
type AtLeastTwo = [string, string, ...number[]];

const c: AtLeastTwo = ["first", "second"];         // OK(number部分は0個以上)
const d: AtLeastTwo = ["first", "second", 1, 2, 3]; // OK
console.log(c, d);
```

---

## enum — 列挙型

関連する定数をまとめて管理します。

### 数値 enum

```ts
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}

const dir: Direction = Direction.Up;
console.log(dir);             // 0
console.log(Direction[0]);    // "Up" (逆引きができる)
console.log(Direction.Right); // 3
```

デフォルトでは0から始まる整数が割り当てられます。最初の値を変えると以降も連番になります。

### 文字列 enum

数値より意図が明確で、デバッグ時に読みやすいです。

```ts
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}

const c2: Color = Color.Green;
console.log(c2); // "GREEN"
```

文字列 enum は逆引き(`Color["GREEN"]`)はできません。

### enum の注意点

```ts
enum Status {
  Active = 0,
  Inactive = 1,
}

// 数値 enum は型外の数値を代入してもエラーにならない(落とし穴)
const s: Status = 99; // TypeScript では警告なし(設計上の問題)
console.log(s); // 99
```

数値 enum は型安全性が低い点が批判されます。文字列 enum か次に示す代替を使うと安全です。

---

## リテラルユニオン + `as const` — enum の代替

現代の TypeScript では enum より**リテラルユニオン**と **`as const`** を組み合わせるパターンがよく使われます。

### リテラルユニオン

```ts
// enum の代わりに type でリテラルユニオンを定義
type Direction2 = "Up" | "Down" | "Left" | "Right";

function move(dir: Direction2): void {
  console.log(`移動: ${dir}`);
}

move("Up");   // 移動: Up
// @ts-expect-error リテラルユニオンにない値はエラー
move("Diagonal");
```

### `as const` — リテラル型として固定

`as const` を付けると、TypeScript は値を**最も狭い型(リテラル型)**として扱います。

```ts
// as const なし: string と推論される
const color1 = "red";    // 型: string ← 実は "red" (リテラル型に推論される)
const arr1 = ["a", "b"]; // 型: string[] ← 中身が変わる可能性があると判断

// as const あり: リテラル型として固定される
const arr2 = ["a", "b"] as const;
// 型: readonly ["a", "b"] — "a" | "b" としか言えない
console.log(arr2); // ['a', 'b']

// @ts-expect-error as const の配列は readonly なので変更不可
arr2.push("c");
```

### オブジェクト定数 + as const でキー型を抽出

```ts
// as const でオブジェクトを定数として定義
const COLORS = {
  Red: "RED",
  Green: "GREEN",
  Blue: "BLUE",
} as const;

// typeof + keyof でキーの型を抽出
type ColorKey = keyof typeof COLORS;           // "Red" | "Green" | "Blue"
type ColorValue = (typeof COLORS)[ColorKey];   // "RED" | "GREEN" | "BLUE"

const myColor: ColorValue = "GREEN";
console.log(myColor); // GREEN
```

このパターンは enum より JS にコンパイルした結果がシンプルで、ツリーシェイキング(不要なコードの除去)にも対応しています。

---

## ⚠️ よくあるつまずき

### 1. 配列の範囲外アクセスは型上 `T` だが実際は `undefined`

strict モードの `noUncheckedIndexedAccess` を有効にしない限り、配列の要素アクセスは `T`(not `T | undefined`)として扱われます。

```ts
const items = ["a", "b", "c"];
const item = items[10]; // 型上は string だが実行時は undefined
console.log(item); // undefined
console.log(typeof item); // "undefined"

// 安全のため存在確認を入れる習慣を
if (item !== undefined) {
  console.log(item.toUpperCase());
}
```

### 2. タプルの長さを超えた代入はエラー

```ts
const pair: [string, number] = ["hello", 1];
// @ts-expect-error タプルの長さは2なのでインデックス2へのアクセスはエラー
pair[2] = "extra";
```

### 3. 数値 enum は型外の数値を許してしまう

文字列 enum かリテラルユニオンを使う方が安全です(前述)。

### 4. `as const` を忘れると型が広がる

```ts
const directions = ["Up", "Down", "Left", "Right"]; // 型: string[]
// "Up" | "Down" ... としたいなら as const が必要
const directions2 = ["Up", "Down", "Left", "Right"] as const; // 型: readonly ["Up", ...]
```

---

## ✍️ 練習問題

### 問1

`string` の読み取り専用配列を受け取り、各要素を大文字にした**新しい配列**を返す関数 `toUpperAll` を書いてください。元の配列は変更しないこと。

<details>
<summary>解答例</summary>

```ts
function toUpperAll(arr: readonly string[]): string[] {
  return arr.map((s) => s.toUpperCase());
}

const words = ["hello", "world"] as const;
console.log(toUpperAll(words)); // ['HELLO', 'WORLD']
```

</details>

---

### 問2

`type RGB = [r: number, g: number, b: number]` を定義し、2つの `RGB` を受け取って各チャンネルを平均した新しい `RGB` を返す関数 `blendColors` を書いてください。

<details>
<summary>解答例</summary>

```ts
type RGB = [r: number, g: number, b: number];

function blendColors(c1: RGB, c2: RGB): RGB {
  return [
    Math.round((c1[0] + c2[0]) / 2),
    Math.round((c1[1] + c2[1]) / 2),
    Math.round((c1[2] + c2[2]) / 2),
  ];
}

const red2: RGB = [255, 0, 0];
const blue: RGB = [0, 0, 255];
console.log(blendColors(red2, blue)); // [128, 0, 128]
```

</details>

---

### 問3

`as const` を使って `WEEKDAYS` オブジェクト(月〜金を英語で)を定義し、その値の型 `Weekday` を抽出してください。`Weekday` を引数に取り、日本語の曜日名を返す関数 `toJapanese` も書いてください。

<details>
<summary>解答例</summary>

```ts
const WEEKDAYS = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
} as const;

type Weekday = (typeof WEEKDAYS)[keyof typeof WEEKDAYS];

function toJapanese(day: Weekday): string {
  const map: Record<Weekday, string> = {
    Monday: "月曜日",
    Tuesday: "火曜日",
    Wednesday: "水曜日",
    Thursday: "木曜日",
    Friday: "金曜日",
  };
  return map[day];
}

console.log(toJapanese("Monday"));    // 月曜日
console.log(toJapanese("Wednesday")); // 水曜日
```

</details>

---

### 問4

`readonly string[]` を受け取る関数 `firstAndLast` を書いてください。配列の先頭と末尾の要素を `[first: string, last: string]` というタプルで返します。配列が空の場合は `["", ""]` を返してください。関数内で元の配列を変更しようとする行を `@ts-expect-error` コメント付きで示して、`readonly` の制約を確認してください。

<details><summary>解答例</summary>

```ts
function firstAndLast(arr: readonly string[]): [first: string, last: string] {
  // @ts-expect-error readonly 配列に push はできない
  // arr.push("x");
  if (arr.length === 0) return ["", ""];
  return [arr[0], arr[arr.length - 1]];
}

const fruits = ["apple", "banana", "cherry"] as const;
console.log(firstAndLast(fruits));   // ['apple', 'cherry']
console.log(firstAndLast([]));       // ['', '']
console.log(firstAndLast(["only"])); // ['only', 'only']
```

`readonly` 配列は `push` / `pop` などの破壊的メソッドを型レベルで禁止する。`as const` 配列は `readonly` 配列に代入できる。

</details>

---

### 問5

文字列の数値 enum `LogLevel`(Debug = "DEBUG"、Info = "INFO"、Warn = "WARN"、Error = "ERROR")を定義してください。`LogLevel` と メッセージ文字列を受け取り、`"[{レベル}] {メッセージ}"` という文字列を出力する関数 `log` を書いてください。

<details><summary>解答例</summary>

```ts
enum LogLevel {
  Debug = "DEBUG",
  Info = "INFO",
  Warn = "WARN",
  Error = "ERROR",
}

function log(level: LogLevel, message: string): void {
  console.log(`[${level}] ${message}`);
}

log(LogLevel.Info, "サーバーが起動しました");  // [INFO] サーバーが起動しました
log(LogLevel.Warn, "メモリ使用率が高い");      // [WARN] メモリ使用率が高い
log(LogLevel.Error, "接続に失敗しました");     // [ERROR] 接続に失敗しました
```

文字列 enum はデバッグ時にそのまま読める値が出力されるため、数値 enum より意図が明確になる。

</details>

---

### 問6

`as const` を使って `HTTP_METHODS` オブジェクトを定義してください(GET / POST / PUT / DELETE を文字列値で)。その値の型 `HttpMethod` を抽出し、`HttpMethod` を受け取って冪等かどうか(GET / PUT は冪等、POST / DELETE は非冪等)を返す関数 `isIdempotent` を書いてください。

<details><summary>解答例</summary>

```ts
const HTTP_METHODS = {
  Get: "GET",
  Post: "POST",
  Put: "PUT",
  Delete: "DELETE",
} as const;

type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

function isIdempotent(method: HttpMethod): boolean {
  return method === "GET" || method === "PUT";
}

console.log(isIdempotent("GET"));    // true
console.log(isIdempotent("POST"));   // false
console.log(isIdempotent("PUT"));    // true
console.log(isIdempotent("DELETE")); // false
```

`as const` + `typeof` + `keyof` の組み合わせで enum を使わずに型安全な定数セットを定義できる。ツリーシェイキングにも対応しやすい。

</details>

---

## 📌 まとめ

- `number[]` と `Array<number>` は同義。`number[]` が一般的
- `readonly T[]` で変更不可の配列を表現できる
- タプル `[string, number]` は位置ごとに型が決まる固定長配列
- 数値 enum は型安全性が低い。文字列 enum かリテラルユニオンを推奨
- `as const` でオブジェクト・配列をリテラル型として固定できる
- 配列の範囲外アクセスは実行時 `undefined` になるが型上は `T` のまま(注意)

## ▶ 動かす

```bash
npm run ch06
# または
npx tsx src/06_arrays_tuples_enums.ts
```
