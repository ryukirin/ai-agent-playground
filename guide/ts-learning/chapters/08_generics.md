# 第08章 ジェネリクス

> 「どんな型でも使える汎用関数・型」を、型安全を保ったまま書くための仕組み。`any` との違いから始め、実用パターンまで一気に習得する。

## 🎯 この章のゴール

- `any` を使うと型情報が失われる理由を説明できる
- `<T>` で型引数を受け取るジェネリック関数を書ける
- `extends` で型引数に制約をつけられる
- ジェネリックな型エイリアス・インターフェースで API ラッパー型などを設計できる
- 型引数の推論と明示指定を使い分けられる

---

## 1. なぜジェネリクスか：`any` の問題

「どんな型でも受け取れる」関数を書きたいとき、最初に思いつくのが `any` です。

```ts
function firstAny(arr: any[]): any {
  return arr[0];
}

const val = firstAny([1, 2, 3]);
// val の型は any → TypeScript は何も知らない
// 例えば val.toUpperCase() を書いても型エラーにならない（実行時にクラッシュ）
```

`any` は「型情報を捨てる」操作です。受け取った配列の要素型が何であれ、TypeScript はそれを追跡しなくなります。

---

## 2. 基本：`function identity<T>(x: T): T`

**型引数 `<T>`** は「呼び出し時に決まる型の変数」です。

```ts
function identity<T>(x: T): T {
  return x;
}

const n = identity(42);      // T = number に推論 → n: number
const s = identity("hello"); // T = string に推論 → s: string
```

型引数は引数の型から TypeScript が**自動推論**してくれます。明示することもできます：

```ts
const b = identity<boolean>(true); // 型を明示
```

---

## 3. ジェネリックな配列ユーティリティ：first / last

```ts
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

const firstNum = first([10, 20, 30]); // firstNum: number | undefined
const firstWord = first(["apple", "banana"]); // firstWord: string | undefined
```

`any[]` を使った版と違い、**戻り値の型が入力の配列の要素型と連動**します。`firstNum` が `number | undefined` であることを TypeScript が知っているので、その後の処理でも型チェックが効きます。

---

## 4. 複数の型引数 `<T, U>`

```ts
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const p1 = pair("age", 25);     // [string, number]
const p2 = pair(true, [1, 2]);  // [boolean, number[]]
```

型引数は何個でも追加できます。慣習的に `T, U, V` や、意味を込めて `TKey, TValue` のように書くことも多いです。

---

## 5. 型制約 `<T extends ...>`

型引数に制約を設けることで、「特定のプロパティやメソッドを持つ型」だけを受け入れられます。

```ts
// length プロパティがある型のみ受け付ける
function logLength<T extends { length: number }>(value: T): T {
  console.log(`length: ${value.length}`);
  return value;
}

logLength("hello");    // OK (string には length がある)
logLength([1, 2, 3]); // OK (配列には length がある)
// @ts-expect-error number には length がないのでエラー
logLength(42);
```

### `keyof` との組み合わせ

オブジェクトのプロパティ名を安全に扱うパターンです。

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Dave", age: 28 };
const name = getProperty(user, "name"); // string
const age  = getProperty(user, "age");  // number

// @ts-expect-error "email" は user のキーでない
getProperty(user, "email");
```

`K extends keyof T` は「`K` は `T` のキーのいずれかであれ」という制約です。

---

## 6. デフォルト型引数 `<T = string>`

型引数に省略時のデフォルトを指定できます。

```ts
type Container<T = string> = {
  value: T;
  label: string;
};

// T を省略 → T = string として扱われる
const c1: Container = { value: "hello", label: "テキスト" };

// T を明示 → その型になる
const c2: Container<number> = { value: 42, label: "数値" };
```

ライブラリの型定義でよく見かけるパターンです。

---

## 7. ジェネリックな型エイリアス・インターフェース

### API レスポンスのラッパー型

実務でよく書くパターンです。成功・失敗を同一の構造で表しつつ、成功時のデータ型だけをジェネリクスで変えます。

```ts
type ApiResponse<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
};

