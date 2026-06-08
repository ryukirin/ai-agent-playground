# 第09章 ユーティリティ型

> TypeScript が標準で提供する「型を変換する関数」の集まり。既存の型から新しい型を作ることで、型の重複を避けながら安全なコードを書く。

## 🎯 この章のゴール

- `keyof`・`typeof`・インデックスアクセス型 `T[K]` という土台を理解する
- `Partial` / `Required` / `Readonly` / `Pick` / `Omit` / `Record` を使い分けられる
- `ReturnType` / `Parameters` / `NonNullable` / `Awaited` を実際の場面で使える
- ユーティリティ型が「型の世界だけの操作」であり実行時には何もしないことを理解する

---

## 土台 1：`keyof` — オブジェクト型のキーを取得

`keyof T` は型 `T` の全プロパティ名をリテラルユニオンとして返します。

```ts
type User = {
  id: number;
  name: string;
  email: string;
  active: boolean;
};

type UserKeys = keyof User;
// "id" | "name" | "email" | "active"
```

---

## 土台 2：型レベルの `typeof`

**値から型を取得する**のに使います。JS にも同名の演算子がありますが、型注釈の位置に書くと型を返す演算子になります。

```ts
const config = {
  host: "localhost",
  port: 3000,
  debug: true,
} as const;

type Config = typeof config;
// { readonly host: "localhost"; readonly port: 3000; readonly debug: true }
```

既存の値と同じ構造を別の変数に強制したいときに便利です。

---

## 土台 3：インデックスアクセス型 `T[K]`

「型 `T` のキー `K` の値の型」を取り出します。

```ts
type UserEmail = User["email"]; // string
type UserId    = User["id"];    // number

// ユニオンを使うと複数のキーをまとめて
type NameOrEmail = User["name" | "email"]; // string | string → string
```

---

## 1. `Partial<T>` — 全プロパティをオプションに

```ts
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; active?: boolean }
```

**よくある使い方：** 更新処理（PATCH リクエスト）の引数型として使い、変更したいフィールドだけ渡せるようにします。

```ts
function updateUser(id: number, patch: Partial<User>): void {
  console.log(`ユーザー ${id} を更新:`, patch);
}

updateUser(1, { name: "新しい名前" });         // OK
updateUser(2, { email: "new@example.com" });   // OK
```

---

## 2. `Required<T>` — 全プロパティを必須に

`Partial` の逆。オプションの `?` を全部外します。

```ts
type DraftPost = {
  title?: string;
  body?: string;
  tags?: string[];
};

type PublishedPost = Required<DraftPost>;
// { title: string; body: string; tags: string[] }
```

「入力途中は省略可だが、保存時は全部必須」という場面で使います。

---

## 3. `Readonly<T>` — 全プロパティを読み取り専用に

```ts
type ReadonlyUser = Readonly<User>;

const frozenUser: ReadonlyUser = { id: 1, name: "Alice", email: "a@e.com", active: true };

// @ts-expect-error 読み取り専用なので代入できない
frozenUser.name = "Bob";
```

**注意：** `Readonly<T>` は浅いコピーだけです。ネストしたオブジェクトの中は変更できます。

---

## 4. `Pick<T, K>` — 特定プロパティだけ残す

```ts
type UserPreview = Pick<User, "id" | "name">;
// { id: number; name: string }
```

API のレスポンス型を「公開して良いフィールドだけ」に絞るときによく使います。

---

## 5. `Omit<T, K>` — 特定プロパティを除いて残す

```ts
// 新規作成時は id がまだない
type NewUserInput = Omit<User, "id">;
// { name: string; email: string; active: boolean }
```

**Pick と Omit の使い分け：**

| 状況 | 型 |
|---|---|
| 残したいプロパティが少ない | `Pick<T, "a" \| "b">` |
| 除きたいプロパティが少ない | `Omit<T, "id">` |

---

## 6. `Record<K, V>` — キーと値の型でオブジェクト型を作る

```ts
type ScoreBoard = Record<string, number>;

const scores: ScoreBoard = { Alice: 95, Bob: 87 };
```

キーをリテラルユニオンに限定すると、キーの入力ミスを防げます：

```ts
type ColorCode = Record<"red" | "green" | "blue", string>;

const colors: ColorCode = {
  red:   "#FF0000",
  green: "#00FF00",
  blue:  "#0000FF",
  // 他のキーを追加しようとするとエラー
};
```

---

## 7. `ReturnType<F>` / `Parameters<F>`

### `ReturnType<F>` — 関数の戻り値の型を取得

```ts
function fetchUser(id: number): User { /* ... */ }

type FetchResult = ReturnType<typeof fetchUser>; // User
```

### `Parameters<F>` — 関数の引数の型をタプルで取得

```ts
type FetchParams = Parameters<typeof fetchUser>; // [id: number]
```

**実用例：** 既存の関数と同じシグネチャのラッパーを書くとき、引数型を手書きせずに再利用できます。

