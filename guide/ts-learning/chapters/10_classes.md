# 第10章 クラス(Classes)

> TypeScript のクラスは JavaScript のクラス構文に「型」「アクセス修飾子」「抽象クラス」などを加えたものです。オブジェクト指向設計の中核を学びます。

## 🎯 この章のゴール

- `constructor`・プロパティ・メソッドを持つクラスを書ける
- `public` / `private` / `protected` / `readonly` の意味と使い分けが分かる
- 継承(`extends`)・抽象クラス(`abstract`)・インターフェース実装(`implements`)を理解する
- `static` メンバ・`getter`/`setter`・パラメータプロパティの省略記法を使いこなせる

---

## クラスの基本

クラスは「同じ構造を持つオブジェクトの設計図」です。`constructor` でインスタンスを初期化します。

```ts
class Animal {
  name: string;       // プロパティ宣言(型を明示)
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // メソッド
  greet(): string {
    return `こんにちは、${this.name}(${this.age}歳)です`;
  }
}

const cat = new Animal("タマ", 3);
console.log(cat.greet()); // こんにちは、タマ(3歳)です
```

JavaScript のクラスと比べると、プロパティを `constructor` の前に **型付きで宣言** する点が TypeScript の特徴です。`strict` モードでは宣言なしのプロパティアクセスはエラーになります。

---

## アクセス修飾子

TypeScript はクラスメンバに「誰がアクセスできるか」を指定できます。

| 修飾子 | アクセス範囲 |
|--------|-------------|
| `public`(省略可能) | どこからでもアクセス可 |
| `private` | クラス内部のみ |
| `protected` | クラス内部 + サブクラスのみ |
| `readonly` | 読み取り専用(書き込みはコンストラクタのみ) |

```ts
class BankAccount {
  public owner: string;        // どこからでも読み書き可
  private balance: number;     // このクラス内でのみアクセス可
  readonly id: string;         // 初期化後は変更不可

  constructor(owner: string, initialBalance: number, id: string) {
    this.owner = owner;
    this.balance = initialBalance;
    this.id = id;
  }

  deposit(amount: number): void {
    this.balance += amount;    // クラス内なので OK
  }

  getBalance(): number {
    return this.balance;       // private でも内部からは読める
  }
}

const account = new BankAccount("田中", 10000, "ACC-001");
console.log(account.owner);        // 田中 (public は OK)
console.log(account.getBalance()); // 10000 (メソッド経由で取得)
// console.log(account.balance);   // ← これは型エラー(private)
```

`readonly` プロパティはコンストラクタで一度だけ設定でき、以後の変更はコンパイルエラーになります。

---

## パラメータプロパティ(省略記法)

`constructor` 引数に修飾子を付けると、プロパティ宣言と代入をまとめて省略できます。コードが大幅に短くなります。

```ts
// 省略前
class PointVerbose {
  public x: number;
  public y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// 省略後(パラメータプロパティ)
class Point {
  constructor(
    public x: number,
    public y: number,
  ) {}
  // x と y のプロパティ宣言 + 代入が自動生成される
}

const p = new Point(3, 4);
console.log(`x=${p.x}, y=${p.y}`); // x=3, y=4
```

`private` や `readonly` にも同様に使えます。実際のコードでは、小さなデータクラスはほぼこの形で書かれます。

---

## getter / setter

プロパティのように見えつつ、取得・設定時に処理を挟みたいときに使います。

```ts
class Temperature {
  private _celsius: number;

  constructor(celsius: number) {
    this._celsius = celsius;
  }

  // getter: プロパティのように読める
  get celsius(): number {
    return this._celsius;
  }

  // setter: 代入時にバリデーションを挟める
  set celsius(value: number) {
    if (value < -273.15) {
      throw new Error("絶対零度より低い温度は設定できません");
    }
    this._celsius = value;
  }

  // 派生した値を getter で提供する例
  get fahrenheit(): number {
    return this._celsius * 9 / 5 + 32;
  }
}

const temp = new Temperature(100);
console.log(temp.celsius);    // 100 (getter 呼び出し)
console.log(temp.fahrenheit); // 212 (派生値の getter)
temp.celsius = 0;             // setter 呼び出し
console.log(temp.celsius);    // 0
```

