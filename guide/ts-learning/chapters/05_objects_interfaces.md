# 第05章 オブジェクト・インターフェース

> TypeScript でオブジェクトの「形」を型として定義する方法を学ぶ。`interface` と `type` の違いを押さえれば、大きなコードベースでも迷わない。

## 🎯 この章のゴール

- オブジェクト型リテラルで形を表現できる
- `interface` と `type` を正しく使い分けられる
- `readonly` / `?` / インデックスシグネチャを使える
- `interface extends` で型を拡張できる
- 過剰プロパティチェックの仕組みを知っている

---

## オブジェクト型リテラル

中カッコ `{}` でプロパティ名と型を列挙するのが最もシンプルな書き方です。

```ts
function printUser(user: { name: string; age: number }): void {
  console.log(`${user.name}(${user.age}歳)`);
}

printUser({ name: "田中", age: 30 }); // 田中(30歳)
```

引数や変数の型注釈にそのまま書けますが、同じ形が複数箇所に出てくるなら `interface` か `type` で名前を付けましょう。

---

## `interface` の定義と使用

```ts
interface User {
  name: string;
  age: number;
}

const alice: User = { name: "Alice", age: 25 };
console.log(alice.name); // Alice
```

`interface` はオブジェクトの「契約(contract)」を表します。この形を守っていれば何でも `User` として使えます。

---

## `type` エイリアスでのオブジェクト型

```ts
type Point = {
  x: number;
  y: number;
};

const origin: Point = { x: 0, y: 0 };
console.log(origin); // { x: 0, y: 0 }
```

見た目は `interface` とよく似ています。

---

## interface vs type — 違いと使い分け

両者は多くの場面で互換的に使えますが、いくつかの重要な違いがあります。

### 1. 拡張(継承)の書き方が違う

```ts
// interface は extends で拡張
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

const myDog: Dog = { name: "ポチ", breed: "柴犬" };
console.log(myDog); // { name: 'ポチ', breed: '柴犬' }

// type は & (交差型) で拡張(詳細は第7章)
type Cat = Animal & { indoor: boolean };

const myCat: Cat = { name: "タマ", indoor: true };
console.log(myCat); // { name: 'タマ', indoor: true }
```

### 2. 宣言マージ — interface だけの機能

同名の `interface` を複数宣言すると自動的にマージされます。

```ts
interface Config {
  host: string;
}

// 同名の interface を再宣言するとマージされる(type では不可)
interface Config {
  port: number;
}

// host と port の両方が必要になる
const config: Config = { host: "localhost", port: 8080 };
console.log(config); // { host: 'localhost', port: 8080 }
```

ライブラリの型定義をプロジェクト側で拡張するときに使われますが、通常のアプリ開発では意図せずマージが起きないよう `type` を好む人もいます。

### 3. ユニオン型は type だけ

```ts
// ユニオン型は type でしか定義できない
type Result = "success" | "failure";
type StringOrNumber = string | number;
```

### 使い分けの指針

| 用途 | 推奨 |
|---|---|
| オブジェクトの形を表す | どちらでも OK。チームで統一する |
| ライブラリ公開・型の拡張を意図する | `interface`(宣言マージが使える) |
| ユニオン・交差・マップ型など複合型 | `type` |
| プロジェクト内部の型定義 | `type` を使うチームが多い傾向 |

---

## オプショナルプロパティ `?`

プロパティ名の後に `?` を付けると省略可能になります。

```ts
interface Article {
  title: string;
  body: string;
  author?: string; // なくてもOK
}

const post1: Article = { title: "TypeScript入門", body: "..." };
const post2: Article = { title: "続・TS", body: "...", author: "山田" };

console.log(post1.author); // undefined
console.log(post2.author); // 山田
```

---

## `readonly` プロパティ

一度代入したら変更できないプロパティを定義します。

```ts
interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const red: Color = { r: 255, g: 0, b: 0 };
console.log(red); // { r: 255, g: 0, b: 0 }

// @ts-expect-error readonly プロパティは再代入できない
red.r = 128;
```

`const` が変数への再代入を防ぐのに対し、`readonly` はオブジェクトのプロパティへの再代入を防ぎます。

