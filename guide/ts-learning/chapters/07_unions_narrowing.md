# 第07章 ユニオン型・絞り込み・判別可能ユニオン

> TypeScript の「型の分岐」を学ぶ章。ユニオン型で複数の型を扱い、絞り込みで安全に使い、判別可能ユニオンで複雑な状態を表現する。

## 🎯 この章のゴール

- `string | number` のようなユニオン型と `A & B` の交差型を書ける
- `typeof`・`in`・`instanceof`・型ガードで型を絞り込める
- 判別可能ユニオン（discriminated union）でオブジェクトの種別を安全に扱える
- `never` を使った網羅性チェックで将来の変更漏れを防げる

---

## 1. ユニオン型 `A | B`

ユニオン型は「A か B のどちらか」を表す型です。

```ts
function printId(id: string | number): void {
  console.log("ID:", id);
}

printId(42);      // OK
printId("abc-1"); // OK
// @ts-expect-error boolean は含まれない
printId(true);    // 型エラー
```

`|` で繋いだどの型も受け付けます。3 つ以上も普通です：`string | number | boolean`。

---

## 2. 交差型 `A & B`

交差型は「A の性質も B の性質も持つ」型を作ります。

```ts
type HasName = { name: string };
type HasAge  = { age: number };
type Person  = HasName & HasAge;  // 両方必須

const alice: Person = { name: "Alice", age: 30 };
```

ユニオンが「または」、交差が「かつ」と覚えると分かりやすいです。

---

## 3. リテラル型とリテラルユニオン

文字列や数値の**特定の値**を型として使えます。

```ts
type Direction = "north" | "south" | "east" | "west";
const dir: Direction = "north"; // OK

// @ts-expect-error リテラルユニオン外の値はエラー
const bad: Direction = "up";
```

```ts
type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;
const roll: DiceValue = 3; // OK
```

### ⚠️ widening（型の拡大）に注意

```ts
const a = "north";           // 型は string（型注釈なしだと広がる）
const b: Direction = "north"; // 型は "north" のままに保たれる
```

---

## 4. 型の絞り込み（narrowing）

ユニオン型の変数は「その型で確実に使える操作」しかできません。TypeScript が OK かどうかを判断するには、**型を絞り込む（narrowing）**必要があります。

### 4-1. `typeof` チェック

```ts
function describe(value: string | number): string {
  if (typeof value === "string") {
    // ここでは value は string と確定 → toUpperCase() が使える
    return `文字列: ${value.toUpperCase()}`;
  }
  // ここでは value は number と確定 → * が使える
  return `数値の2倍: ${value * 2}`;
}

console.log(describe("hello")); // 文字列: HELLO
console.log(describe(21));      // 数値の2倍: 42
```

TypeScript は if 文の条件を解析して、各ブランチの型を自動で絞り込みます。これが narrowing の本質です。

### 4-2. truthiness チェック

`null | undefined` を除外するのに便利です。

```ts
function greet(name: string | null): string {
  if (name) {
    return `こんにちは、${name}さん`; // name は string と確定
  }
  return "こんにちは、ゲストさん";
}
```

### 4-3. `===` 比較

```ts
type Status = "ok" | "error" | "loading";

function handleStatus(s: Status): void {
  if (s === "ok") {
    console.log("成功!");
  } else if (s === "error") {
    console.log("エラーが発生しました");
  } else {
    // s は "loading" と確定
    console.log("読み込み中...");
  }
}
```

### 4-4. `in` 演算子

オブジェクト型のユニオンで、特定のプロパティの有無をチェックします。

```ts
type Cat = { meow(): void };
type Dog = { bark(): void };

function makeSound(animal: Cat | Dog): void {
  if ("meow" in animal) {
    animal.meow(); // Cat と確定
  } else {
    animal.bark(); // Dog と確定
  }
}
```

### 4-5. `instanceof` チェック

クラスのインスタンスかどうかを確認します。

```ts
function formatError(err: Error | string): string {
  if (err instanceof Error) {
    return `エラーオブジェクト: ${err.message}`; // Error と確定
  }
  return `文字列エラー: ${err}`;
}
```

---

## 5. ユーザー定義型ガード `x is T`

`typeof` や `instanceof` で対処できない場合は、自分で型ガード関数を書きます。