`set` のない getter は自動的に `readonly` 扱いになります。

---

## 継承(`extends`)と `super`

既存クラスを土台に新しいクラスを作ります。「is-a」関係(犬は動物である)を表現します。

```ts
class Animal2 {
  constructor(public name: string) {}

  move(distance: number = 0): void {
    console.log(`${this.name} が ${distance}m 移動した`);
  }
}

class Dog extends Animal2 {
  constructor(name: string, public breed: string) {
    super(name);  // 親クラスのコンストラクタを必ず呼ぶ
  }

  // メソッドのオーバーライド
  move(distance: number = 5): void {
    console.log("走り始めた!");
    super.move(distance);  // 親のメソッドも呼べる
  }

  bark(): void {
    console.log(`${this.name}(${this.breed})：ワン!`);
  }
}

const dog = new Dog("ポチ", "柴犬");
dog.move(10); // 走り始めた! → ポチ が 10m 移動した
dog.bark();   // ポチ(柴犬)：ワン!

// 親の型として扱える(ポリモーフィズム)
const animals: Animal2[] = [new Animal2("ネコ"), new Dog("ハチ", "秋田犬")];
animals.forEach(a => a.move(3));
```

サブクラスで `constructor` を定義する場合、`super()` 呼び出しは **必須** です。忘れるとコンパイルエラーになります。

---

## 抽象クラス(`abstract`)

「インスタンス化はできないが、サブクラスの共通構造を定義したい」ときに使います。

```ts
abstract class Shape {
  abstract area(): number;       // 実装を強制するメソッド
  abstract perimeter(): number;

  // 共通の具体実装は持てる
  describe(): string {
    return `面積: ${this.area().toFixed(2)}, 周囲長: ${this.perimeter().toFixed(2)}`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }
  area(): number { return Math.PI * this.radius ** 2; }
  perimeter(): number { return 2 * Math.PI * this.radius; }
}

class Rectangle extends Shape {
  constructor(private width: number, private height: number) {
    super();
  }
  area(): number { return this.width * this.height; }
  perimeter(): number { return 2 * (this.width + this.height); }
}

const shapes: Shape[] = [new Circle(5), new Rectangle(4, 6)];
shapes.forEach(s => console.log(s.describe()));
// 面積: 78.54, 周囲長: 31.42
// 面積: 24.00, 周囲長: 20.00
```

`abstract` クラスの `abstract` メソッドはサブクラスが必ず実装しなければならず、実装漏れはコンパイルエラーです。

---

## インターフェースの `implements`

クラスがインターフェースの契約を満たすことを明示します。複数の `interface` を同時に実装できます。

```ts
interface Printable {
  print(): void;
}

interface Serializable {
  serialize(): string;
}

class User implements Printable, Serializable {
  constructor(
    public name: string,
    public email: string,
  ) {}

  print(): void {
    console.log(`ユーザー: ${this.name} <${this.email}>`);
  }

  serialize(): string {
    return JSON.stringify({ name: this.name, email: this.email });
  }
}

const user = new User("佐藤", "sato@example.com");
user.print();
console.log(user.serialize());
```

`implements` はコンパイル時の型チェックのみで、実行時には何も残りません。「このクラスはこの形を守る」という宣言です。

---

## `static` メンバ

インスタンスではなく **クラス自体** に属するプロパティ・メソッドです。共有カウンターや工場メソッドに便利です。

```ts
class Counter {
  private static count: number = 0;  // クラス全体で共有

  constructor(public name: string) {
    Counter.count++;  // static メンバへのアクセスはクラス名で
  }

  static getCount(): number {
    return Counter.count;
  }

  // static ファクトリメソッドパターン
  static create(name: string): Counter {
    return new Counter(name);
  }
}

const a = Counter.create("A");
const b = Counter.create("B");
const c = new Counter("C");
console.log(`生成数: ${Counter.getCount()}`); // 生成数: 3
```

`static` メソッド内では `this` はクラス自身を指します(インスタンスではありません)。

