// ============================================================
// 第08章 ジェネリクス
// npx tsx src/08_generics.ts
// ============================================================

// ─────────────────────────────────────────
// 1. なぜジェネリクスか: any の問題
// ─────────────────────────────────────────

// any を使うと型情報が失われる
function firstAny(arr: any[]): any {
  return arr[0];
}

const gotAny = firstAny([1, 2, 3]);
// gotAny の型は any → 型補完も型チェックも効かない
// 例えばこれが通ってしまう (any なので):
// gotAny.toUpperCase();  実行時エラーになるが型エラーにならない
console.log("any 版 first:", gotAny);

// ─────────────────────────────────────────
// 2. 基本: function identity<T>
// ─────────────────────────────────────────

// <T> は型引数(型の変数)。呼び出し時に具体的な型に確定する
function identity<T>(x: T): T {
  return x;
}

// TypeScript が引数から T を推論してくれる(明示不要)
const n = identity(42);       // T = number と推論 → n: number
const s = identity("hello");  // T = string と推論 → s: string

console.log("identity number:", n, typeof n);  // 42 number
console.log("identity string:", s, typeof s);  // hello string

// 明示的に型引数を指定することもできる
const explicit = identity<boolean>(true);
console.log("explicit boolean:", explicit);  // true

// ─────────────────────────────────────────
// 3. ジェネリック関数: first / last
// ─────────────────────────────────────────

// any 版と違い、戻り値の型が引数の配列の要素型と一致する
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

// 文字列配列でも同じ関数が使える
const words = ["apple", "banana", "cherry"];
const firstWord = first(words);  // firstWord: string | undefined
console.log("first word:", firstWord);  // apple

// ─────────────────────────────────────────
// 4. 複数の型引数 <T, U>
// ─────────────────────────────────────────

// 2 つの異なる型をまとめてペアにする
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const p1 = pair("age", 25);    // [string, number]
const p2 = pair(true, [1, 2]); // [boolean, number[]]

console.log("pair p1:", p1);  // [ 'age', 25 ]
console.log("pair p2:", p2);  // [ true, [ 1, 2 ] ]

// キーと値を変換するマップ関数
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
// 5. 型制約 <T extends ...>
// ─────────────────────────────────────────

// T に制約をつけることで特定のプロパティを安全に使える

// length プロパティがある型に限定する
function logLength<T extends { length: number }>(value: T): T {
  console.log(`length: ${value.length}`);
  return value;
}

logLength("hello");        // length: 5
logLength([1, 2, 3]);     // length: 3
logLength({ length: 7, extra: "ok" });  // length: 7

// @ts-expect-error number は length を持たないので型エラー
logLength(42);

// キーの型制約: keyof を使って安全にプロパティアクセス
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Dave", age: 28, active: true };
const userName = getProperty(user, "name");    // string
const userAge  = getProperty(user, "age");     // number

console.log("name:", userName, "age:", userAge);  // name: Dave age: 28

// @ts-expect-error "email" は user のキーではない
getProperty(user, "email");

// ─────────────────────────────────────────
// 6. デフォルト型引数 <T = string>
// ─────────────────────────────────────────

// 型引数を省略したときのデフォルトを指定できる
type Container<T = string> = {
  value: T;
  label: string;
};

// T を省略 → T = string として扱われる
const c1: Container = { value: "hello", label: "テキスト" };

// T を明示 → その型になる
const c2: Container<number> = { value: 42, label: "数値" };

console.log("Container デフォルト:", c1.value);  // hello
console.log("Container 明示:", c2.value);         // 42

// ─────────────────────────────────────────
// 7. ジェネリックな型エイリアスとインターフェース
// ─────────────────────────────────────────

// --- API レスポンスのラッパー型 ---
// 成功時のデータ型だけを変えられる汎用ラッパー
type ApiResponse<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
};

// 成功レスポンスを作るファクトリ関数
function createSuccess<T>(data: T): ApiResponse<T> {
  return { ok: true, data, error: null };
}

// 失敗レスポンスを作るファクトリ関数
function createError<T>(message: string): ApiResponse<T> {
  return { ok: false, data: null, error: message };
}

// ユーザー情報を返す場合
type UserDto = { id: number; name: string };
const userResponse: ApiResponse<UserDto> = createSuccess({ id: 1, name: "Eve" });

// 数値リストを返す場合
const listResponse: ApiResponse<number[]> = createSuccess([10, 20, 30]);
const failResponse: ApiResponse<number[]> = createError("サーバーエラー");

console.log("user response:", userResponse);
// { ok: true, data: { id: 1, name: 'Eve' }, error: null }
console.log("list response:", listResponse);
// { ok: true, data: [ 10, 20, 30 ], error: null }
console.log("fail response:", failResponse);
// { ok: false, data: null, error: 'サーバーエラー' }

// --- ジェネリックインターフェース ---
interface Stack<T> {
  push(item: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  size: number;
}

// インターフェースを実装するシンプルなスタック
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
console.log("スタックの先頭:", numStack.peek());  // 3
console.log("スタックの size:", numStack.size);    // 3
console.log("pop:", numStack.pop());               // 3
console.log("pop 後 size:", numStack.size);        // 2

// ─────────────────────────────────────────
// 8. 型引数の推論と明示指定
// ─────────────────────────────────────────

// 推論が効く場合: 引数から T を確定できる
const inferred = first([100, 200, 300]);    // T = number (推論)
// 明示が必要な場合: 引数だけでは型が決まらない
const explicit2 = createError<string[]>("エラー");  // T を明示しないと null になる

console.log("推論:", inferred);            // 100
console.log("明示:", explicit2.data);      // null

// 推論が不正確になりそうな場合は明示すると安全
const widened = identity([1, 2, 3]);        // T = number[] (推論)
const narrow  = identity<[number, number, number]>([1, 2, 3]); // タプルとして扱いたい場合

console.log("widened:", widened);   // [ 1, 2, 3 ]
console.log("narrow:", narrow);     // [ 1, 2, 3 ]

// ─────────────────────────────────────────
// 9. 実用例: 非同期データ取得のラッパー
// ─────────────────────────────────────────

// 実際のアプリで使いやすいジェネリックなフェッチラッパー
// (ここでは型だけ示す。実際の fetch は第11章で扱う)
type FetchResult<T> =
  | { status: "success"; data: T }
  | { status: "error";   message: string }
  | { status: "loading" };

// モックデータで動作確認
function mockFetch<T>(data: T): FetchResult<T> {
  return { status: "success", data };
}

const result = mockFetch({ id: 42, title: "TypeScript 入門" });
if (result.status === "success") {
  console.log("取得データ:", result.data.title);  // TypeScript 入門
}
