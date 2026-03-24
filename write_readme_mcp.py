import sys

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from openai import OpenAI
import json
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

llm = OpenAI(
    api_key=os.environ["HF_TOKEN"],
    base_url="https://router.huggingface.co/v1"
)

async def run_agent(task: str):
    # Start MCP Server
    server_params = StdioServerParameters(
        command=sys.executable,  # use Python at current environment
        args=[os.path.join(os.path.dirname(os.path.abspath(__file__)), "mcp_test.py")],
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # Get tools from MCP server
            mcp_tools = await session.list_tools()

            # Convert to OpenAI format
            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.inputSchema
                    }
                }
                for tool in mcp_tools.tools
            ]

            messages = [
                {"role": "system", "content": (
                    "You are a readme writer. "
                    "Step 1: call list_files to get all files. "
                    "Step 2: call read_file to read each code file. "
                    "Step 3: you MUST call write_file to save the result to README.md. "
                    "The task is NOT complete until write_file has been called."
                )},
                {"role": "user", "content": task}
            ]
            step = 0

            while True:
                tool_choice = "required" if step == 0 else "auto"
                response = llm.chat.completions.create(
                    model="Qwen/Qwen2.5-72B-Instruct",
                    messages=messages,
                    tools=tools,
                    tool_choice=tool_choice
                )

                msg = response.choices[0].message
                messages.append(msg)

                if not msg.tool_calls:
                    print("\n✅ Final Answer:")
                    print(msg.content)
                    break

                step += 1
                print(f"\n── Step {step} ──────────────────────")

                for tool_call in msg.tool_calls:
                    fn_name = tool_call.function.name
                    fn_args = json.loads(tool_call.function.arguments)
                    print(f"  🔧 Tool: {fn_name}")
                    print(f"  📥 Arguments: {fn_args}")

                    # Call the tool via MCP session
                    result = await session.call_tool(fn_name, fn_args)
                    output = result.content[0].text
                    print(f"  📤 Return: {output[:200]}")

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": output
                    })

if __name__ == "__main__":
    asyncio.run(run_agent("Write a readme for this project based on the code files."))