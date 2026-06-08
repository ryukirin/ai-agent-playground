// ============================================================
// 第12章 模块 (module) 与综合练习
// npx tsx src/12_modules_and_practice.ts 运行
// ============================================================
// 此文件在单个文件中完结（无外部 import）
// import/export 的说明以注释形式展示

// ─────────────────────────────────────────
// 1. import / export 说明（注释形式的代码示例）
// ─────────────────────────────────────────

// [named export 示例]
// ────────────────────────────────────────
// // math.ts
// export const PI = 3.14159;
// export function add(a: number, b: number): number { return a + b; }
// export type MathResult = { value: number; operation: string };
//
// // main.ts — named import
// import { PI, add } from "./math.js";
// import type { MathResult } from "./math.js"; // 只导入类型（不保留在 JS 中）
// ────────────────────────────────────────

// [default export 示例]
// ────────────────────────────────────────
// // greeter.ts
// export default function greet(name: string): string {
//   return `你好，${name}！`;
// }
//
// // main.ts
// import greet from "./greeter.js";   // 可以用任意名称接收
// ────────────────────────────────────────

console.log("=== 第12章 模块与综合练习 ===");

// ─────────────────────────────────────────
// 2. 体验 strict 选项的重要性
// ─────────────────────────────────────────

console.log("\n--- strict / strictNullChecks 的效果 ---");

// strictNullChecks：将 null 和 undefined 与其他类型区分
function greetUser(name: string | null): string {
  // name 可能为 null，因此不能直接使用
  if (name === null) {
    return "你好，访客";
  }
  return `你好，${name}`; // 此处已确定为 string
}

console.log(greetUser("王五")); // 你好，王五
console.log(greetUser(null));   // 你好，访客

// noImplicitAny：禁止无法推断类型的参数隐式变为 any
// @ts-expect-error  参数没有类型注释会变为 any，因此报错
function noTypeAnnotation(x) { return x; }

// ─────────────────────────────────────────
// 3. 综合小型应用：类型安全的任务管理
// ─────────────────────────────────────────

// ── 3-1. 类型定义（可辨识联合）──

type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  readonly id: number;       // readonly：创建后不可修改
  title: string;
  status: TaskStatus;
  readonly createdAt: Date;
}

// 工具类型的活用
type NewTaskInput = Omit<Task, "id" | "status" | "createdAt">; // id/status/createdAt 自动设置
type TaskSummary = Pick<Task, "id" | "title" | "status">;       // 列表显示用的轻量类型

// ── 3-2. 泛型仓库 ──

// T extends { id: number } = 任何拥有 id 的类型都可以管理
function createRepository<T extends { readonly id: number }>() {
  const items: T[] = [];
  let nextId = 1;

  return {
    // 添加（因为 id 是自动编号，想用 Omit<T, "id">，
    // 但泛型中无法直接 Omit，所以设计为单独传入 id）
    _add(item: T): void {
      items.push(item);
    },
    findById(id: number): T | undefined {
      return items.find((i) => i.id === id);
    },
    getAll(): readonly T[] {
      return items;
    },
    filter(predicate: (item: T) => boolean): T[] {
      return items.filter(predicate);
    },
    update(id: number, updater: (item: T) => T): boolean {
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return false;
      items[idx] = updater(items[idx]);
      return true;
    },
    getNextId(): number {
      return nextId++;
    },
  };
}

// ── 3-3. 任务管理类 ──

class TaskManager {
  private readonly repo = createRepository<Task>();

  // 添加任务
  addTask(input: NewTaskInput): Task {
    const task: Task = {
      id: this.repo.getNextId(),
      title: input.title,
      status: "todo",
      createdAt: new Date(),
    };
    this.repo._add(task);
    return task;
  }

  // 变更状态（通过可辨识联合类型安全地转换）
  changeStatus(id: number, newStatus: TaskStatus): boolean {
    return this.repo.update(id, (task) => ({ ...task, status: newStatus }));
  }

  // 统计：返回各状态的数量
  getSummaryByStatus(): Record<TaskStatus, number> {
    const all = this.repo.getAll();
    return {
      todo: all.filter((t) => t.status === "todo").length,
      in_progress: all.filter((t) => t.status === "in_progress").length,
      done: all.filter((t) => t.status === "done").length,
    };
  }

  // 获取列表（用 Pick 轻量化）
  listSummaries(): TaskSummary[] {
    return this.repo.getAll().map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
    }));
  }

  // 按状态筛选
  findByStatus(status: TaskStatus): Task[] {
    return this.repo.filter((t) => t.status === status);
  }
}

// ── 3-4. 实际运行 ──

console.log("\n--- 任务管理小型应用 ---");

const manager = new TaskManager();

// 添加任务
const t1 = manager.addTask({ title: "学习 TypeScript 基础" });
const t2 = manager.addTask({ title: "尝试 React + TS" });
const t3 = manager.addTask({ title: "挑战类型谜题" });
const t4 = manager.addTask({ title: "应用到实际项目" });

console.log("添加完成：", manager.listSummaries());

// 变更状态
manager.changeStatus(t1.id, "done");
manager.changeStatus(t2.id, "in_progress");
manager.changeStatus(t3.id, "in_progress");

console.log("\n状态变更后：");
manager.listSummaries().forEach((t) => {
  const icon = t.status === "done" ? "✔" : t.status === "in_progress" ? "▶" : "○";
  console.log(`  [${icon}] #${t.id} ${t.title} (${t.status})`);
});

