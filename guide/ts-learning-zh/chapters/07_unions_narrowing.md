# 第07章 联合类型·类型收窄·可辨识联合

> 学习 TypeScript 中"类型分支"的章节。用联合类型处理多种类型，用类型收窄安全地使用，用可辨识联合表达复杂的状态。

## 🎯 本章目标

- 能写出 `string | number` 这样的联合类型 (union) 以及 `A & B` 的交叉类型 (intersection)
- 能用 `typeof`、`in`、`instanceof`、类型守卫 (type guard) 收窄类型
- 能用可辨识联合 (discriminated union) 安全地处理对象的种类
- 能用 `never` 进行穷举检查，防止将来遗漏新增的变体

---

## 1. 联合类型 `A | B`

联合类型表示"A 或 B 之一"。

```ts
function printId(id: string | number): void {
  console.log("ID:", id);
}

printId(42);      // OK
printId("abc-1"); // OK
// @ts-expect-error boolean 不在联合中
printId(true);    // 类型错误
```

用 `|` 连接的所有类型都能接受。三种以上也很常见：`string | number | boolean`。

---

## 2. 交叉类型 `A & B`

交叉类型创建"同时具备 A 和 B 属性"的类型。

```ts
type HasName = { name: string };
type HasAge  = { age: number };
type Person  = HasName & HasAge;  // 两者都必须

const alice: Person = { name: "Alice", age: 30 };
```

联合是"或"，交叉是"且"，这样记起来更直观。

---

## 3. 字面量类型与字面量联合

可以将字符串或数值的**特定值**作为类型使用。

```ts
type Direction = "north" | "south" | "east" | "west";
const dir: Direction = "north"; // OK

// @ts-expect-error 不在字面量联合范围内的值会报错
const bad: Direction = "up";
```

```ts
type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;
const roll: DiceValue = 3; // OK
```

### ⚠️ 注意类型拓宽 (widening)

```ts
const a = "north";           // 类型是 string（无类型注释时会拓宽）
const b: Direction = "north"; // 类型保持为 "north"
```

---

## 4. 类型收窄 (narrowing)

联合类型的变量只能使用"该类型一定存在的操作"。要让 TypeScript 知道能否使用某个操作，需要**收窄类型 (narrowing)**。

### 4-1. `typeof` 检查

```ts
function describe(value: string | number): string {
  if (typeof value === "string") {
    // 此处 value 确定为 string → 可以使用 toUpperCase()
    return `字符串: ${value.toUpperCase()}`;
  }
  // 此处 value 确定为 number → 可以使用 *
  return `数值的2倍: ${value * 2}`;
}

console.log(describe("hello")); // 字符串: HELLO
console.log(describe(21));      // 数值的2倍: 42
```

TypeScript 会分析 if 语句的条件，自动收窄各分支的类型。这就是 narrowing 的本质。

### 4-2. 真值 (truthiness) 检查

方便用于排除 `null | undefined`。

```ts
function greet(name: string | null): string {
  if (name) {
    return `你好，${name}`; // name 确定为 string
  }
  return "你好，访客";
}
```

### 4-3. `===` 比较

```ts
type Status = "ok" | "error" | "loading";

function handleStatus(s: Status): void {
  if (s === "ok") {
    console.log("成功!");
  } else if (s === "error") {
    console.log("发生了错误");
  } else {
    // s 确定为 "loading"
    console.log("加载中...");
  }
}
```

### 4-4. `in` 运算符

在对象类型的联合中，检查特定属性是否存在。

```ts
type Cat = { meow(): void };
type Dog = { bark(): void };

function makeSound(animal: Cat | Dog): void {
  if ("meow" in animal) {
    animal.meow(); // 确定为 Cat
  } else {
    animal.bark(); // 确定为 Dog
  }
}
```

### 4-5. `instanceof` 检查

检查是否为某个类的实例。

```ts
function formatError(err: Error | string): string {
  if (err instanceof Error) {
    return `错误对象: ${err.message}`; // 确定为 Error
  }
  return `字符串错误: ${err}`;
}
```

---

## 5. 用户自定义类型守卫 `x is T`

当 `typeof` 或 `instanceof` 无法处理时，可以自己编写类型守卫函数。

```ts
type Fish = { swim(): void };
type Bird = { fly(): void };

// 返回值类型写 "value is Fish" 是类型守卫的签名
function isFish(value: Fish | Bird): value is Fish {
  return "swim" in value;
}

function move(creature: Fish | Bird): void {
  if (isFish(creature)) {
    creature.swim(); // 确定为 Fish
  } else {
    creature.fly();  // 确定为 Bird
  }
}
```

与 `unknown` 类型结合，可用于验证外部数据。

```ts
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(v => typeof v === "string");
}
```

---

## 6. 可辨识联合 (discriminated union) ★最重要★

具有**作为标签（判别子）的字面量类型属性**的对象联合，称为可辨识联合。TypeScript 只需在 switch 语句中查看标签，就能自动确定各分支的类型。

### 为什么这个模式很重要

这是在类型安全地表达应用"多种状态"时最实用的模式。

