# 第09章 工具类型 (Utility Types)

> TypeScript 标准提供的"变换类型的函数"集合。通过从现有类型创建新类型，在避免类型重复的同时编写安全的代码。

## 🎯 本章目标

- 理解 `keyof`、`typeof`、索引访问类型 `T[K]` 这些基础知识
- 能区分使用 `Partial` / `Required` / `Readonly` / `Pick` / `Omit` / `Record`
- 能在实际场景中使用 `ReturnType` / `Parameters` / `NonNullable` / `Awaited`
- 理解工具类型是"仅在类型世界中的操作"，运行时不会做任何事

---

## 基础 1：`keyof` — 获取对象类型的键

`keyof T` 将类型 `T` 的所有属性名作为字面量联合返回。

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

## 基础 2：类型层面的 `typeof`

用于**从值获取类型**。JS 中也有同名运算符，但写在类型注释位置时，返回的是类型。

```ts
const config = {
  host: "localhost",
  port: 3000,
  debug: true,
} as const;

type Config = typeof config;
// { readonly host: "localhost"; readonly port: 3000; readonly debug: true }
```

当你想强制让其他变量具有与现有值相同的结构时很方便。

---

## 基础 3：索引访问类型 `T[K]`

取出"类型 `T` 中键 `K` 的值的类型"。

```ts
type UserEmail = User["email"]; // string
type UserId    = User["id"];    // number

// 使用联合可以同时获取多个键的类型
type NameOrEmail = User["name" | "email"]; // string | string → string
```

---

## 1. `Partial<T>` — 将所有属性变为可选

```ts
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; active?: boolean }
```

**常见用法：** 作为更新处理（PATCH 请求）的参数类型，允许只传要修改的字段。

```ts
function updateUser(id: number, patch: Partial<User>): void {
  console.log(`更新用户 ${id}:`, patch);
}

updateUser(1, { name: "新名称" });         // OK
updateUser(2, { email: "new@example.com" });   // OK
```

---

## 2. `Required<T>` — 将所有属性变为必填

`Partial` 的逆操作。去掉所有可选的 `?`。

```ts
type DraftPost = {
  title?: string;
  body?: string;
  tags?: string[];
};

type PublishedPost = Required<DraftPost>;
// { title: string; body: string; tags: string[] }
```

用于"输入时可以省略，但保存时必须全填"的场景。

---

## 3. `Readonly<T>` — 将所有属性变为只读

```ts
type ReadonlyUser = Readonly<User>;

const frozenUser: ReadonlyUser = { id: 1, name: "Alice", email: "a@e.com", active: true };

// @ts-expect-error 只读属性无法赋值
frozenUser.name = "Bob";
```

**注意：** `Readonly<T>` 只是浅层的。嵌套对象内部仍然可以修改。

---

## 4. `Pick<T, K>` — 只保留特定属性

```ts
type UserPreview = Pick<User, "id" | "name">;
// { id: number; name: string }
```

常用于将 API 响应类型限制为"允许公开的字段"。

---

## 5. `Omit<T, K>` — 排除特定属性后保留其余

```ts
// 新建时 id 还不存在
type NewUserInput = Omit<User, "id">;
// { name: string; email: string; active: boolean }
```

**Pick 与 Omit 的区分：**

| 场景 | 类型 |
|---|---|
| 要保留的属性较少 | `Pick<T, "a" \| "b">` |
| 要排除的属性较少 | `Omit<T, "id">` |

---

## 6. `Record<K, V>` — 用键和值的类型创建对象类型

```ts
type ScoreBoard = Record<string, number>;

const scores: ScoreBoard = { Alice: 95, Bob: 87 };
```

将键限定为字面量联合可以防止键输入错误：

```ts
type ColorCode = Record<"red" | "green" | "blue", string>;

const colors: ColorCode = {
  red:   "#FF0000",
  green: "#00FF00",
  blue:  "#0000FF",
  // 尝试添加其他键会报错
};
```

---

## 7. `ReturnType<F>` / `Parameters<F>`

### `ReturnType<F>` — 获取函数的返回值类型

```ts
function fetchUser(id: number): User { /* ... */ }

type FetchResult = ReturnType<typeof fetchUser>; // User
```

### `Parameters<F>` — 以元组形式获取函数的参数类型

```ts
type FetchParams = Parameters<typeof fetchUser>; // [id: number]
```

