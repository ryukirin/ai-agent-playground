// ============================================================
// 第16章 React + TypeScript
// npm run ch16  (= tsx src/16_react_typescript.tsx)
//
// 为了在不依赖浏览器的情况下「运行并查看结果」，
// 使用 renderToStaticMarkup 将组件转换为 HTML 字符串并
// 通过 console.log 输出。通常应使用 ReactDOM.render / createRoot
// 挂载到浏览器，但这里优先采用可在 Node 上运行验证的形式。
// ============================================================

import { renderToStaticMarkup } from "react-dom/server";
import React, { useState, useReducer } from "react";

// ─────────────────────────────────────────────────────────
// 1. 带类型 props 的组件
//    使用 type Props = { ... } 定义必填/可选/默认值/children
// ─────────────────────────────────────────────────────────

// Props 类型：name 必填，count 可选（加 ?），children 为 React.ReactNode
type GreetProps = {
  name: string;            // 必填
  count?: number;          // 可选（省略时为 undefined）
  children?: React.ReactNode; // 子元素（文本、JSX 等任何内容均可）
};

// 默认值通过解构赋值设置（{ count = 0 }）
function Greet({ name, count = 0, children }: GreetProps) {
  return (
    <div className="greet">
      <span>
        {name}: {count}次
      </span>
      {/* 有 children 时才显示 */}
      {children && <p className="note">{children}</p>}
    </div>
  );
}

console.log("=== 1. 带类型的 Props ===");

// 无 count → 使用默认值 0
console.log(renderToStaticMarkup(<Greet name="Alice" />));
// → <div class="greet"><span>Alice: 0次</span></div>

// 有 count + 有 children
console.log(
  renderToStaticMarkup(
    <Greet name="Bob" count={3}>
      TypeScript 学习中!
    </Greet>
  )
);
// → <div class="greet"><span>Bob: 3次</span><p class="note">TypeScript 学习中!</p></div>

// ─────────────────────────────────────────────────────────
// 2. useState 的类型
//    确认推断与显式泛型两种方式，以及函数式更新
// ─────────────────────────────────────────────────────────

// useState(0) → 推断为 number（无需显式声明）
// useState<string | null>(null) → 需要显式泛型
//   （只传 null 会被推断为 never 类型）

type CounterProps = { initial?: number };

function Counter({ initial = 0 }: CounterProps) {
  // 推断：从初始值 initial（number）确定 T = number
  const [count, setCount] = useState(initial);

  // 显式泛型：以 null 为初始值时需要明确标注类型
  const [label, setLabel] = useState<string | null>(null);

  // 函数式更新：接收前一个 state 并返回下一个值的形式
  // SSR 中 onClick 不会触发，但以注释形式展示类型写法
  const increment = () => setCount((prev) => prev + 1); // prev: number
  const resetLabel = () => setLabel(null);

  // 仅引用以抑制未使用警告（实际应用中通过 onClick 等使用）
  void increment;
  void resetLabel;

  return (
    <div className="counter">
      <span data-count={count}>{count}</span>
      {label && <em>{label}</em>}
    </div>
  );
}

// 类型错误示例（仅编译时检查，不执行）：
//   const [count, setCount] = useState(0);
//   setCount("hello"); // → TS2345：string 不能赋值给 number

console.log("\n=== 2. useState 的类型 ===");
// 初始值 0 时 renderToStaticMarkup → 显示计数
console.log(renderToStaticMarkup(<Counter />));
// → <div class="counter"><span data-count="0">0</span></div>

console.log(renderToStaticMarkup(<Counter initial={5} />));
// → <div class="counter"><span data-count="5">5</span></div>

// ─────────────────────────────────────────────────────────
// 3. 事件处理器的类型
//    React.MouseEvent<HTMLButtonElement>
//    React.ChangeEvent<HTMLInputElement>
//    SSR 中事件不会触发。目的是展示类型的写法。
// ─────────────────────────────────────────────────────────

// onClick 的处理器：React.MouseEvent<HTMLButtonElement>
// 可以类型安全地引用被点击元素的信息（currentTarget 等）
function handleClick(e: React.MouseEvent<HTMLButtonElement>): void {
  // currentTarget 为 HTMLButtonElement 类型 → 可访问 disabled
  console.log("被点击按钮的 disabled:", e.currentTarget.disabled);
}

// onChange 的处理器：React.ChangeEvent<HTMLInputElement>
// 通过 e.target.value 获取输入值（类型为 string）
function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
  const value: string = e.target.value; // value 确定为 string 类型
  console.log("输入值:", value);
}

// 带事件类型的表单组件
// SSR 中 onClick/onChange 不会触发。仅作为类型写法的示例。
function SearchForm() {
  return (
    <form>
      {/* onClick 传入接收 React.MouseEvent<HTMLButtonElement> 的处理器 */}
      <button type="button" onClick={handleClick}>
        搜索
      </button>
      {/* onChange 传入接收 React.ChangeEvent<HTMLInputElement> 的处理器 */}
      <input type="text" onChange={handleChange} placeholder="关键词" />
    </form>
  );
}

