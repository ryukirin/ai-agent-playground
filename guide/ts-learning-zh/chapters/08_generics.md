# 第08章 泛型 (Generics)

> 在保持类型安全的同时，编写"适用于任意类型的通用函数和类型"的机制。从与 `any` 的区别入手，一气掌握实用模式。

## 🎯 本章目标

- 能解释使用 `any` 时类型信息为何会丢失
- 能编写以 `<T>` 接收类型参数的泛型函数
- 能用 `extends` 为类型参数添加约束
- 能用泛型类型别名和接口设计 API 包装类型等
- 能灵活使用类型参数的推断与显式指定

---

## 1. 为什么需要泛型：`any` 的问题

想写"接受任意类型"的函数时，最先想到的往往是 `any`。

```ts
function firstAny(arr: any[]): any {
  return arr[0];
}

const val = firstAny([1, 2, 3]);
// val 的类型是 any → TypeScript 对它一无所知
// 例如 val.toUpperCase() 也不会报类型错误（运行时才崩溃）
```

`any` 是"丢弃类型信息"的操作。无论接收的数组元素类型是什么，TypeScript 都不再追踪。

---

## 2. 基础：`function identity<T>(x: T): T`

**类型参数 `<T>`** 是"调用时才确定的类型变量"。

```ts
function identity<T>(x: T): T {
  return x;
}

const n = identity(42);      // T 推断为 number → n: number
const s = identity("hello"); // T 推断为 string → s: string
```

类型参数由参数类型**自动推断**。也可以显式指定：

```ts
const b = identity<boolean>(true); // 显式指定类型
```

---

## 3. 泛型数组工具：first / last

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

与使用 `any[]` 的版本不同，**返回值的类型与输入数组的元素类型联动**。TypeScript 知道 `firstNum` 是 `number | undefined`，后续处理也能进行类型检查。

---

## 4. 多个类型参数 `<T, U>`

```ts
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const p1 = pair("age", 25);     // [string, number]
const p2 = pair(true, [1, 2]);  // [boolean, number[]]
```

类型参数可以添加任意多个。习惯上用 `T, U, V` 或带含义的 `TKey, TValue` 等写法。

---

## 5. 类型约束 `<T extends ...>`

为类型参数添加约束，可以只接受"具有特定属性或方法的类型"。

```ts
// 只接受有 length 属性的类型
function logLength<T extends { length: number }>(value: T): T {
  console.log(`length: ${value.length}`);
  return value;
}

logLength("hello");    // OK（string 有 length）
logLength([1, 2, 3]); // OK（数组有 length）
// @ts-expect-error number 没有 length，报错
logLength(42);
```

### 与 `keyof` 的组合

安全处理对象属性名的常用模式。

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Dave", age: 28 };
const name = getProperty(user, "name"); // string
const age  = getProperty(user, "age");  // number

// @ts-expect-error "email" 不是 user 的键
getProperty(user, "email");
```

`K extends keyof T` 表示"K 必须是 T 的某个键"的约束。

---

## 6. 默认类型参数 `<T = string>`

可以为类型参数指定省略时的默认值。

```ts
type Container<T = string> = {
  value: T;
  label: string;
};

// 省略 T → 视为 T = string
const c1: Container = { value: "hello", label: "文本" };

// 显式指定 T → 使用该类型
const c2: Container<number> = { value: 42, label: "数值" };
```

这是在库的类型定义中常见的模式。

---

## 7. 泛型类型别名与接口

### API 响应的包装类型

这是实务中常写的模式。用相同的结构表达成功和失败，只用泛型改变成功时的数据类型。

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

使用方式：

```ts
type UserDto = { id: number; name: string };
const userRes: ApiResponse<UserDto> = createSuccess({ id: 1, name: "Eve" });
const listRes: ApiResponse<number[]> = createSuccess([10, 20, 30]);
```

同一个 `createSuccess` / `createError` 可以应对用户信息和数值列表等各种场景。

### 泛型接口

```ts
interface Stack<T> {
  push(item: T): void;
  pop(): T | undefined;
  size: number;
}
```

接口也可以添加类型参数。用类实现的方式将在第10章详细介绍。

---

## 8. 类型参数的推断与显式指定

### 推断有效的情况（大多数场景）

当可以从参数确定类型时，交给推断处理：

```ts
const result = first([100, 200, 300]); // T 推断为 number
```

### 需要显式指定的情况

当仅凭参数无法确定类型时，显式指定：

```ts
// createError 的 T 无法从参数确定 → 显式指定
const err = createError<string[]>("错误");
```

### 推断与显式指定的区分

| 场景 | 推荐做法 |
|---|---|
| 从参数可以明显确定类型 | 交给推断 |
| 只想指定返回值的类型 | 显式指定 |
| 推断结果与预期不符（范围太宽） | 显式指定 |

---

## ⚠️ 常见陷阱

**1. 不用泛型而逃到 `any`**

使用 `any` 后，该变量的类型信息全部消失。泛型可以在保持类型的同时实现通用性。

**2. 类型参数"运行时不存在"**

泛型是 TypeScript 仅在编译时使用的机制。编译为 JavaScript 后会消失。若需要在运行时进行类型检查，请使用类型守卫（第7章）。

**3. 忘记约束而导致类型错误**

```ts
function bad<T>(arr: T[]): number {
  // @ts-expect-error 不知道 T 是否有 length，报错
  return arr[0].length; // T 不一定是 string 或数组
}

