# 阶段 2:智能体的核心循环 ── ReAct

> [← 01 LLM 基础](01_阶段1_LLM基础.md) ｜ [03 工具设计 →](03_阶段3_工具设计.md)

## 2-1. 讲解

### 智能体的定义

Anthropic 对 AI 智能体的定义如下:

> **AI 智能体 = LLM 在循环中自主地使用工具。**

这一句话是一切的出发点。无论多复杂的智能体框架,本质都归结于这个「循环」。反过来说,理解了这个循环,你就能看穿 Claude Code、Cursor 都不过是「同一循环的精细扩展」。

### ReAct 循环

最基本、且至今仍在主力使用的执行模式就是 **ReAct(Reason + Act)**。即「思考(Reason),然后行动(Act)」。实际上反复进行以下 3 个阶段:

```
① Thought(思考)    : 模型思考「接下来该做什么」
② Action(行动)     : 以 JSON 输出「想用这些参数调用某工具」
③ Observation(观察): Harness 执行工具,并把结果返回给模型
   → 回到 ①(直到满足完成条件)
```

和人做事一样:「想看文件内容(思考)→ 打开文件(行动)→ 读取内容(观察)→ 那接下来改这个函数吧(思考)…」。这个观察→思考的反馈循环,正是智能体智能的源泉。

### 为什么是「循环」

只调用一次,模型只会说「我想读文件」就结束了。Harness 执行它,把结果返回,**让模型再思考一次**。正因为反复往返,模型才能基于上一步的结果决定下一手。这是与阶段 1 裸调用(一问一答)的决定性区别。

### 停止条件(最重要的安全装置)

循环必须有「停止条件」。基本是「模型不调用工具、只返回最终回答文本时即完成」。但模型也可能没完没了地一直调用工具而「失控」。因此必须设置**迭代次数上限(iteration cap)**。忘记这点会导致死循环烧光 token。

### 在 production Harness 中更为精细

在真实的 Harness 里,ReAct 循环会细分为 6 个阶段(出自 LangChain 的解剖):

1. **pre-check & compaction**(预检查·上下文压缩) ── 窗口快满时先总结历史
2. **thinking**(思考)
3. **self-critique**(自我批判) ── 自问「这个计划对不对」
4. **action**(工具调用)
5. **tool execution**(工具执行) ── 处理 sandbox·timeout
6. **post-processing**(后处理) ── 整理结果交给下一轮

一开始用简单的 3 阶段就够了。先自己写出它,再理解精细版。

## 2-2. 示例代码 ── 自己写一条 ReAct 循环(本教科书的核心)

写一个只有 2 个工具(列目录·读文件)的最小智能体。**这是整个教科书学习收益最高的代码。**

