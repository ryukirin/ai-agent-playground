# 附录 A ── 智能体检索之争:grep 是否取代了 RAG?

> 创建日期: 2026-06-11
> 本附录由一次问答讨论整理而成,作为阶段 4(上下文工程)与阶段 5(Harness 九大组件 · 检索)的补充专题。
> 主题:**「智能体用 grep 取代了 RAG / RAG 已经不需要了」这一论调,是否成立?**
> ▶ 可运行 demo:[附录A_running.py](附录A_running.py)(不用向量库,用 grep + read 的反复 = agentic search 现场演示)

---

## 0. 一句话结论

- **代码检索领域**:agentic search(grep + 反复读文件)已经**事实上取代了向量数据库式 RAG**。这不是观点,而是 Claude Code / Cursor / Devin 的**实际实现**。
- **但「RAG 已死(RAG is dead)」是过头话**:在**非结构化文档、大型知识库、自然语言检索散文**的场景,RAG 依然是正确架构。
- **2026 年的共识**不是「二选一」,而是:**以 agentic search 为骨干,只在需要的地方加语义索引,再加上 context engineering(上下文工程)**。

---

## 1. grep 与 RAG 的本质区别

二者都「从文本里找信息」,但机理与擅长领域完全不同。

| | grep | RAG |
|---|---|---|
| 做什么 | **字符串精确匹配 / 正则匹配** | **按语义相近度检索 + LLM 生成回答** |
| 怎么找 | 机械扫描「包含该字符串的行」 | 把问题向量化,用向量相似度取「语义最接近的文档」 |
| 输出 | 匹配到的行本身 | 结合取回文档生成的**自然语言回答** |
| 表述差异 | 写法不同就匹配不到 | 换说法、近义词也能命中 |
| 可靠性 | **快、准、100% 可复现**,但不理解「语义」 | 语义检索,但有**漏检 / 误检**,且 LLM 可能产生幻觉 |

### 适用场景

- **「这个字符串 / 符号到底在哪」需要精确知道** → **grep**(代码审查、规约违反的穷尽式排查等不容遗漏的场合)。
- **「理解内容后回答问题 / 做摘要」** → **RAG**(规格概要把握、对大量文档做自然语言提问)。

> 二者并非对立,实践中常**组合使用**:先用 RAG 找大致方向,再用 grep 精确定位。

---

## 2. 「grep 取代 RAG」之争确实存在

这一讨论在 2024–2025 年相当激烈,尤其在**编码智能体**语境中出现了「RAG 是不是不需要了」的主张。

### 2.1 「grep 足够,RAG 不要」派的论据

发端:Claude Code 等智能体**完全不用向量数据库**,仅靠 `grep` / `glob` / 读文件就驾驭了庞大代码库的真实体验。

1. **智能体能像人一样探索** ── grep 定位 → 读文件 → 再 grep,这种**反复(agentic loop)**能收集上下文。不是一次性检索,因此用反复弥补了向量相似度的漏检。
2. **零索引维护成本** ── RAG 每次代码变更都要重算嵌入、重建索引;grep 永远看**最新源代码本身**,不会陈旧。
3. **精确性** ── 代码里「这个标识符精确在哪」比「语义相近」更重要。grep 是精确匹配,不会说谎。
4. **长上下文的爆发式扩张** ── 模型长上下文化后,「把相关文件整个塞进去」变得可行,分块(chunking)的必要性下降。

### 2.2 「RAG 仍需要」派的反驳

1. **grep 是词法(lexical)检索** ── 对「认证相关的处理」这种**按语义找**的问题很弱;探索初期连该 grep 什么词都不知道时会卡住。
2. **代码以外另当别论** ── PDF、规格书、客服文档、聊天记录等**非结构化文本**,正则匹配失效,这里仍是 RAG / 语义检索的强项。
3. **规模与延迟** ── 数百万文件、整个公司知识库的规模下,「每次 grep 再反复」在 token 和时间上都很昂贵,预建索引更划算。
4. **grep 本身也是一种检索增强生成** ── 按 RAG 的定义(把外部取回的信息交给 LLM 生成),**agentic grep 也是广义 RAG 的一种**。消失的只是「向量数据库」,Retrieval-Augmented 这个框架本身仍然活着。

