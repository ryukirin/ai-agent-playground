# 第10章 类 (Classes)

> TypeScript 的类是在 JavaScript 类语法基础上，加入了「类型」「访问修饰符」「抽象类 (abstract class)」等特性。本章将学习面向对象设计的核心概念。

## 🎯 本章目标

- 能够编写包含 `constructor`、属性和方法的类
- 理解 `public` / `private` / `protected` / `readonly` 的含义与使用场景
- 理解继承 (`extends`)、抽象类 (`abstract`)、接口实现 (`implements`)
- 掌握 `static` 成员、`getter`/`setter`、参数属性简写语法

---

## 类的基础

类是「拥有相同结构的对象的设计蓝图」。通过 `constructor` 初始化实例。

```ts
class Animal {
  name: string;       // 属性声明（显式指定类型）
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // 方法
  greet(): string {
    return `你好，我是${this.name}，今年${this.age}岁`;
  }
}

const cat = new Animal("小花", 3);
console.log(cat.greet()); // 你好，我是小花，今年3岁
```

与 JavaScript 的类相比，TypeScript 的特点是在 `constructor` 之前**带类型地声明**属性。在 `strict` 模式下，访问未声明的属性会报错。

---

## 访问修饰符

TypeScript 可以为类成员指定「谁能访问」。

| 修饰符 | 访问范围 |
|--------|-------------|
| `public`（可省略） | 任何地方均可访问 |
| `private` | 仅限类内部 |
| `protected` | 类内部 + 子类 |
| `readonly` | 只读（写入仅限构造函数中） |

```ts
class BankAccount {
  public owner: string;        // 任何地方均可读写
  private balance: number;     // 仅限此类内部访问
  readonly id: string;         // 初始化后不可修改

  constructor(owner: string, initialBalance: number, id: string) {
    this.owner = owner;
    this.balance = initialBalance;
    this.id = id;
  }

  deposit(amount: number): void {
    this.balance += amount;    // 类内部可以访问
  }

  getBalance(): number {
    return this.balance;       // private 在内部可读取
  }
}

const account = new BankAccount("张三", 10000, "ACC-001");
console.log(account.owner);        // 张三（public 可访问）
console.log(account.getBalance()); // 10000（通过方法获取）
// console.log(account.balance);   // ← 类型错误（private）
```

`readonly` 属性只能在构造函数中设置一次，之后修改会产生编译错误。

---

## 参数属性（简写语法）

在 `constructor` 的参数上加修饰符，可以将属性声明和赋值合并省略。代码量大幅减少。

```ts
// 简写前
class PointVerbose {
  public x: number;
  public y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// 简写后（参数属性）
class Point {
  constructor(
    public x: number,
    public y: number,
  ) {}
  // 自动生成 x 和 y 的属性声明与赋值
}

const p = new Point(3, 4);
console.log(`x=${p.x}, y=${p.y}`); // x=3, y=4
```

`private` 和 `readonly` 同样适用。在实际代码中，小型数据类几乎都采用这种写法。

---

## getter / setter

在外观上像属性，但在读取或设置时需要加入处理逻辑时使用。

```ts
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

  // 通过 getter 提供派生值的示例
  get fahrenheit(): number {
    return this._celsius * 9 / 5 + 32;
  }
}

const temp = new Temperature(100);
console.log(temp.celsius);    // 100（调用 getter）
console.log(temp.fahrenheit); // 212（派生值的 getter）
temp.celsius = 0;             // 调用 setter
console.log(temp.celsius);    // 0
```

没有 `set` 的 getter 会自动视为 `readonly`。

---

## 继承 (`extends`) 与 `super`

以现有类为基础创建新类。表达「is-a」关系（狗是动物）。

```ts
class Animal2 {
  constructor(public name: string) {}

  move(distance: number = 0): void {
    console.log(`${this.name} 移动了 ${distance}m`);
  }
}

class Dog extends Animal2 {
  constructor(name: string, public breed: string) {
    super(name);  // 必须调用父类构造函数
  }

  // 方法重写
  move(distance: number = 5): void {
    console.log("开始奔跑！");
    super.move(distance);  // 也可以调用父类方法
  }

  bark(): void {
    console.log(`${this.name}（${this.breed}）：汪！`);
  }
}

const dog = new Dog("小黑", "柴犬");
dog.move(10); // 开始奔跑！→ 小黑 移动了 10m
dog.bark();   // 小黑（柴犬）：汪！

// 可以作为父类型使用（多态）
const animals: Animal2[] = [new Animal2("小猫"), new Dog("旺财", "秋田犬")];
animals.forEach(a => a.move(3));
```

