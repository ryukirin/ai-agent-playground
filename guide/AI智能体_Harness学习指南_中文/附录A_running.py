"""
===== 附录 A 配套可运行 Demo：Agentic Search(grep + read 反复)=====

把附录 A「grep 是否取代了 RAG」的论点变成可运行的演示:
  不用任何向量数据库 / embedding,只用 grep + read_file 的反复(agentic loop),
  就能在一个小型「代码库」里精确定位符号 —— 这正是 Claude Code / Cursor / Devin 的做法。

要点(对应附录 A):
  - grep = 词法(完全/子串)匹配,快、准、100% 可复现
  - 搜索词由「模型自己」在 tool_call 里生成(无需单独的关键词生成器)
  - 反复(grep → read → 再 grep)弥补单次检索的取舍 = agentic search

运行:
  pip install huggingface_hub python-dotenv   # 最小依赖,无需向量库
  在同目录 .env 写入 HF_TOKEN=hf_xxx
  python 附录A_running.py
"""

import os
import json
import shutil
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()
client = InferenceClient(api_key=os.environ["HF_TOKEN"])
MODEL = "Qwen/Qwen2.5-72B-Instruct"

REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "repo")


# ============================================================
# 0. 造一个小型「代码库」当 fixture
# ============================================================
FILES = {
    "src/auth.py":
        "# 认证逻辑模块\n"
        "SESSION_TTL = 3600\n\n"
        "def login(user, password):\n"
        "    \"\"\"校验用户名与密码,成功返回 token\"\"\"\n"
        "    if not user or not password:\n"
        "        raise ValueError('缺少凭据')\n"
        "    return make_token(user)\n",
    "src/orders.py":
        "from src.auth import login\n\n"
        "PORT = 8080\n\n"
        "def create_order(user, items):\n"
        "    token = login(user, items.get('pw'))\n"
        "    return {'status': 'ok', 'count': len(items)}\n",
    "src/utils.py":
        "import hashlib\n\n"
        "def make_token(user):\n"
        "    return hashlib.sha256(user.encode()).hexdigest()[:16]\n",
    "README.md":
        "# 订单服务\n服务监听端口见 src/orders.py。登录入口在 src/auth.py。\n",
}

def setup_repo():
    if os.path.isdir(REPO):
        shutil.rmtree(REPO)
    for rel, body in FILES.items():
        path = os.path.join(REPO, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(body)


# ============================================================
# 工具:grep(词法搜索) + read_file —— 没有向量库
# ============================================================
def t_grep(args):
    """子串搜索(真实 grep 用正则;这里用子串更稳,适合教学)。返回 路径:行号: 行内容"""
    pattern = args["pattern"].lower()
    hits = []
    for root, _, files in os.walk(REPO):
        for name in files:
            path = os.path.join(root, name)
            try:
                with open(path, encoding="utf-8") as f:
                    for ln, line in enumerate(f, 1):
                        if pattern in line.lower():
                            rel = os.path.relpath(path, REPO)
                            hits.append(f"{rel}:{ln}: {line.rstrip()}")
            except (UnicodeDecodeError, OSError):
                continue
    return "\n".join(hits[:50]) or "(无匹配)"

def t_read_file(args):
    path = os.path.join(REPO, args["path"])
    if not os.path.isfile(path):
        return f"错误: 找不到文件 {args['path']}(请用 grep 先定位)"
    with open(path, encoding="utf-8") as f:
        # 带行号返回,便于「第几行」类回答
        return "".join(f"{i}: {ln}" for i, ln in enumerate(f, 1))

def schema(name, desc, props, required):
    return {"type": "function", "function": {
        "name": name, "description": desc,
        "parameters": {"type": "object", "properties": props, "required": required}}}

GREP = schema("grep", "在代码库里按关键词做词法搜索,返回匹配行(含相对路径与行号)。搜索词由你决定。",
              {"pattern": {"type": "string", "description": "要搜索的关键词/符号(子串匹配)"}}, ["pattern"])
READ = schema("read_file", "按相对路径读取代码库中某个文件的全文(带行号)。",
              {"path": {"type": "string", "description": "相对 repo 根的路径,如 src/auth.py"}}, ["path"])


# ============================================================
# ReAct 循环(规范化 assistant 为 dict)
# ============================================================
def normalize(msg):
    if msg.tool_calls:
        a = {"role": "assistant", "content": "", "tool_calls": []}
        for i, tc in enumerate(msg.tool_calls):
            a["tool_calls"].append({"id": tc.id or f"call_{i}", "type": "function",
                                    "function": {"name": tc.function.name,
                                                 "arguments": tc.function.arguments or "{}"}})
        return a
    return {"role": "assistant", "content": msg.content or ""}

def agent_loop(user_message, tools, dispatch, max_iter=10):
    messages = [{"role": "user", "content": user_message}]
    for _ in range(max_iter):
        msg = client.chat.completions.create(
            model=MODEL, max_tokens=1024, tools=tools, messages=messages).choices[0].message
        amsg = normalize(msg)
        messages.append(amsg)
        if not msg.tool_calls:
            return msg.content
        for i, tc in enumerate(msg.tool_calls):
            args = json.loads(tc.function.arguments or "{}")
            result = str(dispatch(tc.function.name, args))
            first = result.splitlines()[0] if result else ""
            print(f"   🔧 {tc.function.name}({args}) → {first[:70]}…")
            messages.append({"role": "tool",
                             "tool_call_id": amsg["tool_calls"][i]["id"], "content": result})
    return "(达到迭代上限)"


# ============================================================
def main():
    setup_repo()
    print("=" * 60)
    print("Agentic Search Demo ── grep + read 反复(无向量数据库)")
    print("=" * 60)
    print("智能体自己决定搜索词,用 grep 定位 → read_file 确认 → 回答。\n")

    dispatch = lambda n, a: {"grep": t_grep, "read_file": t_read_file}[n](a)

    # 这个问题需要「精确定位符号」——正是 grep(词法)的强项(见附录 A 第1节)
    answer = agent_loop(
        "在这个代码库里,登录函数 login 定义在哪个文件、第几行?把那一行原样贴出来。",
        tools=[GREP, READ], dispatch=dispatch)
    print(f"\n✅ 回答:\n{answer}")

    print("\n— 说明 —")
    print("全程没有 embedding / 向量库:只有 grep 的词法匹配 + 反复读取。")
    print("这正是附录 A 所述 Claude Code / Cursor 的 agentic search 栈。")
    print("(若问题是『认证相关的逻辑大致怎么做』这种语义检索,则 RAG/语义索引更合适 —— 见附录 A 第4节)")


if __name__ == "__main__":
    main()
