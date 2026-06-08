# 第12章 モジュールと総合練習

> import/export の仕組みと `.d.ts` / `@types` の役割を理解し、これまで学んだ TypeScript の機能を使った小さなアプリで締めくくります。

## 🎯 この章のゴール

- named export / default export / `import type` の違いを説明できる
- `.d.ts` ファイルと `@types/*` がなぜ必要かを理解する
- `strict` 系オプションの意味を把握する
- 判別可能ユニオン・ジェネリクス・ユーティリティ型を組み合わせた設計ができる

---

## import / export の基本

### named export(名前付きエクスポート)

```ts
// math.ts
export const PI = 3.14159;

export function add(a: number, b: number): number {
  return a + b;
}

export type MathResult = { value: number; operation: string };
```

```ts
// main.ts
import { PI, add, type MathResult } from "./math.js";

const result: MathResult = { value: add(1, 2), operation: "add" };
console.log(PI, result);
```

### default export(デフォルトエクスポート)

```ts
// greeter.ts
export default function greet(name: string): string {
  return `こんにちは、${name}！`;
}
```

```ts
// main.ts
import greet from "./greeter.js";   // 好きな名前で受け取れる
import myGreet from "./greeter.js"; // 別の名前でもOK
```

named export は「モジュールの公開 API が明確」で、`import *` や re-export がしやすいため、ライブラリでは named export が主流です。default export は「このファイルの主役が 1 つ」のときに使います。

### `import type` — 型だけを取り込む

```ts
// 型だけ使いたいとき
import type { MathResult } from "./math.js";

// ↑ コンパイル後の JS には残らない。バンドルサイズに影響しない
```

`import type` は型情報をコンパイル時だけに使い、実行時のコードには何も生成しません。`strict` と相性がよく、型と値を明確に区別できます。

---

## モジュール解決のごく軽い話

TypeScript が `import "./foo"` を見たとき、「どのファイルを読むか」を決めるのがモジュール解決です。

今回の `tsconfig.json` は `moduleResolution: "Bundler"` なので、`.ts` 拡張子も解決できます。本番バンドラー(Vite / webpack 等)と同じ動作を想定しています。

`moduleDetection: "force"` は「各ファイルを必ずモジュール(ESM)として扱う」設定です。これがないと、`export` のないファイルはグローバルスクリプトとして扱われ、変数名の衝突が起きることがあります。

---

## 型定義ファイル `.d.ts` と `@types/*`

### なぜ必要か

JavaScript で書かれたライブラリには型情報がありません。TypeScript がそのライブラリを使うとき、型チェックができません。そこで登場するのが **型定義ファイル(`.d.ts`)** です。

```
ライブラリ(JS) + 型定義ファイル(.d.ts) = TypeScript から型安全に使える
```

### `@types/*` パッケージ

DefinitelyTyped コミュニティが主要な JS ライブラリの `.d.ts` を管理しています。

```sh
npm install --save-dev @types/node   # Node.js の型定義
npm install --save-dev @types/react  # React の型定義
```

インストールすると TypeScript コンパイラが自動的に読み込み、型補完・型チェックが効くようになります。このプロジェクトでは `@types/node` が入っているので `process.env` や `Buffer` に型が付きます。

### ライブラリが型を同梱している場合

最近の多くのライブラリは `package.json` の `types` または `exports` フィールドで `.d.ts` を同梱しています(例: TypeScript 自身、Zod、Vite)。その場合は `@types/*` は不要です。

---

## `strict` 系オプションの意味

`strict: true` は以下を一括で有効にします:

| オプション | 意味 |
|-----------|------|
| `strictNullChecks` | `null` / `undefined` を他の型と区別する。最重要 |
| `strictFunctionTypes` | 関数の引数型を反変チェックする |
| `strictBindCallApply` | `bind` / `call` / `apply` の引数を型チェックする |
| `strictPropertyInitialization` | クラスプロパティが初期化されていない場合エラー |
| `noImplicitAny` | 型推論できない場合の暗黙の `any` を禁止 |
| `noImplicitThis` | `this` の型が不明な場合エラー |
| `useUnknownInCatchVariables` | `catch` の変数を `unknown` にする(TS 4.4+) |