```ts
function cachedFetch(...args: Parameters<typeof fetchUser>): ReturnType<typeof fetchUser> {
  // キャッシュ確認してから fetchUser を呼ぶ
  return fetchUser(...args);
}
```

---

## 8. `NonNullable<T>`

`null` と `undefined` を型から除去します。

```ts
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // string
```

API のレスポンスが nullable なフィールドを持つとき、バリデーション後の安全な型として使えます。

---

## 9. `Awaited<T>` — Promise の解決型を取り出す

```ts
type ResolvedString = Awaited<Promise<string>>; // string

async function loadData(): Promise<{ items: string[] }> { /* ... */ }

type LoadResult = Awaited<ReturnType<typeof loadData>>;
// { items: string[] }
```

非同期関数の結果型を別の場所で再利用したいときに便利です。

---

## 10. ユーティリティ型の正体：マップ型

組み込みユーティリティ型は**マップ型**（型の世界のループ）で実装されています。`Partial<T>` を自作すると内部の仕組みが分かります：

```ts
type MyPartial<T> = {
  [K in keyof T]?: T[K];
  //  ↑ T の全キー K に対してループ
  //               ↑ ? でオプション
  //                  ↑ T[K] でその値の型
};
```

- `[K in keyof T]` ── 型レベルの for-of ループ
- `?` ── プロパティをオプションにする
- `T[K]` ── 元の型のそのキーの値の型を取得

実行時には何もしません。TypeScript がコンパイル時に型をチェックするだけです。

---

## 11. よく使う組み合わせパターン

### 「作成時はidなし、更新時はidあり残りオプション」

```ts
type CreateInput = Omit<User, "id">;
type UpdateInput = Pick<User, "id"> & Partial<Omit<User, "id">>;
// { id: number } & { name?: string; email?: string; active?: boolean }
```

### フォーム型（全フィールドが string）

```ts
type UserFormInput = Record<keyof User, string>;
// { id: string; name: string; email: string; active: string }
```

### nullable フィールドを一括で非 null に

```ts
type ApiUser = { name: string | null; bio: string | null | undefined };
type CleanUser = { [K in keyof ApiUser]: NonNullable<ApiUser[K]> };
// { name: string; bio: string }
```

---

## ⚠️ よくあるつまずき

**1. ユーティリティ型は実行時に何もしない**

型の世界だけの操作です。`Readonly<T>` を付けても実行時に freeze されるわけではありません。

```ts
const obj: Readonly<{ x: number }> = { x: 1 };
// TypeScript 上は代入できない (型エラー)
// でも JavaScript の実行時には普通のオブジェクト
(obj as { x: number }).x = 99; // 型エラーを回避すれば変更できてしまう
```

**2. `Partial` は浅い（ネストは変わらない）**

```ts
type Nested = { outer: { inner: string } };
type P = Partial<Nested>;
// outer? は省略可になるが、outer.inner は必須のまま
```

深い Partial が必要なら再帰的な型を自作するか、ライブラリを使います。

**3. `Pick` / `Omit` のキーはリテラル文字列が必要**

```ts
const key = "name";  // 型は string (widened)
// @ts-expect-error string は keyof User として使えない
type BadPick = Pick<User, typeof key>;

// 正しくは: as const でリテラル型を保つ
const key2 = "name" as const;  // 型は "name"
type GoodPick = Pick<User, typeof key2>;
```

**4. `ReturnType` / `Parameters` には `typeof` が必要**

```ts
function foo(): number { return 1; }

// @ts-expect-error foo (値) ではなく型が必要
type R = ReturnType<foo>;

// 正しくは typeof で型に変換してから渡す
type R2 = ReturnType<typeof foo>; // number
```

---

## ✍️ 練習問題

**問題 1：** 次の型 `Product` から、API で公開する用の `PublicProduct`（`price` と `stock` を除いた型）と、更新リクエスト用の `UpdateProductInput`（`id` は必須、残りはオプション）を定義してください。

```ts
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
};
```

<details><summary>解答例</summary>

```ts
type PublicProduct = Omit<Product, "price" | "stock">;
// { id: string; name: string; description: string }

type UpdateProductInput = Pick<Product, "id"> & Partial<Omit<Product, "id">>;
// { id: string; name?: string; description?: string; price?: number; stock?: number }

const pub: PublicProduct = { id: "p1", name: "TypeScript本", description: "入門書" };
console.log(pub.name);

const upd: UpdateProductInput = { id: "p1", price: 2800 };
console.log(upd.id, upd.price);
```

</details>

---

**問題 2：** `Record<string, number>` 型の成績表を受け取り、全員の点数を `+10` した新しい成績表を返す関数 `addBonus` を書いてください。戻り値型は `Record<string, number>` です。

<details><summary>解答例</summary>

```ts
function addBonus(scores: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [name, score] of Object.entries(scores)) {
    result[name] = score + 10;
  }
  return result;
}

const original = { Alice: 80, Bob: 70, Carol: 90 };
const bonused  = addBonus(original);
console.log(bonused); // { Alice: 90, Bob: 80, Carol: 100 }
```

