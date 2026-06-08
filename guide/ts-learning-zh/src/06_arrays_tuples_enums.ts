// ============================================================
// 第06章 数组、元组 (tuple) 与枚举 (enum)
// npx tsx src/06_arrays_tuples_enums.ts 执行
// ============================================================

// ----------------------------------------------------------
// 1. 数组类型 number[] 与 Array<number>（同义）
// ----------------------------------------------------------
const nums1: number[] = [1, 2, 3];
const nums2: Array<number> = [4, 5, 6];

console.log("nums1:", nums1); // [1, 2, 3]
console.log("nums2:", nums2); // [4, 5, 6]

// ----------------------------------------------------------
// 2. 多维数组 number[][]
// ----------------------------------------------------------
// 二维数组（矩阵等）
const matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
console.log("matrix[1][2]:", matrix[1][2]); // 6

// 字符串的二维数组
const grid: string[][] = [
  ["○", "×", "○"],
  ["×", "○", "×"],
];
console.log("grid[0][1]:", grid[0][1]); // ×

// ----------------------------------------------------------
// 3. readonly 数组 — 不可变
// ----------------------------------------------------------
const frozen: readonly number[] = [1, 2, 3];

console.log("frozen[0]:", frozen[0]); // 1

// @ts-expect-error readonly 数组不能使用 push
frozen.push(4);

// @ts-expect-error readonly 数组的元素也不能重新赋值
frozen[0] = 99;

// ----------------------------------------------------------
// 4. 元组 [string, number]
// ----------------------------------------------------------
// 表示"姓名和分数"的元组
const entry: [string, number] = ["小明", 85];

console.log("entry[0]:", entry[0]); // 小明
console.log("entry[1]:", entry[1]); // 85

// 解构赋值也可以
const [tName, tScore] = entry;
console.log(`${tName}：${tScore}分`); // 小明：85分

// ----------------------------------------------------------
// 5. 命名元组（TypeScript 4.0+）
// ----------------------------------------------------------
// 为各元素添加标签可以提高可读性
type NamedEntry = [name: string, score: number];

const student: NamedEntry = ["小红", 92];
console.log("student:", student); // [ '小红', 92 ]

// ----------------------------------------------------------
// 6. 可选元素的元组
// ----------------------------------------------------------
type WithOptional = [string, number, boolean?];

const ta: WithOptional = ["hello", 1];        // 省略 boolean
const tb: WithOptional = ["world", 2, true];  // 有 boolean
console.log("ta:", ta, "tb:", tb);

// ----------------------------------------------------------
// 7. 可变长（rest）元组
// ----------------------------------------------------------
// 前两个固定为 string，后续可以有任意数量的 number
type AtLeastTwo = [string, string, ...number[]];

const tc: AtLeastTwo = ["first", "second"];            // number 部分0个
const td: AtLeastTwo = ["first", "second", 1, 2, 3];   // number 部分3个
console.log("tc:", tc);
console.log("td:", td);

// ----------------------------------------------------------
// 8. 数值枚举
// ----------------------------------------------------------
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}

const dir: Direction = Direction.Up;
console.log("dir:", dir);             // 0
console.log("反向查找:", Direction[0]); // Up
console.log("Right:", Direction.Right); // 3

// ----------------------------------------------------------
// 9. 字符串枚举
// ----------------------------------------------------------
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}

const myColor: Color = Color.Green;
console.log("myColor:", myColor); // GREEN

// ----------------------------------------------------------
// 10. 数值枚举的陷阱：允许类型外的数值
// ----------------------------------------------------------
enum Status {
  Active = 0,
  Inactive = 1,
}

// TypeScript 5.x 中数值枚举的类型外赋值已成为错误
// 旧版本中可以通过，此处作为"陷阱"介绍
// @ts-expect-error 类型外的数值 99 与 Status 不兼容（TS5.x 已加强）
const s: Status = 99;
console.log("类型外的数值（运行时）:", s); // 运行通过，但类型不合法

// ----------------------------------------------------------
// 11. 字面量联合类型 — 枚举的替代方案（推荐）
// ----------------------------------------------------------
type Direction2 = "Up" | "Down" | "Left" | "Right";

function move(d: Direction2): void {
  console.log(`移动：${d}`);
}

move("Up");   // 移动：Up

// @ts-expect-error 不在字面量联合类型中的字符串会报错
move("Diagonal");

// ----------------------------------------------------------
// 12. as const — 固定为字面量类型
// ----------------------------------------------------------
// 没有 as const：推断为 string[]
const arr1 = ["a", "b"]; // 类型：string[]

// 有 as const：变为 readonly ["a", "b"]
const arr2 = ["a", "b"] as const;
console.log("arr2:", arr2); // [ 'a', 'b' ]

// @ts-expect-error as const 的数组是 readonly，不能修改
arr2.push("c");

// ----------------------------------------------------------
// 13. 对象常量 + as const 提取键/值类型
// ----------------------------------------------------------
const COLORS = {
  Red: "RED",
  Green: "GREEN",
  Blue: "BLUE",
} as const;

// keyof typeof 得到 "Red" | "Green" | "Blue"
type ColorKey = keyof typeof COLORS;

// 索引访问类型得到 "RED" | "GREEN" | "BLUE"
type ColorValue = (typeof COLORS)[ColorKey];

const chosenColor: ColorValue = "GREEN";
console.log("chosenColor:", chosenColor); // GREEN

// ----------------------------------------------------------
// 14. 数组越界访问 — 类型上是 string，运行时是 undefined
// ----------------------------------------------------------
const items = ["a", "b", "c"];
const item = items[10]; // 类型上是 string，运行时是 undefined
console.log("items[10]:", item);         // undefined
console.log("typeof items[10]:", typeof item); // "undefined"

// 养成先检查存在性的习惯
if (item !== undefined) {
  console.log(item.toUpperCase());
}

// ----------------------------------------------------------
// 15. 超出元组长度的赋值会报错
// ----------------------------------------------------------
const pair: [string, number] = ["hello", 1];

// @ts-expect-error 元组长度为2，访问索引2会报错
pair[2] = "extra";

// ----------------------------------------------------------
// 16. 忘记 as const 类型会变宽的示例
// ----------------------------------------------------------
// 没有 as const：string[] — 可以放入任意字符串
const dirs1 = ["Up", "Down", "Left", "Right"];
// 类型：string[]，所以可以 push "Unknown"
dirs1.push("Unknown");
console.log("dirs1:", dirs1);

// 有 as const：readonly ["Up", "Down", "Left", "Right"] — 不可变的字面量类型
const dirs2 = ["Up", "Down", "Left", "Right"] as const;
console.log("dirs2:", dirs2);

console.log("=== 第06章 完成 ===");
