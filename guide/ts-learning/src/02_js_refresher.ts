// ============================================================
// 第02章 JS リフレッシャー
// npx tsx src/02_js_refresher.ts で実行
// ============================================================

// ----------------------------------------------------------
// 1. let / const（var は使わない）
// ----------------------------------------------------------

console.log("=== 1. let / const ===");

const PI = 3.14;
let count = 0;
count = 10;
console.log("PI:", PI);      // → 3.14
console.log("count:", count); // → 10

// ブロックスコープ：{ } の中だけで有効
{
  const blockVar = "ブロック内だけ有効";
  console.log(blockVar); // → ブロック内だけ有効
}
// console.log(blockVar); // ここで使おうとするとエラー（スコープ外）

console.log();

// ----------------------------------------------------------
// 2. テンプレートリテラル
// ----------------------------------------------------------

console.log("=== 2. テンプレートリテラル ===");

const userName = "田中";
const userAge = 30;

const oldStyle = "こんにちは、" + userName + "さん（" + userAge + "歳）";
const modern = `こんにちは、${userName}さん（${userAge}歳）`;

console.log("旧スタイル:", oldStyle);  // → こんにちは、田中さん（30歳）
console.log("テンプレート:", modern);  // → こんにちは、田中さん（30歳）

// 改行もそのまま書ける
const multiline = `1行目
2行目
3行目`;
console.log(multiline);

console.log();

// ----------------------------------------------------------
// 3. 関数の書き方3種 + デフォルト引数 + レスト/スプレッド
// ----------------------------------------------------------

console.log("=== 3. 関数 ===");

// 関数宣言
function square(n: number): number {
  return n * n;
}
console.log("square(4):", square(4)); // → 16

// 関数式
const double = function (n: number): number {
  return n * 2;
};
console.log("double(5):", double(5)); // → 10

// アロー関数（1行）
const triple = (n: number): number => n * 3;
console.log("triple(3):", triple(3)); // → 9

// アロー関数（複数行）
const greet = (name: string): string => {
  const msg = `こんにちは、${name}さん`;
  return msg;
};
console.log(greet("佐藤")); // → こんにちは、佐藤さん

// デフォルト引数
function greetWithTitle(name: string, title: string = "さん"): string {
  return `${name}${title}、こんにちは`;
}
console.log(greetWithTitle("田中"));          // → 田中さん、こんにちは
console.log(greetWithTitle("田中", "先生"));  // → 田中先生、こんにちは

// レスト引数：可変長を配列として受け取る
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}
console.log("sum(1,2,3,4):", sum(1, 2, 3, 4)); // → 10

// スプレッド：配列を展開して渡す
const nums = [1, 2, 3];
console.log("sum(...nums):", sum(...nums)); // → 6

console.log();

// ----------------------------------------------------------
// 4. 配列メソッド
// ----------------------------------------------------------

console.log("=== 4. 配列メソッド ===");

const fruits = ["りんご", "バナナ", "みかん", "ぶどう"];
const prices = [100, 200, 150, 300];

// map：各要素を変換
const doubled = prices.map((p) => p * 2);
console.log("map doubled:", doubled); // → [200, 400, 300, 600]

// filter：条件に合う要素だけ残す
const expensive = prices.filter((p) => p >= 200);
console.log("filter expensive:", expensive); // → [200, 300]

// reduce：畳み込んで1つの値にする
const total = prices.reduce((acc, p) => acc + p, 0);
console.log("reduce total:", total); // → 750

// find：条件に合う最初の1件（なければ undefined）
const found = prices.find((p) => p > 100);
console.log("find > 100:", found); // → 200

const notFound = prices.find((p) => p > 1000);
console.log("find > 1000:", notFound); // → undefined

// forEach：副作用のためのループ
console.log("forEach fruits:");
fruits.forEach((f, i) => {
  console.log(`  ${i}: ${f}`);
});
// → 0: りんご  1: バナナ  2: みかん  3: ぶどう