---

## インデックスシグネチャ `{ [key: string]: number }`

プロパティ名が事前に分からない「辞書型」のオブジェクトを表します。

```ts
interface ScoreBoard {
  [playerName: string]: number;
}

const scores: ScoreBoard = {};
scores["田中"] = 85;
scores["鈴木"] = 92;

console.log(scores["田中"]); // 85
console.log(scores["鈴木"]); // 92
```

インデックスシグネチャを持つ `interface` に固定プロパティを追加するときは、固定プロパティの型がインデックスシグネチャの値型と互換している必要があります。

---

## ネストしたオブジェクト・メソッドを持つ型

```ts
interface Address {
  city: string;
  zip: string;
}

interface Employee {
  name: string;
  address: Address;         // ネストしたオブジェクト
  greet(): string;          // メソッド(シグネチャ)
}

const emp: Employee = {
  name: "佐藤",
  address: { city: "東京", zip: "100-0001" },
  greet() {
    return `こんにちは、${this.name}です`;
  },
};

console.log(emp.address.city); // 東京
console.log(emp.greet());      // こんにちは、佐藤です
```

---

## `interface extends` — 継承

既存の `interface` を拡張して新しい型を作ります。

```ts
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

console.log(circle); // { color: 'red', radius: 5 }
console.log(rect);   // { color: 'blue', width: 10, height: 4 }
```

複数の `interface` を同時に `extends` することもできます(`extends A, B`)。交差型(`&`)との違いは第7章で扱います。

---

## ⚠️ よくあるつまずき

### 1. 過剰プロパティチェック — オブジェクトリテラル直渡し時のエラー

TypeScript はオブジェクトリテラルを直接渡すとき、**余分なプロパティがあるとエラー**にします。

```ts
interface Profile {
  name: string;
  age: number;
}

// @ts-expect-error オブジェクトリテラル直渡しで余分な email プロパティがあるとエラー
const p: Profile = { name: "太郎", age: 20, email: "t@example.com" };
```

一方、**一度変数に代入してから渡す**と過剰プロパティチェックはスキップされます。

```ts
const obj = { name: "太郎", age: 20, email: "t@example.com" };
const p2: Profile = obj; // これはエラーにならない(代入互換性チェックのみ)
console.log(p2);
```

この違いは「オブジェクトリテラルは意図しない型の指定ミスを早期発見するため」という設計意図によるものです。

### 2. `interface` の宣言マージを意図せず起こさない

同名の `interface` を誤って2回書くとマージされ、型が変わります。`type` は同名の再宣言そのものがエラーになるため気づきやすいです。

### 3. `readonly` は型チェックのみ。実行時には影響しない

TypeScript の `readonly` は型レベルのチェックです。JavaScript にコンパイルされた後は普通のプロパティになります。

### 4. インデックスシグネチャと通常プロパティの型の不整合

```ts
// @ts-expect-error 固定プロパティ count: number はインデックスシグネチャ string に非互換
interface Bad {
  [key: string]: string;
  count: number;
}
```

固定プロパティの型はインデックスシグネチャの値型に含まれる必要があります。

---

## ✍️ 練習問題

### 問1

`Book` インターフェースを定義してください。`title: string`、`author: string`、`pages: number`、`isbn?: string`(省略可)を持ちます。その後、2冊分のオブジェクトを作成して `console.log` してください。

<details>
<summary>解答例</summary>

```ts
interface Book {
  title: string;
  author: string;
  pages: number;
  isbn?: string;
}

const book1: Book = { title: "TypeScript入門", author: "田中", pages: 320 };
const book2: Book = { title: "JS完全ガイド", author: "鈴木", pages: 450, isbn: "978-0-000-0" };

console.log(book1);
console.log(book2);
```

</details>

---

### 問2

`Shape`(color: string)インターフェースと、それを `extends` した `Triangle`(base: number, height: number)インターフェースを定義してください。`Triangle` の面積(0.5 * base * height)を返す関数 `area` も書いてください。

<details>
<summary>解答例</summary>

