# 第16章 React + TypeScript

> 从函数组件 (component) 的 props 类型定义出发，一口气掌握 `useState` / `useReducer` / 泛型组件等实务中常用的 React × TypeScript 模式。

## 🎯 本章目标

- 能够用 `type Props = { ... }` 以类型安全的方式定义必填项、可选项和 children
- 能够灵活运用 `useState` 的类型推断与显式泛型
- 能够为 `React.MouseEvent<HTMLButtonElement>` 等事件类型添加标注
- 能够使用可辨识联合 Action + `useReducer` 以类型安全的方式进行状态管理
- 能够设计 `List<T>` 这样的泛型组件

---

## 1. 函数组件与 props 的类型标注

### 定义 type Props

React 函数组件使用 `type Props = { ... }` 来明确标注参数类型。

```tsx
type GreetProps = {
  name: string;              // 必填
  count?: number;            // 可选（加 ?）
  children?: React.ReactNode; // 子元素（可接受任何内容的通用类型）
};

// 通过解构赋值指定默认值
function Greet({ name, count = 0, children }: GreetProps) {
  return (
    <div>
      <span>{name}: {count}次</span>
      {children && <p>{children}</p>}
    </div>
  );
}
```

```tsx
// 使用方式
<Greet name="Alice" />                        // count 可省略（= 0）
<Greet name="Bob" count={3}>学习中!</Greet>   // 带 children
```

**要点：**

| 写法 | 含义 |
|---|---|
| `name: string` | 必填。省略会产生编译错误 |
| `count?: number` | 可选。省略时为 `undefined` |
| `{ count = 0 }` | 通过解构赋值指定省略时的默认值 |
| `children?: React.ReactNode` | 可接受文本、JSX、null 等任何内容的类型 |

### 直接写类型标注而非 `React.FC<Props>`

过去常用 `const Greet: React.FC<GreetProps>` 的写法，但现在普遍采用上面这种**直接在参数上标注类型**的方式（因为 `React.FC` 在是否自动包含 `children` 方面有过历史变化）。

---

## 2. useState 的类型

### 推断与显式泛型

TypeScript 会从传入 `useState` 的初始值推断类型。

```tsx
// 推断：初始值为 number，所以 T = number
const [count, setCount] = useState(0);        // count: number

// 推断：初始值为 string，所以 T = string
const [text, setText] = useState("");         // text: string

// 需要显式声明：只传 null 会被推断为 never
const [user, setUser] = useState<string | null>(null);  // 必须显式声明
```

当仅凭初始值无法确定类型时（比如初始为 `null`，之后才有值），需要使用显式泛型。

### 函数式更新

当需要基于前一个 state 计算下一个值时，使用**函数式更新**。在异步处理等依赖前一个值的场景下特别有效。

```tsx
const [count, setCount] = useState(0);

// 函数式更新：prev 被 TypeScript 推断为 number
const increment = () => setCount((prev) => prev + 1);
const addFive   = () => setCount((prev) => prev + 5);
```

```tsx
// 类型错误示例
// @ts-expect-error setCount 不能接收 string
setCount("hello");
```

---

## 3. 事件的类型

React 的事件处理器有专用类型。传给以 `on` 开头的 prop 的函数，应标注对应的事件类型。

### 常用事件类型

| 事件属性 | 类型 | 主要用途 |
|---|---|---|
| `onClick` | `React.MouseEvent<T>` | 按钮、链接的点击 |
| `onChange` | `React.ChangeEvent<T>` | input / select 的值变更 |
| `onSubmit` | `React.FormEvent<HTMLFormElement>` | 表单提交 |
| `onKeyDown` | `React.KeyboardEvent<T>` | 键盘操作 |

`T` 填入元素类型（`HTMLButtonElement` / `HTMLInputElement` 等）。

```tsx
// 点击事件：currentTarget 确定为 HTMLButtonElement 类型
function handleClick(e: React.MouseEvent<HTMLButtonElement>): void {
  console.log("disabled?", e.currentTarget.disabled);
}

// 变更事件：e.target.value 确定为 string 类型
function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
  const value: string = e.target.value;
  console.log("输入值:", value);
}

function SearchForm() {
  return (
    <form>
      <button type="button" onClick={handleClick}>搜索</button>
      <input type="text" onChange={handleChange} />
    </form>
  );
}
```

> **注意：** 本仓库的运行方式（使用 `renderToStaticMarkup` 的服务端渲染）中，`onClick` 和 `onChange` 等事件**不会触发**。事件只在浏览器 DOM 中运行。这里的目的是「查看类型的写法」。

---

## 4. useReducer + 可辨识联合 Action

第7章学过的**可辨识联合 (discriminated union)**，与 React 的 `useReducer` 结合使用非常强大。通过 type 字段区分多种操作模式，reducer 内部的 switch 语句可以自动确定各自的类型。