**实用场景：** 编写与现有函数签名相同的包装器时，无需手动重写参数类型，可以直接复用。

```ts
function cachedFetch(...args: Parameters<typeof fetchUser>): ReturnType<typeof fetchUser> {
  // 检查缓存后再调用 fetchUser
  return fetchUser(...args);
}
```

---

## 8. `NonNullable<T>`

从类型中移除 `null` 和 `undefined`。

```ts
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // string
```

当 API 响应包含可为 null 的字段时，可作为验证后的安全类型使用。

---

## 9. `Awaited<T>` — 提取 Promise 的解析类型

```ts
type ResolvedString = Awaited<Promise<string>>; // string

async function loadData(): Promise<{ items: string[] }> { /* ... */ }

type LoadResult = Awaited<ReturnType<typeof loadData>>;
// { items: string[] }
```

当你想在其他地方复用异步函数的结果类型时很方便。

---

## 10. 工具类型的本质：映射类型

内置工具类型是用**映射类型**（类型世界中的循环）实现的。自己实现 `Partial<T>` 可以了解其内部机制：

```ts
type MyPartial<T> = {
  [K in keyof T]?: T[K];
  //  ↑ 对 T 的所有键 K 进行循环
  //               ↑ ? 表示可选
  //                  ↑ T[K] 取该键值的类型
};
```

- `[K in keyof T]` —— 类型层面的 for-of 循环
- `?` —— 将属性变为可选
- `T[K]` —— 获取原始类型中该键的值类型

运行时什么都不做。TypeScript 只在编译时进行类型检查。

---

## 11. 常用组合模式

### "创建时无 id，更新时有 id 其余可选"

```ts
type CreateInput = Omit<User, "id">;
type UpdateInput = Pick<User, "id"> & Partial<Omit<User, "id">>;
// { id: number } & { name?: string; email?: string; active?: boolean }
```

### 表单类型（所有字段均为 string）

```ts
type UserFormInput = Record<keyof User, string>;
// { id: string; name: string; email: string; active: string }
```

### 批量将可为 null 的字段变为非 null

```ts
type ApiUser = { name: string | null; bio: string | null | undefined };
type CleanUser = { [K in keyof ApiUser]: NonNullable<ApiUser[K]> };
// { name: string; bio: string }
```

---

## ⚠️ 常见陷阱

**1. 工具类型在运行时什么都不做**

只是类型世界中的操作。加了 `Readonly<T>` 也不会在运行时 freeze 对象。

```ts
const obj: Readonly<{ x: number }> = { x: 1 };
// TypeScript 层面无法赋值（类型错误）
// 但 JavaScript 运行时是普通对象
(obj as { x: number }).x = 99; // 绕过类型错误仍然可以修改
```

**2. `Partial` 是浅层的（嵌套不受影响）**

```ts
type Nested = { outer: { inner: string } };
type P = Partial<Nested>;
// outer? 可以省略，但 outer.inner 仍然必填
```

如果需要深层 Partial，请自己实现递归类型或使用库。

**3. `Pick` / `Omit` 的键必须是字面量字符串**

```ts
const key = "name";  // 类型是 string（已拓宽）
// @ts-expect-error string 不能用作 keyof User
type BadPick = Pick<User, typeof key>;

// 正确做法：用 as const 保持字面量类型
const key2 = "name" as const;  // 类型是 "name"
type GoodPick = Pick<User, typeof key2>;
```

**4. `ReturnType` / `Parameters` 需要 `typeof`**

```ts
function foo(): number { return 1; }

// @ts-expect-error 需要的是类型，不是 foo（值）
type R = ReturnType<foo>;

// 正确做法：先用 typeof 转换为类型再传入
type R2 = ReturnType<typeof foo>; // number
```

---

## ✍️ 练习题

**题目 1：** 从以下 `Product` 类型，定义供 API 公开用的 `PublicProduct`（排除 `price` 和 `stock`），以及更新请求用的 `UpdateProductInput`（`id` 必填，其余可选）。

```ts
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
};
```

<details><summary>参考答案</summary>

```ts
type PublicProduct = Omit<Product, "price" | "stock">;
// { id: string; name: string; description: string }

type UpdateProductInput = Pick<Product, "id"> & Partial<Omit<Product, "id">>;
// { id: string; name?: string; description?: string; price?: number; stock?: number }

const pub: PublicProduct = { id: "p1", name: "TypeScript书", description: "入门书" };
console.log(pub.name);

const upd: UpdateProductInput = { id: "p1", price: 2800 };
console.log(upd.id, upd.price);
```

