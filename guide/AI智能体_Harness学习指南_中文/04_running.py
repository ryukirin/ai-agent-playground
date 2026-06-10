"""
===== 阶段 4 上下文工程：4 种实践技巧的可运行 Demo =====

用一个「文件调查智能体」演示 4 种核心技巧：
  (1) Just-In-Time Retrieval(即时取用)  … 只持标识符,需要时才用工具取
  (2) Compaction(压缩)                  … token 量超阈值时总结旧历史
  (3) Structured Note-Taking(结构化笔记)… 写到外部文件,上下文重置后仍能续作
  (4) Sub-Agent(子智能体)               … 委派子任务,只取回「总结」

运行:
  pip install huggingface_hub python-dotenv
  在同目录 .env 写入 HF_TOKEN=hf_xxx
  python 04_running.py

依赖最小化:只用 huggingface_hub(token 计数用简易字符估算,
不依赖 transformers;精确做法见指南正文 tokenizer.apply_chat_template)。
"""

import os
import json
import shutil
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()
client = InferenceClient(api_key=os.environ["HF_TOKEN"])
MODEL = "Qwen/Qwen2.5-72B-Instruct"           # 主模型(工具调用强)
SUMMARIZER = "Qwen/Qwen2.5-7B-Instruct"       # 总结用小模型,便宜

WORK = os.path.join(os.path.dirname(os.path.abspath(__file__)), "work")
NOTES = os.path.join(WORK, "notes.md")

# 演示用的小窗口,便于看到 Compaction 真正触发(真实模型是 32K~128K)
DEMO_WINDOW = 800
COMPACT_AT = 0.75


# ============================================================
# 0. 准备 fixture 文件(让 list_files / read_file 有东西可读)
# ============================================================
def setup_fixtures():
    if os.path.isdir(WORK):
        shutil.rmtree(WORK)
    os.makedirs(WORK)
    with open(os.path.join(WORK, "config.json"), "w", encoding="utf-8") as f:
        json.dump({"service": "orders", "port": 8080, "db": "postgres"}, f, ensure_ascii=False)
    with open(os.path.join(WORK, "readme.txt"), "w", encoding="utf-8") as f:
        f.write("服务名: 订单服务\n版本: 1.2.0\n负责人: 张三\n")


# ============================================================
# 工具实体(JIT 的 read/list,以及 Note-Taking 的 write/read)
# ============================================================
def t_list_files(args):
    d = args["directory"]
    if not os.path.isdir(d):
        return f"错误: 找不到目录 {d}"
    entries = []
    for name in os.listdir(d):
        path = os.path.join(d, name)
        kind = "目录" if os.path.isdir(path) else "文件"
        entries.append(f"{kind}: {path}")
    return "\n".join(entries)

def t_read_file(args):
    p = args["path"]
    if not os.path.exists(p):
        return f"错误: 找不到文件 {p}"
    if not os.path.isfile(p):
        return f"错误: {p} 是目录,请先用 list_files 查看其中的文件,再读取具体文件。"
    with open(p, encoding="utf-8") as f:
        return f.read()

def t_write_note(args):
    with open(NOTES, "a", encoding="utf-8") as f:
        f.write(args["text"] + "\n")
    return "已写入笔记。"

def t_read_notes(args):
    if not os.path.exists(NOTES):
        return "(还没有笔记)"
    with open(NOTES, encoding="utf-8") as f:
        return f.read()

def schema(name, desc, props, required):
    parameters = {"type": "object", "properties": props}
    if required:
        parameters["required"] = required
    return {"type": "function", "function": {
        "name": name, "description": desc,
        "parameters": parameters}}

LIST = schema("list_files", "返回指定目录内的文件名列表。",
              {"directory": {"type": "string", "description": "目录的绝对路径"}}, ["directory"])
READ = schema("read_file", "读取指定路径的文本文件并返回内容。",
              {"path": {"type": "string", "description": "文件的绝对路径"}}, ["path"])
WRITE_NOTE = schema("write_note", "把一行重要发现写入外部笔记文件(持久化)。",
                    {"text": {"type": "string", "description": "要记录的一行内容"}}, ["text"])
READ_NOTES = schema("read_notes", "读取外部笔记文件的全部内容。", {}, [])


