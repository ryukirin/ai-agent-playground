import subprocess
import os

result = subprocess.run(
    ["python", "mcp_test.py"],
    capture_output=True,
    text=True,
    timeout=3,
    cwd=os.path.dirname(os.path.abspath(__file__))
)
print("stdout:", repr(result.stdout))
print("stderr:", repr(result.stderr))
print("returncode:", result.returncode)