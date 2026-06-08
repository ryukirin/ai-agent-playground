// ============================================================
// 第10章 类 (Classes)
// npx tsx src/10_classes.ts 运行
// ============================================================

// ─────────────────────────────────────────
// 1. 类的基础：constructor / 属性 / 方法
// ─────────────────────────────────────────

class Animal {
  name: string;   // 属性声明（显式指定类型。strict 模式下必须）
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  greet(): string {
    return `你好，我是${this.name}，今年${this.age}岁`;
  }
}

const cat = new Animal("小花", 3);
console.log("=== 基础类 ===");
console.log(cat.greet()); // 你好，我是小花，今年3岁

// ─────────────────────────────────────────
// 2. 访问修饰符：public / private / readonly
// ─────────────────────────────────────────

class BankAccount {
  public owner: string;      // 任何地方均可访问
  private balance: number;   // 仅限类内部
  readonly id: string;       // 初始化后不可修改

  constructor(owner: string, initialBalance: number, id: string) {
    this.owner = owner;
    this.balance = initialBalance;
    this.id = id;
  }

  deposit(amount: number): void {
    this.balance += amount; // 类内部可以访问
  }

  getBalance(): number {
    return this.balance;
  }
}

const account = new BankAccount("张三", 10000, "ACC-001");
console.log("\n=== 访问修饰符 ===");
console.log("账户所有者：", account.owner);          // 张三
console.log("余额（通过方法）：", account.getBalance()); // 10000
account.deposit(5000);
console.log("存入5000后：", account.getBalance());   // 15000

// @ts-expect-error  不允许从类外部访问 private 属性
console.log(account.balance);

// @ts-expect-error  不允许对 readonly 属性赋值
account.id = "HACKED";

// ─────────────────────────────────────────
// 3. 参数属性（简写语法）
// ─────────────────────────────────────────

// 简写前（冗长的写法）
class PointVerbose {
  public x: number;
  public y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// 简写后：只需在 constructor 参数上加修饰符
class Point {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

console.log("\n=== 参数属性 ===");
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

  // getter：像属性一样读取
  get celsius(): number {
    return this._celsius;
  }

  // setter：赋值时可以加入验证
  set celsius(value: number) {
    if (value < -273.15) {
      throw new Error("不能设置低于绝对零度的温度");
    }
    this._celsius = value;
  }

  // 通过 getter 提供派生值
  get fahrenheit(): number {
    return this._celsius * 9 / 5 + 32;
  }
}

console.log("\n=== getter / setter ===");
const temp = new Temperature(100);
console.log("摄氏：", temp.celsius);    // 100
console.log("华氏：", temp.fahrenheit); // 212
temp.celsius = 0;
console.log("改为0℃后：", temp.celsius); // 0

try {
  temp.celsius = -300; // setter 的验证被触发
} catch (e) {
  if (e instanceof Error) console.log("错误：", e.message);
}

// ─────────────────────────────────────────
// 5. 继承 (extends) 与 super
// ─────────────────────────────────────────

class Animal2 {
  constructor(public name: string) {}

  move(distance: number = 0): void {
    console.log(`${this.name} 移动了 ${distance}m`);
  }
}

class Dog extends Animal2 {
  constructor(name: string, public breed: string) {
    super(name); // 必须调用父类构造函数
  }

  // 方法重写
  override move(distance: number = 5): void {
    console.log("开始奔跑！");
    super.move(distance); // 也可以调用父类方法
  }

  bark(): void {
    console.log(`${this.name}（${this.breed}）：汪！`);
  }
}

console.log("\n=== 继承 (extends) / super ===");
const dog = new Dog("小黑", "柴犬");
dog.move(10); // 开始奔跑！→ 小黑 移动了 10m
dog.bark();   // 小黑（柴犬）：汪！

// 多态：可以用父类型持有子类
const animals: Animal2[] = [new Animal2("小猫"), new Dog("旺财", "秋田犬")];
animals.forEach((a) => a.move(3));

// ─────────────────────────────────────────
// 6. 抽象类 (abstract)
// ─────────────────────────────────────────

abstract class Shape {
  abstract area(): number;
  abstract perimeter(): number;

  // 公共的具体实现
  describe(): string {
    return `面积：${this.area().toFixed(2)}，周长：${this.perimeter().toFixed(2)}`;
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

console.log("\n=== 抽象类 ===");
const shapes: Shape[] = [new Circle(5), new Rectangle(4, 6)];
shapes.forEach((s) => console.log(s.describe()));
// 面积：78.54，周长：31.42
// 面积：24.00，周长：20.00

// @ts-expect-error  abstract 类不能实例化
new Shape();

// ─────────────────────────────────────────
// 7. interface 的 implements
// ─────────────────────────────────────────

interface Printable {
  print(): void;
}

interface Serializable {
  serialize(): string;
}

// 可以同时实现多个 interface
class User implements Printable, Serializable {
  constructor(
    public name: string,
    public email: string,
  ) {}

  print(): void {
    console.log(`用户：${this.name} <${this.email}>`);
  }

  serialize(): string {
    return JSON.stringify({ name: this.name, email: this.email });
  }
}

console.log("\n=== implements ===");
const user = new User("李四", "lisi@example.com");
user.print();
console.log(user.serialize());

// ─────────────────────────────────────────
// 8. static 成员
// ─────────────────────────────────────────

class Counter {
  private static count: number = 0; // 整个类共享

  constructor(public name: string) {
    Counter.count++;
  }

  static getCount(): number {
    return Counter.count;
  }

  // static 工厂方法模式
  static create(name: string): Counter {
    return new Counter(name);
  }
}

console.log("\n=== static 成员 ===");
const cA = Counter.create("A");
const cB = Counter.create("B");
const cC = new Counter("C");
console.log(`创建了 ${cA.name}, ${cB.name}, ${cC.name}`);
console.log(`已创建数量：${Counter.getCount()}`); // 3

// ─────────────────────────────────────────
// 9. JS 的 #private 与 TS 的 private 的区别
// ─────────────────────────────────────────

class SecretBox {
  private tsPrivate: string = "TS private";   // 仅编译时限制
  #jsPrivate: string = "JS #private";          // 运行时也完全无法访问

  reveal(): void {
    console.log("TS private:", this.tsPrivate);
    console.log("JS #private:", this.#jsPrivate);
  }
}

console.log("\n=== private vs #private ===");
const box = new SecretBox();
box.reveal();
// TS private 可以通过 (box as any).tsPrivate 在运行时访问
// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.log("通过 any 访问：", (box as unknown as Record<string, unknown>)["tsPrivate"]); // TS private
// #jsPrivate 因为语法错误，即使通过 as any 也无法绕过

// ─────────────────────────────────────────
// 10. 练习题参考答案
// ─────────────────────────────────────────

console.log("\n=== 练习题1：抽象类 Vehicle ===");

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
    return `${this.describe()}：轰隆隆...引擎启动！`;
  }
}

class ElectricCar extends Vehicle {
  override startEngine(): string {
    return `${this.describe()}：嗡嗡嗡...电机启动！`;
  }
}

const vehicles: Vehicle[] = [
  new Car("丰田", "普锐斯"),
  new ElectricCar("特斯拉", "Model 3"),
];
vehicles.forEach((v) => console.log(v.startEngine()));

console.log("\n=== 练习题2：泛型 Stack<T> ===");

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
console.log("大小：", numStack.size);  // 3
console.log("pop：", numStack.pop());    // 30
console.log("大小：", numStack.size);  // 2

const strStack = new Stack<string>();
strStack.push("hello");
strStack.push("world");
console.log("字符串 pop：", strStack.pop()); // world