---

## 3. 决定性事件:Claude Code 删掉了向量检索(2025-05)

这是把争论推向「接近定论」的关键事实。

- **2025 年 5 月,Anthropic 从 Claude Code 中删除了向量检索**:拿掉了嵌入流水线、本地向量数据库、分块启发式,**全部换成 grep**。
- Claude Code 主创 **Boris Cherny** 称结果「**大幅超越了其他所有方法(outperformed everything. By a lot)**」。
- **Cursor / Claude Code / Devin** 都依赖 `grep` / `find` / 直接读文件,而非向量检索。

→ 「agentic grep 取代了 RAG」已**不是意见,而是主流智能体的实现事实**。

### 各家给出的「抛弃理由」

1. **精确性(precision)** ── grep 精确匹配;嵌入会产生模糊误报(fuzzy positives)。
2. **简洁性** ── 没有需要构建 / 维护的索引。
3. **新鲜度(freshness)** ── 预建索引会很快与编辑中的代码偏离;grep 永远看最新源。
4. **隐私** ── 不必为算嵌入把代码送往外部。

> Augment 的 SWE-Bench 案例(Jason Liu)以具体数据印证了**「grep 战胜了 embeddings」**:智能体的**坚持(persistence)足以弥补工具的朴素**。

---

## 4. 但「RAG is dead」是错的 ── 各文章的共同提醒

- **RAG 没有死。只是在代码这个「结构化世界」里被 agentic search 取代了。**
- 在**非结构化文本(PDF / 公司文档 / 散文)、大型知识库、自然语言检索**中,RAG 仍是正确架构。
- 整理良好、固定词汇的代码库里 grep 低成本即可胜任;但在**企业级 multimodal / 非结构化数据**上,只靠 grep 会**「完全崩溃(fails completely)」**。

---

## 5. Token 成本分析(本专题的核心算账)

### 5.1 索引「保存」要不要 token?

分清两个阶段:

| 阶段 | 是否耗 token |
|---|---|
| **索引创建时** | **耗 token(计费)** ── 把文档送进嵌入模型向量化,按输入文本计费;代码 / 文档每次变更还要重新嵌入变更部分 |
| **仅仅保存索引** | **不耗 token** ── 只是存储,不是模型调用。代价是磁盘 / 内存(存储费)与向量库运行费(服务器费) |
| **检索(查询)时** | 把问题嵌入(少量 token)+ 取回的 chunk 交给 LLM 生成回答(这部分 token) |

### 5.2 「索引的 token」与「grep 的 token」哪个多?

关键在于**消费位置不同**且**单价相差悬殊**:

| | RAG(嵌入) | grep(agentic search) |
|---|---|---|
| 何时消费 | **一开始集中**(建索引)+ 变更时重嵌入 | **每次检索时**(读过的文件进上下文) |
| 哪种 token | 嵌入模型的输入 | 生成模型的上下文(grep 结果 + 读入的文件正文) |
| 单价 | **极便宜**(嵌入约为生成的数十分之一) | **贵**(LLM 本体的输入 / 输出 token) |

**单次精密检索** → RAG 的 token 数更少:
- RAG:嵌入问题(几十 token)+ 只把 top-N chunk 交给 LLM,**精准只传需要的部分**。
- grep:智能体 grep → 读文件 → 再 grep 反复,**把相关文件整个反复读入上下文**,一个任务可膨胀到数万~数十万输入 token。