console.log();

// ----------------------------------------------------------
// 5. オブジェクト：省略記法・分割代入・スプレッド
// ----------------------------------------------------------

console.log("=== 5. オブジェクト ===");

// プロパティ省略記法
const name = "田中";
const age = 28;
const user = { name, age }; // { name: name, age: age } と同じ
console.log("user:", user); // → { name: '田中', age: 28 }

// オブジェクトの分割代入
const { name: extractedName, age: extractedAge } = user;
console.log("分割代入:", extractedName, extractedAge); // → 田中 28

// 配列の分割代入
const [first, second, ...rest] = fruits;
console.log("first:", first);   // → りんご
console.log("second:", second); // → バナナ
console.log("rest:", rest);     // → ['みかん', 'ぶどう']

// スプレッドでオブジェクトをコピー・マージ
const base = { x: 1, y: 2 };
const extended = { ...base, z: 3 };
console.log("extended:", extended); // → { x: 1, y: 2, z: 3 }

// 同名キーは後勝ち
const overridden = { ...base, x: 99 };
console.log("overridden:", overridden); // → { x: 99, y: 2 }

console.log();

// ----------------------------------------------------------
// 6. 三項演算子 / ?. / ??
// ----------------------------------------------------------

console.log("=== 6. 三項演算子 / ?. / ?? ===");

// 三項演算子
const score = 75;
const result = score >= 60 ? "合格" : "不合格";
console.log("三項演算子:", result); // → 合格

// ?. オプショナルチェイニング
type UserProfile = { profile?: { nickname?: string } };
const userWithProfile: UserProfile = { profile: { nickname: "たなかん" } };
// undefined として宣言し、?. で安全にアクセスする例
const noProfile = undefined as UserProfile | undefined;

console.log("?. あり:", userWithProfile?.profile?.nickname);  // → たなかん
console.log("?. なし:", noProfile?.profile?.nickname);        // → undefined（エラーにならない）

// ?? null 合体演算子
const input: string | null = null;
const value = input ?? "デフォルト値";
console.log("?? input:", value); // → デフォルト値

const zero = 0;
console.log("?? 0:", zero ?? 99);  // → 0（0は null/undefined ではない）
console.log("|| 0:", zero || 99);  // → 99（|| は falsy 全般を対象にする）

console.log();

// ----------------------------------------------------------
// 7. 配列とオブジェクトの組み合わせ実用例
// ----------------------------------------------------------

console.log("=== 7. 実用例：商品リスト処理 ===");

type Item = { name: string; price: number; inStock: boolean };

const items: Item[] = [
  { name: "りんご", price: 120, inStock: true },
  { name: "バナナ", price: 80, inStock: false },
  { name: "みかん", price: 100, inStock: true },
  { name: "ぶどう", price: 350, inStock: true },
];

// 在庫ありで200円未満の商品名を取得
const affordable = items
  .filter((item) => item.inStock && item.price < 200)
  .map((item) => item.name);
console.log("在庫あり・200円未満:", affordable); // → ['りんご', 'みかん']

// 在庫ありの合計金額
const stockTotal = items
  .filter((item) => item.inStock)
  .reduce((acc, item) => acc + item.price, 0);
console.log("在庫ありの合計:", stockTotal); // → 570

console.log();

// ----------------------------------------------------------
// 8. 非同期の触り（Promise / async・await）
// ----------------------------------------------------------

console.log("=== 8. 非同期の触り ===");

// Promise：非同期処理の結果を包む
function delay(ms: number): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(`${ms}ms 後に完了`), ms);
  });
}

// async・await で同期っぽく書く
async function runAsync(): Promise<void> {
  console.log("非同期処理 開始");
  const result = await delay(50); // 50ms 待つ（学習用に短く）
  console.log("非同期処理 結果:", result);
  console.log("非同期処理 終了");
}

// 即時実行
runAsync().then(() => {
  console.log();
  console.log("=== 第02章 完了 ===");
});