```ts
type Fish = { swim(): void };
type Bird = { fly(): void };

// 戻り値型に "value is Fish" と書くのが型ガードのシグネチャ
function isFish(value: Fish | Bird): value is Fish {
  return "swim" in value;
}

function move(creature: Fish | Bird): void {
  if (isFish(creature)) {
    creature.swim(); // Fish と確定
  } else {
    creature.fly();  // Bird と確定
  }
}
```

`unknown` 型と組み合わせると外部データの検証に使えます。

```ts
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(v => typeof v === "string");
}
```

---

## 6. 判別可能ユニオン（discriminated union）★最重要★

**タグ（判別子）となるリテラル型のプロパティ**を持つオブジェクトのユニオンを、判別可能ユニオンと呼びます。TypeScript が switch 文でタグを見るだけで各ブランチの型を自動確定してくれます。

### なぜこのパターンが重要か

アプリが持つ「複数の状態」を型安全に表現するのに最も実用的なパターンです。

```ts
type ApiSuccess = {
  kind: "success"; // ← タグ（判別子）
  data: string[];
};

type ApiError = {
  kind: "error";
  message: string;
  code: number;
};

type ApiLoading = {
  kind: "loading";
};

type ApiResult = ApiSuccess | ApiError | ApiLoading;
```

```ts
function renderResult(result: ApiResult): string {
  switch (result.kind) {
    case "success":
      // result は ApiSuccess と確定 → result.data が使える
      return `成功: ${result.data.join(", ")}`;
    case "error":
      // result は ApiError と確定 → result.message, result.code が使える
      return `エラー(${result.code}): ${result.message}`;
    case "loading":
      return "読み込み中...";
  }
}
```

実行例：
```
成功: A, B, C
エラー(401): 未認証
読み込み中...
```

### 形状の例

```ts
type Square   = { shape: "square";   side: number };
type Circle   = { shape: "circle";   radius: number };
type Triangle = { shape: "triangle"; base: number; height: number };
type Shape = Square | Circle | Triangle;

function area(s: Shape): number {
  switch (s.shape) {
    case "square":   return s.side ** 2;
    case "circle":   return Math.PI * s.radius ** 2;
    case "triangle": return (s.base * s.height) / 2;
  }
}
```

**ポイント：**
- タグのプロパティ名は `kind` / `type` / `shape` など何でも OK、一貫していれば良い
- タグの値はそれぞれ異なるリテラル型にする
- switch の各ブランチで型が確定するので、存在しないプロパティへのアクセスをコンパイル時に防げる

---

## 7. 網羅性チェックと `never`

`never` 型は「到達できないはず」を表します。switch の default ブランチで `never` への代入を使うと、将来 variant が増えたとき**コンパイルエラーで気付けます**。

```ts
function areaWithCheck(s: Shape): number {
  switch (s.shape) {
    case "square":   return s.side ** 2;
    case "circle":   return Math.PI * s.radius ** 2;
    case "triangle": return (s.base * s.height) / 2;
    default: {
      // ここに来たら s は never のはず
      // Shape に新しい variant が追加されると、ここで型エラーになる
      const _exhaustive: never = s;
      throw new Error(`未対応の形状: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