---

## JS の `#private` フィールドとの違い

TypeScript の `private` と JavaScript ネイティブの `#private` は似ていますが異なります。

```ts
class SecretBox {
  private tsPrivate: string = "TS private";  // コンパイル時のみ制限
  #jsPrivate: string = "JS #private";        // 実行時も完全にアクセス不可

  reveal(): void {
    console.log(this.tsPrivate);  // OK
    console.log(this.#jsPrivate); // OK
  }
}

const box = new SecretBox();
box.reveal();
// box.tsPrivate  → 型エラー(TS のチェック)
// (box as any).tsPrivate  → 実行時は "TS private" にアクセスできてしまう
// box.#jsPrivate → 構文エラー(実行時も完全にブロック)
```

**TypeScript の `private`**: コンパイル時の型チェックのみ。トランスパイル後の JS では通常のプロパティ。
**JS の `#private`**: ECMAScript の仕様。実行時も完全にアクセス不可。現在は TypeScript でも利用推奨。

---

## ⚠️ よくあるつまずき

1. **`this` の喪失**: クラスメソッドをコールバックに渡すと `this` が `undefined` になることがあります。アロー関数でラップするか、コンストラクタで `this.method = this.method.bind(this)` と束縛してください。

2. **`private` は実行時に消える**: TypeScript の `private` はコンパイル後の JS では普通のプロパティです。「絶対に外からアクセスさせたい」なら `#privateField` を使いましょう。

3. **`abstract` クラスはインスタンス化できない**: `new Shape()` はコンパイルエラーです。`abstract` メソッドを持たなくても `abstract` 宣言したクラスは同様です。

4. **インターフェースの `implements` は型チェックのみ**: Java や C# と違い、実行時に「このオブジェクトが Printable を実装しているか」を確認する仕組みは TypeScript 単体にはありません(型ガードで対応)。

---

## ✍️ 練習問題

### 問題1

`Vehicle` 抽象クラスを作ってください。
- `make`(メーカー)と `model`(車種)を `protected` プロパティとして持つ
- `startEngine(): string` を抽象メソッドとして定義
- `describe(): string` は `"make model"` の文字列を返す具体実装を持つ

`Car` クラスと `ElectricCar` クラスで継承し、`startEngine` をそれぞれ実装してください。

<details><summary>解答例</summary>

```ts
abstract class Vehicle {
  constructor(
    protected make: string,
    protected model: string,
  ) {}

  abstract startEngine(): string;

  describe(): string {
    return `${this.make} ${this.model}`;
  }
}

class Car extends Vehicle {
  startEngine(): string {
    return `${this.describe()}: ブロロロ...エンジン始動！`;
  }
}

class ElectricCar extends Vehicle {
  startEngine(): string {
    return `${this.describe()}: シーン...モーター始動！`;
  }
}

const cars: Vehicle[] = [
  new Car("トヨタ", "プリウス"),
  new ElectricCar("テスラ", "モデル3"),
];
cars.forEach(c => console.log(c.startEngine()));
```

</details>

### 問題2

`Stack<T>` ジェネリクスクラスを実装してください。
- `private items: T[]` でデータを保持
- `push(item: T): void` — 末尾に追加
- `pop(): T | undefined` — 末尾を取り出す
- `get size(): number` — getter で件数を返す

<details><summary>解答例</summary>

```ts
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  get size(): number {
    return this.items.length;
  }
}

const stack = new Stack<number>();
stack.push(1);
stack.push(2);
stack.push(3);
console.log(stack.size); // 3
console.log(stack.pop()); // 3
console.log(stack.size); // 2
```

</details>

### 問題3

パラメータプロパティを使って `Person` クラスを作成してください。
- コンストラクタ引数で `name: string`(public)、`age: number`(public)、`email: string`(private)を受け取る
- `greet(): string` メソッドは `"こんにちは、{name}({age}歳)です"` を返す
- `getEmail(): string` メソッドは email を返す(外部から直接 email プロパティにはアクセスできない)

<details><summary>解答例</summary>

