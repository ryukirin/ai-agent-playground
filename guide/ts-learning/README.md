# TypeScript 学習ガイド(JS 経験者向け・章別)

「JS は触ったことがある(でもだいぶ忘れた)」人が、**読みながら手を動かして** TypeScript を身につけるためのガイドです。
各章は次の 2 点セットになっています。

- **解説**: `chapters/NN_*.md` … 概念の説明・コード例・よくある間違い・練習問題
- **実行できるコード**: `src/NN_*.ts` … その章の例を実際に動かせる `.ts` ファイル

> Colab のように「読む → すぐ実行して結果を見る」を繰り返すのが、いちばん定着します。

---

## 1. 必要なもの

- **Node.js**(v18 以上。確認: `node --version`)
- エディタは **VS Code** を強く推奨(型エラーがその場で赤線で見える)

このマシンには Node.js v24 が入っているのを確認済みです。そのまま進めて OK です。

---

## 2. セットアップ(最初に 1 回だけ)

このフォルダ(`ts-learning/`)でターミナルを開き、次を実行します。

```bash
npm install
```

これで TypeScript 本体・`tsx`(`.ts` を直接実行するツール)・Node の型定義が入ります。

---

## 3. 使い方

### コードを実行する

`.ts` を**ビルドせずにそのまま実行**できます。

```bash
# 方法 A: npm スクリプト(章番号で実行)
npm run ch03

# 方法 B: ファイルを直接指定
npx tsx src/03_basic_types.ts
```

自分で書き換えて再実行 → 結果がどう変わるかを見るのが学習の本体です。どんどん壊してください。

### 型エラーをチェックする(コンパイルは通る?)

```bash
npm run check
```

`tsc --noEmit` が走り、全 `.ts` の型エラーを一覧表示します。**「実行は通るのにエラーになる」例**を体験するために使います。

### オンラインでも試せる

インストールせずに試したいときは [TypeScript Playground](https://www.typescriptlang.org/play) にコードを貼り付ければ、型エラーとコンパイル結果がブラウザで見られます。

---

## 4. 章一覧(この順番で進めるのがおすすめ)

| # | 章 | テーマ | 実行 |
|---|---|---|---|
| 01 | [はじめの一歩](chapters/01_first_step.md) | TS とは何か / なぜ型か / 最初のコード | `npm run ch01` |
| 02 | [JS の復習](chapters/02_js_refresher.md) | let/const・関数・配列操作・分割代入・非同期の総ざらい | `npm run ch02` |
| 03 | [基本の型](chapters/03_basic_types.md) | string/number/boolean・型推論・any/unknown/never | `npm run ch03` |
| 04 | [関数の型](chapters/04_functions.md) | 引数・戻り値・オプショナル・デフォルト値・関数型 | `npm run ch04` |
| 05 | [オブジェクトと interface/type](chapters/05_objects_interfaces.md) | オブジェクト型・interface vs type・readonly・? | `npm run ch05` |
| 06 | [配列・タプル・enum](chapters/06_arrays_tuples_enums.md) | 配列型・タプル・enum とリテラルユニオン | `npm run ch06` |
| 07 | [ユニオン型と型の絞り込み](chapters/07_unions_narrowing.md) | union/交差型・リテラル型・narrowing・型ガード | `npm run ch07` |
| 08 | [ジェネリクス](chapters/08_generics.md) | 型を引数にする・制約 extends・実用パターン | `npm run ch08` |
| 09 | [ユーティリティ型](chapters/09_utility_types.md) | Partial/Pick/Omit/Record/ReturnType・keyof/typeof | `npm run ch09` |
| 10 | [クラス](chapters/10_classes.md) | class・アクセサ修飾子・implements・継承 | `npm run ch10` |
| 11 | [非同期処理](chapters/11_async.md) | Promise<T>・async/await の型・エラー処理 | `npm run ch11` |
| 12 | [モジュールと実践](chapters/12_modules_and_practice.md) | import/export・型定義ファイル・ミニアプリ | `npm run ch12` |
| 🏅 | [腕試しテスト](chapters/13_skill_test.md) | 全章横断・自己採点式の総合テスト(26 チェック) | `npm run test` |
| 14 | [AIエージェント編](chapters/14_ai_agent.md) | Vercel AI SDK + Zod でツール呼び出しエージェント(応用) | `npm run ch14` |
| 15 | [ストリーミング & 構造化出力](chapters/15_streaming_structured.md) | streamText / generateObject + Zod(応用) | `npm run ch15` |
| 16 | [React + TypeScript](chapters/16_react_typescript.md) | props/useState/useReducer/イベントの型(応用) | `npm run ch16` |

### 🏅 腕試しテスト(全章を終えたら)

`src/13_skill_test.ts` の `未実装` を埋めて `npm run test` を実行すると、自動採点で ✅ / ❌ と点数が出ます(最初は 0 / 26)。
各問は出題章つき。解説・解答例・おまけの「型設計チャレンジ」は [chapters/13_skill_test.md](chapters/13_skill_test.md) にあります。

### 🤖 AIエージェント編(応用・第14〜15章)

学んだ型・ジェネリクス・判別可能ユニオン・Zod が AI 開発でそのまま効きます。第14章(ツール呼び出しエージェント)・第15章(ストリーミング & 構造化出力)とも **APIキー無しでもオフラインのモックで動作**(`npm install` 済みなら追加作業不要)。本物の Claude で動かすなら PowerShell で `$env:ANTHROPIC_API_KEY = "sk-ant-..."` を設定してから `npm run ch14` / `npm run ch15`。

### ⚛️ React + TypeScript(応用・第16章)

`npm run ch16` はブラウザ無しで動くよう、コンポーネントを `renderToStaticMarkup` で HTML 文字列にして出力します(本来はブラウザで描画)。props・useState・useReducer・イベントの型付けを学べます。詳細は [chapters/16_react_typescript.md](chapters/16_react_typescript.md)。

---

## 5. 進め方のコツ

1. **`strict: true` のまま進める**(この設定にしてあります)。緩い設定で覚えると後でつまずきます。
2. **`any` は使わない縛り**で。困ったら `unknown` + 型の絞り込みで対処する練習を。
3. **エラーをわざと出す**。型注釈を間違えて `npm run check` し、TS の指摘を読むのが最短ルート。
4. **各章末の練習問題**を必ず手で解く。`src/` のファイルに追記して `npx tsx` で確認。

---

## 6. フォルダ構成

```
ts-learning/
├── README.md            ← 今ここ
├── package.json         ← npm スクリプト / 依存パッケージ
├── tsconfig.json        ← TypeScript の設定(strict 有効)
├── chapters/            ← 各章の解説(Markdown)
│   ├── 01_first_step.md
│   └── ...
└── src/                 ← 各章の実行できるコード(.ts)
    ├── 01_first_step.ts
    └── ...
```

困ったら `chapters/01_first_step.md` から順に読んでください。それでは、よい TypeScript ライフを!
