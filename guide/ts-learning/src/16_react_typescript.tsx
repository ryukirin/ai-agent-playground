// ============================================================
// 第16章 React + TypeScript
// npm run ch16  (= tsx src/16_react_typescript.tsx)
//
// ブラウザなしで「実行して結果が見える」ようにするため、
// renderToStaticMarkup でコンポーネントを HTML 文字列に変換して
// console.log する。本来は ReactDOM.render / createRoot でブラウザに
// マウントするが、ここでは Node 上で動作確認できる形を優先している。
// ============================================================

import { renderToStaticMarkup } from "react-dom/server";
import React, { useState, useReducer } from "react";

// ─────────────────────────────────────────────────────────
// 1. 型付き props のコンポーネント
//    type Props = { ... } で必須/任意/デフォルト値/children を定義する
// ─────────────────────────────────────────────────────────

// Props 型: name は必須, count は任意(? をつける), children は React.ReactNode
type GreetProps = {
  name: string;            // 必須
  count?: number;          // 任意(省略すると undefined)
  children?: React.ReactNode; // 子要素(テキスト・JSX など何でも OK)
};

// デフォルト値は分割代入でつける({ count = 0 })
function Greet({ name, count = 0, children }: GreetProps) {
  return (
    <div className="greet">
      <span>
        {name}: {count}回
      </span>
      {/* children が渡されていれば表示する */}
      {children && <p className="note">{children}</p>}
    </div>
  );
}

console.log("=== 1. 型付き Props ===");

// count なし → デフォルト 0 が使われる
console.log(renderToStaticMarkup(<Greet name="Alice" />));
// → <div class="greet"><span>Alice: 0回</span></div>

// count あり + children あり
console.log(
  renderToStaticMarkup(
    <Greet name="Bob" count={3}>
      TypeScript 学習中!
    </Greet>
  )
);
// → <div class="greet"><span>Bob: 3回</span><p class="note">TypeScript 学習中!</p></div>

// ─────────────────────────────────────────────────────────
// 2. useState の型
//    推論と明示ジェネリクスの両方、関数更新も確認する
// ─────────────────────────────────────────────────────────

// useState(0) → number と推論される (明示不要)
// useState<string | null>(null) → 明示ジェネリクスが必要
//   (null だけを渡すと never 型に推論されてしまうため)

type CounterProps = { initial?: number };

function Counter({ initial = 0 }: CounterProps) {
  // 推論: 初期値 initial(number) から T = number が決まる
  const [count, setCount] = useState(initial);

  // 明示ジェネリクス: null を初期値にするときは型を明示する
  const [label, setLabel] = useState<string | null>(null);

  // 関数更新: 前の state を受け取って次の値を返す形式
  // SSR では onClick は発火しないが、型の付け方を示すためコメント付きで定義
  const increment = () => setCount((prev) => prev + 1); // prev: number
  const resetLabel = () => setLabel(null);

  // 未使用警告を抑制するために参照だけしておく(実際のアプリでは onClick 等で使う)
  void increment;
  void resetLabel;

  return (
    <div className="counter">
      <span data-count={count}>{count}</span>
      {label && <em>{label}</em>}
    </div>
  );
}

// 型エラーの例(コンパイル時チェックのみ、実行はしない):
//   const [count, setCount] = useState(0);
//   setCount("hello"); // → TS2345: string は number に代入できない

console.log("\n=== 2. useState の型 ===");
// 初期値 0 で renderToStaticMarkup → カウントが表示される
console.log(renderToStaticMarkup(<Counter />));
// → <div class="counter"><span data-count="0">0</span></div>

console.log(renderToStaticMarkup(<Counter initial={5} />));
// → <div class="counter"><span data-count="5">5</span></div>

// ─────────────────────────────────────────────────────────
// 3. イベントハンドラの型
//    React.MouseEvent<HTMLButtonElement>
//    React.ChangeEvent<HTMLInputElement>
//    SSR ではイベントは発火しない。型の付け方を示すことが目的。
// ─────────────────────────────────────────────────────────

// onClick のハンドラ: React.MouseEvent<HTMLButtonElement>
// クリックした要素の情報(currentTarget など)を型安全に参照できる
function handleClick(e: React.MouseEvent<HTMLButtonElement>): void {
  // currentTarget は HTMLButtonElement 型 → disabled が参照できる
  console.log("クリックされたボタンの disabled:", e.currentTarget.disabled);
}

// onChange のハンドラ: React.ChangeEvent<HTMLInputElement>
// e.target.value で入力値を取得できる(型は string)
function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
  const value: string = e.target.value; // value は string 型確定
  console.log("入力値:", value);
}