</details>

---

**問題 3：** 関数 `processOrder` を受け取り、その引数型と戻り値型をそれぞれ `OrderParams`・`OrderResult` として型エイリアスで定義してください。

```ts
function processOrder(
  orderId: number,
  items: string[],
  options: { priority: boolean }
): { success: boolean; message: string } {
  return { success: true, message: `order ${orderId} processed` };
}
```

<details><summary>解答例</summary>

```ts
type OrderParams = Parameters<typeof processOrder>;
// [orderId: number, items: string[], options: { priority: boolean }]

type OrderResult = ReturnType<typeof processOrder>;
// { success: boolean; message: string }

// 使用例
const params: OrderParams = [1, ["itemA", "itemB"], { priority: true }];
const result: OrderResult = processOrder(...params);
console.log(result.message); // order 1 processed
```

</details>

---

**問題 4：** 次の `UserProfile` 型から、表示用の `UserCard`（`id`・`name`・`avatarUrl` だけ）と、設定画面用の `UserSettings`（`email`・`language`・`timezone` だけ）を `Pick` で定義してください。

```ts
type UserProfile = {
  id: number;
  name: string;
  avatarUrl: string;
  email: string;
  passwordHash: string;
  language: string;
  timezone: string;
};
```

<details><summary>解答例</summary>

```ts
type UserProfile = {
  id: number;
  name: string;
  avatarUrl: string;
  email: string;
  passwordHash: string;
  language: string;
  timezone: string;
};

type UserCard     = Pick<UserProfile, "id" | "name" | "avatarUrl">;
type UserSettings = Pick<UserProfile, "email" | "language" | "timezone">;

const card: UserCard = { id: 1, name: "Hina", avatarUrl: "https://example.com/hina.png" };
console.log(card.name); // Hina

const settings: UserSettings = { email: "hina@example.com", language: "ja", timezone: "Asia/Tokyo" };
console.log(settings.timezone); // Asia/Tokyo
```

`passwordHash` のような機密フィールドは `Pick` で選択しないことで型レベルで漏洩を防げます。

</details>

---

**問題 5：** 曜日をキーに持つ勤務時間マップ `WorkHours` を `Record` で定義し、週の合計勤務時間を返す関数 `totalHours` を書いてください。

- キー：`"Mon" | "Tue" | "Wed" | "Thu" | "Fri"`
- 値：`number`（時間）

<details><summary>解答例</summary>

```ts
type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
type WorkHours = Record<Weekday, number>;

function totalHours(hours: WorkHours): number {
  return Object.values(hours).reduce((sum, h) => sum + h, 0);
}

const myWeek: WorkHours = { Mon: 8, Tue: 7, Wed: 9, Thu: 8, Fri: 6 };
console.log(totalHours(myWeek)); // 38
```

`Record<Weekday, number>` とすることで、`"Mon"` 〜 `"Fri"` 以外のキーを追加しようとするとコンパイルエラーになります。

</details>

---

**問題 6：** 既存のオブジェクト `target` に変更を部分的に適用する関数 `applyPatch` を書いてください。`Partial<T>` を使い、`patch` に含まれるフィールドだけを上書きした新しいオブジェクトを返します。  
シグネチャ：`function applyPatch<T extends object>(target: T, patch: Partial<T>): T`

<details><summary>解答例</summary>

```ts
function applyPatch<T extends object>(target: T, patch: Partial<T>): T {
  return { ...target, ...patch };
}

type Config = { host: string; port: number; debug: boolean };

const defaults: Config = { host: "localhost", port: 3000, debug: false };
const patched = applyPatch(defaults, { port: 8080, debug: true });
console.log(patched); // { host: "localhost", port: 8080, debug: true }

// 指定しなかった host はそのまま保たれている
console.log(patched.host); // localhost
```

`Partial<T>` で `patch` の全フィールドをオプションにすることで、変えたいフィールドだけを渡せるようになります。スプレッドで後から渡した値が優先されます。

</details>

---

## 📌 まとめ

- **土台** `keyof T`・型の `typeof`・`T[K]` を押さえると多くのユーティリティ型の意味が分かる
- **変換系** `Partial` / `Required` / `Readonly` でプロパティの有無・書き込み可否を変える
- **選択系** `Pick` / `Omit` で「必要なものだけ」「不要なものを除いた」型を作る
- **生成系** `Record<K, V>` で辞書型を定義する
- **関数系** `ReturnType` / `Parameters` で既存関数の型を再利用する
- **絞り込み** `NonNullable` で null/undefined を除去、`Awaited` で Promise を展開する
- ユーティリティ型の正体は**マップ型**：`[K in keyof T]?: T[K]` のような型の変換操作
- これらは**型の世界だけ**で動く：実行時には何のコードも生成されない

---

## ▶ 動かす

```sh
npm run ch09
# または
npx tsx src/09_utility_types.ts
```