```ts
type ApiSuccess = {
  kind: "success"; // ← 标签（判别子）
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
      // result 确定为 ApiSuccess → 可使用 result.data
      return `成功: ${result.data.join(", ")}`;
    case "error":
      // result 确定为 ApiError → 可使用 result.message, result.code
      return `错误(${result.code}): ${result.message}`;
    case "loading":
      return "加载中...";
  }
}
```

运行示例：
```
成功: A, B, C
错误(401): 未认证
加载中...
```

### 形状示例

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

**要点：**
- 标签属性名可以是 `kind` / `type` / `shape` 等任意名称，保持一致即可
- 各标签的值设为不同的字面量类型
- 每个 switch 分支的类型都会确定，可在编译时防止访问不存在的属性

---

## 7. 穷举检查与 `never`

`never` 类型表示"不应该到达的地方"。在 switch 的 default 分支中使用赋值给 `never`，当将来新增变体时**编译时会报错提醒**。

```ts
function areaWithCheck(s: Shape): number {
  switch (s.shape) {
    case "square":   return s.side ** 2;
    case "circle":   return Math.PI * s.radius ** 2;
    case "triangle": return (s.base * s.height) / 2;
    default: {
      // 若到达此处，s 应为 never
      // 若 Shape 新增变体，此处会出现类型错误
      const _exhaustive: never = s;
      throw new Error(`未支持的形状: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
```

若向 `Shape` 添加 `type Rectangle = { shape: "rectangle"; ... }`，default 分支中赋值给 `never` 会出现类型错误，提示"忘记添加 case 'rectangle'"。

---

## ⚠️ 常见陷阱

**1. 尝试直接使用联合类型中非公共属性**

```ts
function bad(x: string | number): void {
  // @ts-expect-error number 没有 toUpperCase → 不经 narrowing 无法使用
  x.toUpperCase();
}
```

在 narrowing（如 typeof 检查）之后就可以使用了。

**2. 忘记在函数参数类型中写 `|` 导致变成 `any`**

`strict: true` 模式下，隐式 `any` 会报错。请明确指定类型。

**3. 没有标签的对象联合难以收窄**

```ts
// NG: 没有标签就无法在 switch 中收窄
type A = { x: number };
type B = { y: string };
```

创建对象联合时，一开始就设计好判别子会更轻松。

**4. 忘记写类型守卫的返回值类型会变成 boolean**

`value is Fish` 是类型守卫的签名。保持 `boolean` 的话，narrowing 不会生效。

---

## ✍️ 练习题

**题目 1：** 请写一个接收 `string | number | boolean` 的函数 `typeLabel`，分别返回"字符串"、"数值"、"布尔值"以及 typeof 结果。

<details><summary>参考答案</summary>

```ts
function typeLabel(x: string | number | boolean): string {
  if (typeof x === "string")  return "字符串";
  if (typeof x === "number")  return "数值";
  return "布尔值";
}
console.log(typeLabel("hi"));  // 字符串
console.log(typeLabel(42));    // 数值
console.log(typeLabel(true));  // 布尔值
```

</details>

---

**题目 2：** 向以下可辨识联合添加 `Withdrawn`（kind: "withdrawn", amount: number），并在 `summarize` 函数中添加对应的 case。如果有 `never` 穷举检查，试验一下忘记添加时会报错。

```ts
type Deposit  = { kind: "deposit";  amount: number };
type Transfer = { kind: "transfer"; amount: number; to: string };
type Transaction = Deposit | Transfer;

function summarize(t: Transaction): string {
  switch (t.kind) {
    case "deposit":  return `存款: ${t.amount}元`;
    case "transfer": return `转账: ${t.amount}元 → ${t.to}`;
    default: {
      const _: never = t;
      throw new Error("未支持");
    }
  }
}
```

<details><summary>参考答案</summary>

```ts
type Deposit    = { kind: "deposit";   amount: number };
type Transfer   = { kind: "transfer";  amount: number; to: string };
type Withdrawn  = { kind: "withdrawn"; amount: number };
type Transaction = Deposit | Transfer | Withdrawn;

function summarize(t: Transaction): string {
  switch (t.kind) {
    case "deposit":   return `存款: ${t.amount}元`;
    case "transfer":  return `转账: ${t.amount}元 → ${t.to}`;
    case "withdrawn": return `取款: ${t.amount}元`;
    default: {
      const _: never = t;
      throw new Error("未支持");
    }
  }
}

