# 第04章 関数の型

> 関数の引数と戻り値に型を付けることで、呼び出し側のミスをコンパイル時に防ぐ。TypeScript の恩恵が最も体感しやすい場所。

## 🎯 この章のゴール

- 引数・戻り値への型注釈を書ける
- オプショナル引数・デフォルト引数・レストパラメータを使い分けられる
- 関数型(シグネチャ)を型エイリアスで表現できる
- コールバックに型を付けられる
- 関数オーバーロードの概念を知っている

---

## 引数と戻り値の型注釈

最もシンプルな例から始めます。

```ts
function add(a: number, b: number): number {
  return a + b;
}

console.log(add(2, 3)); // 5
```

- `a: number` — 引数 `a` は数値
- `: number`(閉じカッコの後) — 戻り値は数値

**なぜ書くのか？**  
引数の型を書かないと TypeScript は `any` と推論してしまいます(strict モードではエラー)。  
戻り値は推論されるので省略も可ですが、**関数の仕様書として明示する**習慣を最初に身に付けましょう。

---

## 戻り値 `void` — 何も返さない関数

値を返す必要がない関数は戻り値型を `void` にします。

```ts
function greet(name: string): void {
  console.log(`こんにちは、${name}さん`);
  // return しない
}

greet("田中"); // こんにちは、田中さん
```

`undefined` を返す関数にも `void` を使います。`void` は「戻り値を使うことを想定していない」という意味合いです。

---

## オプショナル引数 `?` とデフォルト引数

### オプショナル引数 `?`

`?` を付けると引数を省略できます。省略すると `undefined` になります。

```ts
function greetWithTitle(name: string, title?: string): string {
  if (title !== undefined) {
    return `${title} ${name}`;
  }
  return name;
}

console.log(greetWithTitle("鈴木"));          // 鈴木
console.log(greetWithTitle("鈴木", "Dr."));   // Dr. 鈴木
```

### デフォルト引数

省略時に使いたい値が決まっているならデフォルト引数が便利です。型注釈は省略できます(デフォルト値から推論)。

```ts
function greetWithDefault(name: string, greeting = "こんにちは"): string {
  return `${greeting}、${name}さん`;
}

console.log(greetWithDefault("山田"));              // こんにちは、山田さん
console.log(greetWithDefault("山田", "おはよう"));  // おはよう、山田さん
```

**`?` とデフォルトの違い**

| | 省略時の値 | 型 |
|---|---|---|
| `title?: string` | `undefined` | `string \| undefined` |
| `greeting = "こんにちは"` | `"こんにちは"` | `string` |

---

## レストパラメータ `...nums: number[]`

可変長の引数を配列としてまとめて受け取ります。

```ts
function sum(...nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}

console.log(sum(1, 2, 3));       // 6
console.log(sum(10, 20, 30, 40)); // 100
```

レストパラメータは**必ず最後**に置きます。前に普通の引数があってもOKです。

```ts
function log(prefix: string, ...messages: string[]): void {
  for (const msg of messages) {
    console.log(`[${prefix}] ${msg}`);
  }
}

log("INFO", "起動しました", "接続完了"); 
// [INFO] 起動しました
// [INFO] 接続完了
```

---

## 関数型(シグネチャ)を型エイリアスで表現する

「この引数パターンで、この型を返す関数」という形を型として名前を付けられます。

```ts
// 二項演算の型エイリアス
type BinOp = (a: number, b: number) => number;

const multiply: BinOp = (a, b) => a * b;
const divide: BinOp = (a, b) => a / b;

console.log(multiply(3, 4)); // 12
console.log(divide(10, 2));  // 5
```

型エイリアスを使うと、同じシグネチャの関数を複数定義するときに一貫性が保てます。

---

## コールバックの型

配列の `map` や `filter` に渡す関数にも型が付きます。

