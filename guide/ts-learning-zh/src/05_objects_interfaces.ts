// ============================================================
// 第05章 对象与接口 (interface)
// npx tsx src/05_objects_interfaces.ts 执行
// ============================================================

// ----------------------------------------------------------
// 1. 对象类型字面量
// ----------------------------------------------------------
// 在参数类型中用花括号列举属性
function printUser(user: { name: string; age: number }): void {
  console.log(`${user.name}（${user.age}岁）`);
}
printUser({ name: "小明", age: 30 }); // 小明（30岁）

// ----------------------------------------------------------
// 2. interface 的定义与使用
// ----------------------------------------------------------
interface User {
  name: string;
  age: number;
}

const alice: User = { name: "Alice", age: 25 };
console.log("User:", alice.name, alice.age); // Alice 25

// ----------------------------------------------------------
// 3. type 别名定义对象类型
// ----------------------------------------------------------
type Point = {
  x: number;
  y: number;
};

const origin: Point = { x: 0, y: 0 };
console.log("origin:", origin); // { x: 0, y: 0 }

// ----------------------------------------------------------
// 4. interface vs type — 扩展方式的区别
// ----------------------------------------------------------

// interface 用 extends 扩展
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

const myDog: Dog = { name: "小黑", breed: "柴犬" };
console.log("Dog:", myDog); // { name: '小黑', breed: '柴犬' }

// type 用 &（交叉类型）扩展
type Cat = Animal & { indoor: boolean };

const myCat: Cat = { name: "小花", indoor: true };
console.log("Cat:", myCat); // { name: '小花', indoor: true }

// ----------------------------------------------------------
// 5. 声明合并 — 仅 interface 支持
// ----------------------------------------------------------
// 多次声明同名 interface 会自动合并
interface Config {
  host: string;
}

// 再次声明同名 interface 时属性会被添加（type 不支持）
interface Config {
  port: number;
}

const config: Config = { host: "localhost", port: 8080 };
console.log("Config:", config); // { host: 'localhost', port: 8080 }

// ----------------------------------------------------------
// 6. 联合类型只能用 type
// ----------------------------------------------------------
type Result = "success" | "failure";
type StringOrNumber = string | number;

const r: Result = "success";
const x: StringOrNumber = 42;
console.log("Result:", r, "/ StringOrNumber:", x);

// ----------------------------------------------------------
// 7. 可选属性 ?
// ----------------------------------------------------------
interface Article {
  title: string;
  body: string;
  author?: string; // 可以省略
}

const post1: Article = { title: "TypeScript入门", body: "..." };
const post2: Article = { title: "续·TS", body: "...", author: "小明" };

console.log("post1.author:", post1.author); // undefined
console.log("post2.author:", post2.author); // 小明

// ----------------------------------------------------------
// 8. readonly 属性
// ----------------------------------------------------------
interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const red: Color = { r: 255, g: 0, b: 0 };
console.log("red:", red); // { r: 255, g: 0, b: 0 }

// @ts-expect-error readonly 属性不能重新赋值
red.r = 128;

// ----------------------------------------------------------
// 9. 索引签名 { [key: string]: number }
// ----------------------------------------------------------
// 属性名事先不确定的"字典类型"
interface ScoreBoard {
  [playerName: string]: number;
}

const scores: ScoreBoard = {};
scores["小明"] = 85;
scores["小红"] = 92;

console.log("小明的分数:", scores["小明"]); // 85
console.log("小红的分数:", scores["小红"]); // 92

// ----------------------------------------------------------
// 10. 包含嵌套对象和方法的类型
// ----------------------------------------------------------
interface Address {
  city: string;
  zip: string;
}

interface Employee {
  name: string;
  address: Address;   // 嵌套对象
  greet(): string;    // 方法签名
}

const emp: Employee = {
  name: "小华",
  address: { city: "北京", zip: "100001" },
  greet() {
    return `你好，我是${this.name}`;
  },
};

console.log("city:", emp.address.city); // 北京
console.log("greet:", emp.greet());     // 你好，我是小华

// ----------------------------------------------------------
// 11. interface extends — 继承
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
// 12. 多余属性检查
// ----------------------------------------------------------

interface Profile {
  name: string;
  age: number;
}

// 直接传入对象字面量时，多余属性会报错
// @ts-expect-error 直接传入对象字面量时，多余的 email 属性会导致错误
const p: Profile = { name: "小明", age: 20, email: "t@example.com" };

// 先赋值给变量再传入则不会报错（仅进行赋值兼容性检查）
const obj = { name: "小明", age: 20, email: "t@example.com" };
const p2: Profile = obj; // OK
console.log("p2:", p2); // { name: '小明', age: 20, email: 't@example.com' }

// ----------------------------------------------------------
// 13. 索引签名与固定属性类型不匹配
// ----------------------------------------------------------
// 固定属性 count: number 与索引签名 string 不兼容
// 由于错误发生在 interface 定义块内，此处用类型别名演示
// @ts-expect-error count: number 与 [key: string]: string 不兼容，报错
type BadIndex = { [key: string]: string; count: number };

console.log("=== 第05章 完成 ===");