console.log(summarize({ kind: "deposit", amount: 10000 }));
// 存款: 10000元
console.log(summarize({ kind: "withdrawn", amount: 3000 }));
// 取款: 3000元
```

</details>

---

**题目 3：** 请写一个接收 `unknown` 的用户自定义类型守卫 `isUserObject`，判断其是否为 `{ name: string; age: number }` 的形状。

<details><summary>参考答案</summary>

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

**题目 4：** 使用以下通知类型，写一个将通知内容汇总为字符串的函数 `formatNotification`。用公共属性 `channel` 收窄类型（可辨识联合）。

```ts
type EmailNotification = { channel: "email"; to: string; subject: string };
type PushNotification  = { channel: "push";  deviceId: string; body: string };
type SmsNotification   = { channel: "sms";   phoneNumber: string; body: string };
type Notification = EmailNotification | PushNotification | SmsNotification;
```

期望输出示例：
- `EmailNotification` → `"邮件 收件人: alice@example.com 主题: 验证码"`
- `PushNotification`  → `"推送 设备ID: d-001 内容: 促销开始"`
- `SmsNotification`   → `"短信 收件号: 138-xxxx 内容: 订单确认"`

<details><summary>参考答案</summary>

```ts
type EmailNotification = { channel: "email"; to: string; subject: string };
type PushNotification  = { channel: "push";  deviceId: string; body: string };
type SmsNotification   = { channel: "sms";   phoneNumber: string; body: string };
type Notification = EmailNotification | PushNotification | SmsNotification;

function formatNotification(n: Notification): string {
  switch (n.channel) {
    case "email": return `邮件 收件人: ${n.to} 主题: ${n.subject}`;
    case "push":  return `推送 设备ID: ${n.deviceId} 内容: ${n.body}`;
    case "sms":   return `短信 收件号: ${n.phoneNumber} 内容: ${n.body}`;
  }
}

console.log(formatNotification({ channel: "email", to: "alice@example.com", subject: "验证码" }));
// 邮件 收件人: alice@example.com 主题: 验证码
console.log(formatNotification({ channel: "push", deviceId: "d-001", body: "促销开始" }));
// 推送 设备ID: d-001 内容: 促销开始
```

使用判别子 `channel` 的可辨识联合，switch 的各 case 会自动确定对应的类型。

</details>

---

**题目 5：** 请写一个接收 `unknown` 的用户自定义类型守卫 `isOrder`，判断其是否为 `{ id: number; items: string[] }` 的形状。请验证 `id` 是 number，`items` 是字符串数组。

<details><summary>参考答案</summary>

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

const ok: unknown = { id: 1, items: ["苹果", "香蕉"] };
const ng: unknown = { id: "x", items: [1, 2] };

if (isOrder(ok)) {
  console.log(ok.id, ok.items); // 1 [ '苹果', '香蕉' ]
}
console.log(isOrder(ng)); // false
```

先用 `Array.isArray` 确认是数组，再用 `.every` 检查元素类型，这是关键。

</details>

---

**题目 6：** 向以下 `PaymentMethod` 联合添加 `Invoice`（kind: "invoice", dueDate: string），并确认 `processPayment` 函数因 `never` 穷举检查而能"发现遗漏"。

```ts
type CreditCard = { kind: "credit_card"; cardNumber: string; expiry: string };
type BankTransfer = { kind: "bank_transfer"; accountId: string };
type PaymentMethod = CreditCard | BankTransfer;

function processPayment(p: PaymentMethod): string {
  switch (p.kind) {
    case "credit_card":   return `刷卡支付: ${p.cardNumber}`;
    case "bank_transfer": return `银行转账: 账户 ${p.accountId}`;
    default: {
      const _exhaustive: never = p;
      throw new Error(`未支持的支付方式: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
```

<details><summary>参考答案</summary>

```ts
type CreditCard   = { kind: "credit_card";   cardNumber: string; expiry: string };
type BankTransfer = { kind: "bank_transfer"; accountId: string };
type Invoice      = { kind: "invoice";       dueDate: string };
type PaymentMethod = CreditCard | BankTransfer | Invoice;

function processPayment(p: PaymentMethod): string {
  switch (p.kind) {
    case "credit_card":   return `刷卡支付: ${p.cardNumber}`;
    case "bank_transfer": return `银行转账: 账户 ${p.accountId}`;
    case "invoice":       return `发票付款: 截止日期 ${p.dueDate}`;
    default: {
      const _exhaustive: never = p;
      throw new Error(`未支持的支付方式: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

console.log(processPayment({ kind: "credit_card", cardNumber: "1234-5678", expiry: "12/26" }));
// 刷卡支付: 1234-5678
console.log(processPayment({ kind: "invoice", dueDate: "2025-07-31" }));
// 发票付款: 截止日期 2025-07-31
```

添加 `Invoice` 后若忘记写 case "invoice"，default 中的 `const _exhaustive: never = p` 会出现类型错误，从而发现遗漏。

</details>

---

## 📌 总结

- **联合类型** `A | B`：接受任意一种类型
- **交叉类型** `A & B`：创建同时具备两种性质的类型
- **字面量类型** `"ok" | "error"`：只接受特定值
- **narrowing**：用 `typeof`、真值检查、`===`、`in`、`instanceof` 收窄类型
- **用户自定义类型守卫** `x is T`：用于复杂条件下的类型收窄
- **可辨识联合**：用 `kind` 等标签以类型安全的方式表达多种状态 ← 实务中最常用
- **`never` + 穷举检查**：在编译时检测是否遗漏了新增的变体

---

## ▶ 运行

```sh
npm run ch07
# 或
npx tsx src/07_unions_narrowing.ts
```
