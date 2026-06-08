// ============================================================
// 第12章 モジュールと総合練習
// npx tsx src/12_modules_and_practice.ts で実行
// ============================================================
// このファイルは単一ファイルで完結します(外部 import なし)
// import/export の説明はコメントとして示します

// ─────────────────────────────────────────
// 1. import / export の説明(コメントによるコード例)
// ─────────────────────────────────────────

// [named export の例]
// ────────────────────────────────────────
// // math.ts
// export const PI = 3.14159;
// export function add(a: number, b: number): number { return a + b; }
// export type MathResult = { value: number; operation: string };
//
// // main.ts — named import
// import { PI, add } from "./math.js";
// import type { MathResult } from "./math.js"; // 型だけ取り込む(JS に残らない)
// ────────────────────────────────────────

// [default export の例]
// ────────────────────────────────────────
// // greeter.ts
// export default function greet(name: string): string {
//   return `こんにちは、${name}！`;
// }
//
// // main.ts
// import greet from "./greeter.js";   // 好きな名前で受け取れる
// ────────────────────────────────────────

console.log("=== 第12章 モジュールと総合練習 ===");

// ─────────────────────────────────────────
// 2. strict オプションの重要性を体感する
// ─────────────────────────────────────────

console.log("\n--- strict / strictNullChecks の効果 ---");

// strictNullChecks: null と undefined を他の型と区別する
function greetUser(name: string | null): string {
  // name が null の可能性があるので直接使えない
  if (name === null) {
    return "ゲストさん、こんにちは";
  }
  return `${name}さん、こんにちは`; // ここでは string と確定
}

console.log(greetUser("田中")); // 田中さん、こんにちは
console.log(greetUser(null));   // ゲストさん、こんにちは

// noImplicitAny: 型推論できない引数への暗黙 any を禁止
// @ts-expect-error  引数に型注釈がなく any になってしまうためエラー
function noTypeAnnotation(x) { return x; }

// ─────────────────────────────────────────
// 3. 総合ミニアプリ: 型安全なタスク管理
// ─────────────────────────────────────────

// ── 3-1. 型定義(判別可能ユニオン) ──

type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  readonly id: number;       // readonly: 作成後は変更不可
  title: string;
  status: TaskStatus;
  readonly createdAt: Date;
}

// ユーティリティ型の活用
type NewTaskInput = Omit<Task, "id" | "status" | "createdAt">; // id/status/createdAt は自動設定
type TaskSummary = Pick<Task, "id" | "title" | "status">;       // 一覧表示用の軽量型

// ── 3-2. ジェネリクスのリポジトリ ──

// T extends { id: number } = id を持つ型ならなんでも管理できる
function createRepository<T extends { readonly id: number }>() {
  const items: T[] = [];
  let nextId = 1;

  return {
    // 追加(id は自動採番するため Omit<T, "id"> を使いたいが、
    // ジェネリクスでは直接 Omit できないため id を別で渡す設計にする)
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

// ── 3-3. タスク管理クラス ──

class TaskManager {
  private readonly repo = createRepository<Task>();

  // タスク追加
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

  // 状態変更(判別可能ユニオンで型安全に遷移)
  changeStatus(id: number, newStatus: TaskStatus): boolean {
    return this.repo.update(id, (task) => ({ ...task, status: newStatus }));
  }

  // 集計: 状態ごとの件数を返す
  getSummaryByStatus(): Record<TaskStatus, number> {
    const all = this.repo.getAll();
    return {
      todo: all.filter((t) => t.status === "todo").length,
      in_progress: all.filter((t) => t.status === "in_progress").length,
      done: all.filter((t) => t.status === "done").length,
    };
  }

  // 一覧取得(Pick で軽量化)
  listSummaries(): TaskSummary[] {
    return this.repo.getAll().map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
    }));
  }

  // ステータスでフィルタリング
  findByStatus(status: TaskStatus): Task[] {
    return this.repo.filter((t) => t.status === status);
  }
}

// ── 3-4. 実際に動かす ──

console.log("\n--- タスク管理ミニアプリ ---");

const manager = new TaskManager();

// タスク追加
const t1 = manager.addTask({ title: "TypeScript の基礎を学ぶ" });
const t2 = manager.addTask({ title: "React + TS を試す" });
const t3 = manager.addTask({ title: "型チャレンジに挑戦" });
const t4 = manager.addTask({ title: "実務プロジェクトに適用" });

console.log("追加完了:", manager.listSummaries());

// 状態変更
manager.changeStatus(t1.id, "done");
manager.changeStatus(t2.id, "in_progress");
manager.changeStatus(t3.id, "in_progress");

console.log("\n状態変更後:");
manager.listSummaries().forEach((t) => {
  const icon = t.status === "done" ? "✔" : t.status === "in_progress" ? "▶" : "○";
  console.log(`  [${icon}] #${t.id} ${t.title} (${t.status})`);
});

// 集計
const summary = manager.getSummaryByStatus();
console.log("\n集計:");
console.log(`  todo: ${summary.todo}, in_progress: ${summary.in_progress}, done: ${summary.done}`);

