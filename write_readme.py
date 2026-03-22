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

def list_files() -> str:
    """list all code files in current directory and subdirectories"""
    result = []
    for root, dirs, files in os.walk("."):
        # ignore virtual environment, git and pycache folders
        dirs[:] = [d for d in dirs if d not in [".venv", ".git", "__pycache__"]]
        # ignore environment, gitignore and LICENSE files
        files[:] = [f for f in files if f not in [".env", ".gitignore", "LICENSE"]]
        for file in files:
            path = os.path.join(root, file)
            result.append(path)
    return "\n".join(result)

def read_file(path: str) -> str:
    """read file content"""
    with open(path, encoding="utf-8") as f:
        return f.read()

def create_file(path: str, content: str) -> str:
    """create file with content"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return f"Created {path}"

def write_file(path: str, content: str) -> str:
    """write content to file"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return f"Written to {path}"

tool_map = {"list_files": list_files, "read_file": read_file, "create_file": create_file, "write_file": write_file}

tools = [
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "List all code files in current directory and subdirectories",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
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
            "name": "create_file",
            "description": "Create a new file with content",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "File path"},
                    "content": {"type": "string", "description": "File content"}
                },
                "required": ["path", "content"]
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
        {"role": "system", "content": "You are a readme writer. You must call list_files to get a list of all code files, then call read_file to read each file before writing the readme. Do not assume the content of any file."},
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
    run_agent("Read all code files, write a readme for this project, and save it to README.md. The readme should include an overview of the project, instructions on how to run the code, and explanations of the main components.")