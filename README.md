# AI Agent & Harness Learning Project

This project is designed to systematically learn AI agents and their underlying support layers (Harness). It is structured to guide you through the development process, from understanding the basics to implementing complex systems. Below is an overview of the project, how to run the code, and explanations of the main components.

## Overview

The project is divided into several modules and guides to provide a comprehensive learning experience. The core components and scripts are:

- **`mcp_test.py`**: A basic implementation of an AI agent using the MCP protocol to manage tools and tasks.
- **`react_test.py`**: A script that demonstrates how to use Hugging Face models and tools to execute commands and manipulate files.
- **`secret_logic_xyz.py`**: A simple script containing a division function that can be used for testing purposes.
- **`test.py`**: A script to test the `mcp_test.py` script.
- **`write_readme.py`**: A script that generates a README file based on the project files.
- **`write_readme_mcp.py`**: A script that uses MCP to generate a README file.

The project also includes a comprehensive learning guide in the `guide` directory, which provides detailed explanations and exercises to help you understand and implement AI agents and their harnesses.

## Instructions on How to Run the Code

### Prerequisites

1. **Python**: Ensure you have Python installed on your system.
2. **Virtual Environment**: It is recommended to use a virtual environment to manage dependencies.
3. **Hugging Face Token**: You need to set the `HF_TOKEN` environment variable for accessing Hugging Face models.

### Setting Up the Environment

1. **Create a Virtual Environment**:
   ```sh
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install Dependencies**:
   ```sh
   pip install -r requirements.txt  # Ensure you have a requirements.txt file with necessary packages
   ```

### Running the Scripts

1. **Run `mcp_test.py`**:
   ```sh
   python mcp_test.py
   ```

2. **Run `react_test.py`**:
   ```sh
   python react_test.py
   ```

3. **Run `test.py`**:
   ```sh
   python test.py
   ```

4. **Generate README using `write_readme.py`**:
   ```sh
   python write_readme.py
   ```

5. **Generate README using `write_readme_mcp.py`**:
   ```sh
   python write_readme_mcp.py
   ```

### Project Structure

- **`mcp_test.py`**:
  - Implements an AI agent using the MCP protocol.
  - Registers tools for file manipulation and searching.
  - Runs the agent to execute tasks.

- **`react_test.py`**:
  - Uses the Hugging Face API to create an AI agent.
  - Demonstrates how to read files, execute commands, and write files.
  - Runs the agent to complete a task.

- **`secret_logic_xyz.py`**:
  - A simple script with a division function.
  - Used for testing purposes.

- **`test.py`**:
  - Tests the `mcp_test.py` script by running it and capturing the output.

- **`write_readme.py`**:
  - Generates a README file based on the project files.
  - Uses the Hugging Face API to write the README.

- **`write_readme_mcp.py`**:
  - Generates a README file using the MCP protocol.
  - Demonstrates how to integrate with an MCP server.

- **`guide` Directory**:
  - Contains a comprehensive learning guide with detailed explanations and exercises.
  - Includes multiple chapters on AI agents, harnesses, and related concepts.

## Main Components

### `mcp_test.py`

This script sets up an AI agent using the MCP protocol. It defines several tools for file manipulation and searching and runs the agent to execute tasks.

### `react_test.py`

This script demonstrates how to use the Hugging Face API to create an AI agent. It defines tools for reading files, executing commands, and writing files, and runs the agent to complete a task.

### `secret_logic_xyz.py`

This script contains a simple division function that can be used for testing purposes. It includes error handling for division by zero.

### `test.py`

This script tests the `mcp_test.py` script by running it and capturing the output. It verifies the correctness of the `mcp_test.py` script.

### `write_readme.py`

This script generates a README file based on the project files. It uses the Hugging Face API to read the project files and write the README.

### `write_readme_mcp.py`

This script generates a README file using the MCP protocol. It demonstrates how to integrate with an MCP server and manage the generation process.

## Learning Guide

The `guide` directory contains a comprehensive learning guide with detailed explanations and exercises. The guide is divided into multiple chapters, each covering a specific aspect of AI agents and their harnesses. The chapters are:

- **00_说明.md**: Introduction and index.
- **01_阶段1_LLM基础.md**: LLM foundation.
- **02_阶段2_ReAct循环.md**: Core loop of AI agents.
- **03_阶段3_工具设计.md**: Tool design.
- **04_阶段4_上下文工程.md**: Context engineering.
- **05_阶段5_Harness九大组件.md**: Anatomy of a harness.
- **06_阶段6_工作流与智能体.md**: Workflows vs. agents.
- **07_阶段7_评估安全运维.md**: Evaluation, safety, and operations.
- **08_阶段8_框架.md**: Moving to frameworks.
- **09_阶段9_MCP.md**: MCP protocol.
- **10_阶段10_多智能体.md**: Multi-agents.
- **11_毕业之路与参考文献.md**: Next steps and references.

Each chapter includes explanations, example code, and exercises to help you understand and implement the concepts.

## Conclusion

This project provides a structured and comprehensive approach to learning AI agents and their harnesses. By following the instructions and completing the exercises, you will gain a deep understanding of how to build and manage AI agents for various tasks. Happy coding!