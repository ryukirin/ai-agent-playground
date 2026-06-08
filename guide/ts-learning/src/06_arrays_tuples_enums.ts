// ============================================================
// 第06章 配列・タプル・enum
// npx tsx src/06_arrays_tuples_enums.ts で実行
// ============================================================

// ----------------------------------------------------------
// 1. 配列型 number[] と Array<number>(同義)
// ----------------------------------------------------------
const nums1: number[] = [1, 2, 3];
const nums2: Array<number> = [4, 5, 6];

console.log("nums1:", nums1); // [1, 2, 3]
console.log("nums2:", nums2); // [4, 5, 6]

// ----------------------------------------------------------
// 2. 多次元配列 number[][]
// ----------------------------------------------------------
// 2次元配列(行列など)
const matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
console.log("matrix[1][2]:", matrix[1][2]); // 6

// 文字列の2次元配列
const grid: string[][] = [
  ["○", "×", "○"],
  ["×", "○", "×"],
];
console.log("grid[0][1]:", grid[0][1]); // ×

// ----------------------------------------------------------
// 3. readonly 配列 — 変更不可
// ----------------------------------------------------------
const frozen: readonly number[] = [1, 2, 3];

console.log("frozen[0]:", frozen[0]); // 1

// @ts-expect-error readonly 配列に push は使えない
frozen.push(4);

// @ts-expect-error readonly 配列の要素への再代入もできない
frozen[0] = 99;

// ----------------------------------------------------------
// 4. タプル [string, number]
// ----------------------------------------------------------
// 「名前と点数」のペアを表すタプル
const entry: [string, number] = ["田中", 85];

console.log("entry[0]:", entry[0]); // 田中
console.log("entry[1]:", entry[1]); // 85

// 分割代入でOK
const [tName, tScore] = entry;
console.log(`${tName}: ${tScore}点`); // 田中: 85点

// ----------------------------------------------------------
// 5. 名前付きタプル(TypeScript 4.0+)
// ----------------------------------------------------------
// 各要素にラベルを付けると可読性が上がる
type NamedEntry = [name: string, score: number];

const student: NamedEntry = ["鈴木", 92];
console.log("student:", student); // [ '鈴木', 92 ]

// ----------------------------------------------------------
// 6. オプショナル要素のタプル
// ----------------------------------------------------------
type WithOptional = [string, number, boolean?];

const ta: WithOptional = ["hello", 1];        // boolean 省略
const tb: WithOptional = ["world", 2, true];  // boolean あり
console.log("ta:", ta, "tb:", tb);

// ----------------------------------------------------------
// 7. 可変長(rest)タプル
// ----------------------------------------------------------
// 先頭2つは string 固定、以降は number を何個でも
type AtLeastTwo = [string, string, ...number[]];

const tc: AtLeastTwo = ["first", "second"];            // number 部分は0個
const td: AtLeastTwo = ["first", "second", 1, 2, 3];   // number 部分は3個
console.log("tc:", tc);
console.log("td:", td);

// ----------------------------------------------------------
// 8. 数値 enum
// ----------------------------------------------------------
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}

const dir: Direction = Direction.Up;
console.log("dir:", dir);             // 0
console.log("逆引き:", Direction[0]); // Up
console.log("Right:", Direction.Right); // 3

// ----------------------------------------------------------
// 9. 文字列 enum
// ----------------------------------------------------------
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}

const myColor: Color = Color.Green;
console.log("myColor:", myColor); // GREEN

// ----------------------------------------------------------
// 10. 数値 enum の落とし穴: 型外の数値を許容してしまう
// ----------------------------------------------------------
enum Status {
  Active = 0,
  Inactive = 1,
}

// TypeScript 5.x では数値 enum の型外代入もエラーになった
// 以前のバージョンでは通っていたため「落とし穴」として紹介
// @ts-expect-error 型外の数値 99 は Status に非互換(TS5.x で強化)
const s: Status = 99;
console.log("型外の数値(実行時):", s); // 実行は通るが型は不正

// ----------------------------------------------------------
// 11. リテラルユニオン — enum の代替(推奨)
// ----------------------------------------------------------
type Direction2 = "Up" | "Down" | "Left" | "Right";

function move(d: Direction2): void {
  console.log(`移動: ${d}`);
}

move("Up");   // 移動: Up

// @ts-expect-error リテラルユニオンにない文字列はエラー
move("Diagonal");

// ----------------------------------------------------------
// 12. as const — リテラル型として固定
// ----------------------------------------------------------
// as const なし: string[] と推論される
const arr1 = ["a", "b"]; // 型: string[]

// as const あり: readonly ["a", "b"] になる
const arr2 = ["a", "b"] as const;
console.log("arr2:", arr2); // [ 'a', 'b' ]

// @ts-expect-error as const の配列は readonly なので変更不可
arr2.push("c");

// ----------------------------------------------------------
// 13. オブジェクト定数 + as const でキー/バリュー型を抽出
// ----------------------------------------------------------
const COLORS = {
  Red: "RED",
  Green: "GREEN",
  Blue: "BLUE",
} as const;

// keyof typeof で "Red" | "Green" | "Blue" を得る
type ColorKey = keyof typeof COLORS;

// インデックスアクセス型で "RED" | "GREEN" | "BLUE" を得る
type ColorValue = (typeof COLORS)[ColorKey];

const chosenColor: ColorValue = "GREEN";
console.log("chosenColor:", chosenColor); // GREEN

// ----------------------------------------------------------
// 14. 配列の範囲外アクセス — 型上 string だが実行時 undefined
// ----------------------------------------------------------
const items = ["a", "b", "c"];
const item = items[10]; // 型上は string / 実行時は undefined
console.log("items[10]:", item);         // undefined
console.log("typeof items[10]:", typeof item); // "undefined"

// 安全のため存在確認を入れる習慣を
if (item !== undefined) {
  console.log(item.toUpperCase());
}

// ----------------------------------------------------------
// 15. タプルの長さを超えた代入はエラー
// ----------------------------------------------------------
const pair: [string, number] = ["hello", 1];

// @ts-expect-error タプルの長さは2なのでインデックス2へのアクセスはエラー
pair[2] = "extra";

// ----------------------------------------------------------
// 16. as const を忘れると型が広がる例
// ----------------------------------------------------------
// as const なし: string[] — 要素が何でも入れられる型
const dirs1 = ["Up", "Down", "Left", "Right"];
// 型: string[] なので "Unknown" も代入可
dirs1.push("Unknown");
console.log("dirs1:", dirs1);

// as const あり: readonly ["Up", "Down", "Left", "Right"] — 変更不可のリテラル型
const dirs2 = ["Up", "Down", "Left", "Right"] as const;
console.log("dirs2:", dirs2);

console.log("=== 第06章 完了 ===");