function createSuccess<T>(data: T): ApiResponse<T> {
  return { ok: true, data, error: null };
}

function createError<T>(message: string): ApiResponse<T> {
  return { ok: false, data: null, error: message };
}
```

使い方：

```ts
type UserDto = { id: number; name: string };
const userRes: ApiResponse<UserDto> = createSuccess({ id: 1, name: "Eve" });
const listRes: ApiResponse<number[]> = createSuccess([10, 20, 30]);
```

同じ `createSuccess` / `createError` で、ユーザー情報にも数値リストにも対応できます。

### ジェネリックインターフェース

```ts
interface Stack<T> {
  push(item: T): void;
  pop(): T | undefined;
  size: number;
}
```

インターフェースにも型引数を付けられます。クラスによる実装は第10章で詳しく扱います。

---

## 8. 型引数の推論と明示指定

### 推論が効く場合（多くのケース）

引数から型を確定できる場合は推論に任せます：

```ts
const result = first([100, 200, 300]); // T = number と推論
```

### 明示が必要な場合

引数だけでは型が決まらない場合は明示します：

```ts
// createError の T は引数から決まらない → 明示する
const err = createError<string[]>("エラー");
```

### 推論と明示の使い分け

| 状況 | 推奨 |
|---|---|
| 引数から型が自明に決まる | 推論に任せる |
| 戻り値の型だけを指定したい | 明示 |
| 推論結果が意図と違う（広すぎる） | 明示 |

---

## ⚠️ よくあるつまずき

**1. ジェネリクスを使わず `any` に逃げる**

`any` を使うとその変数からの型情報が全部消えます。ジェネリクスなら型を保ちながら汎用性を得られます。

**2. 型引数は「実行時に存在しない」**

ジェネリクスは TypeScript のコンパイル時専用の仕組みです。JavaScript に変換されると消えます。実行時に型チェックをしたい場合は型ガード（第7章）を使います。

**3. 制約を忘れて型エラーになる**

```ts
function bad<T>(arr: T[]): number {
  // @ts-expect-error T に length があるか分からないのでエラー
  return arr[0].length; // T が string や配列とは限らない
}

// 修正: 制約を追加する
function good<T extends { length: number }>(arr: T[]): number {
  return arr[0].length; // OK
}
```

**4. 型引数の数を減らせないか考える**

`<T, U>` より `<T>` で済む設計の方がシンプルです。型引数が増えすぎたら設計を見直すサインです。

---

## ✍️ 練習問題

**問題 1：** 2 つの値を受け取り、条件関数が true を返す方を返すジェネリック関数 `pick` を書いてください。  
シグネチャ：`function pick<T>(a: T, b: T, condition: (x: T) => boolean): T`

<details><summary>解答例</summary>

```ts
function pick<T>(a: T, b: T, condition: (x: T) => boolean): T {
  return condition(a) ? a : b;
}

const bigger = pick(10, 20, x => x > 15);
console.log(bigger); // 20

const longer = pick("hi", "hello", x => x.length > 3);
console.log(longer); // hello
```

</details>

---

**問題 2：** 型引数 `T` と `U` を受け取り、`T[]` の各要素を `U` に変換する `myMap` 関数を書いてください。（`Array.prototype.map` の自作版です）

<details><summary>解答例</summary>

```ts
function myMap<T, U>(arr: T[], fn: (item: T) => U): U[] {
  const result: U[] = [];
  for (const item of arr) {
    result.push(fn(item));
  }
  return result;
}

const lengths = myMap(["apple", "banana", "cherry"], s => s.length);
console.log(lengths); // [5, 6, 6]

const doubled = myMap([1, 2, 3], n => n * 2);
console.log(doubled); // [2, 4, 6]
```

</details>

---

**問題 3：** `type ApiResponse<T>` を使って、`GET /users/:id` の成功・失敗をそれぞれ表す値を作ってください。成功時は `{ id: number; name: string; email: string }` を持ち、失敗時は `code: 404` のエラーメッセージを持つものとします。

<details><summary>解答例</summary>

```ts
type ApiResponse<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
};

