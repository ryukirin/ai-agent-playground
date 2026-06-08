# 第03章 基本の型

> TypeScript の型システムを支える土台「プリミティブ型」と「型推論」を理解し、`any` / `unknown` / `never` の使い分けを学びます。

## 🎯 この章のゴール

- `string` / `number` / `boolean` / `null` / `undefined` を使いこなせる
- 型推論を活かして「どこに書き、どこを省略するか」を判断できる
- `any` の危険性と `unknown` の使い方を説明できる
- `as` による型アサーションを正しく理解できる

---

## 型注釈の書き方

```ts
// 「変数名: 型名」で注釈を付ける
let message: string = "こんにちは";
let count: number = 42;
let active: boolean = true;
```

型注釈は変数だけでなく、関数の引数・戻り値にも書きます。

```ts
function greet(name: string, times: number): string {
  return name.repeat(times);
}
```

---

## プリミティブ型

### string

文字列。シングル/ダブルクォートまたはバッククォートで作る。

```ts
const s1: string = "hello";
const s2: string = 'world';
const s3: string = `${s1} ${s2}`;
console.log(s3); // → hello world
```

### number

整数・小数を区別せず全て `number`。

```ts
const n1: number = 42;
const n2: number = 3.14;
const n3: number = 0xff;   // 16進数
const n4: number = NaN;    // 数値でない数（これも number 型）
const n5: number = Infinity;
console.log(n1, n2, n3, n4, n5); // → 42 3.14 255 NaN Infinity
```

### boolean

```ts
const isLoggedIn: boolean = true;
const isEmpty: boolean = false;
console.log(isLoggedIn, isEmpty); // → true false
```

### null と undefined

```ts
// null：「値が存在しない」と意図的に示す
// undefined：「値がまだ設定されていない」という未初期化状態
let a: null = null;
let b: undefined = undefined;

console.log(a, b); // → null undefined

// よく使うのは「string | null」のようなユニオン型（第7章）
let nickname: string | null = null;
nickname = "たなかん";
console.log(nickname); // → たなかん
```

### bigint と symbol（軽く）

```ts
// bigint：number より大きい整数を扱う（末尾に n）
const big: bigint = 9999999999999999999999n;
console.log(big); // → 9999999999999999999999n

// symbol：ユニークな識別子（主にライブラリ内で使われる）
const sym: symbol = Symbol("my-symbol");
console.log(sym.toString()); // → Symbol(my-symbol)
```

---

## 型推論

TypeScript は代入する値から型を自動的に推論します。

```ts
// 初期値から string と推論される
const greeting = "Hello";  // 型は string

// 初期値から number と推論される
const year = 2025;          // 型は number

// 推論後に別の型を代入しようとするとエラー
// @ts-expect-error string と推論された greeting に number は代入できない
greeting = 123;
```

### どこに型注釈を書き、どこを省略するか

| 場所 | 推奨 |
|------|------|
| 初期値ありの変数 | 省略（推論に任せる） |
| 関数の引数 | **必ず書く**（推論できないため） |
| 関数の戻り値 | できれば書く（意図を明確に） |
| `let` で後から代入する変数 | 書く方が安全 |

```ts
// 良い例
const ratio = 0.5;                             // 省略 OK（0.5 から number と推論）
function multiply(n: number, by: number): number {  // 引数は必ず書く
  return n * by;
}

// 後から型が変わりうる場合は注釈を付ける
let status: "active" | "inactive" = "active"; // 第7章のリテラル型
```

---

## `any` — 型チェックをオフにする「最終手段」

`any` を使うと TypeScript の型チェックが完全に無効化されます。

```ts
let x: any = "文字列";
x = 42;          // OK
x = true;        // OK
x.foo.bar.baz;   // OK（実行時エラーになっても TS は文句を言わない）

// any は伝染する：any の値を使うと戻り値も any になる
function parseData(json: any) {
  return json.value; // 戻り値も any
}
```

> `any` は「TypeScript を使っているのに JS と同じ状態」です。バグを見つける力を捨てることになるため、**`any` は原則使わない**。やむなく使う場合は `// TODO: 型を付ける` などコメントを残す習慣を。

---

## `unknown` — 安全版 `any`

`unknown` も「どんな値でも入れられる」点は `any` と同じです。しかし `unknown` 型の値は**型を絞り込まないと使えない**ため、安全です。

