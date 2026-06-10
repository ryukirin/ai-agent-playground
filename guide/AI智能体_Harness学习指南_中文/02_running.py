import os
import json
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()  # 读取同目录下的 .env,把 HF_TOKEN 等写入环境变量
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
        print(f"\n🤖 助手发言({i+1} 次循环):\n{msg.content}")

        # 没调用工具、只返回文本 → 完成
        if choice.finish_reason != "tool_calls":
            print(f"\n✅ 完成({i+1} 次循环):\n{msg.content}")
            return msg.content

        # 执行工具调用,生成结果(Observation)
        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)   # 参数以 JSON 字符串传来
            print(f"  🔧 执行 {tc.function.name}({args})")
            result = run_tool(tc.function.name, args)
            print(f"  📊 结果: {result}")
            print(f"  📝 把结果作为 Observation 加入对话历史,供下一轮思考使用。")
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
run_agent("在work下找到配置文件,并告诉我端口号。")