```ts
const numbers = [1, 2, 3, 4, 5];

// コールバックの引数・戻り値を明示する例
const doubled = numbers.map((n: number): number => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// 型エイリアスを使ってコールバック型を定義する例
type Predicate = (value: number) => boolean;

function filterNumbers(arr: number[], pred: Predicate): number[] {
  return arr.filter(pred);
}

const evens = filterNumbers(numbers, (n) => n % 2 === 0);
console.log(evens); // [2, 4]
```

実際は `map` などの引数型から推論されるため、コールバック内では型注釈を省略してもエラーになりません。

---

## アロー関数 vs 関数宣言での型の書き方

同じ関数を2通りの書き方で型を付けてみます。

```ts
// 関数宣言
function addDecl(a: number, b: number): number {
  return a + b;
}

// アロー関数(変数に代入)
const addArrow = (a: number, b: number): number => a + b;

// 変数に型注釈して、アロー関数の引数型を省略する書き方
const addAnnotated: (a: number, b: number) => number = (a, b) => a + b;

console.log(addDecl(1, 2));      // 3
console.log(addArrow(1, 2));     // 3
console.log(addAnnotated(1, 2)); // 3
```

どれも同じ動作です。チーム・プロジェクトで統一すれば OK です。

---

## 関数オーバーロード(1例)

同じ関数名で異なる引数パターンを受け付けるのがオーバーロードです。TypeScript では**オーバーロード署名**を先に並べ、最後に**実装署名**を書きます。

```ts
// オーバーロード署名(型チェックに使われる)
function format(value: number): string;
function format(value: string): string;

// 実装署名(実際の処理)
function format(value: number | string): string {
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  return value.trim();
}

console.log(format(3.14159)); // "3.14"
console.log(format("  hello  ")); // "hello"
```

オーバーロードが必要なのは「引数の型によって戻り値の型が変わる」場合など限定的です。多くは**ユニオン型**(第7章)で十分です。

---

## ⚠️ よくあるつまずき

### 1. 引数の型注釈を書き忘れると strict でエラー

```ts
// @ts-expect-error strict モードでは引数に暗黙の any は禁止
function bad(x) {
  return x + 1;
}
```

戻り値の型は推論されますが、**引数は推論の手がかりがないので必ず書く**のが基本です。

### 2. オプショナル引数は必ず後ろに置く

```ts
// @ts-expect-error オプショナル引数の後に必須引数は置けない
function wrong(a?: string, b: number): void {}
```

`a?: string` の後に必須の `b: number` は置けません。オプショナル引数は常に末尾側に。

### 3. `void` を返す関数に `return` で値を渡しても型エラー

```ts
function noReturn(): void {
  // @ts-expect-error void 型の関数から値を返せない
  return 42;
}
```

### 4. デフォルト引数に `undefined` を渡すとデフォルト値が使われる

```ts
function withDefault(n = 10): number {
  return n;
}

console.log(withDefault());          // 10 ← デフォルト
console.log(withDefault(undefined)); // 10 ← undefined もデフォルト扱い
console.log(withDefault(0));         // 0  ← 0 はデフォルト扱いにならない
```

---

## ✍️ 練習問題

### 問1

2つの文字列を受け取り、長い方を返す関数 `longer` を書いてください。同じ長さなら最初の引数を返します。型注釈を忘れずに。

<details>
<summary>解答例</summary>

```ts
function longer(a: string, b: string): string {
  return a.length >= b.length ? a : b;
}

console.log(longer("cat", "elephant")); // "elephant"
console.log(longer("ab", "cd"));        // "ab"
```

</details>

---

### 問2

`type Transformer = (s: string) => string` という型エイリアスを定義し、この型の関数 `toUpperFirst`(先頭だけ大文字にする)を実装してください。

<details>
<summary>解答例</summary>

```ts
type Transformer = (s: string) => string;

const toUpperFirst: Transformer = (s) =>
  s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);

console.log(toUpperFirst("hello")); // "Hello"
console.log(toUpperFirst(""));      // ""
```