```ts
let val: unknown = "こんにちは";

// @ts-expect-error unknown のまま string メソッドは呼べない
val.toUpperCase();

// typeof で絞り込んでから使う（詳細は第7章）
if (typeof val === "string") {
  console.log(val.toUpperCase()); // → こんにちは（ここでは string と確定）
}

// 外部 API のレスポンスなど「何が来るか分からない」値に使う
function processInput(input: unknown): string {
  if (typeof input === "string") return input;
  if (typeof input === "number") return String(input);
  return "不明な入力";
}
console.log(processInput("hello"));  // → hello
console.log(processInput(42));        // → 42
console.log(processInput(true));      // → 不明な入力
```

---

## `never` — 値を持たない型

`never` は「絶対に値が存在しない」型です。主に2つの場面で現れます。

```ts
// 1. 関数が絶対に return しない（必ず例外を投げる）
function fail(message: string): never {
  throw new Error(message);
}

// 2. switch / if の「到達しないはずの分岐」で使う（網羅性チェック）
type Color = "red" | "green" | "blue";
function getColorCode(color: Color): string {
  switch (color) {
    case "red":   return "#ff0000";
    case "green": return "#00ff00";
    case "blue":  return "#0000ff";
    default:
      // ここに到達したら Color に未対応の値がある、というコンパイルエラーになる
      const _exhaustive: never = color;
      return _exhaustive;
  }
}
```

`never` は第7章（絞り込み）で実用的な形で再登場します。

---

## 型アサーション `as`

TypeScript が推論した型を「自分は〇〇型と知っている」と上書きする構文です。

```ts
// 例：DOM 操作（ブラウザ環境の話）
// document.getElementById は HTMLElement | null を返す
// const input = document.getElementById("name") as HTMLInputElement;
// input.value; // HTMLInputElement と断言したので .value が使える

// 数値に見せかける例
const raw: unknown = 42;
const num = raw as number;
console.log(num + 1); // → 43
```

### `as` の濫用に注意

```ts
// @ts-expect-error 全く関係ない型への as は2段階 as unknown as ... が必要
// （1段階では TS が警告を出す）
const str = "hello" as unknown as number;
console.log(str + 1); // 実行時: "hello1"（文字列連結になる！）
```

> `as` は「自分が TypeScript より型を知っている」場面だけに使います。安易に使うと実行時エラーを隠す温床になります。`as any` は本当に最後の手段。

---

## `typeof` で実行時の型を確認

JavaScript の `typeof` 演算子は TypeScript でも使えます（第7章の型の絞り込みへの布石）。

```ts
const values: unknown[] = [42, "hello", true, null, undefined];

for (const v of values) {
  console.log(typeof v, ":", v);
}
// number : 42
// string : hello
// boolean : true
// object : null   ← null は歴史的経緯で "object"（要注意）
// undefined : undefined
```

> `typeof null === "object"` は JavaScript の有名なバグです。null チェックは `v === null` で別途行う必要があります。

---

## ⚠️ よくあるつまずき

### `null` の `typeof` が `"object"`

```ts
console.log(typeof null);        // → "object"（バグだが仕様）
console.log(typeof undefined);   // → "undefined"
console.log(null === null);      // → true（null チェックはこちらを使う）
```

### `any` と `unknown` の混同

```ts
// any：型チェックをスキップ（使えるが危険）
const a: any = "hello";
a.foo(); // TS は文句を言わない。実行時エラーは起きる

// unknown：使う前に絞り込みが必要（安全）
const u: unknown = "hello";
// u.foo(); // エラー：unknown はそのまま使えない
if (typeof u === "string") {
  u.toUpperCase(); // OK：絞り込み後は使える
}
```

### 型推論と型注釈の両方を書いてしまう（冗長）

```ts
// 冗長（初期値があるなら注釈は不要）
const x: number = 42;

// こちらで十分
const y = 42;
```

ただし、チームの規約や可読性を優先して注釈を書くことは構いません。

---

## ✍️ 練習問題

### 問題 1

次の変数のうち、型注釈を「省略してよいもの」と「書くべきもの」を分類してください。

```ts
const PI = 3.14;                  // (a)
let score;                        // (b)
function double(n) { return n * 2; } // (c) 引数
const result = double(5);         // (d)
```

<details><summary>解答例</summary>

- (a) 省略 OK：`3.14` から `number` と推論される
- (b) 書くべき：初期値なしなので `let score: number` のように型を付ける
- (c) 書くべき：関数引数は推論できない。`n: number` と書く
- (d) 省略 OK：`double(5)` の戻り値型から推論される

</details>

---

### 問題 2

`unknown` 型の引数を受け取り、`number` なら2倍、`string` なら大文字にして返す関数 `transform` を書いてください。どちらでもなければ `"unsupported"` を返す。

