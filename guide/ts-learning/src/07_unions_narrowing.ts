// ============================================================
// 第07章 ユニオン型・絞り込み・判別可能ユニオン
// npx tsx src/07_unions_narrowing.ts
// ============================================================

// ─────────────────────────────────────────
// 1. ユニオン型 string | number
// ─────────────────────────────────────────

// 「どちらかの型」を受け付ける
function printId(id: string | number): void {
  console.log("ID:", id);
}

printId(42);       // ID: 42
printId("abc-1");  // ID: abc-1

// @ts-expect-error boolean はユニオンに含まれないのでエラー
printId(true);

// ─────────────────────────────────────────
// 2. 交差型 A & B
// ─────────────────────────────────────────

// 「両方の性質を持つ」型を作る
type HasName = { name: string };
type HasAge  = { age: number };
type Person  = HasName & HasAge;    // name と age の両方が必須

const alice: Person = { name: "Alice", age: 30 };
console.log("交差型の例:", alice.name, alice.age);  // Alice 30

// ─────────────────────────────────────────
// 3. リテラル型・数値リテラルユニオン
// ─────────────────────────────────────────

// 文字列リテラルユニオン: 決まった文字列しか入れられない
type Direction = "north" | "south" | "east" | "west";
const dir: Direction = "north";
console.log("方角:", dir);

// @ts-expect-error リテラルユニオン外の値はエラー
const badDir: Direction = "up";

// 数値リテラルユニオン: 決まった数値だけを受け入れる
type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;
const roll: DiceValue = 3;
console.log("サイコロ:", roll);

// リテラル型は型注釈なしだと widening(拡大)される点に注意
const withoutAnnotation = "north";  // 型は string (widened)
const withAnnotation: Direction = "north"; // 型は "north" のまま
console.log(withoutAnnotation, withAnnotation);

// ─────────────────────────────────────────
// 4. typeof による絞り込み(narrowing)
// ─────────────────────────────────────────

// TypeScript は typeof チェック後に型を絞り込む
function describe(value: string | number): string {
  if (typeof value === "string") {
    // このブロック内では value は string と確定している
    return `文字列: ${value.toUpperCase()}`;
  }
  // ここでは value は number と確定している
  return `数値の2倍: ${value * 2}`;
}

console.log(describe("hello"));  // 文字列: HELLO
console.log(describe(21));       // 数値の2倍: 42

// ─────────────────────────────────────────
// 5. truthiness(真偽値)による絞り込み
// ─────────────────────────────────────────

// null | undefined を除外するのによく使う
function greet(name: string | null): string {
  if (name) {
    // name が truthy → null でも "" でもない → string と確定
    return `こんにちは、${name}さん`;
  }
  return "こんにちは、ゲストさん";
}

console.log(greet("Bob"));   // こんにちは、Bobさん
console.log(greet(null));    // こんにちは、ゲストさん

// ─────────────────────────────────────────
// 6. === による比較での絞り込み
// ─────────────────────────────────────────

type Status = "ok" | "error" | "loading";

function handleStatus(s: Status): void {
  if (s === "ok") {
    console.log("成功!");
  } else if (s === "error") {
    console.log("エラーが発生しました");
  } else {
    // ここでは s は "loading" と確定
    console.log("読み込み中...");
  }
}

handleStatus("ok");      // 成功!
handleStatus("loading"); // 読み込み中...

// ─────────────────────────────────────────
// 7. in 演算子による絞り込み
// ─────────────────────────────────────────

// オブジェクトに特定のプロパティがあるかチェックして型を絞り込む
type Cat = { kind: "cat"; meow(): void };
type Dog = { kind: "dog"; bark(): void };
type Animal = Cat | Dog;

function makeSound(animal: Animal): void {
  if ("meow" in animal) {
    // meow プロパティがある → Cat と確定
    animal.meow();
  } else {
    animal.bark();
  }
}

const cat: Cat = {
  kind: "cat",
  meow() { console.log("ニャー"); }
};
makeSound(cat);  // ニャー

// ─────────────────────────────────────────
// 8. instanceof による絞り込み
// ─────────────────────────────────────────

function formatError(err: Error | string): string {
  if (err instanceof Error) {
    // Error クラスのインスタンスと確定 → .message が使える
    return `エラーオブジェクト: ${err.message}`;
  }
  return `文字列エラー: ${err}`;
}

console.log(formatError(new Error("ファイルが見つかりません")));
// エラーオブジェクト: ファイルが見つかりません
console.log(formatError("タイムアウト"));
// 文字列エラー: タイムアウト

// ─────────────────────────────────────────
// 9. ユーザー定義型ガード (x is T)
// ─────────────────────────────────────────