`strictNullChecks` が最も影響が大きく、`string | null` と `string` が明確に区別されます。これにより「うっかり null を使ってしまう」バグをコンパイル時に検出できます。

---

## 総合ミニアプリ: 型安全なタスク管理

これまで学んだ以下の要素を組み合わせます:

- **判別可能ユニオン**(第7章): タスクの状態を型安全に表現
- **ジェネリクス**(第8章): 汎用のリポジトリ関数
- **ユーティリティ型**(第9章): `Readonly<T>` / `Pick<T, K>` / `Omit<T, K>`
- **クラス**(第10章): タスク管理クラス
- **非同期処理**(第11章): 保存・取得の模擬非同期

### 設計

```ts
// 判別可能ユニオンでタスク状態を表現
type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  createdAt: Date;
}
```

タスクの追加・状態変更・集計を型安全に行うミニアプリです。詳細は `src/12_modules_and_practice.ts` を参照してください。

---

## 次に学ぶこと

TypeScript の基礎を習得したら、次のステップへ進みましょう:

### フレームワーク連携
- **React + TypeScript**: コンポーネントの props に型を付け、イベントハンドラを型安全に書く。[公式ドキュメント](https://react.dev/learn/typescript)
- **Node.js + TypeScript**: `@types/node` と `tsx` / `ts-node` でサーバーサイドを書く

### 型をもっと深く
- **[Type Challenges](https://github.com/type-challenges/type-challenges)**: 型パズルで型システムの深さを体感する(easy から始めよう)
- **[TypeScript 公式 Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)**: 公式の包括的な解説

### 実務でよく使う技術
- **Zod**: ランタイムバリデーション + 型推論。`fetch` の結果を安全に型付け
- **ESLint + typescript-eslint**: 静的解析でコード品質を保つ
- **Vitest / Jest**: `@types/jest` で型付きのテストを書く

---

## ⚠️ よくあるつまずき

1. **ESM の拡張子問題**: `module: "ESNext"` のとき、Node.js で動かすには `.js` 拡張子が必要なことがあります(`.ts` でも `tsx` は解決してくれますが、`node` 直接実行では `.js` が必要)。`tsx` や `ts-node` を使えば開発中は気にしなくて大丈夫です。

2. **`export default` の名前が変わる**: `import greet from "./greeter.js"` と書いた場合、ファイル名を変えても `import` 文を変えなくていいのは便利ですが、「何がエクスポートされているか」が分かりにくくなります。チームでは named export を優先するのが一般的です。

3. **`@types/*` と本体のバージョン不一致**: `@types/node@22` は Node.js 22 向けです。本体と `@types` のメジャーバージョンを揃えておくと型の不一致が起きにくくなります。

---

## ✍️ 練習問題

### 問題1

`Result<T, E>` 型を定義してください。成功を `{ ok: true; value: T }` 、失敗を `{ ok: false; error: E }` で表す判別可能ユニオンです。この型を使って「割り算する関数(0除算はエラー)」を実装してください。

<details><summary>解答例</summary>

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function safeDivide(a: number, b: number): Result<number, string> {
  if (b === 0) return { ok: false, error: "0で割ることはできません" };
  return { ok: true, value: a / b };
}

const r1 = safeDivide(10, 2);
const r2 = safeDivide(5, 0);

if (r1.ok) console.log("結果:", r1.value); // 5
if (!r2.ok) console.log("エラー:", r2.error); // 0で割ることはできません
```

</details>

### 問題2

`createRepository<T extends { id: number }>` というジェネリクス関数を実装してください。`findById(id: number): T | undefined` と `add(item: T): void` と `getAll(): readonly T[]` を持つオブジェクトを返します。

<details><summary>解答例</summary>

```ts
function createRepository<T extends { id: number }>() {
  const items: T[] = [];
  return {
    add(item: T): void { items.push(item); },
    findById(id: number): T | undefined {
      return items.find((i) => i.id === id);
    },
    getAll(): readonly T[] { return items; },
  };
}

interface Product { id: number; name: string; price: number }
const repo = createRepository<Product>();
repo.add({ id: 1, name: "リンゴ", price: 150 });
repo.add({ id: 2, name: "バナナ", price: 100 });
console.log(repo.findById(1)); // { id: 1, name: 'リンゴ', price: 150 }
console.log(repo.getAll().length); // 2
```

</details>

### 問題3

以下の `User` 型から、`UpdateUserInput` 型(id を除き、すべてのプロパティをオプショナルに)と `PublicUser` 型(password を除く)を **ユーティリティ型だけで** 定義してください。

```ts
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}
```

<details><summary>解答例</summary>

```ts
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// Omit で id を除いてから Partial でオプショナルに
type UpdateUserInput = Partial<Omit<User, "id">>;

// Omit で password を除く
type PublicUser = Omit<User, "password">;

const update: UpdateUserInput = { name: "新しい名前" }; // 部分更新OK
const pub: PublicUser = { id: 1, name: "田中", email: "t@example.com" };
console.log(update, pub);
```

</details>

### 問題4

次のコードの空欄(A)〜(D)を埋めて、`import` / `export` / `import type` の使い方を完成させてください。

```ts
// shapes.ts
/* (A) */ const PI = 3.14159;
/* (A) */ function circleArea(r: number): number { return PI * r * r; }
/* (A) */ type Shape = { kind: string; area: number };

/* (B) */ function formatShape(s: Shape): string {
  return `${s.kind}: 面積 ${s.area.toFixed(2)}`;
}
```

```ts
// main.ts
/* (C) */ { PI, circleArea } from "./shapes.js";
/* (D) */ { Shape } from "./shapes.js";  // 値は不要、型だけ使いたい

const s: Shape = { kind: "円", area: circleArea(5) };
console.log(PI);           // 3.14159
console.log(formatShape(s)); // 円: 面積 78.54
```

(A): named export / default export のどちらか、(B): default export、(C): named import の構文、(D): 型だけを import する構文をそれぞれ答えてください。

<details><summary>解答例</summary>

```ts
// (A) named export — 複数のシンボルを個別にエクスポート
export const PI = 3.14159;
export function circleArea(r: number): number { return PI * r * r; }
export type Shape = { kind: string; area: number };

// (B) default export — モジュールの主役として1つだけ
export default function formatShape(s: Shape): string {
  return `${s.kind}: 面積 ${s.area.toFixed(2)}`;
}
```

```ts
// (C) named import
import { PI, circleArea } from "./shapes.js";
// (D) import type — コンパイル後のJSに何も残らない
import type { Shape } from "./shapes.js";
// default export は好きな名前で受け取る
import formatShape from "./shapes.js";
```

named export は `export` を各宣言に付け、`import { 名前 }` で受け取る。型だけなら `import type` を使うとバンドル最適化に有効。default export は1ファイルに1つだけで、受け取り側の名前は自由。

</details>

---

### 問題5

判別可能ユニオンとユーティリティ型を組み合わせてください。

```ts
type Notification =
  | { type: "email"; to: string; subject: string; body: string }
  | { type: "sms"; to: string; message: string }
  | { type: "push"; deviceId: string; title: string; body: string };
```

この型を使って以下を実装してください。
1. `formatNotification(n: Notification): string` — `type` で分岐して内容を人間が読みやすい文字列に変換する
2. `EmailDraft` 型を **ユーティリティ型だけで** 定義する:email の `Notification` から `type` を除き、`subject` と `body` だけオプショナルにした型

<details><summary>解答例</summary>

```ts
type Notification =
  | { type: "email"; to: string; subject: string; body: string }
  | { type: "sms"; to: string; message: string }
  | { type: "push"; deviceId: string; title: string; body: string };

function formatNotification(n: Notification): string {
  switch (n.type) {
    case "email":
      return `[メール] 宛先: ${n.to} / 件名: ${n.subject}`;
    case "sms":
      return `[SMS] 宛先: ${n.to} / 本文: ${n.message}`;
    case "push":
      return `[プッシュ] デバイス: ${n.deviceId} / タイトル: ${n.title}`;
  }
}

// Extract で email のメンバだけ取り出し、Omit で type を除き、
// 必須フィールド(to)はそのまま、subject と body は Partial で wrap
type EmailBase = Omit<Extract<Notification, { type: "email" }>, "type">;
type EmailDraft = Omit<EmailBase, "subject" | "body"> &
  Partial<Pick<EmailBase, "subject" | "body">>;

const draft: EmailDraft = { to: "user@example.com" }; // subject/body は省略可
console.log(formatNotification({ type: "sms", to: "090-0000-0000", message: "テスト" }));
// [SMS] 宛先: 090-0000-0000 / 本文: テスト
```

`switch` の全ケース網羅(exhaustive check)を型システムが保証する。`Extract<Union, { type: "email" }>` でユニオンの特定メンバを取り出し、`Omit` / `Partial` / `Pick` を組み合わせて派生型を作れる。

</details>

---

### 問題6

これまでの総合問題です。簡単なバリデーション関数を実装してください。

```ts
type ValidationError = { field: string; message: string };
type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: ValidationError[] };
```

この型を使って `validateUser(input: unknown): ValidationResult<{ name: string; age: number }>` を実装してください。ルール:
- `input` がオブジェクトでない → `[{ field: "input", message: "オブジェクトではありません" }]`
- `name` が文字列でない or 空 → `[{ field: "name", message: "名前は必須です" }]`
- `age` が 0〜120 の整数でない → `[{ field: "age", message: "年齢は0〜120の整数です" }]`
- 複数エラーがある場合はすべてまとめて返す

<details><summary>解答例</summary>

```ts
type ValidationError = { field: string; message: string };
type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: ValidationError[] };