```tsx
// Action 类型：type 字段作为判别字段
type CountAction =
  | { type: "inc" }                  // 只有 type
  | { type: "dec" }
  | { type: "set"; value: number };  // type + payload

type CountState = { count: number };

// reducer：纯函数，便于测试和单独执行
function countReducer(state: CountState, action: CountAction): CountState {
  switch (action.type) {
    case "inc": return { count: state.count + 1 };
    case "dec": return { count: state.count - 1 };
    case "set": return { count: action.value }; // 确定为 "set" → value 可用
  }
}
```

```tsx
function CounterWithReducer() {
  const [state, dispatch] = useReducer(countReducer, { count: 0 });

  return (
    <div>
      <span>{state.count}</span>
      <button onClick={() => dispatch({ type: "inc" })}>+</button>
      <button onClick={() => dispatch({ type: "dec" })}>-</button>
      <button onClick={() => dispatch({ type: "set", value: 0 })}>重置</button>
    </div>
  );
}
```

```tsx
// 类型错误示例：未定义的 type 会产生编译错误
// @ts-expect-error "reset" 不存在于 Action 类型中
dispatch({ type: "reset" });
```

**reducer 是纯函数的优点：** 无需浏览器即可验证运行结果。

```tsx
const s0 = { count: 0 };
console.log(countReducer(s0, { type: "inc" }));  // { count: 1 }
console.log(countReducer(s0, { type: "set", value: 42 })); // { count: 42 }
```

---

## 5. 泛型组件

可以将第8章学过的泛型应用到 React 组件中。与 **render prop 模式**结合使用，可以创建「适用于任意类型列表」的通用组件。

```tsx
type ListProps<T> = {
  items: T[];
  render: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
};

// <T,> 的末尾逗号：防止 TSX 解析器将 <T> 误认为标签的惯用写法
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
```

```tsx
// 用于 number[]：T 推断为 number
<List
  items={[10, 20, 30]}
  render={(n) => <strong>{n}</strong>}
/>

// 用于 string[]：T 推断为 string（复用同一组件）
<List
  items={["TypeScript", "React", "Node.js"]}
  keyExtractor={(item) => item}
  render={(item, i) => <span>{i + 1}. {item}</span>}
/>

// 对象数组也可以
type MenuItem = { id: number; label: string };
<List<MenuItem>
  items={menu}
  keyExtractor={(item) => String(item.id)}
  render={(item) => <a href={`#${item.id}`}>{item.label}</a>}
/>
```

---

## 6. 在本仓库中的运行方式

通常 React 通过 `ReactDOM.createRoot(el).render(<App />)` 在浏览器中渲染。本仓库为了**不依赖浏览器确认运行结果**，使用 `react-dom/server` 的 `renderToStaticMarkup`。

```tsx
import { renderToStaticMarkup } from "react-dom/server";

// 将组件输出为 HTML 字符串
const html = renderToStaticMarkup(<Greet name="Alice" count={3} />);
console.log(html);
// → <div><span>Alice: 3次</span></div>
```

**`renderToStaticMarkup` 是什么：** 服务端渲染 (SSR) 用的工具函数，将组件转换为静态 HTML 字符串。输出的是不带 React 数据属性（`data-reactroot` 等）的简洁 HTML。事件仅在客户端运行，因此这里不会触发。

在生产 React 应用中，使用 `createRoot` 挂载到浏览器，useState 的计数递增和表单输入等双向交互才能正常工作。

---

## ⚠️ 常见误区

**1. `import React from "react"` 是不必要的（React 17+ / react-jsx 运行时）**

```tsx
// 不推荐：旧写法（React 16 及之前需要）
import React from "react";

// 推荐：tsconfig 中有 "jsx": "react-jsx" 时无需 import
function Hello() {
  return <div>Hello</div>;  // React 会自动导入
}
```

但如果需要引用 `React.ReactNode` / `React.MouseEvent` 等类型，则需要 `import React from "react"` 或 `import type { ReactNode } from "react"`。

**2. 事件处理器是用箭头函数还是函数定义**

`onClick={handleClick}` 与 `onClick={() => handleClick()}` 行为相同，但是否接收事件对象会影响类型。

```tsx
// 不推荐：() => { ... } 的形式有时无法推断 e 的类型
const onClickBad = (e) => { /* ... */ }; // e 可能变成 any

// 推荐：在外部定义处理器并显式标注类型
const onClickGood = (e: React.MouseEvent<HTMLButtonElement>) => { /* ... */ };
```

**3. 忘记 `key` prop 会出现警告**

```tsx
// 不推荐：没有 key 在浏览器中会出现警告
{items.map((item) => <li>{item}</li>)}

// 推荐：添加唯一的 key
{items.map((item, i) => <li key={i}>{item}</li>)}  // index 是最后手段
{items.map((item) => <li key={item.id}>{item.name}</li>)}  // ID 最理想
```

**4. SSR 中事件不会触发**

本仓库的运行代码使用 `renderToStaticMarkup`（服务端渲染），因此 `onClick` 等事件不会执行。目的仅是确认「类型检查和 HTML 输出」。实际的浏览器行为请在使用 ReactDOM.createRoot 的应用中确认。

---

## ✍️ 练习题

**题目 1：** 创建满足以下要求的 `Badge` 组件。
- `label: string`（必填）
- `color?: "red" | "green" | "blue"`（可选，默认 `"green"`）
- `children?: React.ReactNode`（可选）
- 用 `renderToStaticMarkup` 输出 HTML 字符串并确认

<details><summary>参考答案</summary>

```tsx
import { renderToStaticMarkup } from "react-dom/server";

