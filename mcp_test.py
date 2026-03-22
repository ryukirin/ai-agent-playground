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

if __name__ == "__main__":
    mcp.run()