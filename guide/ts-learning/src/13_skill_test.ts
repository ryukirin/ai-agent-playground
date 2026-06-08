/**
 * ===== TypeScript 腕試しテスト(第1〜12章 総合) =====
 *
 * 使い方:
 *   1. このファイルの【✏️ ここを実装するエリア】にある各関数/クラスの
 *      `throw new Error("未実装")` を、正しい実装に置き換える。
 *   2. `npm run test`(または `npx tsx src/13_skill_test.ts`)で実行。
 *   3. すべて ✅ になればクリア!❌ が残っている間は再挑戦。
 *
 * ・解答例は chapters/13_skill_test.md に章ごとの解説つきで載っています。
 * ・型だけのチャレンジ(おまけ)も同 md にあります。
 * ・採点ロジック(下半分)は編集しないでください。
 */

// ============================================================
// ✏️ ここを実装するエリア(ここだけ編集する)
// ============================================================

// --- Q1【第3・4章】数値を2乗して返す。引数・戻り値に型を付けること ---
function square(n: number): number {
  throw new Error("未実装"); // TODO: n を2乗して返す
}

// --- Q2【第3章】unknown を受け取り、string ならその文字数、それ以外は -1 ---
function safeLength(x: unknown): number {
  throw new Error("未実装"); // TODO: typeof で絞り込む
}

// --- Q3【第4章】文字列配列を区切り文字で連結。区切りは省略時 "," ---
function joinWith(items: string[], sep: string = ","): string {
  throw new Error("未実装"); // TODO: 省略可能引数 sep を使う
}

// --- Q4【第5章】User は定義済み。formatUser を実装する ---
//     email があれば "名前 <メール>"、無ければ "名前" を返す
interface User {
  id: number;
  name: string;
  email?: string;
}
function formatUser(u: User): string {
  throw new Error("未実装"); // TODO: email の有無で分岐
}

// --- Q5【第6章】RGB タプル [r,g,b](0-255)を "#rrggbb"(小文字・2桁0埋め)に ---
function rgbToHex(rgb: readonly [number, number, number]): string {
  throw new Error("未実装"); // TODO: toString(16) と padStart を使う
}

// --- Q6【第7章】判別可能ユニオン Shape の面積。default に never の網羅性チェックも ---
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number };
function area(shape: Shape): number {
  throw new Error("未実装"); // TODO: switch (shape.kind) で分岐
}

// --- Q7【第7章】ユーザー定義型ガード:値が「空でない string」なら true ---
function isNonEmptyString(x: unknown): x is string {
  throw new Error("未実装"); // TODO: typeof と length で判定
}

// --- Q8【第8章】配列の最後の要素を返すジェネリック関数(空なら undefined)---
function lastItem<T>(arr: T[]): T | undefined {
  throw new Error("未実装"); // TODO: 型引数 T を活かす
}

// --- Q9【第8章】オブジェクトとキーから値を取り出す。キーは keyof で制約 ---
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  throw new Error("未実装"); // TODO: obj[key] を返す
}

// --- Q10【第9章】文字列配列の出現回数を Record<string, number> で返す ---
function countBy(items: string[]): Record<string, number> {
  throw new Error("未実装"); // TODO: 集計して Record を作る
}

// --- Q11【第10章】ジェネリックなスタック Stack<T> を完成させる ---
class Stack<T> {
  private items: T[] = [];
  push(item: T): void {
    throw new Error("未実装"); // TODO
  }
  pop(): T | undefined {
    throw new Error("未実装"); // TODO
  }
  size(): number {
    throw new Error("未実装"); // TODO
  }
}

// --- Q12【第11章】delay と fetchUserName(疑似非同期)を実装 ---
function delay(ms: number): Promise<void> {
  throw new Error("未実装"); // TODO: setTimeout を Promise で包む
}
async function fetchUserName(id: number): Promise<string> {
  throw new Error("未実装"); // TODO: 50ms 待ってから `user-${id}` を返す
}

// --- Q13【第12章・総合】カウンターの reducer。判別可能ユニオン Action で分岐 ---
//     "inc" は +1 / "dec" は -1 / "set" は payload をセット
type CounterAction =
  | { type: "inc" }
  | { type: "dec" }
  | { type: "set"; payload: number };