// 組み込みの typeof/instanceof では対処できない場合に自分で型ガードを書く
type Fish = { swim(): void };
type Bird = { fly(): void };

// 戻り値型 "value is Fish" が型ガードのシグネチャ
function isFish(value: Fish | Bird): value is Fish {
  return "swim" in value;
}

function move(creature: Fish | Bird): void {
  if (isFish(creature)) {
    // ここでは Fish と確定
    creature.swim();
  } else {
    creature.fly();
  }
}

const fish: Fish = { swim() { console.log("泳ぐ"); } };
const bird: Bird = { fly()  { console.log("飛ぶ"); } };
move(fish);  // 泳ぐ
move(bird);  // 飛ぶ

// unknown に対して型ガードを書く実用例
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(v => typeof v === "string");
}

const data: unknown = ["a", "b", "c"];
if (isStringArray(data)) {
  // data は string[] と確定
  console.log("文字列配列の先頭:", data[0]);  // a
}

// ─────────────────────────────────────────
// 10. 判別可能ユニオン (discriminated union) ★最重要★
// ─────────────────────────────────────────

// 「タグ」となるリテラル型プロパティを持つオブジェクトのユニオン
// このパターンを使うと TypeScript が自動で型を絞り込んでくれる

// --- 例: API レスポンスの表現 ---
type ApiSuccess = {
  kind: "success";  // ← これがタグ(判別子)
  data: string[];
};

type ApiError = {
  kind: "error";    // ← 同じ名前・違うリテラル値
  message: string;
  code: number;
};

type ApiLoading = {
  kind: "loading";
};

// 3種類のユニオン型
type ApiResult = ApiSuccess | ApiError | ApiLoading;

// switch で kind を見るだけで TypeScript が各ブランチの型を確定してくれる
function renderResult(result: ApiResult): string {
  switch (result.kind) {
    case "success":
      // result は ApiSuccess と確定 → result.data が使える
      return `成功: ${result.data.join(", ")}`;
    case "error":
      // result は ApiError と確定 → result.message, result.code が使える
      return `エラー(${result.code}): ${result.message}`;
    case "loading":
      // result は ApiLoading と確定
      return "読み込み中...";
  }
}

const success: ApiResult = { kind: "success", data: ["A", "B", "C"] };
const error: ApiResult   = { kind: "error", message: "未認証", code: 401 };
const loading: ApiResult = { kind: "loading" };

console.log(renderResult(success));  // 成功: A, B, C
console.log(renderResult(error));    // エラー(401): 未認証
console.log(renderResult(loading));  // 読み込み中...

// タグの名前は kind 以外でも何でも OK (type / tag / variant など慣習は様々)
type Square   = { shape: "square";   side: number };
type Circle   = { shape: "circle";   radius: number };
type Triangle = { shape: "triangle"; base: number; height: number };
type Shape = Square | Circle | Triangle;

function area(s: Shape): number {
  switch (s.shape) {
    case "square":   return s.side ** 2;
    case "circle":   return Math.PI * s.radius ** 2;
    case "triangle": return (s.base * s.height) / 2;
  }
}

console.log("正方形の面積:", area({ shape: "square",   side: 4 }));          // 16
console.log("円の面積:",     area({ shape: "circle",   radius: 3 }).toFixed(4)); // 28.2743
console.log("三角形の面積:", area({ shape: "triangle", base: 6, height: 4 }));   // 12

// ─────────────────────────────────────────
// 11. 網羅性チェック (exhaustiveness check) with never
// ─────────────────────────────────────────

// never 型は「到達できないはずの場所」を表す
// switch の default ブランチで never に代入することで、
// 将来 Shape に新しい種類が追加されたとき、コンパイルエラーで気付ける

function areaWithExhaustiveCheck(s: Shape): number {
  switch (s.shape) {
    case "square":   return s.side ** 2;
    case "circle":   return Math.PI * s.radius ** 2;
    case "triangle": return (s.base * s.height) / 2;
    default: {
      // ここに来たら s は never のはず
      // もし Shape に新しい variant が追加されたら、
      // never への代入でコンパイルエラーになる
      const _exhaustive: never = s;
      throw new Error(`未対応の形状: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

// 動作確認
console.log("網羅性チェック付き面積:", areaWithExhaustiveCheck({ shape: "square", side: 5 })); // 25

// ─────────────────────────────────────────
// 12. ユニオン型の実用パターンまとめ
// ─────────────────────────────────────────

// null 安全なユーティリティ関数
function parseNumber(input: string | null | undefined): number | null {
  if (input == null) return null;  // null と undefined をまとめて除外
  const n = parseFloat(input);
  return isNaN(n) ? null : n;
}

console.log(parseNumber("3.14"));  // 3.14
console.log(parseNumber(null));    // null
console.log(parseNumber("abc"));   // null