// フィルタリング
const inProgress = manager.findByStatus("in_progress");
console.log(`\n進行中のタスク(${inProgress.length}件):`);
inProgress.forEach((t) => console.log(`  - ${t.title}`));

// ─────────────────────────────────────────
// 4. 非同期タスク管理(第11章の組み合わせ)
// ─────────────────────────────────────────

console.log("\n--- 非同期でタスクを保存/取得する例 ---");

// 模擬 DB(実際の DB や API の代わりに Promise で遅延させる)
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

// async/await + 型安全な操作
async function saveAndFetch(): Promise<void> {
  const allTasks = manager.findByStatus("done");

  // 並列保存(Promise.all でタプル型)
  const saveResults = await Promise.all(
    allTasks.map((t) => fakeDbSave(t)),
  );
  // saveResults の型: { savedAt: string }[]
  console.log(`${saveResults.length} 件を保存完了`);

  // ID で取得
  const fetched = await fakeDbFetch(t1.id, allTasks);
  if (fetched !== null) {
    // fetched の型: Task(null でないことが確定)
    console.log(`取得: #${fetched.id} "${fetched.title}" - ${fetched.status}`);
  } else {
    console.log(`ID ${t1.id} は見つかりませんでした`);
  }
}

await saveAndFetch();

// ─────────────────────────────────────────
// 5. 練習問題の解答例
// ─────────────────────────────────────────

console.log("\n=== 練習問題1: Result<T, E> ===");

type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function safeDivide(a: number, b: number): Result<number, string> {
  if (b === 0) return { ok: false, error: "0で割ることはできません" };
  return { ok: true, value: a / b };
}

const r1 = safeDivide(10, 2);
const r2 = safeDivide(5, 0);

// 判別可能ユニオンでナローイング
if (r1.ok) {
  const val: number = r1.value; // ok が true なら value は必ず number
  console.log("10 / 2 =", val);
}
if (!r2.ok) {
  const err: string = r2.error; // ok が false なら error は必ず string
  console.log("5 / 0:", err);
}

console.log("\n=== 練習問題2: createRepository<T> ===");

// 汎用リポジトリ(別のエンティティで再利用できる)
interface Product {
  readonly id: number;
  name: string;
  price: number;
}

const productRepo = createRepository<Product>();
productRepo._add({ id: 1, name: "リンゴ", price: 150 });
productRepo._add({ id: 2, name: "バナナ", price: 100 });
productRepo._add({ id: 3, name: "みかん", price: 80 });

console.log("全商品:", productRepo.getAll().map((p) => p.name));
console.log("ID=2:", productRepo.findById(2)?.name); // バナナ

const cheap = productRepo.filter((p) => p.price < 120);
console.log("120円未満:", cheap.map((p) => `${p.name}(${p.price}円)`));

console.log("\n=== 練習問題3: ユーティリティ型 ===");

interface UserForPractice {
  id: number;
  name: string;
  email: string;
  password: string;
}

// ユーティリティ型だけで新しい型を定義
type UpdateUserInput = Partial<Omit<UserForPractice, "id">>;  // id を除いて全部オプショナル
type PublicUser = Omit<UserForPractice, "password">;          // password を除く

const updateInput: UpdateUserInput = { name: "新しい名前" }; // email/password なしでもOK
const publicUser: PublicUser = { id: 1, name: "田中", email: "t@example.com" }; // password なし

console.log("UpdateUserInput:", updateInput);
console.log("PublicUser:", publicUser);

// ─────────────────────────────────────────
// 6. 全章のまとめ: 学んだ機能の一覧
// ─────────────────────────────────────────

console.log("\n=== 全12章のまとめ ===");

const learned: Record<string, string> = {
  "第01章": "TypeScript の始め方・型注釈の基本",
  "第02章": "JS の復習(let/const/アロー関数/分割代入)",
  "第03章": "基本の型(string/number/boolean/null/undefined/any/unknown/never)",
  "第04章": "関数の型(引数・戻り値・オプショナル・オーバーロード)",
  "第05章": "オブジェクトとインターフェース",
  "第06章": "配列・タプル・列挙型(enum)",
  "第07章": "ユニオン型とナローイング(型の絞り込み)",
  "第08章": "ジェネリクス(型引数で再利用可能なコード)",
  "第09章": "ユーティリティ型(Partial/Required/Readonly/Pick/Omit/Record...)",
  "第10章": "クラス(アクセス修飾子・継承・abstract・implements)",
  "第11章": "非同期処理(Promise<T>/async/await/try-catch)",
  "第12章": "モジュールと総合練習(import/export/.d.ts/strict)",
};

Object.entries(learned).forEach(([ch, desc]) => {
  console.log(`  ${ch}: ${desc}`);
});

console.log("\nお疲れさまでした！TypeScript の基礎をすべて学びました。");
console.log("次は: Type Challenges / React + TS / Node + TS に挑戦しよう！");
