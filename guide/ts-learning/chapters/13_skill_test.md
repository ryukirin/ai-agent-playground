# 腕試しテスト(第1〜12章 総合)

> 全章の内容を 1 ファイルで力試し。`src/13_skill_test.ts` の TODO を実装して、自動採点で全問 ✅ を目指します。

## 🎯 これは何?

- `src/13_skill_test.ts` に **13 テーマ・全 26 チェック** のコーディング課題が入っています。
- 各課題の `throw new Error("未実装")` を正しい実装に置き換え、実行すると **自動採点(✅/❌ と点数)** が出ます。
- このページには **章ごとの解説 + 折りたたみ解答** と、おまけの **型設計チャレンジ** があります。

## ▶ 進め方

```bash
# 1. テストを実行(最初は全部 ❌、0 / 26 と表示される)
npm run test            # = npx tsx src/13_skill_test.ts

# 2. src/13_skill_test.ts の【✏️ ここを実装するエリア】の TODO を埋める

# 3. もう一度実行 → ✅ が増える。全部 ✅ で 26 / 26 になればクリア!
npm run test

# 仕上げに型エラーが無いかも確認
npm run check
```

> 採点エリア(ファイル下半分)は編集しないでください。実装するのは上半分の TODO だけです。

---

## 📝 問題と解答

各問の「解答例」は折りたたんでいます。**自分で書いてから**開いて答え合わせしましょう。

### Q1【第3・4章】`square(n)`
数値を 2 乗して返す。引数・戻り値に型を付ける。

<details><summary>解答例</summary>

```ts
function square(n: number): number {
  return n * n;
}
```
</details>

### Q2【第3章】`safeLength(x: unknown)`
`unknown` を受け取り、`string` ならその文字数、それ以外は `-1` を返す。

<details><summary>解答例</summary>

```ts
function safeLength(x: unknown): number {
  return typeof x === "string" ? x.length : -1;
}
```
`unknown` はそのままでは `.length` を呼べないので、`typeof` で `string` に絞り込んでから使うのがポイント。
</details>

### Q3【第4章】`joinWith(items, sep?)`
文字列配列を区切り文字で連結。区切りは省略時 `","`。

<details><summary>解答例</summary>

```ts
function joinWith(items: string[], sep: string = ","): string {
  return items.join(sep);
}
```
`sep: string = ","` がデフォルト引数。呼び出し側が省略すると `","` が使われる。
</details>

### Q4【第5章】`formatUser(u: User)`
`email` があれば `"名前 <メール>"`、無ければ `"名前"` を返す(`User` は定義済み)。

<details><summary>解答例</summary>

```ts
function formatUser(u: User): string {
  return u.email ? `${u.name} <${u.email}>` : u.name;
}
```
`email?` は任意プロパティ。無いと `undefined` になるので、truthy 判定で分岐する。
</details>

### Q5【第6章】`rgbToHex(rgb)`
`readonly [number, number, number]` を `"#rrggbb"`(小文字・2 桁 0 埋め)に変換。

<details><summary>解答例</summary>

```ts
function rgbToHex(rgb: readonly [number, number, number]): string {
  return "#" + rgb.map((n) => n.toString(16).padStart(2, "0")).join("");
}
```
`toString(16)` で 16 進数化、`padStart(2, "0")` で 2 桁に揃える。
</details>

### Q6【第7章】`area(shape)`
判別可能ユニオン `Shape` の面積を返す。`default` で `never` による網羅性チェックも入れる。

<details><summary>解答例</summary>

```ts
function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rect":
      return shape.width * shape.height;
    default: {
      const _exhaustive: never = shape; // 新しい kind を足し忘れるとここでエラー
      return _exhaustive;
    }
  }
}
```
`kind` で分岐すると、その case の中では型が自動で絞り込まれる(`circle` の中では `radius` が使える)。
</details>

### Q7【第7章】`isNonEmptyString(x): x is string`
ユーザー定義型ガード。値が「空でない string」なら `true`。

<details><summary>解答例</summary>

```ts
function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.length > 0;
}
```
戻り値の型 `x is string` が型ガードの肝。`true` を返すと、呼び出し側で `x` が `string` に絞り込まれる。
</details>

### Q8【第8章】`lastItem<T>(arr)`
配列の最後の要素を返すジェネリック関数(空なら `undefined`)。

<details><summary>解答例</summary>

```ts
function lastItem<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}
```
型引数 `T` のおかげで、`number[]` を渡せば `number | undefined`、`string[]` なら `string | undefined` が返る。
</details>

### Q9【第8章】`pluck<T, K extends keyof T>(obj, key)`
オブジェクトとキーから値を取り出す。キーは `keyof` で「存在するキーだけ」に制約。

