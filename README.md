# simpleagent

A minimal AI coding agent built in ~200 lines of TypeScript that can read, write, and navigate your filesystem using GEMINI AI.

## How It Works

The agent runs a simple loop:

1. You give it a task
2. The LLM decides which tool to call
3. Your program executes the tool locally
4. The result is sent back to the LLM
5. Repeat until the task is done

> The LLM never touches your filesystem directly - it just asks your program to run tools, and those tools do the actual work.

## Tools

| Tool | Description |
|------|-------------|
| `read_files` | Reads the content of a file |
| `list_files` | Lists all files inside the `/data` directory |
| `write_files` | Creates or overwrites a file with new content |

## Getting Started

### Prerequisites

- [Bun](https://bun.com) v1.3.14+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com)

### Setup

Install dependencies:

```bash
bun install
```

Create a `.env` file and add your API key:

```bash
GEMINI_API_KEY=your_api_key_here
```

### Run

```bash
bun run index.ts
```

By default, the agent will work inside the `/data` directory. All file operations are scoped to it.

## Customization

- **Swap the LLM provider** - Replace Gemini with OpenAI, Anthropic, or any other provider
- **Tweak the system prompt** - Change the agent's behavior and personality
- **Add more tools** - Extend it with bash execution, web search, database queries, and more

## Read More

This project was built as part of the *AI Agent Series*. Check out the full blog post to understand the architecture and core concepts behind it - [Read the blog post](https://priyanshuu.tech/blogs)


---