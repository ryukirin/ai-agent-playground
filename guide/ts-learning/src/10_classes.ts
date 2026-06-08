// ============================================================
// 第10章 クラス(Classes)
// npx tsx src/10_classes.ts で実行
// ============================================================

// ─────────────────────────────────────────
// 1. クラスの基本: constructor / プロパティ / メソッド
// ─────────────────────────────────────────

class Animal {
  name: string;   // プロパティ宣言(型を明示。strict では必須)
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  greet(): string {
    return `こんにちは、${this.name}(${this.age}歳)です`;
  }
}

const cat = new Animal("タマ", 3);
console.log("=== 基本クラス ===");
console.log(cat.greet()); // こんにちは、タマ(3歳)です

// ─────────────────────────────────────────
// 2. アクセス修飾子: public / private / readonly
// ─────────────────────────────────────────

class BankAccount {
  public owner: string;      // どこからでもアクセス可
  private balance: number;   // クラス内部のみ
  readonly id: string;       // 初期化後は変更不可

  constructor(owner: string, initialBalance: number, id: string) {
    this.owner = owner;
    this.balance = initialBalance;
    this.id = id;
  }

  deposit(amount: number): void {
    this.balance += amount; // クラス内なので OK
  }

  getBalance(): number {
    return this.balance;
  }
}

const account = new BankAccount("田中", 10000, "ACC-001");
console.log("\n=== アクセス修飾子 ===");
console.log("口座オーナー:", account.owner);          // 田中
console.log("残高(メソッド経由):", account.getBalance()); // 10000
account.deposit(5000);
console.log("5000円入金後:", account.getBalance());   // 15000

// @ts-expect-error  private プロパティへのクラス外からのアクセスは禁止
console.log(account.balance);

// @ts-expect-error  readonly プロパティへの代入は禁止
account.id = "HACKED";

// ─────────────────────────────────────────
// 3. パラメータプロパティ(省略記法)
// ─────────────────────────────────────────

// 省略前(冗長な書き方)
class PointVerbose {
  public x: number;
  public y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// 省略後: constructor 引数に修飾子を付けるだけ
class Point {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

console.log("\n=== パラメータプロパティ ===");
const p1 = new PointVerbose(1, 2);
const p2 = new Point(3, 4);
console.log(`p1: x=${p1.x}, y=${p1.y}`); // x=1, y=2
console.log(`p2: x=${p2.x}, y=${p2.y}`); // x=3, y=4

// ─────────────────────────────────────────
// 4. getter / setter
// ─────────────────────────────────────────

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

  // 派生値を getter で提供
  get fahrenheit(): number {
    return this._celsius * 9 / 5 + 32;
  }
}

console.log("\n=== getter / setter ===");
const temp = new Temperature(100);
console.log("摂氏:", temp.celsius);    // 100
console.log("華氏:", temp.fahrenheit); // 212
temp.celsius = 0;
console.log("0℃に変更後:", temp.celsius); // 0

try {
  temp.celsius = -300; // setter のバリデーションが発動
} catch (e) {
  if (e instanceof Error) console.log("エラー:", e.message);
}

// ─────────────────────────────────────────
// 5. 継承(extends)と super
// ─────────────────────────────────────────

class Animal2 {
  constructor(public name: string) {}

  move(distance: number = 0): void {
    console.log(`${this.name} が ${distance}m 移動した`);
  }
}

class Dog extends Animal2 {
  constructor(name: string, public breed: string) {
    super(name); // 親クラスのコンストラクタを必ず呼ぶ
  }

  // メソッドのオーバーライド
  override move(distance: number = 5): void {
    console.log("走り始めた!");
    super.move(distance); // 親のメソッドも呼べる
  }