```ts
interface Shape {
  color: string;
}

interface Triangle extends Shape {
  base: number;
  height: number;
}

function area(t: Triangle): number {
  return 0.5 * t.base * t.height;
}

const t: Triangle = { color: "green", base: 6, height: 4 };
console.log(area(t)); // 12
```

</details>

---

### 問3

`type` を使って `Status = "active" | "inactive" | "pending"` を定義し、それを含む `Task` オブジェクト型を `type` で作成してください(id: number, title: string, status: Status)。

<details>
<summary>解答例</summary>

```ts
type Status = "active" | "inactive" | "pending";

type Task = {
  id: number;
  title: string;
  status: Status;
};

const task: Task = { id: 1, title: "TypeScriptを学ぶ", status: "active" };
console.log(task);
```

</details>

---

### 問4

`readonly` を活用して `Coordinate` インターフェースを定義してください(`readonly x: number`、`readonly y: number`)。2つの `Coordinate` を受け取り、各軸の差の絶対値の合計(マンハッタン距離)を返す関数 `manhattanDistance` を書いてください。`Coordinate` オブジェクトの各プロパティには関数内から変更を試みる行を `@ts-expect-error` コメント付きで添えて、`readonly` の制約を示してください。

<details><summary>解答例</summary>

```ts
interface Coordinate {
  readonly x: number;
  readonly y: number;
}

function manhattanDistance(a: Coordinate, b: Coordinate): number {
  // @ts-expect-error readonly プロパティは変更できない
  // a.x = 0;
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

const p1: Coordinate = { x: 1, y: 2 };
const p2: Coordinate = { x: 4, y: 6 };
console.log(manhattanDistance(p1, p2)); // 7
```

`readonly` はプロパティへの再代入をコンパイル時に防ぐ。`const` は変数の再代入を防ぐものであり、役割が異なる。

</details>

---

### 問5

インデックスシグネチャを使って `WordCount` インターフェースを定義してください(`[word: string]: number`)。文字列配列を受け取り、各単語の出現回数を `WordCount` として返す関数 `countWords` を書いてください。

<details><summary>解答例</summary>

```ts
interface WordCount {
  [word: string]: number;
}

function countWords(words: string[]): WordCount {
  const result: WordCount = {};
  for (const w of words) {
    result[w] = (result[w] ?? 0) + 1;
  }
  return result;
}

const input = ["apple", "banana", "apple", "cherry", "banana", "apple"];
console.log(countWords(input));
// { apple: 3, banana: 2, cherry: 1 }
```

インデックスシグネチャはキーが事前に確定しない辞書型オブジェクトを表すのに適している。

</details>

---

### 問6

`Vehicle`(speed: number, fuel: string)インターフェースを定義し、それを `extends` した `ElectricVehicle`(batteryCapacity: number、fuel は "electric" に固定したい場合でも型上は string でよい)インターフェースを定義してください。`ElectricVehicle` を受け取り `"速度{speed}km/h・電池容量{batteryCapacity}kWh"` という文字列を返す関数 `describe` を書いてください。

<details><summary>解答例</summary>

```ts
interface Vehicle {
  speed: number;
  fuel: string;
}

interface ElectricVehicle extends Vehicle {
  batteryCapacity: number;
}

function describe(ev: ElectricVehicle): string {
  return `速度${ev.speed}km/h・電池容量${ev.batteryCapacity}kWh`;
}

const tesla: ElectricVehicle = { speed: 250, fuel: "electric", batteryCapacity: 100 };
console.log(describe(tesla)); // 速度250km/h・電池容量100kWh
```

`extends` により親インターフェースのプロパティを引き継ぎつつ、子インターフェース固有のプロパティを追加できる。

</details>

---

## 📌 まとめ

- `interface` はオブジェクトの形を宣言する。宣言マージができる
- `type` はより汎用的。ユニオン型・交差型・プリミティブにも使える
- `?` でオプショナル、`readonly` で変更不可のプロパティを定義
- インデックスシグネチャ `{ [key: string]: T }` で動的なキーの辞書を表現
- `interface extends` で継承して型を拡張できる
- オブジェクトリテラルを直渡しすると過剰プロパティチェックが働く

## ▶ 動かす

```bash
npm run ch05
# または
npx tsx src/05_objects_interfaces.ts
```