```

もし `Shape` に `type Rectangle = { shape: "rectangle"; ... }` を追加したら、default ブランチで `never` への代入が型エラーになり「case "rectangle" を追加し忘れているよ」と教えてくれます。

---

## ⚠️ よくあるつまずき

**1. ユニオン型で共通プロパティ以外を直接使おうとする**

```ts
function bad(x: string | number): void {
  // @ts-expect-error number には toUpperCase がない → narrowing なしには使えない
  x.toUpperCase();
}
```

narrowing（typeof チェックなど）の後なら使えます。

**2. `|` を関数の引数の型に書き忘れて `any` になる**

`strict: true` では暗黙の `any` はエラーになります。型を明示しましょう。

**3. タグのないオブジェクトユニオンは絞り込みが難しい**

```ts
// NG: タグなしだと switch で絞り込めない
type A = { x: number };
type B = { y: string };
```

オブジェクトのユニオンを作るときは最初から判別子を設計すると楽になります。

**4. 型ガードの戻り値型を書き忘れると boolean になる**

`value is Fish` が型ガードのシグネチャです。`boolean` のままだと narrowing が機能しません。

---

## ✍️ 練習問題

**問題 1：** `string | number | boolean` を受け取り、それぞれ「文字列」「数値」「真偽値」と type of 結果を返す関数 `typeLabel` を書いてください。

<details><summary>解答例</summary>

```ts
function typeLabel(x: string | number | boolean): string {
  if (typeof x === "string")  return "文字列";
  if (typeof x === "number")  return "数値";
  return "真偽値";
}
console.log(typeLabel("hi"));  // 文字列
console.log(typeLabel(42));    // 数値
console.log(typeLabel(true));  // 真偽値
```

</details>

---

**問題 2：** 以下の判別可能ユニオンに `Withdrawn`（kind: "withdrawn", amount: number）を追加し、`summarize` 関数に case を追加してください。network が `never` チェックを持っていれば追加し忘れたときにエラーになることも確認してみましょう。

```ts
type Deposit  = { kind: "deposit";  amount: number };
type Transfer = { kind: "transfer"; amount: number; to: string };
type Transaction = Deposit | Transfer;

function summarize(t: Transaction): string {
  switch (t.kind) {
    case "deposit":  return `入金: ${t.amount}円`;
    case "transfer": return `送金: ${t.amount}円 → ${t.to}`;
    default: {
      const _: never = t;
      throw new Error("未対応");
    }
  }
}
```

<details><summary>解答例</summary>

```ts
type Deposit    = { kind: "deposit";   amount: number };
type Transfer   = { kind: "transfer";  amount: number; to: string };
type Withdrawn  = { kind: "withdrawn"; amount: number };
type Transaction = Deposit | Transfer | Withdrawn;

function summarize(t: Transaction): string {
  switch (t.kind) {
    case "deposit":   return `入金: ${t.amount}円`;
    case "transfer":  return `送金: ${t.amount}円 → ${t.to}`;
    case "withdrawn": return `出金: ${t.amount}円`;
    default: {
      const _: never = t;
      throw new Error("未対応");
    }
  }
}

console.log(summarize({ kind: "deposit", amount: 10000 }));
// 入金: 10000円
console.log(summarize({ kind: "withdrawn", amount: 3000 }));
// 出金: 3000円
```

</details>

---

**問題 3：** `unknown` を受け取り、それが `{ name: string; age: number }` の形かどうかを判定するユーザー定義型ガード `isUserObject` を書いてください。

<details><summary>解答例</summary>

```ts
type User = { name: string; age: number };

function isUserObject(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "age" in value &&
    typeof (value as User).name === "string" &&
    typeof (value as User).age === "number"
  );
}

const data: unknown = { name: "Carol", age: 25 };
if (isUserObject(data)) {
  console.log(data.name, data.age); // Carol 25
}
```

</details>

---

**問題 4：** 以下の通知型を使い、通知の内容を文字列にまとめる関数 `formatNotification` を書いてください。共通の `channel` プロパティで型を絞り込みましょう(判別可能ユニオン)。

```ts
type EmailNotification = { channel: "email"; to: string; subject: string };
type PushNotification  = { channel: "push";  deviceId: string; body: string };
type SmsNotification   = { channel: "sms";   phoneNumber: string; body: string };
type Notification = EmailNotification | PushNotification | SmsNotification;
```

期待する出力例：
- `EmailNotification` → `"メール to: alice@example.com 件名: 確認コード"`
- `PushNotification`  → `"プッシュ deviceId: d-001 本文: セール開始"`
- `SmsNotification`   → `"SMS 宛先: 090-xxxx 本文: ご注文確認"`

<details><summary>解答例</summary>

```ts
type EmailNotification = { channel: "email"; to: string; subject: string };
type PushNotification  = { channel: "push";  deviceId: string; body: string };
type SmsNotification   = { channel: "sms";   phoneNumber: string; body: string };
type Notification = EmailNotification | PushNotification | SmsNotification;

function formatNotification(n: Notification): string {
  switch (n.channel) {
    case "email": return `メール to: ${n.to} 件名: ${n.subject}`;
    case "push":  return `プッシュ deviceId: ${n.deviceId} 本文: ${n.body}`;
    case "sms":   return `SMS 宛先: ${n.phoneNumber} 本文: ${n.body}`;
  }
}

