# 阶段 5:Harness 的九大组件 ── 解剖图

> [← 04 上下文工程](04_阶段4_上下文工程.md) ｜ [06 工作流 vs 智能体 →](06_阶段6_工作流与智能体.md)

## 5-1. 讲解

至此学习了「循环·工具·上下文」。阶段 5 中,**俯瞰 production 级 Harness 拥有的全部组件**。任何正经的 Harness 都包含以下 9 个组件。

| # | 组件 | 作用 | 与此前阶段的对应 |
|---|---|---|---|
| 1 | **Model Interface(模型接口层)** | 抽象与 LLM 的对话。让模型可替换,负责 system prompt·tool 定义·消息整形·结构化输出解析 | 阶段 1·2 的 `client.chat.completions.create` 周边 |
| 2 | **Tool Registry(工具注册表)** | 可用工具的目录(描述·schema·执行逻辑) | 阶段 3 的 `TOOLS` 与 `run_tool` |
| 3 | **Context Manager(上下文管理)** | 用 truncation / compression / retrieval / 选择性注入管理有限窗口。**智能体失败最常见的原因就在这里** | 阶段 4 |
| 4 | **Planning Module(规划模块)** | 决定推理方针。Reactive(逐步)/ Planning(先分解)/ Hierarchical(两者结合) | 阶段 2 的 ReAct = reactive |
| 5 | **Execution Engine(执行引擎)** | 执行工具调用。处理 sandbox·timeout·输出整形·并行 | 阶段 2 的 `run_tool` 的扩展 |
| 6 | **Memory System(记忆系统)** | 4 种:in-context / external(DB·向量)/ episodic(行为日志)/ semantic(事实·总结) | 阶段 4 的 note-taking |
| 7 | **Feedback & Observation Loop(观察循环)** | 捕获工具输出·错误并返回模型。「没有好的观察循环,智能体就盲跑」 | 阶段 2 的 tool_result |
| 8 | **Safety & Guardrails(安全层)** | 审批门·危险操作检测·范围限制·限流·审计日志 | 阶段 2 的 iteration cap、阶段 7 |
| 9 | **Orchestration Layer(编排层)** | 多智能体协作(任务路由·spawn·结果聚合·状态同步) | 阶段 6·10 |

### 各组件补充

**Model Interface(可替换性)**:好的 Harness 能在不改写工具逻辑的情况下替换 Claude / GPT / Gemini。因此把「模型名」集中到一处配置。

**Planning Module 的 3 种**:
- *Reactive*:逐步观察前进(Claude Code 偏此)。灵活但前瞻弱。
- *Planning*:先立整体计划再执行。擅长长周期任务,但计划失准时脆弱。
- *Hierarchical*:上层规划、下层 reactive 执行。两者折衷。

**Memory 的 4 种**:
- *in-context*:当前对话窗口(最基本,多数系统以此为主)。
- *external*:DB 或向量库(RAG)。存放大量知识。
- *episodic*:过去的行为日志(「上次这样失败过」)。
- *semantic*:提炼的事实·总结(「用户专长 VB」)。
→ 本项目 `memory/` 的 `user` / `feedback` / `project` / `reference` 分类正是 semantic memory 的结构化。

### Harness 的底层基础设施(LangChain)

production Harness 把上面 9 个组件架在以下基础设施之上。

- **文件系统**:跨会话的持久存储、超出窗口的 context 转储、通过文件共享协作。
- **Git**:进度追踪与 per-step undo(回滚)。
- **Bash / 代码执行**:与其预先造好所有工具,不如给它计算环境、让模型自己设计解法。
- **Sandbox**:隔离执行生成的代码。配备运行时·浏览器·测试运行器,让智能体能验证自己的工作。

### 真实产品的设计思想差异

