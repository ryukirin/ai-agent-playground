// ============================================================
// 第09章 工具类型 (Utility Types)
// npx tsx src/09_utility_types.ts
// ============================================================

// ─────────────────────────────────────────
// 基础 1: keyof — 以联合类型获取对象类型的所有键
// ─────────────────────────────────────────

type User = {
  id: number;
  name: string;
  email: string;
  active: boolean;
};

// keyof User 为 "id" | "name" | "email" | "active"
type UserKeys = keyof User;

// UserKeys 类型的变量只能存放 User 的某个键
const k1: UserKeys = "name";    // OK
const k2: UserKeys = "active";  // OK
// @ts-expect-error "password" 不是 User 的键
const k3: UserKeys = "password";

console.log("keyof 示例 k1:", k1, "k2:", k2);

// ─────────────────────────────────────────
// 基础 2: typeof — 从值获取类型（类型层面的 typeof）
// ─────────────────────────────────────────

const config = {
  host: "localhost",
  port: 3000,
  debug: true,
};

// typeof config 得到 { host: string; port: number; debug: boolean }
// 使用 as const 会固定为字面量类型，此处为对比省略
type Config = typeof config;

// 强制另一个变量具有相同的结构（同为 Config 类型，不同的值也 OK）
const anotherConfig: Config = { host: "example.com", port: 8080, debug: false };
console.log("typeof 示例:", anotherConfig.port);  // 8080

// ─────────────────────────────────────────
// 基础 3: 索引访问类型 T[K]
// ─────────────────────────────────────────

// T[K] 获取"类型 T 中键 K 的值的类型"
type UserEmail = User["email"];  // string
type UserId    = User["id"];     // number

const email: UserEmail = "test@example.com";
const id: UserId = 42;
console.log("索引访问类型:", email, id);

// 使用联合可以同时获取多个键的类型
type UserNameOrEmail = User["name" | "email"];  // string | string → string
type UserIdOrActive  = User["id" | "active"];   // number | boolean

const val: UserIdOrActive = 123;  // number 或 boolean 均可
console.log("联合访问:", val);

// ─────────────────────────────────────────
// 1. Partial<T> — 将所有属性变为可选
// ─────────────────────────────────────────

// User 的所有属性变为可省略
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; active?: boolean }

// "更新处理"时只传想修改的字段更方便
function updateUser(id: number, patch: Partial<User>): void {
  console.log(`更新用户 ${id}:`, patch);
  // 实际上这里会将数据写入 DB
}

updateUser(1, { name: "新名称" });
// 更新用户 1: { name: '新名称' }

updateUser(2, { email: "new@example.com", active: false });
// 更新用户 2: { email: 'new@example.com', active: false }

// ─────────────────────────────────────────
// 2. Required<T> — 将所有属性变为必填
// ─────────────────────────────────────────

type DraftPost = {
  title?: string;
  body?: string;
  tags?: string[];
};

// 发布前所有项目都必须填写
type PublishedPost = Required<DraftPost>;
// { title: string; body: string; tags: string[] }

const post: PublishedPost = {
  title: "TypeScript 入门",
  body: "什么是泛型...",
  tags: ["typescript", "入门"],
};
console.log("Required 示例 title:", post.title);

// ─────────────────────────────────────────
// 3. Readonly<T> — 将所有属性变为只读
// ─────────────────────────────────────────

type ReadonlyUser = Readonly<User>;

const frozenUser: ReadonlyUser = { id: 1, name: "Alice", email: "a@e.com", active: true };

console.log("Readonly 示例（赋值前）:", frozenUser.name);  // Alice

// @ts-expect-error Readonly 类型，TypeScript 报类型错误。但运行时（JS）实际会被改写
frozenUser.name = "Bob";

// TypeScript 的保护仅在编译时有效。若需运行时保护，请使用 Object.freeze()
console.log("Readonly 示例（赋值后 ※运行时会被修改）:", frozenUser.name);  // Bob

// ─────────────────────────────────────────
// 4. Pick<T, K> — 只保留特定属性
// ─────────────────────────────────────────

// 从 User 中只取出 id 和 name
type UserPreview = Pick<User, "id" | "name">;
// { id: number; name: string }

const preview: UserPreview = { id: 1, name: "Alice" };
console.log("Pick 示例:", preview);  // { id: 1, name: 'Alice' }

// 常用于创建 API 公开响应类型（排除密码和内部标志后的形式）
type PublicUser = Pick<User, "id" | "name" | "email">;

// ─────────────────────────────────────────
// 5. Omit<T, K> — 排除特定属性后保留其余
// ─────────────────────────────────────────

// 从 User 中排除 id 的类型（新建时 id 还不存在）
type NewUserInput = Omit<User, "id">;
// { name: string; email: string; active: boolean }