</details>

---

**题目 2：** 请写一个接收 `Record<string, number>` 类型成绩表的函数 `addBonus`，将所有人的分数 `+10` 并返回新的成绩表。返回值类型为 `Record<string, number>`。

<details><summary>参考答案</summary>

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

**题目 3：** 接收函数 `processOrder`，用类型别名分别定义其参数类型 `OrderParams` 和返回值类型 `OrderResult`。

```ts
function processOrder(
  orderId: number,
  items: string[],
  options: { priority: boolean }
): { success: boolean; message: string } {
  return { success: true, message: `order ${orderId} processed` };
}
```

<details><summary>参考答案</summary>

```ts
type OrderParams = Parameters<typeof processOrder>;
// [orderId: number, items: string[], options: { priority: boolean }]

type OrderResult = ReturnType<typeof processOrder>;
// { success: boolean; message: string }

// 使用示例
const params: OrderParams = [1, ["itemA", "itemB"], { priority: true }];
const result: OrderResult = processOrder(...params);
console.log(result.message); // order 1 processed
```

</details>

---

**题目 4：** 从以下 `UserProfile` 类型，用 `Pick` 定义显示用的 `UserCard`（只有 `id`、`name`、`avatarUrl`）和设置页面用的 `UserSettings`（只有 `email`、`language`、`timezone`）。

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

<details><summary>参考答案</summary>

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

const settings: UserSettings = { email: "hina@example.com", language: "zh", timezone: "Asia/Shanghai" };
console.log(settings.timezone); // Asia/Shanghai
```

`passwordHash` 等敏感字段通过 `Pick` 不选择，可在类型层面防止泄露。

</details>

---

**题目 5：** 用 `Record` 定义以工作日为键的工作时间映射 `WorkHours`，并写一个返回本周总工作时间的函数 `totalHours`。

- 键：`"Mon" | "Tue" | "Wed" | "Thu" | "Fri"`
- 值：`number`（小时数）

<details><summary>参考答案</summary>

```ts
type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
type WorkHours = Record<Weekday, number>;

function totalHours(hours: WorkHours): number {
  return Object.values(hours).reduce((sum, h) => sum + h, 0);
}

const myWeek: WorkHours = { Mon: 8, Tue: 7, Wed: 9, Thu: 8, Fri: 6 };
console.log(totalHours(myWeek)); // 38
```

使用 `Record<Weekday, number>` 后，尝试添加 `"Mon"` 到 `"Fri"` 以外的键会导致编译错误。

</details>

---

**题目 6：** 请写一个将变更部分应用到现有对象 `target` 的函数 `applyPatch`。使用 `Partial<T>`，只覆盖 `patch` 中包含的字段，返回新对象。  
签名：`function applyPatch<T extends object>(target: T, patch: Partial<T>): T`

<details><summary>参考答案</summary>

```ts
function applyPatch<T extends object>(target: T, patch: Partial<T>): T {
  return { ...target, ...patch };
}

type Config = { host: string; port: number; debug: boolean };

const defaults: Config = { host: "localhost", port: 3000, debug: false };
const patched = applyPatch(defaults, { port: 8080, debug: true });
console.log(patched); // { host: "localhost", port: 8080, debug: true }

// 未指定的 host 保持不变
console.log(patched.host); // localhost
```

用 `Partial<T>` 将 `patch` 的所有字段变为可选，就可以只传想修改的字段。展开语法会让后传的值优先。

</details>

---

## 📌 总结

- **基础** 掌握 `keyof T`、类型层面的 `typeof`、`T[K]`，就能理解大多数工具类型的含义
- **变换系** `Partial` / `Required` / `Readonly` 改变属性的有无和可写性
- **选择系** `Pick` / `Omit` 创建"只需要的属性"或"排除不需要属性"的类型
- **生成系** `Record<K, V>` 定义字典类型
- **函数系** `ReturnType` / `Parameters` 复用现有函数的类型
- **收窄** `NonNullable` 移除 null/undefined，`Awaited` 展开 Promise
- 工具类型的本质是**映射类型**：`[K in keyof T]?: T[K]` 这样的类型转换操作
- 这些操作**只在类型世界中**进行：运行时不生成任何代码

---

## ▶ 运行

```sh
npm run ch09
# 或
npx tsx src/09_utility_types.ts
```
