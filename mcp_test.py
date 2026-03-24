import os
import subprocess

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-first-server")

@mcp.tool()
def search_files(keyword: str) -> list:
    """
    search files in current directory and subdirectories
    return list of file paths that contain the keyword in their names
    """
    import os

    results = []
    for root, dirs, files in os.walk("."):
        for file in files:
            if keyword in file:
                results.append(os.path.join(root, file))
    return results

@mcp.tool()
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

@mcp.tool()
def read_file(path: str) -> str:
    """read file content"""
    with open(path, encoding="utf-8") as f:
        return f.read()

@mcp.tool()
def create_file(path: str, content: str) -> str:
    """create file with content"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return f"Created {path}"

@mcp.tool()
def write_file(path: str, content: str) -> str:
    """write content to file"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return f"Written to {path}"

if __name__ == "__main__":
    mcp.run()