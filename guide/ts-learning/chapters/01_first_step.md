# 第01章 TypeScript 最初の一歩

> TypeScript は「JavaScript に型を足したもの」。コードを実行する前にバグを見つけられるのが最大の強みです。

## 🎯 この章のゴール

- TypeScript が何者で、なぜ使うのかを説明できる
- 変数と関数に型注釈を書ける
- `// @ts-expect-error` で「わざと型エラーを体験」できる
- `npm run ch01` でサンプルを実行できる

---

## TypeScript とは

TypeScript は Microsoft が開発したプログラミング言語です。一言で言うと **JavaScript のスーパーセット**。つまり、

- 正しい JavaScript はそのまま TypeScript としても動く
- TypeScript に書いた「型」の情報は、最終的に JavaScript に変換（コンパイル）されるときに取り除かれる

```
TypeScript ファイル (.ts)
        ↓  tsc でコンパイル / tsx で直接実行
JavaScript ファイル (.js)  ← 型情報は消える（type erasure）
        ↓
ブラウザ / Node.js で実行
```

### JS を書くだけではなぜ困るのか

JavaScript は型が緩いため、次のようなバグが実行するまで気づけません。

```js
// JavaScript の例：実行してみるまでおかしさに気づかない

const price = "500";      // 文字列の "500"
const tax = 0.1;
console.log(price * tax); // → 50（暗黙の型変換で動いてしまう！）

const user = undefined;
console.log(user.name);   // → 実行時エラー TypeError: Cannot read properties of undefined
```

TypeScript なら**実行前**、エディタ上でエラーを教えてくれます。

---

## 動く仕組み：型は実行時に消える

```ts
// TypeScript のコード
let count: number = 42;   // ": number" が型注釈

// コンパイル後に生成される JavaScript
// let count = 42;         ← 型注釈は消える
```

> **重要：** `count: number` という型情報は実行時には存在しません。型チェックはあくまでコンパイル（ビルド）時だけの話です。ランタイムで型を調べる仕組みは別途必要です（第7章で解説）。

---

## このプロジェクトでの使い方

```bash
# 型チェックだけ行う（エラーがあれば一覧表示）
npm run check

# 第01章のサンプルを実行する（tsx が内部でコンパイルして即実行）
npm run ch01

# tsx を直接使っても同じ
npx tsx src/01_first_step.ts
```

`tsx` は TypeScript をコンパイルして Node.js で実行するツールです。普段の学習では `npm run chNN` を使えば OK です。

---

## 最初のコード：型注釈を書いてみよう

### 変数への型注釈

```ts
// 変数名の後ろに ": 型名" を書く
let message: string = "こんにちは TypeScript";
let count: number = 10;
let isDone: boolean = false;

console.log(message, count, isDone);
// → こんにちは TypeScript 10 false
```

### 関数への型注釈

```ts
// 引数と戻り値の両方に型を書く
function add(a: number, b: number): number {
  return a + b;
}

console.log(add(3, 4)); // → 7
```

引数に型がついていると、間違えたときにエディタがすぐ赤線を引いてくれます。

```ts
// @ts-expect-error 文字列を渡したら型エラーになる体験
add("3", 4);
```

> **`// @ts-expect-error` とは？**
> 「次の行は意図的に型エラーになる」と TypeScript に教えるコメントです。
> このコメントがない状態で型エラーの行があると `tsc` が失敗します。
> 学習用に「悪い例」を安全に書き記すために使います。

---

## 型推論：注釈を省略できるケース

TypeScript は代入する値を見て型を推論してくれます。

```ts
// 初期化時に値があれば、型注釈を書かなくても推論される
let greeting = "Hello";  // TypeScript は string と推論する

// 推論後に number を代入しようとするとエラー
// @ts-expect-error string 型に number を代入しようとした
greeting = 123;
```

変数を初期化する場合は型注釈を省略しても構いません（第3章で詳しく解説します）。

---

## ⚠️ よくあるつまずき

### 「型は実行時に消える」を忘れがち