```python
import os
import json
from huggingface_hub import InferenceClient

client = InferenceClient(api_key=os.environ["HF_TOKEN"])
MODEL = "Qwen/Qwen2.5-72B-Instruct"   # 工具调用能力强的 Hugging Face 开源模型

# ── ① 工具的「定义」(schema)。用 OpenAI 兼容的 function 格式书写 ──
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "返回指定目录内的文件名列表。",
            "parameters": {
                "type": "object",
                "properties": {
                    "directory": {"type": "string", "description": "要列出的目录的绝对路径"}
                },
                "required": ["directory"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "读取指定路径的文本文件并返回内容。",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "文件的绝对路径"}
                },
                "required": ["path"],
            },
        },
    },
]

# ── ② 工具的「实体」。由 Harness 实际执行的函数 ──
def run_tool(name, args):
    if name == "list_files":
        d = args["directory"]
        if not os.path.isdir(d):
            return f"错误: 找不到目录: {d}"
        return "\n".join(os.listdir(d)) or "(空目录)"
    elif name == "read_file":
        if not os.path.exists(args["path"]):
            return f"错误: 找不到文件: {args['path']}"
        with open(args["path"], encoding="utf-8") as f:
            return f.read()
    return f"未知工具: {name}"

# ── ③ ReAct 循环主体 ──
def run_agent(user_message, max_iterations=10):
    messages = [{"role": "user", "content": user_message}]

    for i in range(max_iterations):          # ← 停止条件(iteration cap)
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=2048,
            tools=TOOLS,
            messages=messages,
        )
        choice = response.choices[0]
        msg = choice.message

        # 把助手的发言(思考 + 工具调用)加入历史
        messages.append(msg)

        # 没调用工具、只返回文本 → 完成
        if choice.finish_reason != "tool_calls":
            print(f"\n✅ 完成({i+1} 次循环):\n{msg.content}")
            return msg.content

        # 执行工具调用,生成结果(Observation)
        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)   # 参数以 JSON 字符串传来
            print(f"  🔧 执行 {tc.function.name}({args})")
            result = run_tool(tc.function.name, args)
            # Observation 以 tool 角色返回,并带上对应的 tool_call_id
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result,
            })

    print("⚠️ 已达迭代上限(防失控)")

# ── 运行 ──
# 例: 假设 /work/ 下有 config.json,其中写着 "port": 8080。
# (运行前先准备好该目录与文件)
run_agent("在 /work 下找到配置文件,并告诉我端口号。")
```

运行后,日志会显示:模型先调用 `list_files("/work")` → **观察**结果、得知配置文件是 `config.json` → 这时才调用 `read_file("/work/config.json")` → 观察并找到 `"port": 8080` → 最终回答。**这一往返正是 ReAct 循环。**

> 📌 **关键点(以及计算问题为何不适合 ReAct)**:本例中**第 2 步读哪个文件,要等第 1 步的观察(目录里有哪些文件)才能确定**。事先无法写死路径,所以观察 → 思考的往返(循环)成为**必然**;而且模型本来就看不到文件系统,没有工具就什么都做不了。
>
> 反之,像「计算 `12345 + 67890`」这样的**计算问题并不适合 ReAct**:模型自己就能算(无需工具),也不存在「观察后改变下一步」的环节(一步就结束)。**ReAct 真正发挥作用的,是「调查外部状态、并根据结果改变下一步行动」的任务**(调查·探索·分步操作)。

### 发生了什么(逐行对应)

| ReAct 阶段 | 代码中的位置 |
|---|---|
| ① Thought + ② Action | `client.chat.completions.create(...)` 的响应 |
| ③ 执行 | `run_tool(tc.function.name, args)` |
| 返回 Observation | `messages.append({"role": "tool", "tool_call_id": tc.id, ...})` |
| 循环 | `for i in range(max_iterations)` |
| 停止条件 | `if choice.finish_reason != "tool_calls"` 与 `max_iterations` |

## 2-3. 练习

1. **【必做·基础】** 实际运行上面的代码,在日志中观察工具被调用的过程。把 `max_iterations` 设为 1,试试会发生什么。
2. **【必做·实现】** 增加第 3 个工具 `write_file(path, content)`,让它「把读取到的配置内容写入另一个文件」并运行。需要同时修改 `TOOLS` 定义和 `run_tool`。
3. **【理解】** 每轮 `print` 出 `messages` 数组,观察对话历史如何增长。确认 assistant 的 `tool_calls` 与对应的 `tool` 角色消息(以 `tool_call_id` 关联)成对出现。
4. **【进阶】** 让模型故意去读一个不存在的文件,此时 `run_tool` 返回错误字符串。观察模型如何根据这个错误调整行为(=错误也作为 Observation 成为学习材料)。
5. **【进阶】** 复现「doom loop(反复同一失败的死循环)」。例如让 `read_file` 总是返回同一错误,观察模型反复调用同一工具的样子,亲身体会为何 iteration cap 是必备的安全装置。

---

> [← 01 LLM 基础](01_阶段1_LLM基础.md) ｜ [03 工具设计 →](03_阶段3_工具设计.md)