console.log("\n=== 3. 事件处理器的类型 ===");
console.log(renderToStaticMarkup(<SearchForm />));
// SSR 中事件不会输出到 HTML 属性，
// 但组件的类型检查在编译时正常进行
// → <form><button type="button">搜索</button><input type="text" placeholder="关键词"/></form>

// ─────────────────────────────────────────────────────────
// 4. useReducer + 可辨识联合 Action
//    将第7章「可辨识联合」的知识应用于 React 状态管理
// ─────────────────────────────────────────────────────────

// Action 类型：可辨识联合（通过 type 字段区分种类）
type CountAction =
  | { type: "inc" }                 // 计数加一
  | { type: "dec" }                 // 计数减一
  | { type: "set"; value: number }; // 设置为指定值

type CountState = { count: number };

// reducer 是纯函数，可以单独调用并确认结果
function countReducer(state: CountState, action: CountAction): CountState {
  switch (action.type) {
    case "inc":
      return { count: state.count + 1 };
    case "dec":
      return { count: state.count - 1 };
    case "set":
      // action.type 确定为 "set" → action.value 可类型安全使用
      return { count: action.value };
  }
}

// 使用 reducer 的 React 组件
// （SSR 中 dispatch 的事件不会触发，但初始状态会被渲染）
function CounterWithReducer() {
  const [state, dispatch] = useReducer(countReducer, { count: 0 });

  // dispatch 的类型：传入不符合上方 Action 类型的对象会产生类型错误
  const onInc = () => dispatch({ type: "inc" });
  const onDec = () => dispatch({ type: "dec" });
  const onSet = () => dispatch({ type: "set", value: 10 });

  void onInc;
  void onDec;
  void onSet;

  return <div className="reducer-counter">count = {state.count}</div>;
}

console.log("\n=== 4. useReducer + 可辨识联合 ===");

// reducer 是纯函数，可以直接调用确认运行结果
const s0: CountState = { count: 0 };
const s1 = countReducer(s0, { type: "inc" });
console.log("inc:", s1); // { count: 1 }

const s2 = countReducer(s1, { type: "inc" });
console.log("inc:", s2); // { count: 2 }

const s3 = countReducer(s2, { type: "dec" });
console.log("dec:", s3); // { count: 1 }

const s4 = countReducer(s3, { type: "set", value: 42 });
console.log("set 42:", s4); // { count: 42 }

// SSR 渲染确认（输出初始值 count = 0）
console.log(renderToStaticMarkup(<CounterWithReducer />));
// → <div class="reducer-counter">count = 0</div>

// 类型错误示例：传入未定义的 type 会产生编译错误
// @ts-expect-error "reset" 不存在于 Action 类型中
countReducer(s0, { type: "reset" });

// ─────────────────────────────────────────────────────────
// 5. 泛型组件 List<T>
//    render prop 模式：由调用方决定显示方式
// ─────────────────────────────────────────────────────────

// T 可以是任意类型。接收 items: T[] 和 render: (item: T) => React.ReactNode
// 通过 render prop，无论 T 是什么类型，都能类型安全地渲染各元素
type ListProps<T> = {
  items: T[];
  render: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
};

// 泛型组件：<T,> 的末尾逗号是为了防止 TSX 解析器
// 将 <T> 误认为标签的惯用写法
function List<T>({ items, render, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={keyExtractor ? keyExtractor(item, i) : String(i)}>
          {render(item, i)}
        </li>
      ))}
    </ul>
  );
}

console.log("\n=== 5. 泛型组件 List<T> ===");

// 渲染 number[]：T 推断为 number
console.log(
  renderToStaticMarkup(
    <List
      items={[10, 20, 30]}
      render={(n) => <strong>{n}</strong>}
    />
  )
);
// → <ul><li><strong>10</strong></li><li><strong>20</strong></li><li><strong>30</strong></li></ul>

// 渲染 string[]：T 推断为 string（复用同一个 List）
console.log(
  renderToStaticMarkup(
    <List
      items={["TypeScript", "React", "Node.js"]}
      keyExtractor={(item) => item}
      render={(item, i) => (
        <span>
          {i + 1}. {item}
        </span>
      )}
    />
  )
);
// → <ul><li><span>1. TypeScript</span></li>...</ul>

// 对象数组也可以使用：T = { id: number; label: string }
type MenuItem = { id: number; label: string };
const menu: MenuItem[] = [
  { id: 1, label: "首页" },
  { id: 2, label: "设置" },
  { id: 3, label: "退出登录" },
];

console.log(
  renderToStaticMarkup(
    <List
      items={menu}
      keyExtractor={(item) => String(item.id)}
      render={(item) => <a href={`#${item.id}`}>{item.label}</a>}
    />
  )
);
// → <ul><li><a href="#1">首页</a></li>...</ul>