子类中定义 `constructor` 时，**必须**调用 `super()`，否则会产生编译错误。

---

## 抽象类 (`abstract`)

「不能实例化，但希望定义子类的公共结构」时使用。

```ts
abstract class Shape {
  abstract area(): number;       // 强制子类实现的方法
  abstract perimeter(): number;

  // 可以有公共的具体实现
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

const shapes: Shape[] = [new Circle(5), new Rectangle(4, 6)];
shapes.forEach(s => console.log(s.describe()));
// 面积：78.54，周长：31.42
// 面积：24.00，周长：20.00
```

`abstract` 类中的 `abstract` 方法必须由子类实现，漏实现会产生编译错误。

---

## 接口的 `implements`

明确声明类满足某个接口的约定。可以同时实现多个 `interface`。

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
    console.log(`用户：${this.name} <${this.email}>`);
  }

  serialize(): string {
    return JSON.stringify({ name: this.name, email: this.email });
  }
}

const user = new User("李四", "lisi@example.com");
user.print();
console.log(user.serialize());
```

`implements` 仅在编译时做类型检查，运行时不会留下任何内容。这是一个「此类遵守此形状」的声明。

---

## `static` 成员

属于**类本身**而非实例的属性和方法。适合用于共享计数器或工厂方法。

```ts
class Counter {
  private static count: number = 0;  // 整个类共享

  constructor(public name: string) {
    Counter.count++;  // 通过类名访问 static 成员
  }

  static getCount(): number {
    return Counter.count;
  }

  // static 工厂方法模式
  static create(name: string): Counter {
    return new Counter(name);
  }
}

const a = Counter.create("A");
const b = Counter.create("B");
const c = new Counter("C");
console.log(`已创建数量：${Counter.getCount()}`); // 已创建数量：3
```

`static` 方法内的 `this` 指向类本身（而非实例）。

---

## JS 的 `#private` 字段与 TS 的 `private` 的区别

TypeScript 的 `private` 与 JavaScript 原生的 `#private` 相似但不同。

```ts
class SecretBox {
  private tsPrivate: string = "TS private";  // 仅编译时限制
  #jsPrivate: string = "JS #private";        // 运行时也完全无法访问

  reveal(): void {
    console.log(this.tsPrivate);  // OK
    console.log(this.#jsPrivate); // OK
  }
}

const box = new SecretBox();
box.reveal();
// box.tsPrivate  → 类型错误（TS 的检查）
// (box as any).tsPrivate  → 运行时可以访问 "TS private"
// box.#jsPrivate → 语法错误（运行时也完全被阻止）
```

**TypeScript 的 `private`**：仅编译时类型检查。转译后的 JS 中是普通属性。
**JS 的 `#private`**：ECMAScript 规范。运行时也完全无法访问。现在在 TypeScript 中也推荐使用。

---

## ⚠️ 常见陷阱

1. **`this` 的丢失**：将类方法作为回调传递时，`this` 可能变为 `undefined`。请用箭头函数包裹，或在构造函数中使用 `this.method = this.method.bind(this)` 绑定。

2. **`private` 在运行时消失**：TypeScript 的 `private` 在编译后的 JS 中是普通属性。若「绝对不允许外部访问」，请使用 `#privateField`。

3. **`abstract` 类不能实例化**：`new Shape()` 会产生编译错误。即使没有 `abstract` 方法，只要声明了 `abstract`，同样如此。

4. **接口的 `implements` 仅做类型检查**：与 Java 或 C# 不同，TypeScript 本身没有运行时「检查此对象是否实现了 Printable」的机制（需用类型守卫处理）。

---

## ✍️ 练习题

### 题目1

请创建 `Vehicle` 抽象类。
- 以 `protected` 属性持有 `make`（制造商）和 `model`（车型）
- 将 `startEngine(): string` 定义为抽象方法
- `describe(): string` 持有返回 `"make model"` 字符串的具体实现

请分别用 `Car` 类和 `ElectricCar` 类继承，并各自实现 `startEngine`。