// 修正：添加约束
function good<T extends { length: number }>(arr: T[]): number {
  return arr[0].length; // OK
}
```

**4. 考虑能否减少类型参数的数量**

`<T>` 比 `<T, U>` 的设计更简洁。类型参数增多往往是需要重新审视设计的信号。

---

## ✍️ 练习题

**题目 1：** 请写一个接收两个值的泛型函数 `pick`，返回条件函数返回 true 的那个值。  
签名：`function pick<T>(a: T, b: T, condition: (x: T) => boolean): T`

<details><summary>参考答案</summary>

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

**题目 2：** 请写一个接收类型参数 `T` 和 `U` 的 `myMap` 函数，将 `T[]` 的每个元素转换为 `U`。（这是 `Array.prototype.map` 的手动实现版本）

<details><summary>参考答案</summary>

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

**题目 3：** 使用 `type ApiResponse<T>`，创建表示 `GET /users/:id` 成功和失败的值。成功时持有 `{ id: number; name: string; email: string }`，失败时持有 `code: 404` 的错误消息。

<details><summary>参考答案</summary>

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
  error: "404: 用户未找到",
};

console.log(successRes.data?.name); // Frank
console.log(errorRes.error);        // 404: 用户未找到
```

</details>

---

**题目 4：** 请写一个接收数组并返回去重后新数组的泛型函数 `unique`。  
签名：`function unique<T>(arr: T[]): T[]`（请使用 `Set` 实现）

<details><summary>参考答案</summary>

```ts
function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

const nums = unique([1, 2, 2, 3, 1, 4]);
console.log(nums); // [1, 2, 3, 4]

const words = unique(["apple", "banana", "apple", "cherry"]);
console.log(words); // ["apple", "banana", "cherry"]
```

传入 `Set` 会自动去除重复项。用展开语法转回数组即完成。

</details>

---

**题目 5：** 请写一个接收对象 `T` 和键集合 `K extends keyof T` 的泛型函数 `pickKeys`，返回只包含指定键的新对象。  
签名：`function pickKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`

<details><summary>参考答案</summary>

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

// @ts-expect-error "password" 不是 user 的键，报错
pickKeys(user, ["password"]);
```

因为有 `K extends keyof T` 约束，传入不存在的键会导致编译错误。

</details>

---

**题目 6：** 定义表示成功和失败的泛型类型 `Result<T, E = string>`，并写一个接收成功值或失败值的 `match` 函数。

```ts
// 定义的大致形状
type Result<T, E = string> = /* ... */;
```

- 成功时为 `{ ok: true; value: T }`
- 失败时为 `{ ok: false; error: E }`
- 实现 `match<T, E>(result: Result<T, E>, onOk: (v: T) => void, onErr: (e: E) => void): void`

<details><summary>参考答案</summary>

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
const failure: Result<number> = { ok: false, error: "计算失败" };

match(success, v => console.log("成功:", v), e => console.log("失败:", e));
// 成功: 42
match(failure, v => console.log("成功:", v), e => console.log("失败:", e));
// 失败: 计算失败
```

默认类型参数 `E = string` 使得 `Result<number>` 可以省略失败类型。

</details>

---

## 📌 总结

- **泛型是"类型变量"**：用 `<T>` 声明，调用时确定为具体类型
- 与 `any` 不同，可以在**保持类型信息的同时实现通用性**
- `<T, U>` 可以持有多个类型参数
- `<T extends ...>` 添加约束，使特定属性或方法可用
- `<T = string>` 指定默认类型参数
- 类型别名和接口也可以带类型参数（如 `ApiResponse<T>`）
- **能交给推断时不显式指定**；类型无法确定时显式指定
- 泛型**仅在编译时存在**：运行时会被擦除

---

## ▶ 运行

```sh
npm run ch08
# 或
npx tsx src/08_generics.ts
```
