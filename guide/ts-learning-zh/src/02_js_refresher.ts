// ============================================================
// 第02章 JS 基础回顾
// 通过 npx tsx src/02_js_refresher.ts 运行
// ============================================================

// ----------------------------------------------------------
// 1. let / const（不使用 var）
// ----------------------------------------------------------

console.log("=== 1. let / const ===");

const PI = 3.14;
let count = 0;
count = 10;
console.log("PI:", PI);      // → 3.14
console.log("count:", count); // → 10

// 块级作用域：只在 { } 内有效
{
  const blockVar = "仅在块内有效";
  console.log(blockVar); // → 仅在块内有效
}
// console.log(blockVar); // 在这里使用会报错（超出作用域）

console.log();

// ----------------------------------------------------------
// 2. 模板字面量
// ----------------------------------------------------------

console.log("=== 2. 模板字面量 ===");

const userName = "张三";
const userAge = 30;

const oldStyle = "你好，" + userName + "（" + userAge + "岁）";
const modern = `你好，${userName}（${userAge}岁）`;

console.log("旧风格:", oldStyle);  // → 你好，张三（30岁）
console.log("模板字面量:", modern);  // → 你好，张三（30岁）

// 可以直接写换行
const multiline = `第一行
第二行
第三行`;
console.log(multiline);

console.log();

// ----------------------------------------------------------
// 3. 函数的3种写法 + 默认参数 + 剩余参数/展开运算符
// ----------------------------------------------------------

console.log("=== 3. 函数 ===");

// 函数声明
function square(n: number): number {
  return n * n;
}
console.log("square(4):", square(4)); // → 16

// 函数表达式
const double = function (n: number): number {
  return n * 2;
};
console.log("double(5):", double(5)); // → 10

// 箭头函数（单行）
const triple = (n: number): number => n * 3;
console.log("triple(3):", triple(3)); // → 9

// 箭头函数（多行）
const greet = (name: string): string => {
  const msg = `你好，${name}`;
  return msg;
};
console.log(greet("李四")); // → 你好，李四

// 默认参数
function greetWithTitle(name: string, title: string = "先生/女士"): string {
  return `${name}${title}，你好`;
}
console.log(greetWithTitle("张三"));          // → 张三先生/女士，你好
console.log(greetWithTitle("张三", "老师"));  // → 张三老师，你好

// 剩余参数：以数组形式接收可变数量的参数
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}
console.log("sum(1,2,3,4):", sum(1, 2, 3, 4)); // → 10

// 展开运算符：将数组展开后传入
const nums = [1, 2, 3];
console.log("sum(...nums):", sum(...nums)); // → 6

console.log();

// ----------------------------------------------------------
// 4. 数组方法
// ----------------------------------------------------------

console.log("=== 4. 数组方法 ===");

const fruits = ["苹果", "香蕉", "橘子", "葡萄"];
const prices = [100, 200, 150, 300];

// map：转换每个元素
const doubled = prices.map((p) => p * 2);
console.log("map doubled:", doubled); // → [200, 400, 300, 600]

// filter：只保留满足条件的元素
const expensive = prices.filter((p) => p >= 200);
console.log("filter expensive:", expensive); // → [200, 300]

// reduce：折叠为单个值
const total = prices.reduce((acc, p) => acc + p, 0);
console.log("reduce total:", total); // → 750

// find：返回满足条件的第一个元素（不存在则返回 undefined）
const found = prices.find((p) => p > 100);
console.log("find > 100:", found); // → 200

const notFound = prices.find((p) => p > 1000);
console.log("find > 1000:", notFound); // → undefined

// forEach：用于副作用的循环
console.log("forEach fruits:");
fruits.forEach((f, i) => {
  console.log(`  ${i}: ${f}`);
});
// → 0: 苹果  1: 香蕉  2: 橘子  3: 葡萄

console.log();

// ----------------------------------------------------------
// 5. 对象：简写、解构赋值、展开运算符
// ----------------------------------------------------------

console.log("=== 5. 对象 ===");

// 属性简写
const name = "张三";
const age = 28;
const user = { name, age }; // 等同于 { name: name, age: age }
console.log("user:", user); // → { name: '张三', age: 28 }

// 对象解构赋值
const { name: extractedName, age: extractedAge } = user;
console.log("解构赋值:", extractedName, extractedAge); // → 张三 28

// 数组解构赋值
const [first, second, ...rest] = fruits;
console.log("first:", first);   // → 苹果
console.log("second:", second); // → 香蕉
console.log("rest:", rest);     // → ['橘子', '葡萄']

// 用展开运算符复制/合并对象
const base = { x: 1, y: 2 };
const extended = { ...base, z: 3 };
console.log("extended:", extended); // → { x: 1, y: 2, z: 3 }

// 同名键后者优先
const overridden = { ...base, x: 99 };
console.log("overridden:", overridden); // → { x: 99, y: 2 }

console.log();

// ----------------------------------------------------------
// 6. 三元运算符 / ?. / ??
// ----------------------------------------------------------

console.log("=== 6. 三元运算符 / ?. / ?? ===");

// 三元运算符
const score = 75;
const result = score >= 60 ? "合格" : "不合格";
console.log("三元运算符:", result); // → 合格

// ?. 可选链
type UserProfile = { profile?: { nickname?: string } };
const userWithProfile: UserProfile = { profile: { nickname: "小张" } };
// 声明为 undefined，演示用 ?. 安全访问的示例
const noProfile = undefined as UserProfile | undefined;

console.log("?. 有效:", userWithProfile?.profile?.nickname);  // → 小张
console.log("?. 无效:", noProfile?.profile?.nickname);        // → undefined（不会报错）

// ?? 空值合并运算符
const input: string | null = null;
const value = input ?? "默认值";
console.log("?? input:", value); // → 默认值

const zero = 0;
console.log("?? 0:", zero ?? 99);  // → 0（0 不是 null/undefined）
console.log("|| 0:", zero || 99);  // → 99（|| 针对所有 falsy 值）

console.log();

// ----------------------------------------------------------
// 7. 数组与对象组合的实用示例
// ----------------------------------------------------------

console.log("=== 7. 实用示例：商品列表处理 ===");

type Item = { name: string; price: number; inStock: boolean };

const items: Item[] = [
  { name: "苹果", price: 120, inStock: true },
  { name: "香蕉", price: 80, inStock: false },
  { name: "橘子", price: 100, inStock: true },
  { name: "葡萄", price: 350, inStock: true },
];

// 获取有库存且价格不足200的商品名
const affordable = items
  .filter((item) => item.inStock && item.price < 200)
  .map((item) => item.name);
console.log("有库存且不足200:", affordable); // → ['苹果', '橘子']

// 有库存商品的总金额
const stockTotal = items
  .filter((item) => item.inStock)
  .reduce((acc, item) => acc + item.price, 0);
console.log("有库存商品总计:", stockTotal); // → 570

console.log();

// ----------------------------------------------------------
// 8. 异步处理入门（Promise / async・await）
// ----------------------------------------------------------

console.log("=== 8. 异步处理入门 ===");

// Promise：包装异步处理结果
function delay(ms: number): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(`${ms}ms 后完成`), ms);
  });
}

// 用 async・await 像同步代码一样书写
async function runAsync(): Promise<void> {
  console.log("异步处理 开始");
  const result = await delay(50); // 等待 50ms（学习用，设置较短）
  console.log("异步处理 结果:", result);
  console.log("异步处理 结束");
}

// 立即执行
runAsync().then(() => {
  console.log();
  console.log("=== 第02章 完成 ===");
});