type BadgeProps = {
  label: string;
  color?: "red" | "green" | "blue";
  children?: React.ReactNode;
};

function Badge({ label, color = "green", children }: BadgeProps) {
  return (
    <span className={`badge badge-${color}`}>
      {label}
      {children && <span className="sub">{children}</span>}
    </span>
  );
}

console.log(renderToStaticMarkup(<Badge label="NEW" />));
// → <span class="badge badge-green">NEW</span>

console.log(renderToStaticMarkup(<Badge label="SALE" color="red">50%OFF</Badge>));
// → <span class="badge badge-red">SALE<span class="sub">50%OFF</span></span>
```

</details>

---

**题目 2：** 在下面的 `TodoAction` 类型中添加 `{ type: "clear" }`（全部删除），并完成 `todoReducer`。直接调用 reducer 确认运行结果。

```tsx
type Todo = { id: number; text: string; done: boolean };
type TodoState = { todos: Todo[] };

type TodoAction =
  | { type: "add"; text: string }
  | { type: "toggle"; id: number };
  // 在此添加 { type: "clear" }

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case "add":
      return {
        todos: [...state.todos, { id: Date.now(), text: action.text, done: false }],
      };
    case "toggle":
      return {
        todos: state.todos.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t
        ),
      };
    // 在此添加 case "clear"
  }
}
```

<details><summary>参考答案</summary>

```tsx
type Todo = { id: number; text: string; done: boolean };
type TodoState = { todos: Todo[] };

type TodoAction =
  | { type: "add"; text: string }
  | { type: "toggle"; id: number }
  | { type: "clear" };   // ← 添加

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case "add":
      return {
        todos: [...state.todos, { id: Date.now(), text: action.text, done: false }],
      };
    case "toggle":
      return {
        todos: state.todos.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t
        ),
      };
    case "clear":        // ← 添加
      return { todos: [] };
  }
}

// 运行确认：reducer 是纯函数，可以直接调用
const s0: TodoState = { todos: [] };
const s1 = todoReducer(s0, { type: "add", text: "学习 TypeScript" });
console.log("add:", s1.todos.length);     // 1

const s2 = todoReducer(s1, { type: "toggle", id: s1.todos[0].id });
console.log("toggle done:", s2.todos[0].done);  // true

const s3 = todoReducer(s2, { type: "clear" });
console.log("clear:", s3.todos.length);   // 0
```

</details>

---

**题目 3：** 创建 `Table<T>` 泛型组件。
- `columns: { key: keyof T; header: string }[]` ― 显示列的定义
- `rows: T[]` ― 数据
- 用 `<thead>/<tr>/<th>` 渲染表头行，用 `<tbody>/<tr>/<td>` 渲染数据行
- 用 `renderToStaticMarkup` 确认表格 HTML

<details><summary>参考答案</summary>

```tsx
import { renderToStaticMarkup } from "react-dom/server";

type ColumnDef<T> = { key: keyof T; header: string };
type TableProps<T> = { columns: ColumnDef<T>[]; rows: T[] };

function Table<T extends object>({ columns, rows }: TableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={String(col.key)}>{String(row[col.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type Product = { id: number; name: string; price: number };

const products: Product[] = [
  { id: 1, name: "苹果", price: 150 },
  { id: 2, name: "香蕉", price: 80 },
];

console.log(
  renderToStaticMarkup(
    <Table
      columns={[
        { key: "id", header: "ID" },
        { key: "name", header: "商品名称" },
        { key: "price", header: "价格" },
      ]}
      rows={products}
    />
  )
);
// → <table><thead>...</thead><tbody>...</tbody></table>
```

</details>

---

## 📌 总结

- **props 的类型定义**：用 `type Props = { ... }` 明确标注必填 / 可选（`?`）/ `children`
- **useState 的类型**：从初始值推断生效。初始为 `null` 等不确定时，使用显式泛型
- **函数式更新**：用 `setState(prev => ...)` 安全地使用前一个值
- **事件类型**：`React.MouseEvent<HTMLButtonElement>` / `React.ChangeEvent<HTMLInputElement>` 等，通过泛型指定元素类型
- **useReducer + 可辨识联合**：`type Action = ... | ...` 让 switch 分支类型安全
- **泛型组件**：`function List<T>` 同时兼顾可复用性与类型安全。注意 `<T,>` 末尾逗号
- **本仓库中**使用 `renderToStaticMarkup` 以 HTML 字符串形式确认（实际应在浏览器中使用 `createRoot`）

---

## ▶ 运行

```sh
npm run ch16
# 或
npx tsx src/16_react_typescript.tsx
```
