from openai import OpenAI
import json
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.environ["HF_TOKEN"],
    base_url="https://router.huggingface.co/v1"
)

def read_file(path: str) -> str:
    """read file content"""
    with open(path, encoding="utf-8") as f:
        return f.read()

def run_command(command: str) -> str:
    """execute command and return output"""
    result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=10)
    return result.stdout + result.stderr

def write_file(path: str, content: str) -> str:
    """write content to file"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return f"Written to {path}"

tool_map = {"read_file": read_file, "run_command": run_command, "write_file": write_file}

tools = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read file content",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "File path"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "run_command",
            "description": "Execute shell command",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Command to execute"}
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write content to file",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "File path"},
                    "content": {"type": "string", "description": "File content"}
                },
                "required": ["path", "content"]
            }
        }
    }
]

def run_agent(task: str):
    messages = [
        {"role": "system", "content": "You are a programming assistant. You must call read_file to read the content of a file before analyzing it. Do not assume the content of any file."},
        {"role": "user", "content": task}
    ]
    step = 0

    while True:
        # when tools have call records, use auto; otherwise, use required
        tool_choice = "required" if step == 0 else "auto"

        response = client.chat.completions.create(
            # Qwen2.5-72B-Instruct has better tool use capability
            # but you can also try other models like Qwen2-14B-Instruct
            model="Qwen/Qwen2.5-72B-Instruct",
            messages=messages,
            tools=tools,
            tool_choice=tool_choice
        )

        msg = response.choices[0].message
        messages.append(msg)

        # if no tool calls, print final answer and exit
        if not msg.tool_calls:
            print("\n✅ Final Answer:")
            print(msg.content)
            break

        # if there are tool calls, execute them and append results to messages
        step += 1
        print(f"\n── Step {step} ──────────────────────")

        for tool_call in msg.tool_calls:
            fn_name = tool_call.function.name
            fn_args = json.loads(tool_call.function.arguments)
            print(f"  🔧 Tool: {fn_name}")
            print(f"  📥 Arguments: {fn_args}")

            result = tool_map[fn_name](**fn_args)
            print(f"  📤 Return: {result[:200]}")

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result
            })

if __name__ == "__main__":
    run_agent("Read secret_logic_xyz.py, find the bug, and fix the file directly")