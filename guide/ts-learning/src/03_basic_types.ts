// ============================================================
// 第03章 基本の型
// npx tsx src/03_basic_types.ts で実行
// ============================================================

// ----------------------------------------------------------
// 1. プリミティブ型：string / number / boolean
// ----------------------------------------------------------

console.log("=== 1. プリミティブ型 ===");

// string
const s1: string = "hello";
const s2: string = "world";
const s3: string = `${s1} ${s2}`;
console.log("string:", s3); // → hello world

// number（整数・小数・特殊値すべて number）
const n1: number = 42;
const n2: number = 3.14;
const n3: number = 0xff;    // 16進数
const n4: number = NaN;     // Not a Number（これも number 型）
const n5: number = Infinity;
console.log("number:", n1, n2, n3, n4, n5); // → 42 3.14 255 NaN Infinity

// boolean
const isLoggedIn: boolean = true;
const isEmpty: boolean = false;
console.log("boolean:", isLoggedIn, isEmpty); // → true false

console.log();

// ----------------------------------------------------------
// 2. null と undefined
// ----------------------------------------------------------

console.log("=== 2. null / undefined ===");

// null：意図的に「値なし」を示す
const a: null = null;
// undefined：値が未設定の状態
const b: undefined = undefined;
console.log("null:", a);      // → null
console.log("undefined:", b); // → undefined

// よく使うのは「string | null」のようなユニオン型（詳細は第7章）
let nickname: string | null = null;
console.log("nickname（null）:", nickname); // → null
nickname = "たなかん";
console.log("nickname（set）:", nickname);  // → たなかん

console.log();

// ----------------------------------------------------------
// 3. bigint と symbol
// ----------------------------------------------------------

console.log("=== 3. bigint / symbol ===");

// bigint：非常に大きな整数（末尾に n を付ける）
const big: bigint = 9007199254740993n; // Number.MAX_SAFE_INTEGER + 2
console.log("bigint:", big); // → 9007199254740993n

// symbol：ユニークな識別子
const sym1: symbol = Symbol("key");
const sym2: symbol = Symbol("key");
console.log("symbol equals:", sym1 === sym2); // → false（同じ説明でも別物）
console.log("symbol:", sym1.toString());       // → Symbol(key)

console.log();

// ----------------------------------------------------------
// 4. 型推論：初期値から型が決まる
// ----------------------------------------------------------

console.log("=== 4. 型推論 ===");

// 初期値から string と推論される（型注釈なしでよい）
const greeting = "Hello TypeScript";
console.log("greeting:", greeting); // → Hello TypeScript

// 初期値から number と推論される
const year = 2025;
console.log("year:", year); // → 2025

// 推論された型と違う値を代入しようとするとエラー
let mutableGreeting = "Hello TypeScript"; // string と推論
// @ts-expect-error string と推論された変数に number は代入できない
mutableGreeting = 123;
console.log("mutableGreeting（型的に誤り）:", mutableGreeting); // 実行時は 123 になる

// 関数の引数は推論できないので必ず書く
function multiply(n: number, by: number): number {
  return n * by;
}
console.log("multiply:", multiply(3, 4)); // → 12

console.log();

// ----------------------------------------------------------
// 5. any：型チェックをオフにする（危険）
// ----------------------------------------------------------

console.log("=== 5. any ===");

// any は何でも入れられる
let x: any = "文字列";
console.log("any string:", x); // → 文字列

x = 42;
console.log("any number:", x); // → 42

x = { nested: { prop: "値" } };
console.log("any object:", x.nested.prop); // → 値（型チェックなしで使える）

// any の伝染：any を使うと戻り値も any になる
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseUnsafe(data: any) {
  return data.value; // 戻り値も any になる
}
const result = parseUnsafe({ value: "見つかった" });
console.log("any result:", result); // → 見つかった（型情報が消えている）

console.log();

// ----------------------------------------------------------
// 6. unknown：安全版 any（使う前に型の絞り込みが必要）
// ----------------------------------------------------------

console.log("=== 6. unknown ===");

let val: unknown = "こんにちは";

// @ts-expect-error unknown のまま string メソッドは呼べない（安全）
val.toUpperCase();

// typeof で絞り込んでから使う
if (typeof val === "string") {
  console.log("unknown → string:", val.toUpperCase()); // → こんにちは
}

// 外部入力など「何が来るか分からない」値に使う実用例
function processInput(input: unknown): string {
  if (typeof input === "string") return `string: ${input}`;
  if (typeof input === "number") return `number: ${String(input)}`;
  if (typeof input === "boolean") return `boolean: ${String(input)}`;
  return "不明な入力";
}

console.log(processInput("hello")); // → string: hello
console.log(processInput(42));      // → number: 42
console.log(processInput(true));    // → boolean: true
console.log(processInput(null));    // → 不明な入力

console.log();

// ----------------------------------------------------------
// 7. never：値を持たない型
// ----------------------------------------------------------

console.log("=== 7. never ===");

// 例1：必ず例外を投げる関数（return しない = never）
function fail(message: string): never {
  throw new Error(message);
}

// 例2：switch の網羅性チェックに使う
type Color = "red" | "green" | "blue";

function getColorCode(color: Color): string {
  switch (color) {
    case "red":   return "#ff0000";
    case "green": return "#00ff00";
    case "blue":  return "#0000ff";
    default: {
      // Color に新しい値を追加してこのケースに到達したらコンパイルエラーになる
      const _exhaustive: never = color;
      return _exhaustive; // 実行には到達しない（never なので）
    }
  }
}

console.log("getColorCode red:", getColorCode("red"));     // → #ff0000
console.log("getColorCode blue:", getColorCode("blue"));   // → #0000ff

// fail の呼び出し例（実行するとエラーになるのでコメントアウト）
// fail("これはエラーです");

console.log();

// ----------------------------------------------------------
// 8. 型アサーション as
// ----------------------------------------------------------

console.log("=== 8. 型アサーション as ===");

// unknown を number として扱う
const raw: unknown = 42;
const num = raw as number;
console.log("as number:", num + 1); // → 43

// string を number に as する（危険な例）
const strAsNum = "hello" as unknown as number;
console.log("strAsNum + 1:", strAsNum + 1);
// → "hello1"（文字列連結になる！型アサーションは実行時の値を変えない）

// @ts-expect-error 直接関係ない型への1段階 as はエラーになる
const bad = "hello" as number;
console.log("bad:", bad);

console.log();

// ----------------------------------------------------------
// 9. typeof で実行時の型を確認（第7章の布石）
// ----------------------------------------------------------

console.log("=== 9. typeof ===");

const values: unknown[] = [42, "hello", true, null, undefined, { key: "obj" }];

for (const v of values) {
  // typeof null === "object" というJS歴史的バグに注意
  const typeStr = typeof v;
  const displayType = v === null ? "null（typeof は'object'）" : typeStr;
  console.log(`typeof [${String(v)}] → "${typeStr}"  (${displayType})`);
}
// → "number"  "string"  "boolean"  "object"（null）  "undefined"  "object"

console.log();
console.log("=== 第03章 完了 ===");
