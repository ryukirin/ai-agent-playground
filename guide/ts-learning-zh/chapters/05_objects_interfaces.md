# 第05章 对象与接口 (interface)

> 学习在 TypeScript 中将对象的"形状"定义为类型的方法。掌握 `interface` 与 `type` 的区别，在大型代码库中也不会迷失。

## 🎯 本章目标

- 能用对象类型字面量表达形状
- 能正确区分使用 `interface` 和 `type`
- 能使用 `readonly` / `?` / 索引签名
- 能用 `interface extends` 扩展类型
- 了解多余属性检查的机制

---

## 对象类型字面量

用花括号 `{}` 列举属性名和类型，是最简单的写法。

```ts
function printUser(user: { name: string; age: number }): void {
  console.log(`${user.name}（${user.age}岁）`);
}

printUser({ name: "小明", age: 30 }); // 小明（30岁）
```

可以直接写在参数或变量的类型注解中，但如果同一形状出现在多处，应该用 `interface` 或 `type` 为其命名。

---

## `interface` 的定义与使用

```ts
interface User {
  name: string;
  age: number;
}

const alice: User = { name: "Alice", age: 25 };
console.log(alice.name); // Alice
```

`interface` 表示对象的"契约（contract）"。只要满足这个形状，就可以作为 `User` 使用。

---

## 用 `type` 别名定义对象类型

```ts
type Point = {
  x: number;
  y: number;
};

const origin: Point = { x: 0, y: 0 };
console.log(origin); // { x: 0, y: 0 }
```

外观上与 `interface` 非常相似。

---

## interface vs type — 区别与使用场景

两者在很多情况下可以互换使用，但有几个重要区别。

### 1. 扩展（继承）的写法不同

```ts
// interface 用 extends 扩展
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

const myDog: Dog = { name: "小黑", breed: "柴犬" };
console.log(myDog); // { name: '小黑', breed: '柴犬' }

// type 用 &（交叉类型）扩展（详见第7章）
type Cat = Animal & { indoor: boolean };

const myCat: Cat = { name: "小花", indoor: true };
console.log(myCat); // { name: '小花', indoor: true }
```

### 2. 声明合并 — 仅 interface 支持

多次声明同名 `interface` 会自动合并。

```ts
interface Config {
  host: string;
}

// 再次声明同名 interface 时属性会被合并（type 不支持此功能）
interface Config {
  port: number;
}

// host 和 port 都变为必需
const config: Config = { host: "localhost", port: 8080 };
console.log(config); // { host: 'localhost', port: 8080 }
```

这用于在项目中扩展库的类型定义，但在普通应用开发中，有些人为避免意外合并而偏好使用 `type`。

### 3. 联合类型只能用 type

```ts
// 联合类型只能用 type 定义
type Result = "success" | "failure";
type StringOrNumber = string | number;
```

### 使用场景建议

| 用途 | 推荐 |
|---|---|
| 表示对象的形状 | 两者均可，团队统一即可 |
| 开放给库使用、意图扩展类型 | `interface`（可使用声明合并） |
| 联合类型、交叉类型、映射类型等复合类型 | `type` |
| 项目内部的类型定义 | 偏向使用 `type` 的团队较多 |

---

## 可选属性 `?`

在属性名后加 `?` 使其可以省略。

```ts
interface Article {
  title: string;
  body: string;
  author?: string; // 可以省略
}

const post1: Article = { title: "TypeScript入门", body: "..." };
const post2: Article = { title: "续·TS", body: "...", author: "小明" };

console.log(post1.author); // undefined
console.log(post2.author); // 小明
```

---

## `readonly` 属性

定义一旦赋值就不能修改的属性。

```ts
interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const red: Color = { r: 255, g: 0, b: 0 };
console.log(red); // { r: 255, g: 0, b: 0 }

// @ts-expect-error readonly 属性不能重新赋值
red.r = 128;
```

`const` 防止变量重新赋值，而 `readonly` 防止对象属性重新赋值。

---

## 索引签名 `{ [key: string]: number }`

表示属性名事先未知的"字典类型"对象。

```ts
interface ScoreBoard {
  [playerName: string]: number;
}

const scores: ScoreBoard = {};
scores["小明"] = 85;
scores["小红"] = 92;

console.log(scores["小明"]); // 85
console.log(scores["小红"]); // 92
```

在拥有索引签名的 `interface` 中添加固定属性时，固定属性的类型必须与索引签名的值类型兼容。

---

## 包含嵌套对象和方法的类型

```ts
interface Address {
  city: string;
  zip: string;
}

interface Employee {
  name: string;
  address: Address;         // 嵌套对象
  greet(): string;          // 方法（签名）
}

const emp: Employee = {
  name: "小华",
  address: { city: "北京", zip: "100001" },
  greet() {
    return `你好，我是${this.name}`;
  },
};

console.log(emp.address.city); // 北京
console.log(emp.greet());      // 你好，我是小华
```

---

## `interface extends` — 继承

扩展已有的 `interface` 创建新类型。

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

也可以同时 `extends` 多个 `interface`（`extends A, B`）。与交叉类型（`&`）的区别在第7章中介绍。

---

## ⚠️ 常见错误

### 1. 多余属性检查 — 直接传入对象字面量时的错误

TypeScript 在直接传入对象字面量时，**多余的属性会报错**。

