// ============================================================
// 第09章 ユーティリティ型
// npx tsx src/09_utility_types.ts
// ============================================================

// ─────────────────────────────────────────
// 土台 1: keyof — オブジェクト型のキーをユニオンで取得
// ─────────────────────────────────────────

type User = {
  id: number;
  name: string;
  email: string;
  active: boolean;
};

// keyof User は "id" | "name" | "email" | "active"
type UserKeys = keyof User;

// UserKeys 型の変数には User のキーのいずれかしか入らない
const k1: UserKeys = "name";    // OK
const k2: UserKeys = "active";  // OK
// @ts-expect-error "password" は User のキーでない
const k3: UserKeys = "password";

console.log("keyof の例 k1:", k1, "k2:", k2);

// ─────────────────────────────────────────
// 土台 2: typeof — 値から型を取得(型レベルの typeof)
// ─────────────────────────────────────────

const config = {
  host: "localhost",
  port: 3000,
  debug: true,
};

// typeof config で { host: string; port: number; debug: boolean } が得られる
// as const を使うとリテラル型に固定されるが、ここでは比較のため通常の型を示す
type Config = typeof config;

// 別の変数に同じ構造を強制する (同じ Config 型なので違う値でも OK)
const anotherConfig: Config = { host: "example.com", port: 8080, debug: false };
console.log("typeof 例:", anotherConfig.port);  // 8080

// ─────────────────────────────────────────
// 土台 3: インデックスアクセス型 T[K]
// ─────────────────────────────────────────

// T[K] で「型 T の K というキーの値の型」を得られる
type UserEmail = User["email"];  // string
type UserId    = User["id"];     // number

const email: UserEmail = "test@example.com";
const id: UserId = 42;
console.log("インデックスアクセス型:", email, id);

// ユニオンを使うと複数のキーの型をまとめて取れる
type UserNameOrEmail = User["name" | "email"];  // string | string → string
type UserIdOrActive  = User["id" | "active"];   // number | boolean

const val: UserIdOrActive = 123;  // number でも boolean でも OK
console.log("ユニオンアクセス:", val);

// ─────────────────────────────────────────
// 1. Partial<T> — 全プロパティをオプションに
// ─────────────────────────────────────────

// User の全プロパティが省略可能になる
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; active?: boolean }

// 「更新処理」では変更したいフィールドだけ渡せると便利
function updateUser(id: number, patch: Partial<User>): void {
  console.log(`ユーザー ${id} を更新:`, patch);
  // 実際には DB に反映する処理
}

updateUser(1, { name: "新しい名前" });
// ユーザー 1 を更新: { name: '新しい名前' }

updateUser(2, { email: "new@example.com", active: false });
// ユーザー 2 を更新: { email: 'new@example.com', active: false }

// ─────────────────────────────────────────
// 2. Required<T> — 全プロパティを必須に
// ─────────────────────────────────────────

type DraftPost = {
  title?: string;
  body?: string;
  tags?: string[];
};

// 投稿する前には全項目が必要
type PublishedPost = Required<DraftPost>;
// { title: string; body: string; tags: string[] }

const post: PublishedPost = {
  title: "TypeScript 入門",
  body: "ジェネリクスとは...",
  tags: ["typescript", "入門"],
};
console.log("Required 例 title:", post.title);

// ─────────────────────────────────────────
// 3. Readonly<T> — 全プロパティを読み取り専用に
// ─────────────────────────────────────────

type ReadonlyUser = Readonly<User>;

const frozenUser: ReadonlyUser = { id: 1, name: "Alice", email: "a@e.com", active: true };

console.log("Readonly 例 (代入前):", frozenUser.name);  // Alice

// @ts-expect-error Readonly なので TypeScript は型エラー。ただし実行時(JS)は書き換わってしまう
frozenUser.name = "Bob";

// TypeScript で守られるのはコンパイル時のみ。実行時の保護が必要なら Object.freeze() を使う
console.log("Readonly 例 (代入後 ※実行時は変更される):", frozenUser.name);  // Bob

// ─────────────────────────────────────────
// 4. Pick<T, K> — 特定プロパティだけ残す
// ─────────────────────────────────────────

// User から id と name だけ取り出す
type UserPreview = Pick<User, "id" | "name">;
// { id: number; name: string }

const preview: UserPreview = { id: 1, name: "Alice" };
console.log("Pick 例:", preview);  // { id: 1, name: 'Alice' }

// API の公開用レスポンス型(パスワードや内部フラグを除いた形)を作るのによく使う
type PublicUser = Pick<User, "id" | "name" | "email">;

// ─────────────────────────────────────────
// 5. Omit<T, K> — 特定プロパティを除いて残す
// ─────────────────────────────────────────

// User から id を除いた型(新規作成時は id がまだない)
type NewUserInput = Omit<User, "id">;
// { name: string; email: string; active: boolean }

