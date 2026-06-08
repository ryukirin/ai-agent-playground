// ============================================================
// 第05章 オブジェクト・インターフェース
// npx tsx src/05_objects_interfaces.ts で実行
// ============================================================

// ----------------------------------------------------------
// 1. オブジェクト型リテラル
// ----------------------------------------------------------
// 引数の型として中カッコでプロパティを列挙する
function printUser(user: { name: string; age: number }): void {
  console.log(`${user.name}(${user.age}歳)`);
}
printUser({ name: "田中", age: 30 }); // 田中(30歳)

// ----------------------------------------------------------
// 2. interface の定義と使用
// ----------------------------------------------------------
interface User {
  name: string;
  age: number;
}

const alice: User = { name: "Alice", age: 25 };
console.log("User:", alice.name, alice.age); // Alice 25

// ----------------------------------------------------------
// 3. type エイリアスでのオブジェクト型
// ----------------------------------------------------------
type Point = {
  x: number;
  y: number;
};

const origin: Point = { x: 0, y: 0 };
console.log("origin:", origin); // { x: 0, y: 0 }

// ----------------------------------------------------------
// 4. interface vs type — 拡張方法の違い
// ----------------------------------------------------------

// interface は extends で拡張
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

const myDog: Dog = { name: "ポチ", breed: "柴犬" };
console.log("Dog:", myDog); // { name: 'ポチ', breed: '柴犬' }

// type は & (交差型) で拡張
type Cat = Animal & { indoor: boolean };

const myCat: Cat = { name: "タマ", indoor: true };
console.log("Cat:", myCat); // { name: 'タマ', indoor: true }

// ----------------------------------------------------------
// 5. 宣言マージ — interface だけの機能
// ----------------------------------------------------------
// 同名の interface を複数宣言するとマージされる
interface Config {
  host: string;
}

// 同名の再宣言でプロパティが追加される(type では不可)
interface Config {
  port: number;
}

const config: Config = { host: "localhost", port: 8080 };
console.log("Config:", config); // { host: 'localhost', port: 8080 }

// ----------------------------------------------------------
// 6. ユニオン型は type のみ
// ----------------------------------------------------------
type Result = "success" | "failure";
type StringOrNumber = string | number;

const r: Result = "success";
const x: StringOrNumber = 42;
console.log("Result:", r, "/ StringOrNumber:", x);

// ----------------------------------------------------------
// 7. オプショナルプロパティ ?
// ----------------------------------------------------------
interface Article {
  title: string;
  body: string;
  author?: string; // なくてもOK
}

const post1: Article = { title: "TypeScript入門", body: "..." };
const post2: Article = { title: "続・TS", body: "...", author: "山田" };

console.log("post1.author:", post1.author); // undefined
console.log("post2.author:", post2.author); // 山田

// ----------------------------------------------------------
// 8. readonly プロパティ
// ----------------------------------------------------------
interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const red: Color = { r: 255, g: 0, b: 0 };
console.log("red:", red); // { r: 255, g: 0, b: 0 }

// @ts-expect-error readonly プロパティは再代入できない
red.r = 128;

// ----------------------------------------------------------
// 9. インデックスシグネチャ { [key: string]: number }
// ----------------------------------------------------------
// プロパティ名が事前に決まらない「辞書型」
interface ScoreBoard {
  [playerName: string]: number;
}

const scores: ScoreBoard = {};
scores["田中"] = 85;
scores["鈴木"] = 92;

console.log("田中のスコア:", scores["田中"]); // 85
console.log("鈴木のスコア:", scores["鈴木"]); // 92

// ----------------------------------------------------------
// 10. ネストしたオブジェクト・メソッドを持つ型
// ----------------------------------------------------------
interface Address {
  city: string;
  zip: string;
}

interface Employee {
  name: string;
  address: Address;   // ネストしたオブジェクト
  greet(): string;    // メソッドシグネチャ
}

const emp: Employee = {
  name: "佐藤",
  address: { city: "東京", zip: "100-0001" },
  greet() {
    return `こんにちは、${this.name}です`;
  },
};

console.log("city:", emp.address.city); // 東京
console.log("greet:", emp.greet());     // こんにちは、佐藤です

// ----------------------------------------------------------
// 11. interface extends — 継承
// ----------------------------------------------------------
interface Shape {
  color: string;
}

interface Circle extends Shape {
  radius: number;
}

interface Rectangle extends Shape {
  width: number;
  height: number;
}

const circle: Circle = { color: "red", radius: 5 };
const rect: Rectangle = { color: "blue", width: 10, height: 4 };

console.log("circle:", circle); // { color: 'red', radius: 5 }
console.log("rect:", rect);     // { color: 'blue', width: 10, height: 4 }

// ----------------------------------------------------------
// 12. 過剰プロパティチェック
// ----------------------------------------------------------

interface Profile {
  name: string;
  age: number;
}

// オブジェクトリテラルを直渡しすると余分なプロパティでエラー
// @ts-expect-error オブジェクトリテラル直渡しで余分な email プロパティがあるためエラー
const p: Profile = { name: "太郎", age: 20, email: "t@example.com" };

// 一度変数に代入してから渡すとエラーにならない(代入互換性チェックのみ)
const obj = { name: "太郎", age: 20, email: "t@example.com" };
const p2: Profile = obj; // OK
console.log("p2:", p2); // { name: '太郎', age: 20, email: 't@example.com' }

// ----------------------------------------------------------
// 13. インデックスシグネチャと固定プロパティの型不整合
// ----------------------------------------------------------
// 固定プロパティ count: number はインデックスシグネチャ string と非互換になる
// interface の定義ブロック内でエラーが起きるため、型エイリアスで示す
// @ts-expect-error count: number が [key: string]: string に非互換なためエラー
type BadIndex = { [key: string]: string; count: number };

console.log("=== 第05章 完了 ===");