  bark(): void {
    console.log(`${this.name}(${this.breed})：ワン!`);
  }
}

console.log("\n=== 継承(extends)/ super ===");
const dog = new Dog("ポチ", "柴犬");
dog.move(10); // 走り始めた! → ポチ が 10m 移動した
dog.bark();   // ポチ(柴犬)：ワン!

// ポリモーフィズム: 親の型で子を扱える
const animals: Animal2[] = [new Animal2("ネコ"), new Dog("ハチ", "秋田犬")];
animals.forEach((a) => a.move(3));

// ─────────────────────────────────────────
// 6. 抽象クラス(abstract)
// ─────────────────────────────────────────

abstract class Shape {
  abstract area(): number;
  abstract perimeter(): number;

  // 共通の具体実装
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

console.log("\n=== 抽象クラス ===");
const shapes: Shape[] = [new Circle(5), new Rectangle(4, 6)];
shapes.forEach((s) => console.log(s.describe()));
// 面積: 78.54, 周囲長: 31.42
// 面積: 24.00, 周囲長: 20.00

// @ts-expect-error  abstract クラスはインスタンス化できない
new Shape();

// ─────────────────────────────────────────
// 7. interface の implements
// ─────────────────────────────────────────

interface Printable {
  print(): void;
}

interface Serializable {
  serialize(): string;
}

// 複数の interface を同時に実装できる
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

console.log("\n=== implements ===");
const user = new User("佐藤", "sato@example.com");
user.print();
console.log(user.serialize());

// ─────────────────────────────────────────
// 8. static メンバ
// ─────────────────────────────────────────

class Counter {
  private static count: number = 0; // クラス全体で共有

  constructor(public name: string) {
    Counter.count++;
  }

  static getCount(): number {
    return Counter.count;
  }

  // static ファクトリメソッドパターン
  static create(name: string): Counter {
    return new Counter(name);
  }
}

console.log("\n=== static メンバ ===");
const cA = Counter.create("A");
const cB = Counter.create("B");
const cC = new Counter("C");
console.log(`${cA.name}, ${cB.name}, ${cC.name} を生成`);
console.log(`生成数: ${Counter.getCount()}`); // 3

// ─────────────────────────────────────────
// 9. JS の #private と TS の private の違い
// ─────────────────────────────────────────

class SecretBox {
  private tsPrivate: string = "TS private";   // コンパイル時のみ制限
  #jsPrivate: string = "JS #private";          // 実行時も完全にアクセス不可

  reveal(): void {
    console.log("TS private:", this.tsPrivate);
    console.log("JS #private:", this.#jsPrivate);
  }
}

console.log("\n=== private vs #private ===");
const box = new SecretBox();
box.reveal();
// TS private は (box as any).tsPrivate で実行時にアクセスできてしまう
// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.log("any 経由でアクセス:", (box as unknown as Record<string, unknown>)["tsPrivate"]); // TS private
// #jsPrivate は構文エラーになるため as any でも回避不可

// ─────────────────────────────────────────
// 10. 練習問題の解答例
// ─────────────────────────────────────────

console.log("\n=== 練習問題1: 抽象クラス Vehicle ===");

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
  override startEngine(): string {
    return `${this.describe()}: ブロロロ...エンジン始動！`;
  }
}

class ElectricCar extends Vehicle {
  override startEngine(): string {
    return `${this.describe()}: シーン...モーター始動！`;
  }
}

const vehicles: Vehicle[] = [
  new Car("トヨタ", "プリウス"),
  new ElectricCar("テスラ", "モデル3"),
];
vehicles.forEach((v) => console.log(v.startEngine()));

console.log("\n=== 練習問題2: ジェネリクス Stack<T> ===");

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

const numStack = new Stack<number>();
numStack.push(10);
numStack.push(20);
numStack.push(30);
console.log("サイズ:", numStack.size);  // 3
console.log("pop:", numStack.pop());    // 30
console.log("サイズ:", numStack.size);  // 2

const strStack = new Stack<string>();
strStack.push("hello");
strStack.push("world");
console.log("文字列 pop:", strStack.pop()); // world
