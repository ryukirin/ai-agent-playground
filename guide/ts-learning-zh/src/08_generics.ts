// ============================================================
// 第08章 泛型 (Generics)
// npx tsx src/08_generics.ts
// ============================================================

// ─────────────────────────────────────────
// 1. 为什么需要泛型：any 的问题
// ─────────────────────────────────────────

// 使用 any 会导致类型信息丢失
function firstAny(arr: any[]): any {
  return arr[0];
}

const gotAny = firstAny([1, 2, 3]);
// gotAny 的类型是 any → 无法进行类型补全和类型检查
// 例如下面这样也不会报错（因为是 any）：
// gotAny.toUpperCase();  运行时报错，但不会有类型错误
console.log("any 版 first:", gotAny);

// ─────────────────────────────────────────
// 2. 基础: function identity<T>
// ─────────────────────────────────────────

// <T> 是类型参数（类型的变量），调用时确定为具体类型
function identity<T>(x: T): T {
  return x;
}

// TypeScript 会从参数推断 T（无需显式指定）
const n = identity(42);       // T 推断为 number → n: number
const s = identity("hello");  // T 推断为 string → s: string

console.log("identity number:", n, typeof n);  // 42 number
console.log("identity string:", s, typeof s);  // hello string

// 也可以显式指定类型参数
const explicit = identity<boolean>(true);
console.log("explicit boolean:", explicit);  // true

// ─────────────────────────────────────────
// 3. 泛型函数: first / last
// ─────────────────────────────────────────

// 与 any 版本不同，返回值类型与参数数组的元素类型一致
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

const nums = [10, 20, 30];
const firstNum = first(nums);  // firstNum: number | undefined
const lastNum  = last(nums);   // lastNum:  number | undefined

console.log("first:", firstNum);  // 10
console.log("last:", lastNum);    // 30

// 同一个函数也适用于字符串数组
const words = ["apple", "banana", "cherry"];
const firstWord = first(words);  // firstWord: string | undefined
console.log("first word:", firstWord);  // apple

// ─────────────────────────────────────────
// 4. 多个类型参数 <T, U>
// ─────────────────────────────────────────

// 将两种不同类型组合为一对
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const p1 = pair("age", 25);    // [string, number]
const p2 = pair(true, [1, 2]); // [boolean, number[]]

console.log("pair p1:", p1);  // [ 'age', 25 ]
console.log("pair p2:", p2);  // [ true, [ 1, 2 ] ]

// 转换键值的 map 函数
function mapRecord<K extends string, V, W>(
  record: Record<K, V>,
  transform: (v: V) => W
): Record<K, W> {
  const result = {} as Record<K, W>;
  for (const key in record) {
    result[key] = transform(record[key]);
  }
  return result;
}

const prices = { apple: 100, banana: 80, cherry: 200 };
const doubled = mapRecord(prices, v => v * 2);
console.log("doubled prices:", doubled);  // { apple: 200, banana: 160, cherry: 400 }

// ─────────────────────────────────────────
// 5. 类型约束 <T extends ...>
// ─────────────────────────────────────────

// 为 T 添加约束，可以安全使用特定属性

// 限定为有 length 属性的类型
function logLength<T extends { length: number }>(value: T): T {
  console.log(`length: ${value.length}`);
  return value;
}

logLength("hello");        // length: 5
logLength([1, 2, 3]);     // length: 3
logLength({ length: 7, extra: "ok" });  // length: 7

// @ts-expect-error number 没有 length，报类型错误
logLength(42);

// 键的类型约束：用 keyof 安全访问属性
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Dave", age: 28, active: true };
const userName = getProperty(user, "name");    // string
const userAge  = getProperty(user, "age");     // number

console.log("name:", userName, "age:", userAge);  // name: Dave age: 28

// @ts-expect-error "email" 不是 user 的键
getProperty(user, "email");

// ─────────────────────────────────────────
// 6. 默认类型参数 <T = string>
// ─────────────────────────────────────────

// 可以指定省略类型参数时的默认值
type Container<T = string> = {
  value: T;
  label: string;
};

// 省略 T → 视为 T = string
const c1: Container = { value: "hello", label: "文本" };

// 显式指定 T → 使用该类型
const c2: Container<number> = { value: 42, label: "数值" };

console.log("Container 默认:", c1.value);  // hello
console.log("Container 显式:", c2.value);  // 42

// ─────────────────────────────────────────
// 7. 泛型类型别名与接口
// ─────────────────────────────────────────

// --- API 响应的包装类型 ---
// 只改变成功时数据类型的通用包装
type ApiResponse<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
};

// 创建成功响应的工厂函数
function createSuccess<T>(data: T): ApiResponse<T> {
  return { ok: true, data, error: null };
}

// 创建失败响应的工厂函数
function createError<T>(message: string): ApiResponse<T> {
  return { ok: false, data: null, error: message };
}

// 返回用户信息的情况
type UserDto = { id: number; name: string };
const userResponse: ApiResponse<UserDto> = createSuccess({ id: 1, name: "Eve" });

// 返回数值列表的情况
const listResponse: ApiResponse<number[]> = createSuccess([10, 20, 30]);
const failResponse: ApiResponse<number[]> = createError("服务器错误");

console.log("user response:", userResponse);
// { ok: true, data: { id: 1, name: 'Eve' }, error: null }
console.log("list response:", listResponse);
// { ok: true, data: [ 10, 20, 30 ], error: null }
console.log("fail response:", failResponse);
// { ok: false, data: null, error: '服务器错误' }

// --- 泛型接口 ---
interface Stack<T> {
  push(item: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  size: number;
}

// 实现该接口的简单栈
class SimpleStack<T> implements Stack<T> {
  private items: T[] = [];

  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  get size(): number { return this.items.length; }
}

const numStack = new SimpleStack<number>();
numStack.push(1);
numStack.push(2);
numStack.push(3);
console.log("栈顶元素:", numStack.peek());  // 3
console.log("栈的 size:", numStack.size);   // 3
console.log("pop:", numStack.pop());         // 3
console.log("pop 后 size:", numStack.size); // 2

// ─────────────────────────────────────────
// 8. 类型参数的推断与显式指定
// ─────────────────────────────────────────

// 推断有效的情况：可以从参数确定 T
const inferred = first([100, 200, 300]);    // T = number（推断）
// 需要显式指定的情况：仅凭参数无法确定类型
const explicit2 = createError<string[]>("错误");  // 不显式指定 T 的话 data 会是 null

console.log("推断:", inferred);            // 100
console.log("显式:", explicit2.data);      // null

// 推断结果不准确时显式指定更安全
const widened = identity([1, 2, 3]);        // T = number[]（推断）
const narrow  = identity<[number, number, number]>([1, 2, 3]); // 想作为元组处理时

console.log("widened:", widened);   // [ 1, 2, 3 ]
console.log("narrow:", narrow);     // [ 1, 2, 3 ]

// ─────────────────────────────────────────
// 9. 实用示例：异步数据获取的包装
// ─────────────────────────────────────────

// 实际应用中好用的泛型 fetch 包装
// （此处只展示类型。实际的 fetch 在第11章介绍）
type FetchResult<T> =
  | { status: "success"; data: T }
  | { status: "error";   message: string }
  | { status: "loading" };

// 用模拟数据验证行为
function mockFetch<T>(data: T): FetchResult<T> {
  return { status: "success", data };
}

const result = mockFetch({ id: 42, title: "TypeScript 入门" });
if (result.status === "success") {
  console.log("获取的数据:", result.data.title);  // TypeScript 入门
}
