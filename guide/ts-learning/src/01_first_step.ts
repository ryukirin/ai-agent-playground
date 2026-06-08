// ============================================================
// 第01章 TypeScript 最初の一歩
// npx tsx src/01_first_step.ts で実行
// ============================================================

// ----------------------------------------------------------
// 1. TypeScript がなぜ必要か：JS でよく起きるバグの例
// ----------------------------------------------------------

// JS では文字列 "500" と数値の掛け算が暗黙変換で動いてしまう
// TS はこれを事前に検出できる（ここでは JS と同じ挙動をあえて示す）
const price = "500" as unknown as number; // 意図的に型を騙している例
const tax = 0.1;
console.log("【JSっぽいバグ例】 price * tax =", (price as unknown as string) + "*" + tax);
console.log("  → 実際の計算:", (price as unknown as number) * tax);
// 出力: 50（文字列が数値に暗黙変換される）

console.log();

// ----------------------------------------------------------
// 2. 変数への型注釈（基本）
// ----------------------------------------------------------

// 「変数名: 型名 = 値」の書き方
let message: string = "こんにちは TypeScript";
let count: number = 10;
let isDone: boolean = false;

console.log("【型注釈付き変数】");
console.log(message); // → こんにちは TypeScript
console.log(count);   // → 10
console.log(isDone);  // → false

console.log();

// ----------------------------------------------------------
// 3. 関数への型注釈
// ----------------------------------------------------------

// 引数と戻り値に型を書く
function add(a: number, b: number): number {
  return a + b;
}

console.log("【型付き関数 add】");
console.log("add(3, 4) =", add(3, 4)); // → 7
console.log("add(10, -2) =", add(10, -2)); // → 8

console.log();

// ----------------------------------------------------------
// 4. @ts-expect-error で「型エラーを体験」する
// ----------------------------------------------------------
// ※ @ts-expect-error は「次の1行は意図的な型エラー」と TS に伝えるコメント
// ※ これがないと tsc --noEmit が失敗する

// 例1：文字列を number 引数に渡す
// @ts-expect-error 文字列を number 型の引数に渡した型エラーの例
const badResult = add("3", 4);
console.log("【@ts-expect-error の例1（文字列を数値引数に渡した）】");
console.log("結果:", badResult); // 実行時は動くが型的に誤り

console.log();

// 例2：string 型変数に number を代入
let greeting: string = "Hello";
// @ts-expect-error string 型に number を代入しようとした
greeting = 123;
console.log("【@ts-expect-error の例2（string 変数に number を代入）】");
console.log("greeting =", greeting); // 実行時は 123 になる

console.log();

// ----------------------------------------------------------
// 5. 型推論：注釈なしでも TypeScript が型を推論する
// ----------------------------------------------------------

// 初期化時に値があれば型を推論してくれる
const inferred = "TypeScript が string と推論する";
// inferred の型は自動で string になっている

console.log("【型推論の例】");
console.log(inferred);
// 型が string と推論されているので、number を代入しようとするとエラーになる

// 型推論の例：型注釈なし変数への誤代入を @ts-expect-error で示す
let inferredVar = "文字列として推論される";
// @ts-expect-error string と推論された変数に number を代入
inferredVar = 42;
console.log("inferredVar =", inferredVar);

console.log();

// ----------------------------------------------------------
// 6. 型は実行時に消える（type erasure）
// ----------------------------------------------------------

// TypeScript の型注釈は JS にコンパイルされると消える
// 実行時に型を確認するには JavaScript の typeof を使う

let value: number = 42;
console.log("【typeof で実行時の型を確認】");
console.log("value =", value);
console.log("typeof value =", typeof value); // → "number"（JS の typeof）
// TS の型注釈 ": number" と JS の typeof "number" は別物。
// TS の型はあくまで開発時（コンパイル時）だけ存在する。

console.log();

// ----------------------------------------------------------
// 7. 簡単な実用例：名前と年齢を使った関数
// ----------------------------------------------------------

function greet(name: string, age: number): string {
  return `${name}さんは${age}歳です`;
}

console.log("【実用例 greet】");
console.log(greet("田中", 30));  // → 田中さんは30歳です
console.log(greet("佐藤", 25));  // → 佐藤さんは25歳です

// 引数の型が違うとエラー
// @ts-expect-error age に string を渡したエラー例
console.log(greet("鈴木", "三十"));

console.log();
console.log("=== 第01章 完了 ===");