# ============================================================
# 通用 ReAct 循环(规范化 assistant 为 dict,以便计数 & Compaction)
# ============================================================
def normalize(msg):
    if msg.tool_calls:
        # Some OpenAI-compatible routers reject assistant messages that mix
        # natural-language content with tool_calls in the next request.
        a = {"role": "assistant", "content": "", "tool_calls": []}
        for i, tc in enumerate(msg.tool_calls):
            call_id = tc.id or f"call_{i}"
            a["tool_calls"].append({"id": call_id, "type": "function",
                                    "function": {"name": tc.function.name,
                                                 "arguments": tc.function.arguments or "{}"}})
    else:
        a = {"role": "assistant", "content": msg.content or ""}
    return a

def count_tokens(messages):
    # 简易估算: 累计文本字符 ÷ 3 ≈ token(精确做法见指南正文)
    total = 0
    for m in messages:
        total += len(str(m.get("content") or ""))
        for tc in (m.get("tool_calls") or []):
            total += len(tc["function"]["arguments"]) + len(tc["function"]["name"])
    return total // 3

def compact_history(messages):
    """(2) Compaction: 总结较旧历史,保留最近往来"""
    keep, old = messages[-4:], messages[:-4]
    if len(old) < 2:
        return messages
    summary = client.chat.completions.create(
        model=SUMMARIZER, max_tokens=512,
        messages=[{"role": "user", "content":
            "请用要点总结以下对话/工作日志,保留全部已记录的事实与未决事项,丢弃冗长输出:\n\n"
            + str(old)}],
    ).choices[0].message.content
    return [{"role": "user", "content": f"【至今为止的总结】\n{summary}"}] + keep

def agent_loop(messages, tools, dispatch, max_iter=12, compact=False, verbose=True):
    for i in range(max_iter):
        if compact:
            used = count_tokens(messages)
            if used > DEMO_WINDOW * COMPACT_AT:
                if verbose:
                    print(f"      📦 [Compaction] 已用≈{used} tok > 阈值 → 总结旧历史并折叠")
                messages = compact_history(messages)
        msg = client.chat.completions.create(
            model=MODEL, max_tokens=1024, tools=tools or None, messages=messages
        ).choices[0].message
        assistant_msg = normalize(msg)
        messages.append(assistant_msg)
        if not msg.tool_calls:
            return msg.content, messages
        for i, tc in enumerate(msg.tool_calls):
            args = json.loads(tc.function.arguments or "{}")
            result = str(dispatch(tc.function.name, args))
            if verbose:
                print(f"      🔧 {tc.function.name}({args}) → {result[:60].rstrip()}…")
            call_id = assistant_msg["tool_calls"][i]["id"]
            messages.append({"role": "tool", "tool_call_id": call_id, "content": result})
    return "(达到迭代上限)", messages


# ============================================================
# Demo 1 ── Just-In-Time Retrieval(只持标识符,按需取)
# ============================================================
def demo_jit():
    print("\n" + "=" * 60)
    print("Demo 1 ── Just-In-Time Retrieval(即时取用)")
    print("=" * 60)
    print("智能体不预读任何文件,只用 list_files 看清单 → 按需 read_file。")
    dispatch = lambda n, a: {"list_files": t_list_files, "read_file": t_read_file}[n](a)
    answer, _ = agent_loop(
        [{"role": "user", "content": f"在目录 {WORK} 下找到配置文件,并告诉我端口号。"}],
        tools=[LIST, READ], dispatch=dispatch)
    print(f"\n✅ 回答: {answer}")