function createUser(input: NewUserInput): User {
  return { id: Math.floor(Math.random() * 1000), ...input };
}

const newUser = createUser({ name: "Bob", email: "b@e.com", active: true });
console.log("Omit 例:", newUser.name, "id:", newUser.id);

// Pick と Omit の使い分け:
// 「残したいものが少ない」→ Pick / 「除きたいものが少ない」→ Omit

// ─────────────────────────────────────────
// 6. Record<K, V> — キーと値の型でオブジェクト型を作る
// ─────────────────────────────────────────

// キーが string、値が number の辞書
type ScoreBoard = Record<string, number>;

const scores: ScoreBoard = {
  Alice: 95,
  Bob: 87,
  Carol: 92,
};
console.log("Record 例:", scores["Alice"]);  // 95

// キーをユニオンリテラルに限定すると安全なマップになる
type ColorCode = Record<"red" | "green" | "blue", string>;

const cssColors: ColorCode = {
  red:   "#FF0000",
  green: "#00FF00",
  blue:  "#0000FF",
};
console.log("Record リテラルキー:", cssColors.red);  // #FF0000

// ─────────────────────────────────────────
// 7. ReturnType<F> / Parameters<F>
// ─────────────────────────────────────────

function fetchUser(id: number, options: { cache: boolean }): User {
  // 実装省略
  return { id, name: "Dummy", email: "", active: true };
}

// 関数の戻り値型を取得
type FetchUserReturn = ReturnType<typeof fetchUser>;  // User

// 関数の引数型をタプルで取得
type FetchUserParams = Parameters<typeof fetchUser>;
// [id: number, options: { cache: boolean }]

// 実用例: 既存関数と同じ引数を受け取るラッパーを書くとき
function cachedFetchUser(...args: FetchUserParams): FetchUserReturn {
  console.log("キャッシュチェック後に呼び出し:", args[0]);
  return fetchUser(...args);
}

const fetched = cachedFetchUser(42, { cache: true });
console.log("ReturnType 例:", fetched.id);  // 42

// ─────────────────────────────────────────
// 8. NonNullable<T>
// ─────────────────────────────────────────

// null と undefined を除外する
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>;  // string

// API レスポンスのフィールドが nullable な場合に便利
type ApiUser = { name: string | null; bio: string | null | undefined };
type CleanUser = { [K in keyof ApiUser]: NonNullable<ApiUser[K]> };
// { name: string; bio: string }

const name: DefiniteString = "Alice";  // null も undefined も入らない
console.log("NonNullable 例:", name);

// ─────────────────────────────────────────
// 9. Awaited<T> — Promise の解決型を取り出す
// ─────────────────────────────────────────

// Promise<string> の中身の型を取得
type ResolvedString = Awaited<Promise<string>>;  // string

// 非同期関数の戻り値型取得に便利
async function loadData(): Promise<{ items: string[] }> {
  return { items: ["a", "b", "c"] };
}

type LoadDataResult = Awaited<ReturnType<typeof loadData>>;
// { items: string[] }

const result: LoadDataResult = { items: ["x", "y"] };
console.log("Awaited 例:", result.items);  // [ 'x', 'y' ]

// ─────────────────────────────────────────
// 10. ユーティリティ型の正体: マップ型で Partial を自作する
// ─────────────────────────────────────────

// TypeScript の組み込みユーティリティ型は実はマップ型で実装されている
// Partial<T> の実装を手動で書くと:
type MyPartial<T> = {
  [K in keyof T]?: T[K];  // T の全キー K に対して、T[K] 型のオプションプロパティ
};

// 動作は Partial<T> と同じ
type MyPartialUser = MyPartial<User>;

const partial: MyPartialUser = { name: "Alice" };  // id も email も省略 OK
console.log("MyPartial 例:", partial.name, partial.id);  // Alice undefined

// [K in keyof T] がループ(マップ)、? がオプション、T[K] がインデックスアクセス型
// これら3つが組み合わさってユーティリティ型を作っている

// ─────────────────────────────────────────
// 11. 実務でよく見る組み合わせパターン
// ─────────────────────────────────────────

// フォームの入力値型(全フィールドが string で、User のキーと一致)
type UserFormInput = Record<keyof User, string>;

const formInput: UserFormInput = {
  id: "42",
  name: "Charlie",
  email: "c@e.com",
  active: "true",
};
console.log("組み合わせ Record<keyof>:", formInput.name);  // Charlie

// 「作成時はidなし、更新時はidあり残りオプション」の型を同時に定義
type CreateInput = Omit<User, "id">;
type UpdateInput = Partial<Omit<User, "id">> & Pick<User, "id">;
// UpdateInput = { id: number } & { name?: string; email?: string; active?: boolean }

const update: UpdateInput = { id: 1, name: "新名前" };
console.log("Update パターン:", update.id, update.name);  // 1 新名前