// イベント型付きのフォームコンポーネント
// SSR では onClick/onChange は発火しない。あくまで型の付け方の例示。
function SearchForm() {
  return (
    <form>
      {/* onClick に React.MouseEvent<HTMLButtonElement> を受け取るハンドラを渡す */}
      <button type="button" onClick={handleClick}>
        検索
      </button>
      {/* onChange に React.ChangeEvent<HTMLInputElement> を受け取るハンドラを渡す */}
      <input type="text" onChange={handleChange} placeholder="キーワード" />
    </form>
  );
}

console.log("\n=== 3. イベントハンドラの型 ===");
console.log(renderToStaticMarkup(<SearchForm />));
// SSR なのでイベントは HTML 属性に出力されないが、
// コンポーネントの型チェックはコンパイル時に正常に行われる
// → <form><button type="button">検索</button><input type="text" placeholder="キーワード"/></form>

// ─────────────────────────────────────────────────────────
// 4. useReducer + 判別可能ユニオン Action
//    第7章「判別可能ユニオン」の知識を React state 管理に応用する
// ─────────────────────────────────────────────────────────

// Action 型: 判別可能ユニオン(type フィールドで種別を判別)
type CountAction =
  | { type: "inc" }                 // カウントアップ
  | { type: "dec" }                 // カウントダウン
  | { type: "set"; value: number }; // 指定値にセット

type CountState = { count: number };

// reducer は純粋関数なので、単体で呼び出して結果を確認できる
function countReducer(state: CountState, action: CountAction): CountState {
  switch (action.type) {
    case "inc":
      return { count: state.count + 1 };
    case "dec":
      return { count: state.count - 1 };
    case "set":
      // action.type が "set" に確定 → action.value が型安全に使える
      return { count: action.value };
  }
}

// reducer を使う React コンポーネント
// (SSR では dispatch のイベントは発火しないが、初期状態が描画される)
function CounterWithReducer() {
  const [state, dispatch] = useReducer(countReducer, { count: 0 });

  // dispatch の型: 上の Action 型に合わないオブジェクトは型エラーになる
  const onInc = () => dispatch({ type: "inc" });
  const onDec = () => dispatch({ type: "dec" });
  const onSet = () => dispatch({ type: "set", value: 10 });

  void onInc;
  void onDec;
  void onSet;

  return <div className="reducer-counter">count = {state.count}</div>;
}

console.log("\n=== 4. useReducer + 判別可能ユニオン ===");

// reducer は純粋関数なので直接呼んで動作確認できる
const s0: CountState = { count: 0 };
const s1 = countReducer(s0, { type: "inc" });
console.log("inc:", s1); // { count: 1 }

const s2 = countReducer(s1, { type: "inc" });
console.log("inc:", s2); // { count: 2 }

const s3 = countReducer(s2, { type: "dec" });
console.log("dec:", s3); // { count: 1 }

const s4 = countReducer(s3, { type: "set", value: 42 });
console.log("set 42:", s4); // { count: 42 }

// SSR での描画確認(初期値 count = 0 が出力される)
console.log(renderToStaticMarkup(<CounterWithReducer />));
// → <div class="reducer-counter">count = 0</div>

// 型エラーの例: 定義にない type を渡すとコンパイルエラー
// @ts-expect-error "reset" は Action 型に存在しない
countReducer(s0, { type: "reset" });

// ─────────────────────────────────────────────────────────
// 5. ジェネリックコンポーネント List<T>
//    render prop パターン: 表示方法を呼び出し側が決める
// ─────────────────────────────────────────────────────────

// T は任意の型。items: T[] と render: (item: T) => React.ReactNode を受け取る
// render prop により、T が何であっても型安全に各要素を描画できる
type ListProps<T> = {
  items: T[];
  render: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
};

// ジェネリックコンポーネント: <T,> の末尾カンマは TSX パーサが
// <T> をタグと誤解しないようにするための慣用的な書き方
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

console.log("\n=== 5. ジェネリックコンポーネント List<T> ===");

// number[] を描画: T = number に推論される
console.log(
  renderToStaticMarkup(
    <List
      items={[10, 20, 30]}
      render={(n) => <strong>{n}</strong>}
    />
  )
);
// → <ul><li><strong>10</strong></li><li><strong>20</strong></li><li><strong>30</strong></li></ul>

// string[] を描画: T = string に推論される(同じ List を再利用)
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

// オブジェクト配列にも使える: T = { id: number; label: string }
type MenuItem = { id: number; label: string };
const menu: MenuItem[] = [
  { id: 1, label: "ホーム" },
  { id: 2, label: "設定" },
  { id: 3, label: "ログアウト" },
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
// → <ul><li><a href="#1">ホーム</a></li>...</ul>