function validateUser(
  input: unknown,
): ValidationResult<{ name: string; age: number }> {
  if (typeof input !== "object" || input === null) {
    return { valid: false, errors: [{ field: "input", message: "オブジェクトではありません" }] };
  }

  const errors: ValidationError[] = [];
  const obj = input as Record<string, unknown>;

  if (typeof obj["name"] !== "string" || obj["name"].trim() === "") {
    errors.push({ field: "name", message: "名前は必須です" });
  }

  const age = obj["age"];
  if (typeof age !== "number" || !Number.isInteger(age) || age < 0 || age > 120) {
    errors.push({ field: "age", message: "年齢は0〜120の整数です" });
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: { name: obj["name"] as string, age: obj["age"] as number } };
}

const r1 = validateUser({ name: "田中", age: 25 });
if (r1.valid) console.log("OK:", r1.data); // OK: { name: '田中', age: 25 }

const r2 = validateUser({ name: "", age: 200 });
if (!r2.valid) console.log("NG:", r2.errors);
// NG: [{ field: 'name', ... }, { field: 'age', ... }]
```

判別可能ユニオン(`valid` タグ)で成功/失敗を型安全に表現し、複数エラーを配列で収集するパターン。`unknown` を型ガードで絞り込むことで `any` なしに扱える。

</details>

---

## 📌 まとめ

- named export が主流。`import type` で型だけを取り込める
- `.d.ts` / `@types/*` が JS ライブラリと TypeScript を橋渡しする
- `strict: true` で最も重要なのは `strictNullChecks`—null/undefined の扱いが厳格になる
- 判別可能ユニオン × ジェネリクス × ユーティリティ型の組み合わせで表現力豊かな型設計ができる
- 次は React/Node.js + TS、Type Challenges、公式 Handbook へ!

## ▶ 動かす

```sh
npm run ch12
# または
npx tsx src/12_modules_and_practice.ts
```