```ts
interface Profile {
  name: string;
  age: number;
}

// @ts-expect-error 直接传入对象字面量时，多余的 email 属性会报错
const p: Profile = { name: "小明", age: 20, email: "t@example.com" };
```

而**先赋值给变量再传入**则会跳过多余属性检查。

```ts
const obj = { name: "小明", age: 20, email: "t@example.com" };
const p2: Profile = obj; // 不会报错（仅进行赋值兼容性检查）
console.log(p2);
```

这种区别源于"对象字面量用于尽早发现意外的类型指定错误"的设计意图。

### 2. 避免意外触发 `interface` 的声明合并

不小心写了两次同名 `interface` 会发生合并，导致类型改变。`type` 在重复声明时本身就会报错，更容易发现。

### 3. `readonly` 仅在类型检查时有效，运行时无影响

TypeScript 的 `readonly` 是类型层面的检查。编译为 JavaScript 后变成普通属性。

### 4. 索引签名与普通属性的类型不匹配

```ts
// @ts-expect-error 固定属性 count: number 与索引签名 string 不兼容
interface Bad {
  [key: string]: string;
  count: number;
}
```

固定属性的类型必须包含在索引签名的值类型中。

---

## ✍️ 练习题

### 题1

请定义 `Book` 接口 (interface)，包含 `title: string`、`author: string`、`pages: number`、`isbn?: string`（可选）。然后创建两本书的对象并 `console.log` 输出。

<details>
<summary>参考答案</summary>

```ts
interface Book {
  title: string;
  author: string;
  pages: number;
  isbn?: string;
}

const book1: Book = { title: "TypeScript入门", author: "小明", pages: 320 };
const book2: Book = { title: "JS完全指南", author: "小红", pages: 450, isbn: "978-0-000-0" };

console.log(book1);
console.log(book2);
```

</details>

---

### 题2

请定义 `Shape`（color: string）接口 (interface) 和继承自它的 `Triangle`（base: number, height: number）接口 (interface)。还要编写一个返回 `Triangle` 面积（0.5 * base * height）的函数 `area`。

<details>
<summary>参考答案</summary>

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

### 题3

请用 `type` 定义 `Status = "active" | "inactive" | "pending"`，并用 `type` 创建包含该类型的 `Task` 对象类型（id: number, title: string, status: Status）。

<details>
<summary>参考答案</summary>

```ts
type Status = "active" | "inactive" | "pending";

type Task = {
  id: number;
  title: string;
  status: Status;
};

const task: Task = { id: 1, title: "学习TypeScript", status: "active" };
console.log(task);
```

</details>

---

### 题4

请使用 `readonly` 定义 `Coordinate` 接口 (interface)（`readonly x: number`、`readonly y: number`）。编写一个接收两个 `Coordinate`，返回各轴差值绝对值之和（曼哈顿距离）的函数 `manhattanDistance`。在函数内尝试修改 `Coordinate` 对象各属性的行请加上 `@ts-expect-error` 注释，以展示 `readonly` 的约束。

<details><summary>参考答案</summary>

```ts
interface Coordinate {
  readonly x: number;
  readonly y: number;
}

function manhattanDistance(a: Coordinate, b: Coordinate): number {
  // @ts-expect-error readonly 属性不能修改
  // a.x = 0;
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

const p1: Coordinate = { x: 1, y: 2 };
const p2: Coordinate = { x: 4, y: 6 };
console.log(manhattanDistance(p1, p2)); // 7
```

`readonly` 在编译时防止属性重新赋值。`const` 防止变量重新赋值，两者作用不同。

</details>

---

### 题5

请使用索引签名定义 `WordCount` 接口 (interface)（`[word: string]: number`）。编写一个接收字符串数组，返回每个单词出现次数的 `WordCount` 的函数 `countWords`。

<details><summary>参考答案</summary>

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

索引签名适合表示键事先不确定的字典类型对象。

</details>

---

### 题6

请定义 `Vehicle`（speed: number, fuel: string）接口 (interface) 和继承自它的 `ElectricVehicle`（batteryCapacity: number，fuel 想固定为 "electric" 时类型上用 string 即可）接口 (interface)。编写一个接收 `ElectricVehicle` 并返回 `"速度{speed}km/h・电池容量{batteryCapacity}kWh"` 字符串的函数 `describe`。

<details><summary>参考答案</summary>

```ts
interface Vehicle {
  speed: number;
  fuel: string;
}

interface ElectricVehicle extends Vehicle {
  batteryCapacity: number;
}

function describe(ev: ElectricVehicle): string {
  return `速度${ev.speed}km/h・电池容量${ev.batteryCapacity}kWh`;
}

const tesla: ElectricVehicle = { speed: 250, fuel: "electric", batteryCapacity: 100 };
console.log(describe(tesla)); // 速度250km/h・电池容量100kWh
```

通过 `extends` 继承父接口的属性，同时为子接口添加特有属性。

</details>

---

## 📌 总结

- `interface` 用于声明对象的形状，支持声明合并
- `type` 更通用，也可用于联合类型、交叉类型、基本类型
- `?` 定义可选属性，`readonly` 定义不可修改的属性
- 索引签名 `{ [key: string]: T }` 表示动态键的字典
- `interface extends` 继承并扩展类型
- 直接传入对象字面量时会触发多余属性检查

## ▶ 运行

```bash
npm run ch05
# 或者
npx tsx src/05_objects_interfaces.ts
```