</details>

---

### 問3

任意の数の数値を受け取り、その平均を返す関数 `average` を書いてください。引数が0個のときは `NaN` を返して構いません。

<details>
<summary>解答例</summary>

```ts
function average(...nums: number[]): number {
  if (nums.length === 0) return NaN;
  return nums.reduce((acc, n) => acc + n, 0) / nums.length;
}

console.log(average(1, 2, 3, 4, 5)); // 3
console.log(average(10, 20));         // 15
console.log(average());               // NaN
```

</details>

---

### 問4

高階関数 `applyTwice` を書いてください。`(f: (x: number) => number, x: number) => number` という型で、`f` を2回適用した結果を返します。関数型エイリアス `NumTransform` を定義してから使うこと。

<details><summary>解答例</summary>

```ts
type NumTransform = (x: number) => number;

function applyTwice(f: NumTransform, x: number): number {
  return f(f(x));
}

const double: NumTransform = (x) => x * 2;
const addTen: NumTransform = (x) => x + 10;

console.log(applyTwice(double, 3));  // 12  (3→6→12)
console.log(applyTwice(addTen, 5)); // 25  (5→15→25)
```

関数型エイリアスで引数の型を統一することで、`applyTwice` 側の記述がすっきりする。

</details>

---

### 問5

`greet` 関数を書いてください。第1引数は `name: string`(必須)、第2引数は `title?: string`(オプショナル)、第3引数は `suffix = "!"` (デフォルト引数)です。`title` がある場合は `"こんにちは、{title} {name}{suffix}"` を、ない場合は `"こんにちは、{name}{suffix}"` を返します。

<details><summary>解答例</summary>

```ts
function greet(name: string, title?: string, suffix = "!"): string {
  if (title !== undefined) {
    return `こんにちは、${title} ${name}${suffix}`;
  }
  return `こんにちは、${name}${suffix}`;
}

console.log(greet("山田"));                    // こんにちは、山田!
console.log(greet("山田", "Dr."));             // こんにちは、Dr. 山田!
console.log(greet("山田", undefined, "。"));   // こんにちは、山田。
console.log(greet("山田", "Dr.", "。"));       // こんにちは、Dr. 山田。
```

`title?` は省略すると `undefined` になる。`suffix` はデフォルト引数なので省略時は `"!"` が使われ、`undefined` を明示渡しした場合もデフォルト値が使われる。

</details>

---

### 問6

数値を可変長で受け取り、最大値と最小値を `[max: number, min: number]` のタプルで返す関数 `maxMin` を書いてください。引数が0個のときは `[−Infinity, Infinity]` を返してください。

<details><summary>解答例</summary>

```ts
function maxMin(...nums: number[]): [max: number, min: number] {
  if (nums.length === 0) return [-Infinity, Infinity];
  let max = nums[0];
  let min = nums[0];
  for (const n of nums) {
    if (n > max) max = n;
    if (n < min) min = n;
  }
  return [max, min];
}

console.log(maxMin(3, 1, 4, 1, 5, 9, 2, 6)); // [9, 1]
console.log(maxMin(42));                       // [42, 42]
console.log(maxMin());                         // [-Infinity, Infinity]
```

レストパラメータで可変長引数を配列として受け取り、名前付きタプルで意図の明確な戻り値を表現する。

</details>

---

## 📌 まとめ

- 引数の型注釈は**必ず書く**。戻り値は省略可だが明示推奨
- オプショナル `?` は `undefined` になる。デフォルト引数は省略時の値を指定できる
- レストパラメータ `...nums: number[]` で可変長引数を配列として受け取る
- `type BinOp = (a: number, b: number) => number` で関数型に名前を付けられる
- オーバーロードは限定的な用途。多くはユニオン型で代替できる

## ▶ 動かす

```bash
npm run ch04
# または
npx tsx src/04_functions.ts
```
