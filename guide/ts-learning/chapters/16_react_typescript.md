# 第16章 React + TypeScript

> 関数コンポーネントの props 型定義から始め、`useState` / `useReducer` / ジェネリックコンポーネントまで、実務でよく使う React × TypeScript のパターンを一気に習得する。

## 🎯 この章のゴール

- `type Props = { ... }` で必須・任意・children を型安全に定義できる
- `useState` の型推論と明示ジェネリクスを使い分けられる
- `React.MouseEvent<HTMLButtonElement>` などのイベント型を付けられる
- 判別可能ユニオン Action + `useReducer` で状態管理を型安全に書ける
- `List<T>` のようなジェネリックコンポーネントを設計できる

---

## 1. 関数コンポーネントと props の型付け

### type Props を定義する

React の関数コンポーネントには `type Props = { ... }` を使って引数の型を明示します。

```tsx
type GreetProps = {
  name: string;              // 必須
  count?: number;            // 任意(? をつける)
  children?: React.ReactNode; // 子要素(何でも入る万能型)
};

// 分割代入でデフォルト値を指定する
function Greet({ name, count = 0, children }: GreetProps) {
  return (
    <div>
      <span>{name}: {count}回</span>
      {children && <p>{children}</p>}
    </div>
  );
}
```

```tsx
// 使い方
<Greet name="Alice" />                        // count は省略可(= 0)
<Greet name="Bob" count={3}>学習中!</Greet>   // children あり
```

**ポイント:**

| 書き方 | 意味 |
|---|---|
| `name: string` | 必須。省略するとコンパイルエラー |
| `count?: number` | 任意。省略すると `undefined` |
| `{ count = 0 }` | 省略時のデフォルト値を分割代入で指定 |
| `children?: React.ReactNode` | テキスト・JSX・null など何でも受け取れる型 |

### `React.FC<Props>` ではなく型注釈を直接書く

昔は `const Greet: React.FC<GreetProps>` と書くスタイルが多かったですが、現在は上のように **直接引数に型を付ける** 方法が一般的です(`React.FC` は `children` を自動で含めてくれたり含めなかったりと挙動が変わった経緯があるため)。

---

## 2. useState の型

### 推論と明示ジェネリクス

`useState` に渡した初期値から TypeScript が型を推論してくれます。

```tsx
// 推論: 初期値が number なので T = number と決まる
const [count, setCount] = useState(0);        // count: number

// 推論: 初期値が string なので T = string と決まる
const [text, setText] = useState("");         // text: string

// 明示が必要: null だけ渡すと never に推論されてしまう
const [user, setUser] = useState<string | null>(null);  // 明示必須
```

初期値だけでは型が確定しない場合(最初は `null` だが後で値が入る、など)は明示ジェネリクスを使います。

### 関数更新

前の state を使って次の値を計算したいときは **関数更新** を使います。非同期処理などで前の値に依存するケースに特に有効です。

```tsx
const [count, setCount] = useState(0);

// 関数更新: prev は TypeScript が number と推論してくれる
const increment = () => setCount((prev) => prev + 1);
const addFive   = () => setCount((prev) => prev + 5);
```

```tsx
// 型エラーの例
// @ts-expect-error setCount に string は渡せない
setCount("hello");
```

---

## 3. イベントの型

React のイベントハンドラには専用の型があります。`on` で始まる prop に渡す関数には、対応するイベント型を付けましょう。

### よく使うイベント型

| イベント属性 | 型 | 主な用途 |
|---|---|---|
| `onClick` | `React.MouseEvent<T>` | ボタン・リンクのクリック |
| `onChange` | `React.ChangeEvent<T>` | input / select の値変更 |
| `onSubmit` | `React.FormEvent<HTMLFormElement>` | フォーム送信 |
| `onKeyDown` | `React.KeyboardEvent<T>` | キーボード操作 |

`T` には要素の型(`HTMLButtonElement` / `HTMLInputElement` など)を入れます。

```tsx
// クリックイベント: currentTarget は HTMLButtonElement 型に確定
function handleClick(e: React.MouseEvent<HTMLButtonElement>): void {
  console.log("disabled?", e.currentTarget.disabled);
}

// 変更イベント: e.target.value は string 型に確定
function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
  const value: string = e.target.value;
  console.log("入力値:", value);
}

function SearchForm() {
  return (
    <form>
      <button type="button" onClick={handleClick}>検索</button>
      <input type="text" onChange={handleChange} />
    </form>
  );
}
```

