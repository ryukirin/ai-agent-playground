# AI Agent Playground

This repository is designed to serve as a playground for experimenting with AI agents, particularly those using the Hugging Face models and the MCP framework. It includes various scripts for interacting with AI models, testing functionalities, and generating useful outputs such as automated README files.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
- [Getting Started](#getting-started)
- [Running the Code](#running-the-code)
- [Contributing](#contributing)

## Overview

The `ai-agent-playground` is a collection of Python scripts that demonstrate how to interact with AI models through different APIs. The primary focus is on using the Hugging Face models and the MCP (Multi-Component Protocol) framework to build and test AI agents.

## Components

### `mcp_test.py`

This script sets up a FastMCP server that provides a tool for searching files in the current directory and its subdirectories based on a keyword. The server can be started by running the script directly.

### `react_test.py`

This script demonstrates how to use the Hugging Face API to interact with a language model. It includes functions for reading files, running commands, and writing files. The script also contains a function to run an agent that reads a file, finds bugs, and fixes them.

### `secret_logic_xyz.py`

A simple utility script that defines a function to perform division, handling division by zero errors.

### `write_readme.py`

This script automates the creation of a README file for the project. It lists all code files, reads their contents, and generates a detailed README file.

## Getting Started

To get started with this project, follow these steps:

1. **Clone the Repository:**
   ```sh
   git clone https://github.com/yourusername/ai-agent-playground.git
   cd ai-agent-playground
   ```

2. **Set Up the Environment:**
   - Create a virtual environment:
     ```sh
     python -m venv .venv
     ```
   - Activate the virtual environment:
     - On Windows:
       ```sh
       .\.venv\Scripts\activate
       ```
     - On macOS/Linux:
       ```sh
       source .venv/bin/activate
       ```
   - Install the required dependencies:
     ```sh
     pip install -r requirements.txt
     ```

3. **Configure Environment Variables:**
   - Create a `.env` file in the root directory and add your Hugging Face API token:
     ```ini
     HF_TOKEN=your_hugging_face_api_token
     ```

## Running the Code

### Running the MCP Server

To start the MCP server, run the following command:

```sh
python mcp_test.py
```

### Running the React Test Script

To run the script that interacts with the Hugging Face API, use the following command:

```sh
python react_test.py
```

### Running the Write README Script

To generate a README file automatically, run the following command:

```sh
python write_readme.py
```

## Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.

1. **Fork the Repository:**
   ```sh
   git fork https://github.com/yourusername/ai-agent-playground.git
   ```

2. **Create a Branch:**
   ```sh
   git checkout -b feature/your-feature
   ```

3. **Commit Your Changes:**
   ```sh
   git commit -m "Add your feature"
   ```

4. **Push to Your Fork:**
   ```sh
   git push origin feature/your-feature
   ```

5. **Submit a Pull Request:**
   - Go to the original repository and click on "New Pull Request."

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