```ts
// TypeScript で型チェックが通っても、実行時の値は変わらない
let value: number = 1;
console.log(typeof value); // → "number"（これは JS の typeof、TS の型とは別物）

// TS の型は開発者が読む「仕様書」であり、実行時の挙動を変えない
```

### `var` を使いたくなる（使わなくてよい）

JS の古い書き方では `var` がありましたが、TypeScript の学習では `let` / `const` だけ使います。詳細は第2章で説明します。

### 「どこに型を書くの？」と迷う

最初は全部に書いても OK です。慣れてきたら「初期値があれば省略、関数の引数は書く」というルールを身につけます（第3章）。

---

## ✍️ 練習問題

### 問題 1

`name: string` と `age: number` の変数を宣言し、`"田中さんは30歳です"` のような文字列を console.log で出力してください。テンプレートリテラル（バッククォート `` ` ``）を使うとスマートです。

<details><summary>解答例</summary>

```ts
const name: string = "田中";
const age: number = 30;
console.log(`${name}さんは${age}歳です`);
```

</details>

---

### 問題 2

2つの文字列を受け取って結合して返す関数 `concat` を書いてください。引数と戻り値に型注釈を付けること。

<details><summary>解答例</summary>

```ts
function concat(a: string, b: string): string {
  return a + b;
}
console.log(concat("Hello", " World")); // → Hello World
```

</details>

---

### 問題 3

次のコードはどこが問題ですか？ `// @ts-expect-error` を付けて、「意図的なエラー」として成立させてください。

```ts
let score: number = 100;
score = "満点";
```

<details><summary>解答例</summary>

```ts
let score: number = 100;
// @ts-expect-error number 型の変数に string は代入できない
score = "満点";
console.log(score); // 実行はできるが、型的には誤り
```

</details>

---

### 問題 4

次のコードには `// @ts-expect-error` が1か所必要です。どの行の**直前**に置けばよいか答え、実際に動くコードを書いてください。

```ts
function multiply(a: number, b: number): number {
  return a * b;
}

const result = multiply(3, "4");
console.log(result);
```

<details><summary>解答例</summary>

```ts
function multiply(a: number, b: number): number {
  return a * b;
}

// @ts-expect-error 第2引数に string を渡しているため型エラー
const result = multiply(3, "4");
console.log(result); // 実行値は 12 だが、型的には誤り
```

`multiply` は引数を `number` と宣言しているので、`"4"` (string) を渡した行が型エラーになる。`@ts-expect-error` はエラーになる行の直前1行に置く。

</details>

---

### 問題 5

`boolean` 型の引数 `isPremium` と `string` 型の引数 `planName` を受け取り、`"プレミアム: {planName}"` または `"スタンダード: {planName}"` を返す関数 `getPlanLabel` を、引数・戻り値の型注釈をすべて明示して書いてください。

<details><summary>解答例</summary>

```ts
function getPlanLabel(isPremium: boolean, planName: string): string {
  const prefix = isPremium ? "プレミアム" : "スタンダード";
  return `${prefix}: ${planName}`;
}
console.log(getPlanLabel(true, "ゴールド"));   // → プレミアム: ゴールド
console.log(getPlanLabel(false, "ベーシック")); // → スタンダード: ベーシック
```

引数2つと戻り値に型注釈を付けることで、呼び出し側の型間違い（例: `isPremium` に文字列を渡す）をコンパイル時に検出できる。

</details>

---

## 📌 まとめ

- TypeScript は JavaScript に**型**を加えた言語。最終的に JS に変換される
- 型は**実行時に消える**。型チェックはコンパイル時のみ
- 変数は `let x: number`、関数は引数と戻り値に型注釈を書く
- 初期値がある変数は型推論が働くので注釈を省略できる
- `// @ts-expect-error` で「意図的なエラー」を安全に書ける
- `npm run ch01` または `npx tsx src/01_first_step.ts` で実行

## ▶ 動かす

```bash
npm run ch01
# または
npx tsx src/01_first_step.ts
```