> **注意:** このリポジトリの実行形式(`renderToStaticMarkup` を使ったサーバーサイドレンダリング)では、`onClick` や `onChange` などのイベントは**発火しません**。イベントはブラウザの DOM でのみ動きます。ここでは「型の付け方を見る」ことが目的です。

---

## 4. useReducer + 判別可能ユニオン Action

第7章で学んだ**判別可能ユニオン**は、React の `useReducer` と組み合わせると強力です。複数の操作パターンを type フィールドで区別することで、reducer 内の switch 文がそれぞれの型を自動的に確定してくれます。

```tsx
// Action 型: type フィールドが判別子になる
type CountAction =
  | { type: "inc" }                  // type だけ
  | { type: "dec" }
  | { type: "set"; value: number };  // type + ペイロード

type CountState = { count: number };

// reducer: 純粋関数なのでテストや単体実行がしやすい
function countReducer(state: CountState, action: CountAction): CountState {
  switch (action.type) {
    case "inc": return { count: state.count + 1 };
    case "dec": return { count: state.count - 1 };
    case "set": return { count: action.value }; // "set" 確定 → value が使える
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
      <button onClick={() => dispatch({ type: "set", value: 0 })}>リセット</button>
    </div>
  );
}
```

```tsx
// 型エラーの例: 定義にない type はコンパイルエラー
// @ts-expect-error "reset" は Action 型に存在しない
dispatch({ type: "reset" });
```

**reducer が純粋関数であることの利点:** ブラウザなしでも動作確認できます。

```tsx
const s0 = { count: 0 };
console.log(countReducer(s0, { type: "inc" }));  // { count: 1 }
console.log(countReducer(s0, { type: "set", value: 42 })); // { count: 42 }
```

---

## 5. ジェネリックコンポーネント

第8章のジェネリクスを React コンポーネントに応用できます。**render prop パターン**と組み合わせると、「どんな型のリストでも使える」汎用コンポーネントを作れます。

```tsx
type ListProps<T> = {
  items: T[];
  render: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
};

// <T,> の末尾カンマ: TSX パーサが <T> をタグと誤解しないための慣用記法
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
// number[] で使う: T = number に推論される
<List
  items={[10, 20, 30]}
  render={(n) => <strong>{n}</strong>}
/>

// string[] で使う: T = string に推論される(同じコンポーネントを再利用)
<List
  items={["TypeScript", "React", "Node.js"]}
  keyExtractor={(item) => item}
  render={(item, i) => <span>{i + 1}. {item}</span>}
/>

// オブジェクト配列でも OK
type MenuItem = { id: number; label: string };
<List<MenuItem>
  items={menu}
  keyExtractor={(item) => String(item.id)}
  render={(item) => <a href={`#${item.id}`}>{item.label}</a>}
/>
```

---

## 6. このリポジトリでの動かし方

通常 React はブラウザ上で `ReactDOM.createRoot(el).render(<App />)` によりレンダリングします。このリポジトリでは **ブラウザなしで実行結果を確認** するために、`react-dom/server` の `renderToStaticMarkup` を使っています。

```tsx
import { renderToStaticMarkup } from "react-dom/server";

// コンポーネントを HTML 文字列として出力
const html = renderToStaticMarkup(<Greet name="Alice" count={3} />);
console.log(html);
// → <div><span>Alice: 3回</span></div>
```

**`renderToStaticMarkup` とは:** サーバーサイドレンダリング(SSR)用のユーティリティで、コンポーネントを静的な HTML 文字列に変換します。React のデータ属性(`data-reactroot` など)が付かないシンプルな HTML が得られます。イベントはクライアント側でのみ動作するため、ここでは発火しません。

本番の React アプリでは `createRoot` を使ってブラウザにマウントし、useState のカウントアップやフォームの入力など双方向のインタラクションが動きます。

---

## ⚠️ よくあるつまずき

**1. `import React from "react"` は不要(React 17+ / react-jsx ランタイム)**

```tsx
// NG: 古い書き方(React 16 以前は必要だった)
import React from "react";

// OK: tsconfig に "jsx": "react-jsx" があれば import 不要
function Hello() {
  return <div>Hello</div>;  // React は自動でインポートされる
}
```

ただし `React.ReactNode` / `React.MouseEvent` などの型を参照する場合は `import React from "react"` または `import type { ReactNode } from "react"` が必要です。

**2. イベントハンドラを arrow function にするか関数定義にするか**

`onClick={handleClick}` と `onClick={() => handleClick()}` は動作は同じですが、イベントオブジェクトを受け取るかどうかで型が変わります。

```tsx
// NG: () => { ... } の形だと e の型を明示しないと推論されない場合がある
const onClickBad = (e) => { /* ... */ }; // e: any になりうる

