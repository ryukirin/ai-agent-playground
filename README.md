# AI Agent Playground

This repository contains various scripts for experimenting with AI agents, particularly those using the MCP (Multi-Component Protocol) and OpenAI's language models. Below is an overview of the project, instructions on how to run the code, and explanations of the main components.

## Overview

The project includes several Python scripts that demonstrate different functionalities:

- **mcp_test.py**: A test script for the MCP server. It defines several tools such as `search_files`, `list_files`, `read_file`, `create_file`, and `write_file`.
- **react_test.py**: A script that uses OpenAI's language model to interact with the filesystem and execute commands. It includes functions for reading files, running commands, and writing files.
- **secret_logic_xyz.py**: A simple script that performs division and handles division by zero errors.
- **test.py**: A script that runs the `mcp_test.py` script and captures its output.
- **write_readme.py**: A script that generates a README file for the project by reading all code files and summarizing their contents.
- **write_readme_mcp.py**: A script that uses the MCP protocol to generate a README file for the project.

## Instructions

### Prerequisites

Before running the scripts, ensure you have the following installed:

- Python 3.9 or higher
- Required libraries (install using `pip`):
  ```sh
  pip install openai
  pip install mcp
  pip install dotenv
  ```

### Running the Scripts

1. **Set up environment variables**:
   - Create a `.env` file in the root directory and add your Hugging Face API token:
     ```
     HF_TOKEN=your_hugging_face_api_token
     ```

2. **Run the MCP server**:
   - Run the `mcp_test.py` script to start the MCP server:
     ```sh
     python mcp_test.py
     ```

3. **Run the agent scripts**:
   - Run the `react_test.py` script to interact with the filesystem and execute commands:
     ```sh
     python react_test.py
     ```
   - Run the `write_readme.py` script to generate a README file:
     ```sh
     python write_readme.py
     ```
   - Run the `write_readme_mcp.py` script to generate a README file using the MCP protocol:
     ```sh
     python write_readme_mcp.py
     ```

## Main Components

### mcp_test.py

This script sets up an MCP server and defines several tools for interacting with the filesystem. The tools include:

- `search_files`: Searches for files containing a specific keyword.
- `list_files`: Lists all code files in the current directory and subdirectories.
- `read_file`: Reads the content of a file.
- `create_file`: Creates a new file with specified content.
- `write_file`: Writes content to an existing file.

### react_test.py

This script uses OpenAI's language model to interact with the filesystem and execute commands. It includes functions for:

- Reading files.
- Running shell commands.
- Writing content to files.

### secret_logic_xyz.py

A simple script that performs division and handles division by zero errors.

### test.py

This script runs the `mcp_test.py` script and captures its output, which can be useful for testing and debugging.

### write_readme.py

This script generates a README file for the project by reading all code files and summarizing their contents.

### write_readme_mcp.py

This script uses the MCP protocol to generate a README file for the project.

## Contributing

Contributions are welcome! If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.