**累计 / 实际运维** → grep 往往更划算:
1. **建索引不是一次性的** ── 代码频繁变更,每次都要重嵌入;活跃编辑的代码库里这笔重建会累积。
2. **嵌入 token 极便宜** ── 用量大也金额影响小。
3. **grep 本身 0 token** ── grep 执行不需要 LLM;聪明的智能体只读「该读的文件」,不会每次全量扫。

### 5.3 一句话回答「哪个多」

> **单论 token「数量」,grep 容易更多。但把「便宜的嵌入 token vs 昂贵的 LLM token」这一单价差,以及重建索引的人力 / 流程成本一起算进去,在代码领域 grep(agentic)更划算** ── 这是目前的实务评价。

并且要记住:**Claude Code 选 grep,首要原因并非 token 成本**。Boris Cherny 列出的是精确性、新鲜度、维护简洁、隐私 ── **「grep 效果更好」才是本质,token 是次要论点**。

---

## 6. 2026 年的落点(实务共识)

最新文章(2026 年 4–5 月)的论调:

> **不是「二选一」,而是「以 agentic 为骨干(backbone),语义索引只在需要处使用,加上 context engineering」。**

RAGFlow 的年终回顾很有象征性 ── 趋势本身已从 RAG 走向 **"From RAG to Context"**(从 RAG 到「上下文工程」)这一框架的扩张。

### 与本项目(Harness 学习)的关联

- 旧 ASP 代码、参考实现的探索 → **grep + 读文件的反复是正攻法**。
- 规约违反的穷尽式排查(绝对禁止 Top 10)这种**一件都不能漏**的用途 → **grep 型必须**。
- 棚卸し.md、旧规格的「语义概要把握」探索阶段 → 语义检索的思路仍有用。

→ 本项目「代码探索靠 grep、规约排查必用 grep」的方针,**与最新业界动向完全一致**。把它对应到学习指南:这正是**阶段 4(上下文工程)中「检索即上下文注入」**与**阶段 5(Harness 九大组件)中的检索组件**的活教材。

---

## 7. 参考文献(出处)

- Why Cursor, Claude Code, and Devin Use grep, Not Vectors — MindStudio
  https://www.mindstudio.ai/blog/is-rag-dead-what-ai-agents-use-instead
- Coding Agents Skipped RAG — RAG Still Wins on Large Docs — MindStudio
  https://www.mindstudio.ai/blog/is-rag-dead-what-ai-coding-agents-use-instead
- Settling the RAG Debate: Why Claude Code Dropped Vector DB-Based RAG — SmartScope
  https://smartscope.blog/en/ai-development/practices/rag-debate-agentic-search-code-exploration/
- Why Claude Code Abandoned RAG for Agentic Search — Zenn (karamage)
  https://zenn.dev/karamage/articles/2514cf04e0d1ac?locale=en
- Claude Code Doesn't Index Your Codebase. Here's What It Does Instead. — Vadim's blog
  https://vadim.blog/claude-code-no-indexing/
- Why Grep Beat Embeddings in Our SWE-Bench Agent (Augment) — Jason Liu
  https://jxnl.co/writing/2025/09/11/why-grep-beat-embeddings-in-our-swe-bench-agent-lessons-from-augment/
- Developers Debate Whether RAG is Dead — BigGo News
  https://biggo.com/news/202510020722_RAG_vs_AI_Agents_Debate
- From RAG to Context — A 2025 year-end review of RAG — RAGFlow
  https://ragflow.io/blog/rag-review-2025-from-rag-to-context
- AI Agents Don't Need Vector Search Anymore: The Agentic Search Stack Replacing RAG in 2026 — Medium (Abdullah Grewal)
  https://buzzgrewal.medium.com/ai-agents-dont-need-vector-search-anymore-inside-the-agentic-search-stack-replacing-rag-in-2026-58efcabe4f6f
- Is RAG Dead? Long Context, Grep, and the End of the Mandatory Vector DB — AkitaOnRails
  https://akitaonrails.com/en/2026/04/06/rag-is-dead-long-context/