// OK: ハンドラを外で定義して型を明示する
const onClickGood = (e: React.MouseEvent<HTMLButtonElement>) => { /* ... */ };
```

**3. `key` prop を忘れると警告が出る**

```tsx
// NG: key がないとブラウザで警告
{items.map((item) => <li>{item}</li>)}

// OK: 一意な key を付ける
{items.map((item, i) => <li key={i}>{item}</li>)}  // インデックスは最終手段
{items.map((item) => <li key={item.id}>{item.name}</li>)}  // ID が理想的
```

**4. SSR ではイベントは発火しない**

このリポジトリの実行コードは `renderToStaticMarkup`(サーバーサイドレンダリング)を使っているため、`onClick` などのイベントは実行されません。あくまで「型チェックと HTML 出力」の確認が目的です。実際のブラウザ動作は ReactDOM.createRoot を使ったアプリで確認してください。

---

## ✍️ 練習問題

**問題 1:** 次の要件を満たす `Badge` コンポーネントを作ってください。
- `label: string`(必須)
- `color?: "red" | "green" | "blue"`(任意、デフォルト `"green"`)
- `children?: React.ReactNode`(任意)
- `renderToStaticMarkup` で HTML 文字列を出力して確認する

<details><summary>解答例</summary>

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

**問題 2:** 下記の `TodoAction` 型に `{ type: "clear" }`(全削除)を追加し、`todoReducer` を完成させてください。reducer を直接呼んで動作を確認してください。

```tsx
type Todo = { id: number; text: string; done: boolean };
type TodoState = { todos: Todo[] };

type TodoAction =
  | { type: "add"; text: string }
  | { type: "toggle"; id: number };
  // ここに { type: "clear" } を追加する

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
    // case "clear" を追加する
  }
}
```

<details><summary>解答例</summary>

```tsx
type Todo = { id: number; text: string; done: boolean };
type TodoState = { todos: Todo[] };

type TodoAction =
  | { type: "add"; text: string }
  | { type: "toggle"; id: number }
  | { type: "clear" };   // ← 追加

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
    case "clear":        // ← 追加
      return { todos: [] };
  }
}

// 動作確認: reducer は純粋関数なので直接呼べる
const s0: TodoState = { todos: [] };
const s1 = todoReducer(s0, { type: "add", text: "TypeScript を学ぶ" });
console.log("add:", s1.todos.length);     // 1

const s2 = todoReducer(s1, { type: "toggle", id: s1.todos[0].id });
console.log("toggle done:", s2.todos[0].done);  // true

const s3 = todoReducer(s2, { type: "clear" });
console.log("clear:", s3.todos.length);   // 0
```

</details>

---

**問題 3:** `Table<T>` ジェネリックコンポーネントを作ってください。
- `columns: { key: keyof T; header: string }[]` ― 表示する列の定義
- `rows: T[]` ― データ
- `<thead>/<tr>/<th>` でヘッダー行、`<tbody>/<tr>/<td>` でデータ行を描画する
- `renderToStaticMarkup` でテーブル HTML を確認する

<details><summary>解答例</summary>

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
  { id: 1, name: "りんご", price: 150 },
  { id: 2, name: "バナナ", price: 80 },
];

console.log(
  renderToStaticMarkup(
    <Table
      columns={[
        { key: "id", header: "ID" },
        { key: "name", header: "商品名" },
        { key: "price", header: "価格" },
      ]}
      rows={products}
    />
  )
);
// → <table><thead>...</thead><tbody>...</tbody></table>
```

</details>

---

## 📌 まとめ

- **props の型定義**: `type Props = { ... }` で必須 / 任意(`?`) / `children` を明示
- **useState の型**: 初期値から推論が効く。`null` 開始など曖昧なときは明示ジェネリクス
- **関数更新**: `setState(prev => ...)` で前の値を安全に使える
- **イベント型**: `React.MouseEvent<HTMLButtonElement>` / `React.ChangeEvent<HTMLInputElement>` など要素型をジェネリクスで指定
- **useReducer + 判別可能ユニオン**: `type Action = ... | ...` で switch 分岐が型安全になる
- **ジェネリックコンポーネント**: `function List<T>` で再利用性と型安全を両立。`<T,>` の末尾カンマに注意
- **このリポジトリでは** `renderToStaticMarkup` で HTML 文字列として確認(本来はブラウザで `createRoot` を使う)

---

## ▶ 動かす

```sh
npm run ch16
# または
npx tsx src/16_react_typescript.tsx
```