<details><summary>解答例</summary>

```ts
function transform(input: unknown): number | string {
  if (typeof input === "number") return input * 2;
  if (typeof input === "string") return input.toUpperCase();
  return "unsupported";
}
console.log(transform(5));       // → 10
console.log(transform("hello")); // → HELLO
console.log(transform(true));    // → unsupported
```

</details>

---

### 問題 3

以下のコードに `// @ts-expect-error` を適切な場所に追加して、`tsc --noEmit` が通るようにしてください（意図的なエラー行が1行あります）。

```ts
let name: string = "田中";
name = 42;
console.log(name);
```

<details><summary>解答例</summary>

```ts
let name: string = "田中";
// @ts-expect-error string 型変数に number を代入しようとした
name = 42;
console.log(name);
```

</details>

---

### 問題 4

次の変数はそれぞれ **何型に推論される**か答えてください。また、(d) の変数に後から `"hello"` を代入しようとするとどうなるかも答えてください。

```ts
const a = 100;            // (a)
const b = "TypeScript";   // (b)
const c = true;           // (c)
let   d = 3.14;           // (d)
```

<details><summary>解答例</summary>

- (a) `100` という **number リテラル型**（`const` なので値が固定される）
- (b) `"TypeScript"` という **string リテラル型**（同上）
- (c) `true` という **boolean リテラル型**（同上）
- (d) `number`（`let` なので値は変わりうる。広い型に推論される）

`d = "hello"` を代入しようとすると `string` を `number` に代入できないとして型エラーになる。`const` の場合は値が不変なのでリテラル型に、`let` の場合は再代入を想定してプリミティブ型に推論される違いがポイント。

</details>

---

### 問題 5

`unknown` 型の引数 `value` を受け取り、以下のルールで変換する関数 `describe` を書いてください。`as` は使わないこと。

- `number` なら `"数値: {value}"` を返す
- `string` なら `"文字列: {value}（長さ {length} 文字）"` を返す
- `boolean` なら `"真偽値: {value}"` を返す
- それ以外なら `"不明な値"` を返す

<details><summary>解答例</summary>

```ts
function describe(value: unknown): string {
  if (typeof value === "number") return `数値: ${value}`;
  if (typeof value === "string") return `文字列: ${value}（長さ ${value.length} 文字）`;
  if (typeof value === "boolean") return `真偽値: ${value}`;
  return "不明な値";
}

console.log(describe(42));       // → 数値: 42
console.log(describe("hello"));  // → 文字列: hello（長さ 5 文字）
console.log(describe(false));    // → 真偽値: false
console.log(describe(null));     // → 不明な値
```

`typeof` で絞り込んだ後は TypeScript が型を確定してくれるため、`as` なしで `.length` などのプロパティにアクセスできる。`unknown` を受け取りつつ安全に処理する基本パターン。

</details>

---

### 問題 6

次のコードは `as` を使って危険な型変換をしています。何が問題かを説明し、`as` を使わず型安全に書き直してください。

```ts
function getLength(value: unknown): number {
  return (value as string).length;
}

console.log(getLength("hello")); // → 5
console.log(getLength(12345));   // → 実行時エラーまたは undefined
```

<details><summary>解答例</summary>

```ts
function getLength(value: unknown): number {
  if (typeof value === "string") return value.length;
  if (Array.isArray(value)) return value.length;
  return 0;
}

console.log(getLength("hello")); // → 5
console.log(getLength(12345));   // → 0
console.log(getLength([1, 2, 3])); // → 3
```

元のコードの問題点: `value as string` は TypeScript に「string と思い込ませる」だけで、実際に `number` が来たときは `(number).length` が `undefined` になる。型エラーはなくても実行時に壊れる。`typeof` による絞り込みを使うことで、本当の型が確定してから `.length` にアクセスでき安全。

</details>

---

## 📌 まとめ

- プリミティブ型：`string` / `number` / `boolean` / `null` / `undefined`（`bigint` / `symbol` もある）
- 型推論：初期値ありの変数は省略 OK。関数引数は必ず書く
- `any`：型チェックをオフにする。原則使わない
- `unknown`：安全版 any。使う前に `typeof` 等で型を絞り込む
- `never`：値を持たない型。網羅性チェックに使う
- `as`：型アサーション。自分が型を知っている場面に限定して使う
- `typeof`：実行時の型確認（`null` は `"object"` になる点に注意）

## ▶ 動かす

```bash
npm run ch03
# または
npx tsx src/03_basic_types.ts
```
