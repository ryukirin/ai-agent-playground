from openai import OpenAI
import json
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()

MAX_FILE_CHARS = 8000
MAX_CONTEXT_CHARS = 60000

client = OpenAI(
    api_key=os.environ["HF_TOKEN"],
    base_url="https://router.huggingface.co/v1"
)

def list_files() -> str:
    """list all code files in current directory and subdirectories"""
    ignored_dirs = {
        ".venv",
        ".git",
        "__pycache__",
        "node_modules",
        ".next",
        "dist",
        "build",
        ".pytest_cache"
    }
    ignored_files = {".env", ".gitignore", "LICENSE", "README.md"}
    readable_extensions = {
        ".py",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".json",
        ".toml",
        ".yaml",
        ".yml",
        ".md",
        ".txt",
        ".ipynb"
    }

    result = []
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in ignored_dirs]
        files[:] = [f for f in files if f not in ignored_files]
        for file in files:
            if os.path.splitext(file)[1] not in readable_extensions:
                continue
            path = os.path.join(root, file)
            result.append(path)
    return "\n".join(sorted(result, key=lambda path: (path.count(os.sep), path)))

def read_file(path: str) -> str:
    """read file content"""
    with open(path, encoding="utf-8") as f:
        content = f.read()

    if len(content) > MAX_FILE_CHARS:
        return (
            content[:MAX_FILE_CHARS]
            + f"\n\n[TRUNCATED: file has {len(content)} characters, "
            + f"only first {MAX_FILE_CHARS} characters were included]"
        )
    return content

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
    print("\n── Step 1 ──────────────────────")
    files = list_files().splitlines()
    print("  🔧 Tool: list_files")
    print("  📥 Arguments: {}")
    print(f"  📤 Return: {chr(10).join(files)[:200]}")

    project_sections = []
    context_chars = 0
    for path in files:
        print(f"\n── Reading {path} ──────────────────────")
        try:
            content = read_file(path)
        except UnicodeDecodeError:
            print("  ⚠️ Skipped: not a UTF-8 text file")
            continue
        except OSError as exc:
            print(f"  ⚠️ Skipped: {exc}")
            continue

        section = f"## {path}\n```text\n{content}\n```"
        if context_chars + len(section) > MAX_CONTEXT_CHARS:
            print(f"  ⚠️ Skipped: context limit reached ({MAX_CONTEXT_CHARS} characters)")
            continue

        context_chars += len(section)
        print(f"  📤 Return: {content[:200]}")
        project_sections.append(section)

    messages = [
        {"role": "system", "content": "You are a README writer. Write clear, practical Markdown based only on the project files provided by the user."},
        {
            "role": "user",
            "content": (
                f"{task}\n\n"
                "Here are the project files that were read from disk:\n\n"
                + "\n\n".join(project_sections)
            )
        }
    ]

    print("\n── Step 2 ──────────────────────")
    print("  🤖 Generating README.md")
    response = client.chat.completions.create(
        # Qwen2.5-72B-Instruct has better README writing capability
        # but you can also try other models like Qwen2-14B-Instruct
        model="Qwen/Qwen2.5-72B-Instruct",
        messages=messages
    )
    readme = response.choices[0].message.content or ""
    print(f"  📤 Return: {readme[:200]}")

    print("\n── Step 3 ──────────────────────")
    result = write_file("README.md", readme)
    print(f"  📤 Return: {result}")

    print("\n✅ Final Answer:")
    print(result)

if __name__ == "__main__":
    run_agent("Read all code files, write a readme for this project, and save it to README.md. The readme should include an overview of the project, instructions on how to run the code, and explanations of the main components.")