console.log(formatNotification({ channel: "email", to: "alice@example.com", subject: "確認コード" }));
// メール to: alice@example.com 件名: 確認コード
console.log(formatNotification({ channel: "push", deviceId: "d-001", body: "セール開始" }));
// プッシュ deviceId: d-001 本文: セール開始
```

判別子 `channel` を使った判別可能ユニオンで、switch の各 case が対応する型に自動確定されます。

</details>

---

**問題 5：** `unknown` を受け取り、`{ id: number; items: string[] }` の形かどうかを判定するユーザー定義型ガード `isOrder` を書いてください。`id` が number で、`items` が文字列の配列であることを確認してください。

<details><summary>解答例</summary>

```ts
type Order = { id: number; items: string[] };

function isOrder(value: unknown): value is Order {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "items" in value &&
    typeof (value as Order).id === "number" &&
    Array.isArray((value as Order).items) &&
    (value as Order).items.every(v => typeof v === "string")
  );
}

const ok: unknown = { id: 1, items: ["りんご", "バナナ"] };
const ng: unknown = { id: "x", items: [1, 2] };

if (isOrder(ok)) {
  console.log(ok.id, ok.items); // 1 [ 'りんご', 'バナナ' ]
}
console.log(isOrder(ng)); // false
```

`Array.isArray` で配列かを確認してから `.every` で要素型をチェックするのがポイントです。

</details>

---

**問題 6：** 下記の `PaymentMethod` ユニオンに `Invoice`（kind: "invoice", dueDate: string）を追加し、`processPayment` 関数が `never` 網羅性チェックで「追加漏れに気付ける」ことを確認してください。

```ts
type CreditCard = { kind: "credit_card"; cardNumber: string; expiry: string };
type BankTransfer = { kind: "bank_transfer"; accountId: string };
type PaymentMethod = CreditCard | BankTransfer;

function processPayment(p: PaymentMethod): string {
  switch (p.kind) {
    case "credit_card":   return `カード決済: ${p.cardNumber}`;
    case "bank_transfer": return `振込: 口座 ${p.accountId}`;
    default: {
      const _exhaustive: never = p;
      throw new Error(`未対応の支払い方法: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
```

<details><summary>解答例</summary>

```ts
type CreditCard   = { kind: "credit_card";   cardNumber: string; expiry: string };
type BankTransfer = { kind: "bank_transfer"; accountId: string };
type Invoice      = { kind: "invoice";       dueDate: string };
type PaymentMethod = CreditCard | BankTransfer | Invoice;

function processPayment(p: PaymentMethod): string {
  switch (p.kind) {
    case "credit_card":   return `カード決済: ${p.cardNumber}`;
    case "bank_transfer": return `振込: 口座 ${p.accountId}`;
    case "invoice":       return `請求書払い: 支払期限 ${p.dueDate}`;
    default: {
      const _exhaustive: never = p;
      throw new Error(`未対応の支払い方法: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

console.log(processPayment({ kind: "credit_card", cardNumber: "1234-5678", expiry: "12/26" }));
// カード決済: 1234-5678
console.log(processPayment({ kind: "invoice", dueDate: "2025-07-31" }));
// 請求書払い: 支払期限 2025-07-31
```

`Invoice` を追加した際に case "invoice" を書き忘れると、default の `const _exhaustive: never = p` が型エラーになり漏れに気付けます。

</details>

---

## 📌 まとめ

- **ユニオン型** `A | B`：どちらかの型を受け付ける
- **交差型** `A & B`：両方の性質を持つ型を作る
- **リテラル型** `"ok" | "error"`：特定の値だけを受け付ける
- **narrowing**：`typeof`・truthiness・`===`・`in`・`instanceof` で型を絞り込む
- **ユーザー定義型ガード** `x is T`：複雑な条件での絞り込みに使う
- **判別可能ユニオン**：`kind` などのタグで複数状態を型安全に表現 ← 実務で最もよく使う
- **`never` + exhaustiveness check**：variant の追加漏れをコンパイル時に検出

---

## ▶ 動かす

```sh
npm run ch07
# または
npx tsx src/07_unions_narrowing.ts
```