<details><summary>解答例</summary>

```ts
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```
`K extends keyof T` で不正なキーをコンパイル時に弾ける。戻り値 `T[K]` でキーごとの正確な型が返る。
</details>

### Q10【第9章】`countBy(items)`
文字列配列の出現回数を `Record<string, number>` で返す。

<details><summary>解答例</summary>

```ts
function countBy(items: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    result[item] = (result[item] ?? 0) + 1;
  }
  return result;
}
```
`Record<string, number>` は「キーが string・値が number のオブジェクト」を表す型。
</details>

### Q11【第10章】`class Stack<T>`
ジェネリックなスタック。`push` / `pop` / `size` を完成させる。

<details><summary>解答例</summary>

```ts
class Stack<T> {
  private items: T[] = [];
  push(item: T): void {
    this.items.push(item);
  }
  pop(): T | undefined {
    return this.items.pop();
  }
  size(): number {
    return this.items.length;
  }
}
```
`private items` で内部配列を隠蔽。`Stack<number>` のように使うと型安全になる。
</details>

### Q12【第11章】`delay(ms)` と `fetchUserName(id)`
`delay` は指定ミリ秒待つ `Promise<void>`、`fetchUserName` は 50ms 待って `` `user-${id}` `` を返す。

<details><summary>解答例</summary>

```ts
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function fetchUserName(id: number): Promise<string> {
  await delay(50);
  return `user-${id}`;
}
```
`setTimeout` を `Promise` で包むのが「待つ」処理の定番。`async` 関数は必ず `Promise` を返す。
</details>

### Q13【第12章・総合】`counterReducer(state, action)`
判別可能ユニオン `CounterAction` で分岐。`"inc"` は +1 / `"dec"` は -1 / `"set"` は `payload` をセット。

<details><summary>解答例</summary>

```ts
function counterReducer(state: number, action: CounterAction): number {
  switch (action.type) {
    case "inc":
      return state + 1;
    case "dec":
      return state - 1;
    case "set":
      return action.payload; // "set" の中でだけ payload が使える
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
```
Redux などの状態管理で実際に使われるパターン。`"set"` の case でだけ `payload` にアクセスできるのが判別可能ユニオンの威力。
</details>

---

## 🧩 型設計チャレンジ(おまけ・型だけの腕試し)

こちらは**型を書く**問題です。エディタや [Playground](https://www.typescriptlang.org/play) に書いて、`npm run check`(`tsc`)が通れば正解。実行はしません。

土台の型はこちら:

```ts
interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
}
```

### T1【第9章】`Product` から `description` を除いた型 `RequiredProduct` を作る

<details><summary>解答例</summary>

```ts
type RequiredProduct = Omit<Product, "description">;
// = { id: number; name: string; price: number }
```
</details>

### T2【第9章】`Product` の全プロパティを省略可能にした型 `ProductPatch`(更新用)

<details><summary>解答例</summary>

```ts
type ProductPatch = Partial<Product>;
// すべて ? 付きになる。部分更新の引数によく使う
```
</details>

### T3【第9章】`id` と `name` だけ取り出した型 `ProductSummary`

<details><summary>解答例</summary>

```ts
type ProductSummary = Pick<Product, "id" | "name">;
```
</details>

### T4【第9章】商品 ID をキー、`Product` を値にしたマップ型 `ProductMap`

<details><summary>解答例</summary>

```ts
type ProductMap = Record<number, Product>;
```
</details>

### T5【第8・9章】`keyof Product` の型は?(ユニオンで答える)

<details><summary>解答例</summary>

```ts
type ProductKeys = keyof Product;
// = "id" | "name" | "price" | "description"
```
</details>

### T6【第11章】`Promise<string>` から中身の型を取り出す

<details><summary>解答例</summary>

```ts
type Unwrapped = Awaited<Promise<string>>;
// = string(ネストした Promise も剥がせる)
```
</details>

---

## 🏅 自己採点の目安

| スコア | 目安 |
|---|---|
| 26 / 26 + 型チャレンジ全問 | 基礎は卒業。React+TS や Node+TS、[Type Challenges](https://github.com/type-challenges/type-challenges) へ |
| 20〜25 / 26 | あと少し。間違えた問の章をもう一度 |
| 〜19 / 26 | 該当章(各問に番号あり)を復習してから再挑戦 |

## 📌 次に学ぶこと

- **React + TypeScript** / **Node.js(API)+ TypeScript** — 実アプリで型を使う
- **AI エージェント開発(Vercel AI SDK + Zod)** — ここで学んだ型・ジェネリクス・判別可能ユニオンがそのまま効きます
- 公式 [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) / 日本語の [サバイバル TypeScript](https://typescriptbook.jp/)