type UserDetail = { id: number; name: string; email: string };

const successRes: ApiResponse<UserDetail> = {
  ok: true,
  data: { id: 1, name: "Frank", email: "frank@example.com" },
  error: null,
};

const errorRes: ApiResponse<UserDetail> = {
  ok: false,
  data: null,
  error: "404: ユーザーが見つかりません",
};

console.log(successRes.data?.name); // Frank
console.log(errorRes.error);        // 404: ユーザーが見つかりません
```

</details>

---

**問題 4：** 配列を受け取り、重複を取り除いた新しい配列を返すジェネリック関数 `unique` を書いてください。  
シグネチャ：`function unique<T>(arr: T[]): T[]`（`Set` を使って実装してください）

<details><summary>解答例</summary>

```ts
function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

const nums = unique([1, 2, 2, 3, 1, 4]);
console.log(nums); // [1, 2, 3, 4]

const words = unique(["apple", "banana", "apple", "cherry"]);
console.log(words); // ["apple", "banana", "cherry"]
```

`Set` に渡すと重複が自動で除去されます。スプレッド構文で配列に戻せば完成です。

</details>

---

**問題 5：** オブジェクト `T` とキーの集合 `K extends keyof T` を受け取り、指定したキーのみを含む新しいオブジェクトを返すジェネリック関数 `pickKeys` を書いてください。  
シグネチャ：`function pickKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`

<details><summary>解答例</summary>

```ts
function pickKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

const user = { id: 1, name: "Grace", email: "grace@example.com", active: true };

const preview = pickKeys(user, ["id", "name"]);
console.log(preview); // { id: 1, name: "Grace" }

// @ts-expect-error "password" は user のキーでないのでエラー
pickKeys(user, ["password"]);
```

`K extends keyof T` の制約により、存在しないキーを渡すとコンパイルエラーになります。

</details>

---

**問題 6：** 成功と失敗を表すジェネリック型 `Result<T, E = string>` を定義し、成功値または失敗値を受け取る `match` 関数を書いてください。

```ts
// 定義するイメージ
type Result<T, E = string> = /* ... */;
```

- 成功時は `{ ok: true; value: T }`
- 失敗時は `{ ok: false; error: E }`
- `match<T, E>(result: Result<T, E>, onOk: (v: T) => void, onErr: (e: E) => void): void` を実装する

<details><summary>解答例</summary>

```ts
type Result<T, E = string> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

function match<T, E>(
  result: Result<T, E>,
  onOk: (v: T) => void,
  onErr: (e: E) => void
): void {
  if (result.ok) {
    onOk(result.value);
  } else {
    onErr(result.error);
  }
}

const success: Result<number> = { ok: true, value: 42 };
const failure: Result<number> = { ok: false, error: "計算に失敗しました" };

match(success, v => console.log("成功:", v), e => console.log("失敗:", e));
// 成功: 42
match(failure, v => console.log("成功:", v), e => console.log("失敗:", e));
// 失敗: 計算に失敗しました
```

デフォルト型引数 `E = string` により `Result<number>` だけで失敗型を省略できます。

</details>

---

## 📌 まとめ

- **ジェネリクスは「型の変数」**：`<T>` で宣言し、呼び出し時に具体的な型に確定する
- `any` と違い、**型情報を保持したまま汎用化**できる
- `<T, U>` で複数の型引数を持てる
- `<T extends ...>` で制約を付け、特定のプロパティやメソッドを使えるようにする
- `<T = string>` でデフォルト型引数を指定できる
- 型エイリアス・インターフェースにも型引数を付けられる（`ApiResponse<T>` など）
- **推論に任せられる場合は明示しない**；型が決まらない場合は明示する
- ジェネリクスは**コンパイル時専用**：実行時には消える

---

## ▶ 動かす

```sh
npm run ch08
# または
npx tsx src/08_generics.ts
```