function counterReducer(state: number, action: CounterAction): number {
  throw new Error("未実装"); // TODO: switch (action.type) で分岐(default に never)
}

// ============================================================
// 🔒 採点エリア(ここから下は編集しない)
// ============================================================

let passed = 0;
let total = 0;

async function check(label: string, fn: () => boolean | Promise<boolean>): Promise<void> {
  total++;
  try {
    const ok = await fn();
    if (ok) {
      passed++;
      console.log(`✅ ${label}`);
    } else {
      console.log(`❌ ${label}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`❌ ${label}  (${msg})`);
  }
}

async function main(): Promise<void> {
  console.log("===== TypeScript 腕試しテスト(第1〜12章)=====");
  console.log("src/13_skill_test.ts の TODO(未実装)を埋めて、全問 ✅ を目指そう。\n");

  await check("Q1  square(5) === 25", () => square(5) === 25);
  await check("Q1  square(-3) === 9", () => square(-3) === 9);

  await check('Q2  safeLength("hello") === 5', () => safeLength("hello") === 5);
  await check("Q2  safeLength(123) === -1", () => safeLength(123) === -1);

  await check('Q3  joinWith(["a","b"]) === "a,b"', () => joinWith(["a", "b"]) === "a,b");
  await check('Q3  joinWith(["a","b"], "-") === "a-b"', () => joinWith(["a", "b"], "-") === "a-b");

  await check("Q4  email あり", () => formatUser({ id: 1, name: "Taro", email: "t@x.jp" }) === "Taro <t@x.jp>");
  await check("Q4  email なし", () => formatUser({ id: 2, name: "Hanako" }) === "Hanako");

  await check('Q5  [255,0,128] -> "#ff0080"', () => rgbToHex([255, 0, 128]) === "#ff0080");
  await check('Q5  [0,0,0] -> "#000000"', () => rgbToHex([0, 0, 0]) === "#000000");

  await check("Q6  circle の面積", () => Math.abs(area({ kind: "circle", radius: 2 }) - Math.PI * 4) < 1e-9);
  await check("Q6  rect の面積", () => area({ kind: "rect", width: 3, height: 4 }) === 12);

  await check('Q7  isNonEmptyString("a") === true', () => isNonEmptyString("a") === true);
  await check('Q7  isNonEmptyString("") === false', () => isNonEmptyString("") === false);
  await check("Q7  isNonEmptyString(123) === false", () => isNonEmptyString(123) === false);

  await check("Q8  lastItem([1,2,3]) === 3", () => lastItem([1, 2, 3]) === 3);
  await check('Q8  lastItem(["a","b"]) === "b"', () => lastItem(["a", "b"]) === "b");
  await check("Q8  lastItem([]) === undefined", () => lastItem([]) === undefined);

  await check("Q9  pluck(obj, 'id')", () => pluck({ id: 1, name: "Taro" }, "id") === 1);
  await check("Q9  pluck(obj, 'name')", () => pluck({ id: 1, name: "Taro" }, "name") === "Taro");

  await check("Q10 countBy 集計", () => {
    const r = countBy(["a", "b", "a", "a", "b"]);
    return r.a === 3 && r.b === 2;
  });

  await check("Q11 Stack push/pop/size", () => {
    const s = new Stack<number>();
    s.push(1);
    s.push(2);
    return s.size() === 2 && s.pop() === 2 && s.size() === 1;
  });

  await check("Q12 fetchUserName(7) === 'user-7'", async () => (await fetchUserName(7)) === "user-7");

  await check("Q13 inc", () => counterReducer(0, { type: "inc" }) === 1);
  await check("Q13 dec", () => counterReducer(5, { type: "dec" }) === 4);
  await check("Q13 set", () => counterReducer(0, { type: "set", payload: 42 }) === 42);

  console.log("\n" + "=".repeat(44));
  console.log(`結果: ${passed} / ${total} 問正解`);
  if (passed === total) {
    console.log("🎉 全問正解!TypeScript の基礎はバッチリです。");
  } else {
    console.log(`あと ${total - passed} 問。TODO(未実装)を埋めて再挑戦!`);
    console.log("解答例 → chapters/13_skill_test.md");
  }
}

await main();