```ts
class Person {
  constructor(
    public name: string,
    public age: number,
    private email: string,
  ) {}

  greet(): string {
    return `こんにちは、${this.name}(${this.age}歳)です`;
  }

  getEmail(): string {
    return this.email;
  }
}

const p = new Person("田中", 30, "tanaka@example.com");
console.log(p.greet());    // こんにちは、田中(30歳)です
console.log(p.getEmail()); // tanaka@example.com
// console.log(p.email);  // 型エラー(private)
```

パラメータプロパティにより、プロパティ宣言と `this.xxx = xxx` の代入を1行で書ける。`private` にすれば外部から直接アクセスできないが、メソッド経由でのみ読める。

</details>

---

### 問題4

`Flyable` インターフェースと `Swimmable` インターフェースを定義し、`Duck`(アヒル)クラスで両方を実装してください。
- `Flyable`: `fly(): string` メソッドを持つ
- `Swimmable`: `swim(): string` メソッドを持つ
- `Duck`: パラメータプロパティで `name: string`(public)を持ち、両インターフェースを実装。`fly()` は `"{name}が空を飛ぶ"`、`swim()` は `"{name}が泳ぐ"` を返す

<details><summary>解答例</summary>

```ts
interface Flyable {
  fly(): string;
}

interface Swimmable {
  swim(): string;
}

class Duck implements Flyable, Swimmable {
  constructor(public name: string) {}

  fly(): string {
    return `${this.name}が空を飛ぶ`;
  }

  swim(): string {
    return `${this.name}が泳ぐ`;
  }
}

const duck = new Duck("ドナルド");
console.log(duck.fly());  // ドナルドが空を飛ぶ
console.log(duck.swim()); // ドナルドが泳ぐ

// インターフェース型として扱える
const flyer: Flyable = duck;
console.log(flyer.fly()); // ドナルドが空を飛ぶ
```

`implements` で複数インターフェースを同時に満たせる。それぞれの型として変数に代入でき、多態的に扱える。

</details>

---

### 問題5

`readonly` と `static` を活用した `AppConfig` クラスを作ってください。
- `static readonly DEFAULT_TIMEOUT: number = 5000` を持つ
- `readonly baseUrl: string` と `readonly timeout: number` をコンストラクタで受け取る(timeout のデフォルト値は `AppConfig.DEFAULT_TIMEOUT`)
- `static create(baseUrl: string, timeout?: number): AppConfig` というファクトリメソッドを持つ

<details><summary>解答例</summary>

```ts
class AppConfig {
  static readonly DEFAULT_TIMEOUT: number = 5000;

  readonly baseUrl: string;
  readonly timeout: number;

  constructor(baseUrl: string, timeout: number = AppConfig.DEFAULT_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  static create(baseUrl: string, timeout?: number): AppConfig {
    return new AppConfig(baseUrl, timeout);
  }
}

const cfg1 = AppConfig.create("https://api.example.com");
console.log(cfg1.baseUrl);  // https://api.example.com
console.log(cfg1.timeout);  // 5000 (デフォルト)

const cfg2 = AppConfig.create("https://api.example.com", 3000);
console.log(cfg2.timeout);  // 3000

console.log(AppConfig.DEFAULT_TIMEOUT); // 5000
// cfg1.timeout = 9000; // 型エラー(readonly)
```

`static readonly` はクラス全体で共有される変更不可の定数として使える。ファクトリメソッドパターンを使うとコンストラクタの詳細を隠蔽できる。

</details>

---

## 📌 まとめ

- クラスはプロパティ・メソッドを型付きで定義した「設計図」
- `private` / `protected` / `readonly` でアクセスを制限し、安全な設計を実現
- パラメータプロパティ(`constructor(public x: number)`)でボイラープレートを削減
- `abstract` クラスで「実装を強制するテンプレート」を作れる
- `implements` で複数のインターフェース契約を同時に満たせる
- `static` メンバはインスタンスではなくクラスに紐づく
- 実行時にも `private` を保証したいときは JS ネイティブの `#field` を使う

## ▶ 動かす

```sh
npm run ch10
# または
npx tsx src/10_classes.ts
```