| 工具 | 设计思想 |
|---|---|
| **Claude Code** | 重透明性。显式审批门、精选工具、详尽日志。reactive 的 ReAct |
| **OpenAI Codex** | 把 Harness 组件紧密集成进模型 API。服务端工具管理·统一线程 |
| **Cursor** | IDE 集成。用高级代码索引取上下文,以 diff 审阅做隐式审批 |

## 5-2. 示例代码 ── 以九大组件意识来结构化

把此前零散的代码整理成一个类(标明各组件对应何处)。

```python
class AgentHarness:
    def __init__(self):
        self.model = "Qwen/Qwen2.5-72B-Instruct"  # ① Model Interface
        self.tools = TOOLS                     # ② Tool Registry(定义)
        self.tool_impls = {                    # ② + ⑤ Execution Engine
            "list_files": run_list_files,
            "read_file": run_read_file,
        }
        self.messages = []                     # ③ Context Manager / ⑥ in-context memory
        self.max_iterations = 20               # ⑧ Safety: iteration cap
        self.client = InferenceClient(api_key=os.environ["HF_TOKEN"])

    def _compact_if_needed(self):              # ③ Context Manager
        if len(self.messages) > 12:
            self.messages = compact_history(self.messages, self.client)

    def _check_safety(self, name, args):       # ⑧ Safety & Guardrails
        if name == "write_file" and args["path"].startswith("C:/Windows"):
            return False, "禁止写入系统目录"
        return True, ""

    def _execute(self, name, args):            # ⑤ Execution Engine + ⑦ Observation
        ok, reason = self._check_safety(name, args)
        if not ok:
            return f"⛔ 拒绝: {reason}"        # 安全层拦截 → 作为观察返回
        try:
            return self.tool_impls[name](args)
        except Exception as e:
            return f"错误: {e}"                # ⑦ 错误也是 Observation

    def run(self, user_message):               # ④ Planning(reactive)+ 循环
        self.messages.append({"role": "user", "content": user_message})
        for i in range(self.max_iterations):
            self._compact_if_needed()
            resp = self.client.chat.completions.create(
                model=self.model, max_tokens=2048,
                tools=self.tools, messages=self.messages,
            )
            choice = resp.choices[0]
            self.messages.append(choice.message)
            if choice.finish_reason != "tool_calls":
                return choice.message.content
            for tc in choice.message.tool_calls:
                args = json.loads(tc.function.arguments)
                out = self._execute(tc.function.name, args)
                self.messages.append({"role": "tool",
                                      "tool_call_id": tc.id, "content": out})
        return "⚠️ 迭代上限"
```

> 开头需要 `import os, json` 与 `from huggingface_hub import InferenceClient`(`TOOLS` / `run_list_files` / `run_read_file` / `compact_history` 沿用阶段 2~4)。

## 5-3. 练习

1. **【俯瞰】** 借助注释,把上面 `AgentHarness` 类的各方法/属性全部对应到 9 个组件。指出缺失的组件(如 ⑨ Orchestration)是哪些。
2. **【实现】** 扩展 `_check_safety`,加上「`read_file` 试图读取含 `.env` 或 `secret` 的路径时拒绝」的护栏。观察拒绝理由作为 Observation 返回模型后,模型如何改用别的手段。
3. **【设计】** 就 Planning 的 3 种(reactive / planning / hierarchical),分别用具体例子说明各自适合什么任务。「依次修改 10 个文件」适合哪种?为什么?
4. **【项目联动】** 把本项目的组成对应到 9 组件表。例如 Tool Registry = ?、Context Manager = ?、Memory = ?、Safety = ?、Orchestration = ?(提示:Skill 群、`memory/`、绝对禁止 Top 10、Workflow 工具)。
5. **【进阶】** 设计把 Git 用作 Harness 基础设施的方案。写出「智能体每步提交、失败则回退到上一提交(per-step undo)」机制的伪代码。

---

> [← 04 上下文工程](04_阶段4_上下文工程.md) ｜ [06 工作流 vs 智能体 →](06_阶段6_工作流与智能体.md)
