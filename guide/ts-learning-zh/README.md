# TypeScript 学习指南（面向有 JS 基础的开发者·按章节学习）

适合「接触过 JS（但已经忘得差不多了）」的人，通过**边读边动手**来掌握 TypeScript 的学习指南。
每一章都包含以下两部分：

- **讲解**：`chapters/NN_*.md` … 概念说明·代码示例·常见错误·练习题
- **可运行的代码**：`src/NN_*.ts` … 可以直接运行该章示例的 `.ts` 文件

> 像使用 Colab 一样，反复「阅读 → 立即运行查看结果」是最有效的学习方式。

---

## 1. 前置条件

- **Node.js**（v18 及以上。确认方法：`node --version`）
- 编辑器强烈推荐使用 **VS Code**（可以实时看到类型错误的红色波浪线）

已确认本机安装了 Node.js v24，可以直接开始。

---

## 2. 初始设置（只需执行一次）

在本文件夹（`ts-learning/`）中打开终端，执行以下命令：

```bash
npm install
```

这会安装 TypeScript 本体、`tsx`（直接运行 `.ts` 文件的工具）以及 Node 的类型定义。

---

## 3. 使用方法

### 运行代码

可以**不编译，直接运行** `.ts` 文件。

```bash
# 方式 A：使用 npm 脚本（按章节编号运行）
npm run ch03

# 方式 B：直接指定文件
npx tsx src/03_basic_types.ts
```

自行修改后重新运行 → 观察结果如何变化，这才是学习的核心。请尽情「破坏」它。

### 检查类型错误（能通过编译吗？）

```bash
npm run check
```

运行 `tsc --noEmit`，列出所有 `.ts` 文件的类型错误。用于体验**「运行没问题但有类型错误」**的例子。

### 也可以在线体验

不想安装的话，可以把代码粘贴到 [TypeScript Playground](https://www.typescriptlang.org/play)，在浏览器中查看类型错误和编译结果。

---

## 4. 章节列表（建议按此顺序学习）

| # | 章节 | 主题 | 运行 |
|---|---|---|---|
| 01 | [迈出第一步](chapters/01_first_step.md) | TS 是什么 / 为什么需要类型 / 第一段代码 | `npm run ch01` |
| 02 | [复习 JS](chapters/02_js_refresher.md) | let/const·函数·数组操作·解构赋值·异步全面回顾 | `npm run ch02` |
| 03 | [基础类型](chapters/03_basic_types.md) | string/number/boolean·类型推断·any/unknown/never | `npm run ch03` |
| 04 | [函数的类型](chapters/04_functions.md) | 参数·返回值·可选参数·默认值·函数类型 | `npm run ch04` |
| 05 | [对象与 interface/type](chapters/05_objects_interfaces.md) | 对象类型·interface vs type·readonly·? | `npm run ch05` |
| 06 | [数组·元组·enum](chapters/06_arrays_tuples_enums.md) | 数组类型·元组·enum 与字面量联合类型 | `npm run ch06` |
| 07 | [联合类型与类型收窄](chapters/07_unions_narrowing.md) | union/交叉类型·字面量类型·narrowing·类型守卫 | `npm run ch07` |
| 08 | [泛型](chapters/08_generics.md) | 将类型作为参数·约束 extends·实用模式 | `npm run ch08` |
| 09 | [工具类型](chapters/09_utility_types.md) | Partial/Pick/Omit/Record/ReturnType·keyof/typeof | `npm run ch09` |
| 10 | [类](chapters/10_classes.md) | class·访问修饰符·implements·继承 | `npm run ch10` |
| 11 | [异步处理](chapters/11_async.md) | Promise<T>·async/await 的类型·错误处理 | `npm run ch11` |
| 12 | [模块与实践](chapters/12_modules_and_practice.md) | import/export·类型定义文件·迷你应用 | `npm run ch12` |
| 🏅 | [实战测验](chapters/13_skill_test.md) | 跨越全章·自评式综合测试（26 项检查） | `npm run test` |
| 14 | [AI 智能体篇](chapters/14_ai_agent.md) | Vercel AI SDK + Zod 实现工具调用智能体（进阶） | `npm run ch14` |
| 15 | [流式输出 & 结构化输出](chapters/15_streaming_structured.md) | streamText / generateObject + Zod（进阶） | `npm run ch15` |
| 16 | [React + TypeScript](chapters/16_react_typescript.md) | props/useState/useReducer/事件的类型（进阶） | `npm run ch16` |

### 🏅 实战测验（完成全章后）

在 `src/13_skill_test.ts` 中填写 `未实装` 部分，然后运行 `npm run test`，即可自动评分并显示 ✅ / ❌ 和得分（初始为 0 / 26）。
每道题都标注了出题章节。讲解·参考答案·附加「类型设计挑战」请参阅 [chapters/13_skill_test.md](chapters/13_skill_test.md)。

### 🤖 AI 智能体篇（进阶·第 14〜15 章）

所学的类型·泛型·可辨识联合·Zod 在 AI 开发中同样适用。第 14 章（工具调用智能体）·第 15 章（流式输出 & 结构化输出）均**无需 API 密钥，可通过离线模拟运行**（已执行 `npm install` 则无需额外操作）。若要使用真实的 Claude 运行，请在 PowerShell 中执行 `$env:ANTHROPIC_API_KEY = "sk-ant-..."` 设置后，再运行 `npm run ch14` / `npm run ch15`。

### ⚛️ React + TypeScript（进阶·第 16 章）

`npm run ch16` 为了无需浏览器即可运行，使用 `renderToStaticMarkup` 将组件输出为 HTML 字符串（正常情况下应在浏览器中渲染）。可以学习 props·useState·useReducer·事件的类型标注。详情请参阅 [chapters/16_react_typescript.md](chapters/16_react_typescript.md)。

---

## 5. 学习技巧

1. **保持 `strict: true` 模式**（已预先配置好）。在宽松设置下学习会在后期遇到麻烦。
2. **禁止使用 `any`**。遇到困难时，练习用 `unknown` + 类型收窄来解决。
3. **故意制造错误**。写错类型注解后运行 `npm run check`，仔细阅读 TS 的提示是最快的学习路径。
4. **务必亲手完成每章末尾的练习题**。在 `src/` 的文件中追加代码，用 `npx tsx` 确认结果。

---

## 6. 文件夹结构

```
ts-learning/
├── README.md            ← 当前位置
├── package.json         ← npm 脚本 / 依赖包
├── tsconfig.json        ← TypeScript 配置（启用 strict）
├── chapters/            ← 各章讲解（Markdown）
│   ├── 01_first_step.md
│   └── ...
└── src/                 ← 各章可运行的代码（.ts）
    ├── 01_first_step.ts
    └── ...
```

遇到问题时，请从 `chapters/01_first_step.md` 开始依次阅读。祝您 TypeScript 学习愉快！