function createUser(input: NewUserInput): User {
  return { id: Math.floor(Math.random() * 1000), ...input };
}

const newUser = createUser({ name: "Bob", email: "b@e.com", active: true });
console.log("Omit 示例:", newUser.name, "id:", newUser.id);

// Pick 与 Omit 的区分：
// "要保留的属性少" → Pick / "要排除的属性少" → Omit

// ─────────────────────────────────────────
// 6. Record<K, V> — 用键和值的类型创建对象类型
// ─────────────────────────────────────────

// 键为 string、值为 number 的字典
type ScoreBoard = Record<string, number>;

const scores: ScoreBoard = {
  Alice: 95,
  Bob: 87,
  Carol: 92,
};
console.log("Record 示例:", scores["Alice"]);  // 95

// 将键限定为联合字面量后成为安全的映射
type ColorCode = Record<"red" | "green" | "blue", string>;

const cssColors: ColorCode = {
  red:   "#FF0000",
  green: "#00FF00",
  blue:  "#0000FF",
};
console.log("Record 字面量键:", cssColors.red);  // #FF0000

// ─────────────────────────────────────────
// 7. ReturnType<F> / Parameters<F>
// ─────────────────────────────────────────

function fetchUser(id: number, options: { cache: boolean }): User {
  // 省略实现
  return { id, name: "Dummy", email: "", active: true };
}

// 获取函数的返回值类型
type FetchUserReturn = ReturnType<typeof fetchUser>;  // User

// 以元组形式获取函数的参数类型
type FetchUserParams = Parameters<typeof fetchUser>;
// [id: number, options: { cache: boolean }]

// 实用示例：编写与现有函数接受相同参数的包装器时
function cachedFetchUser(...args: FetchUserParams): FetchUserReturn {
  console.log("检查缓存后调用:", args[0]);
  return fetchUser(...args);
}

const fetched = cachedFetchUser(42, { cache: true });
console.log("ReturnType 示例:", fetched.id);  // 42

// ─────────────────────────────────────────
// 8. NonNullable<T>
// ─────────────────────────────────────────

// 排除 null 和 undefined
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>;  // string

// 当 API 响应字段可为 null 时很方便
type ApiUser = { name: string | null; bio: string | null | undefined };
type CleanUser = { [K in keyof ApiUser]: NonNullable<ApiUser[K]> };
// { name: string; bio: string }

const name: DefiniteString = "Alice";  // null 和 undefined 均不可存入
console.log("NonNullable 示例:", name);

// ─────────────────────────────────────────
// 9. Awaited<T> — 提取 Promise 的解析类型
// ─────────────────────────────────────────

// 获取 Promise<string> 内部的类型
type ResolvedString = Awaited<Promise<string>>;  // string

// 方便获取异步函数的返回值类型
async function loadData(): Promise<{ items: string[] }> {
  return { items: ["a", "b", "c"] };
}

type LoadDataResult = Awaited<ReturnType<typeof loadData>>;
// { items: string[] }

const result: LoadDataResult = { items: ["x", "y"] };
console.log("Awaited 示例:", result.items);  // [ 'x', 'y' ]

// ─────────────────────────────────────────
// 10. 工具类型的本质：用映射类型自己实现 Partial
// ─────────────────────────────────────────

// TypeScript 内置的工具类型实际上是用映射类型实现的
// 手动写出 Partial<T> 的实现：
type MyPartial<T> = {
  [K in keyof T]?: T[K];  // 对 T 的所有键 K，生成 T[K] 类型的可选属性
};

// 行为与 Partial<T> 相同
type MyPartialUser = MyPartial<User>;

const partial: MyPartialUser = { name: "Alice" };  // id、email 也可以省略
console.log("MyPartial 示例:", partial.name, partial.id);  // Alice undefined

// [K in keyof T] 是循环（映射），? 是可选，T[K] 是索引访问类型
// 这三者组合在一起构成了工具类型

// ─────────────────────────────────────────
// 11. 实务中常见的组合模式
// ─────────────────────────────────────────

// 表单输入值类型（所有字段为 string，与 User 的键对应）
type UserFormInput = Record<keyof User, string>;

const formInput: UserFormInput = {
  id: "42",
  name: "Charlie",
  email: "c@e.com",
  active: "true",
};
console.log("组合 Record<keyof>:", formInput.name);  // Charlie

// 同时定义"创建时无 id，更新时有 id 其余可选"的类型
type CreateInput = Omit<User, "id">;
type UpdateInput = Partial<Omit<User, "id">> & Pick<User, "id">;
// UpdateInput = { id: number } & { name?: string; email?: string; active?: boolean }

const update: UpdateInput = { id: 1, name: "新名称" };
console.log("Update 模式:", update.id, update.name);  // 1 新名称