// 统计
const summary = manager.getSummaryByStatus();
console.log("\n统计：");
console.log(`  todo：${summary.todo}，in_progress：${summary.in_progress}，done：${summary.done}`);

// 筛选
const inProgress = manager.findByStatus("in_progress");
console.log(`\n进行中的任务（${inProgress.length}件）：`);
inProgress.forEach((t) => console.log(`  - ${t.title}`));

// ─────────────────────────────────────────
// 4. 异步任务管理（与第11章的组合）
// ─────────────────────────────────────────

console.log("\n--- 用异步方式保存/获取任务的示例 ---");

// 模拟 DB（用 Promise 延迟代替实际 DB 或 API）
function fakeDbSave(task: Task): Promise<{ savedAt: string }> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ savedAt: new Date().toISOString() }), 50);
  });
}

function fakeDbFetch(id: number, tasks: Task[]): Promise<Task | null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(tasks.find((t) => t.id === id) ?? null), 50);
  });
}

// async/await + 类型安全的操作
async function saveAndFetch(): Promise<void> {
  const allTasks = manager.findByStatus("done");

  // 并行保存（用 Promise.all 获取元组类型）
  const saveResults = await Promise.all(
    allTasks.map((t) => fakeDbSave(t)),
  );
  // saveResults 的类型：{ savedAt: string }[]
  console.log(`${saveResults.length} 件保存完成`);

  // 通过 ID 获取
  const fetched = await fakeDbFetch(t1.id, allTasks);
  if (fetched !== null) {
    // fetched 的类型：Task（已确定不为 null）
    console.log(`获取：#${fetched.id} "${fetched.title}" - ${fetched.status}`);
  } else {
    console.log(`未找到 ID ${t1.id}`);
  }
}

await saveAndFetch();

// ─────────────────────────────────────────
// 5. 练习题参考答案
// ─────────────────────────────────────────

console.log("\n=== 练习题1：Result<T, E> ===");

type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function safeDivide(a: number, b: number): Result<number, string> {
  if (b === 0) return { ok: false, error: "不能除以0" };
  return { ok: true, value: a / b };
}

const r1 = safeDivide(10, 2);
const r2 = safeDivide(5, 0);

// 通过可辨识联合进行收窄
if (r1.ok) {
  const val: number = r1.value; // ok 为 true 时 value 必定是 number
  console.log("10 / 2 =", val);
}
if (!r2.ok) {
  const err: string = r2.error; // ok 为 false 时 error 必定是 string
  console.log("5 / 0：", err);
}

console.log("\n=== 练习题2：createRepository<T> ===");

// 通用仓库（可以用其他实体复用）
interface Product {
  readonly id: number;
  name: string;
  price: number;
}

const productRepo = createRepository<Product>();
productRepo._add({ id: 1, name: "苹果", price: 150 });
productRepo._add({ id: 2, name: "香蕉", price: 100 });
productRepo._add({ id: 3, name: "橘子", price: 80 });

console.log("所有商品：", productRepo.getAll().map((p) => p.name));
console.log("ID=2：", productRepo.findById(2)?.name); // 香蕉

const cheap = productRepo.filter((p) => p.price < 120);
console.log("120元以下：", cheap.map((p) => `${p.name}(${p.price}元)`));

console.log("\n=== 练习题3：工具类型 ===");

interface UserForPractice {
  id: number;
  name: string;
  email: string;
  password: string;
}

// 仅用工具类型定义新类型
type UpdateUserInput = Partial<Omit<UserForPractice, "id">>;  // 去掉 id，全部变为可选
type PublicUser = Omit<UserForPractice, "password">;          // 去掉 password

const updateInput: UpdateUserInput = { name: "新名字" }; // 无 email/password 也可以
const publicUser: PublicUser = { id: 1, name: "王五", email: "w@example.com" }; // 无 password

console.log("UpdateUserInput：", updateInput);
console.log("PublicUser：", publicUser);

// ─────────────────────────────────────────
// 6. 全章总结：学到的功能一览
// ─────────────────────────────────────────

console.log("\n=== 全12章总结 ===");

const learned: Record<string, string> = {
  "第01章": "TypeScript 入门・类型注释基础",
  "第02章": "JS 复习（let/const/箭头函数/解构赋值）",
  "第03章": "基本类型（string/number/boolean/null/undefined/any/unknown/never）",
  "第04章": "函数的类型（参数・返回值・可选参数・重载）",
  "第05章": "对象与接口",
  "第06章": "数组・元组・枚举 (enum)",
  "第07章": "联合类型与收窄（类型收缩）",
  "第08章": "泛型 (Generics)（类型参数实现可复用代码）",
  "第09章": "工具类型（Partial/Required/Readonly/Pick/Omit/Record...）",
  "第10章": "类（访问修饰符・继承・abstract・implements）",
  "第11章": "异步处理（Promise<T>/async/await/try-catch）",
  "第12章": "模块与综合练习（import/export/.d.ts/strict）",
};

Object.entries(learned).forEach(([ch, desc]) => {
  console.log(`  ${ch}：${desc}`);
});

console.log("\n辛苦了！您已学完 TypeScript 的所有基础知识。");
console.log("下一步：挑战 Type Challenges / React + TS / Node + TS！");