<details><summary>参考答案</summary>

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
    return `${this.describe()}：轰隆隆...引擎启动！`;
  }
}

class ElectricCar extends Vehicle {
  startEngine(): string {
    return `${this.describe()}：嗡嗡嗡...电机启动！`;
  }
}

const cars: Vehicle[] = [
  new Car("丰田", "普锐斯"),
  new ElectricCar("特斯拉", "Model 3"),
];
cars.forEach(c => console.log(c.startEngine()));
```

</details>

### 题目2

请实现泛型类 `Stack<T>`。
- 用 `private items: T[]` 持有数据
- `push(item: T): void` — 在末尾追加
- `pop(): T | undefined` — 取出末尾元素
- `get size(): number` — 通过 getter 返回数量

<details><summary>参考答案</summary>

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

### 题目3

请使用参数属性创建 `Person` 类。
- 构造函数接收 `name: string`（public）、`age: number`（public）、`email: string`（private）
- `greet(): string` 方法返回 `"你好，我是{name}，今年{age}岁"`
- `getEmail(): string` 方法返回 email（外部不能直接访问 email 属性）

<details><summary>参考答案</summary>

```ts
class Person {
  constructor(
    public name: string,
    public age: number,
    private email: string,
  ) {}

  greet(): string {
    return `你好，我是${this.name}，今年${this.age}岁`;
  }

  getEmail(): string {
    return this.email;
  }
}

const p = new Person("王五", 30, "wangwu@example.com");
console.log(p.greet());    // 你好，我是王五，今年30岁
console.log(p.getEmail()); // wangwu@example.com
// console.log(p.email);  // 类型错误（private）
```

通过参数属性，可以在一行中完成属性声明与 `this.xxx = xxx` 赋值。设为 `private` 后外部无法直接访问，只能通过方法读取。

</details>

---

### 题目4

请定义 `Flyable` 接口和 `Swimmable` 接口，并在 `Duck`（鸭子）类中同时实现两者。
- `Flyable`：拥有 `fly(): string` 方法
- `Swimmable`：拥有 `swim(): string` 方法
- `Duck`：通过参数属性持有 `name: string`（public），实现两个接口。`fly()` 返回 `"{name}在天空中飞"`，`swim()` 返回 `"{name}在游泳"`

<details><summary>参考答案</summary>

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
    return `${this.name}在天空中飞`;
  }

  swim(): string {
    return `${this.name}在游泳`;
  }
}

const duck = new Duck("唐老鸭");
console.log(duck.fly());  // 唐老鸭在天空中飞
console.log(duck.swim()); // 唐老鸭在游泳

// 可以作为接口类型使用
const flyer: Flyable = duck;
console.log(flyer.fly()); // 唐老鸭在天空中飞
```

`implements` 可以同时满足多个接口。可以将其赋值给各自的类型变量，实现多态。

</details>

---

### 题目5

请创建一个活用 `readonly` 和 `static` 的 `AppConfig` 类。
- 持有 `static readonly DEFAULT_TIMEOUT: number = 5000`
- 通过构造函数接收 `readonly baseUrl: string` 和 `readonly timeout: number`（timeout 默认值为 `AppConfig.DEFAULT_TIMEOUT`）
- 拥有 `static create(baseUrl: string, timeout?: number): AppConfig` 工厂方法

<details><summary>参考答案</summary>

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
console.log(cfg1.timeout);  // 5000（默认值）

const cfg2 = AppConfig.create("https://api.example.com", 3000);
console.log(cfg2.timeout);  // 3000

console.log(AppConfig.DEFAULT_TIMEOUT); // 5000
// cfg1.timeout = 9000; // 类型错误（readonly）
```

`static readonly` 可用作整个类共享的不可变常量。使用工厂方法模式可以隐藏构造函数的细节。

</details>

---

## 📌 总结

- 类是带类型定义属性和方法的「设计蓝图」
- 通过 `private` / `protected` / `readonly` 限制访问，实现安全设计
- 参数属性 (`constructor(public x: number)`) 减少样板代码
- `abstract` 类可以创建「强制实现的模板」
- `implements` 可以同时满足多个接口约定
- `static` 成员绑定在类上，而非实例
- 如果运行时也需要保证 `private`，请使用 JS 原生的 `#field`

## ▶ 运行

```sh
npm run ch10
# 或者
npx tsx src/10_classes.ts
```