# ============================================================
# Demo 2 ── Compaction(token 超阈值就压缩)
# ============================================================
def demo_compaction():
    print("\n" + "=" * 60)
    print("Demo 2 ── Compaction(压缩)")
    print("=" * 60)
    print(f"窗口被故意设小({DEMO_WINDOW} tok)。先灌入一段很长的对话历史,")
    print("再问「请列出全部要点」── 触发总结,旧历史被折叠成摘要后仍能回答。")

    # 造一段较长的历史(多轮记录),超过演示窗口
    history = [{"role": "user", "content": "我们来逐条记录项目配置,稍后请你汇总。"},
               {"role": "assistant", "content": "好的,请逐条说,我来记录。"}]
    for i in range(1, 21):
        history.append({"role": "user", "content":
            f"记一下:配置项{i} — 微服务 svc_{i:02d},监听端口 {8000+i},数据库 db_{i:02d}(postgres),负责人 user_{i:02d},SLA 99.{i}%。"})
        history.append({"role": "assistant", "content": f"已记录配置项{i}(共已记录 {i} 条)。"})
    history.append({"role": "user", "content": "现在请把我们记录过的端口号全部列出来。"})

    print(f"\n   压缩前历史:{len(history)} 条消息,≈{count_tokens(history)} tok")
    answer, msgs = agent_loop(history, tools=[], dispatch=lambda n, a: "",
                              compact=True, max_iter=3)
    print(f"\n✅ 回答:\n{answer}")
    print(f"\n   压缩后历史:{len(msgs)} 条消息,≈{count_tokens(msgs)} tok ── 旧历史已折叠成摘要")


# ============================================================
# Demo 3 ── Structured Note-Taking(写外部文件,重置后续作)
# ============================================================
def demo_notes():
    print("\n" + "=" * 60)
    print("Demo 3 ── Structured Note-Taking(结构化笔记)")
    print("=" * 60)
    if os.path.exists(NOTES):
        os.remove(NOTES)
    dispatch = lambda n, a: {"list_files": t_list_files, "read_file": t_read_file,
                             "write_note": t_write_note, "read_notes": t_read_notes}[n](a)

    print("阶段A:调查并把发现写入 notes.md")
    agent_loop(
        [{"role": "user", "content":
          f"调查 {WORK}:用 read_file 查清服务名、端口、版本,并用 write_note 把每条发现各记一行。"}],
        tools=[READ, LIST, WRITE_NOTE], dispatch=dispatch)
    print(f"\n   📒 notes.md 现有内容:\n{t_read_notes({})}")

    print("阶段B:★彻底重置上下文(messages 清空)★,只靠 read_notes 回答")
    answer, _ = agent_loop(
        [{"role": "user", "content": "你没有任何记忆。请先 read_notes,再据此告诉我服务名、端口和版本。"}],
        tools=[READ_NOTES], dispatch=dispatch)
    print(f"\n✅ 重置后仍能回答: {answer}")
    print("   → 一致性靠外部笔记文件而非上下文窗口来保持。")


# ============================================================
# Demo 4 ── Sub-Agent(委派子任务,只取回总结)
# ============================================================
def research_subagent(question):
    """子智能体:自带 list_files/read_file,独立上下文调查,只返回简短总结。"""
    dispatch = lambda n, a: {"list_files": t_list_files, "read_file": t_read_file}[n](a)
    summary, _ = agent_loop(
        [{"role": "system", "content": "你是调查子智能体。只返回不超过 3 行的结论,不要贴文件原文。"},
         {"role": "user", "content": f"调查目录 {WORK} 来回答:{question}"}],
        tools=[LIST, READ], dispatch=dispatch, verbose=False)  # 子智能体的过程不污染父级
    return summary

def demo_subagent():
    print("\n" + "=" * 60)
    print("Demo 4 ── Sub-Agent(子智能体)")
    print("=" * 60)
    print("父智能体只有 delegate_research 工具;文件原文留在子智能体,父级只收到总结。")
    DELEGATE = schema("delegate_research", "把一个调查问题委派给子智能体,返回简短结论。",
                      {"question": {"type": "string", "description": "要调查的问题"}}, ["question"])

    def dispatch(n, a):
        if n == "delegate_research":
            print(f"      👥 [Sub-Agent] 受理委派: {a['question']}")
            return research_subagent(a["question"])
        return f"未知工具 {n}"

    answer, parent_msgs = agent_loop(
        [{"role": "user", "content": "这个服务叫什么、用什么端口?请委派调查后汇总告诉我。"}],
        tools=[DELEGATE], dispatch=dispatch)
    print(f"\n✅ 回答: {answer}")
    print(f"   (父级历史仅 ≈{count_tokens(parent_msgs)} tok ── 文件原文从未进入父上下文)")


# ============================================================
if __name__ == "__main__":
    setup_fixtures()
    demo_jit()
    demo_compaction()
    demo_notes()
    demo_subagent()
    print("\n🎉 4 种上下文工程技巧演示完毕。")
