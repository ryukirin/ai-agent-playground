// ============================================================
// 第04章 関数の型
// npx tsx src/04_functions.ts で実行
// ============================================================

// ----------------------------------------------------------
// 1. 引数と戻り値の型注釈
// ----------------------------------------------------------
// 最もシンプルな関数: 引数2つとも number、戻り値も number
function add(a: number, b: number): number {
  return a + b;
}
console.log("add(2, 3) =", add(2, 3)); // 5

// ----------------------------------------------------------
// 2. 戻り値 void — 何も返さない関数
// ----------------------------------------------------------
function greet(name: string): void {
  console.log(`こんにちは、${name}さん`);
}
greet("田中"); // こんにちは、田中さん

// ----------------------------------------------------------
// 3. オプショナル引数 ?
// ----------------------------------------------------------
// title を省略すると undefined になる
function greetWithTitle(name: string, title?: string): string {
  if (title !== undefined) {
    return `${title} ${name}`;
  }
  return name;
}
console.log("省略:", greetWithTitle("鈴木"));          // 鈴木
console.log("あり:", greetWithTitle("鈴木", "Dr."));   // Dr. 鈴木

// ----------------------------------------------------------
// 4. デフォルト引数
// ----------------------------------------------------------
// greeting の型注釈を省略しても string と推論される
function greetWithDefault(name: string, greeting = "こんにちは"): string {
  return `${greeting}、${name}さん`;
}
console.log(greetWithDefault("山田"));              // こんにちは、山田さん
console.log(greetWithDefault("山田", "おはよう"));  // おはよう、山田さん

// デフォルト引数に undefined を渡してもデフォルト値が使われる
function withDefault(n = 10): number {
  return n;
}
console.log("withDefault():", withDefault());          // 10
console.log("withDefault(undefined):", withDefault(undefined)); // 10
console.log("withDefault(0):", withDefault(0));        // 0 ← デフォルトにならない

// ----------------------------------------------------------
// 5. レストパラメータ ...nums: number[]
// ----------------------------------------------------------
// 可変長の引数を配列としてまとめて受け取る
function sum(...nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}
console.log("sum(1,2,3):", sum(1, 2, 3));         // 6
console.log("sum(10,20,30,40):", sum(10, 20, 30, 40)); // 100

// 先頭に通常引数を置くことも可能
function log(prefix: string, ...messages: string[]): void {
  for (const msg of messages) {
    console.log(`[${prefix}] ${msg}`);
  }
}
log("INFO", "起動しました", "接続完了");
// [INFO] 起動しました
// [INFO] 接続完了

// ----------------------------------------------------------
// 6. 関数型(シグネチャ)を型エイリアスで表現
// ----------------------------------------------------------
// 「number を2つ受け取って number を返す関数」という型
type BinOp = (a: number, b: number) => number;

const multiply: BinOp = (a, b) => a * b;
const divide: BinOp = (a, b) => a / b;

console.log("multiply(3,4):", multiply(3, 4)); // 12
console.log("divide(10,2):", divide(10, 2));   // 5

// ----------------------------------------------------------
// 7. コールバックの型
// ----------------------------------------------------------
// 配列メソッドに渡す関数にも型が付く
const numbers = [1, 2, 3, 4, 5];

const doubled = numbers.map((n: number): number => n * 2);
console.log("doubled:", doubled); // [2, 4, 6, 8, 10]

// 型エイリアスでコールバック型を定義する例
type Predicate = (value: number) => boolean;

function filterNumbers(arr: number[], pred: Predicate): number[] {
  return arr.filter(pred);
}

const evens = filterNumbers(numbers, (n) => n % 2 === 0);
console.log("evens:", evens); // [2, 4]

// ----------------------------------------------------------
// 8. アロー関数 vs 関数宣言での型の書き方
// ----------------------------------------------------------
// 関数宣言
function addDecl(a: number, b: number): number {
  return a + b;
}

// アロー関数(引数・戻り値に型注釈)
const addArrow = (a: number, b: number): number => a + b;

// 変数側に関数型を注釈し、実装側は型推論に任せる
const addAnnotated: (a: number, b: number) => number = (a, b) => a + b;

console.log("addDecl:", addDecl(1, 2));       // 3
console.log("addArrow:", addArrow(1, 2));      // 3
console.log("addAnnotated:", addAnnotated(1, 2)); // 3

// ----------------------------------------------------------
// 9. 関数オーバーロード(1例)
// ----------------------------------------------------------
// オーバーロード署名: 呼び出し側から見えるシグネチャ
function format(value: number): string;
function format(value: string): string;

// 実装署名: 実際の処理(外から直接呼べない)
function format(value: number | string): string {
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  return value.trim();
}

console.log("format(3.14159):", format(3.14159)); // "3.14"
console.log('format("  hello  "):', format("  hello  ")); // "hello"

// ----------------------------------------------------------
// 10. よくあるつまずき: @ts-expect-error で示す禁止パターン
// ----------------------------------------------------------

// strict モードでは引数に暗黙の any は禁止
// @ts-expect-error 引数 x に型注釈がなく暗黙の any になるためエラー
function bad(x) {
  return x + 1;
}

// オプショナル引数の後に必須引数は置けない
// @ts-expect-error オプショナル引数 a の後に必須引数 b は置けない
function wrong(a?: string, b: number): void {}

// void 型の関数から値を返せない
function noReturn(): void {
  // @ts-expect-error void 関数で値を return するとエラー
  return 42;
}

console.log("=== 第04章 完了 ===");
