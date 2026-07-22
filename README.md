# repo-to-llm

A lightweight, extremely fast Node.js tool that scans a local code repository, sanitizes the source code (stripping comments and excess whitespace), and compiles everything into a single, readable PDF file. 

**This tool is explicitly designed to help you feed entire repositories into Large Language Models (LLMs)** that accept document uploads, bypassing file-count limits and saving precious tokens.

### 🤖 Why use this for LLMs?

When working with models like Claude Sonnet 5, GPT-5.5, or Gemini 3.1 Pro (Preview), you often need to provide your existing codebase as context. However, uploading individual files is tedious, and many web UIs restrict the number of files you can attach. 

This generator solves that by bundling your code into a single document optimized for AI ingestion:
- **Token Optimization:** The "Remove Comments" and "Normalize Whitespace" features drastically reduce the character count, saving context window space and lowering API costs.
- **Contextual File Paths:** Each file in the PDF is prefixed with a clear header (`===== lib/scanner.ts =====`), allowing the LLM to understand your project structure and cross-file dependencies.
- **Single File Upload:** Easily bypass the 5-10 file upload limit on popular AI web interfaces by uploading one single, text-rich PDF containing your entire project.

### ✨ Features

- **🚀 Zero-Dependency PDF Generation**: Uses raw PDF buffer construction—no heavy external libraries like Puppeteer or PDFKit required.
- **🔍 Smart Scanning**: Automatically ignores binary files, images, `.git`, `node_modules`, and hidden environment variables by default.
- **🧹 Code Minification**: 
  - Language-agnostic comment stripping (`//`, `/* */`, and `#`).
  - Whitespace and newline normalization to save PDF pages/tokens.
- **🎛️ Clean Web GUI**: A simple, dark-mode web interface to configure your scan and download the PDF directly to your browser.
- **🛠️ Highly Customizable**: Easily override ignore folders, extensions, files (like `LICENSE` or `.gitignore`), and prefixes (like `.env`).

### 📦 Prerequisites

- **Node.js** (v18 or newer recommended)
- Because the project uses TypeScript (`.ts` files) natively, you may need a runtime execution tool like [`tsx`](https://github.com/privatenumber/tsx) or `ts-node`, or Node.js v22.6.0+ with experimental TS support.

### 🚀 Getting Started

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/repo-to-pdf.git
cd repo-to-pdf
```

2. Run the server:
You can run the server directly:
```sh
yarn dev
```

3. Open the Web GUI:
Open your browser and navigate to:

```text
http://localhost:3000
```

### 💻 How to Use

1. Enter the absolute path to the local repository you want to scan in the "Repository path" field (e.g., `/Users/name/Projects/my-app` or `C:\Projects\my-app`).
2. __(Optional)__ Add extra file extensions, folder names, or file prefixes you want to ignore.
3. Toggle the **Remove comments and Collapse multiple spaces** options based on your needs. (Highly recommended for LLM usage to save tokens).
4. Click **Generate PDF**. The server will process the files and automatically trigger a PDF download.
5. **Upload the resulting `repository.pdf` to your favorite LLM** and start asking architectural questions or requesting feature additions!

### 📂 Project Structure
- `server.ts` - The core HTTP web server and API endpoint handler.
- `lib/scanner.ts` - Recursively walks directories and filters files based on rules (extensions, exact names, prefixes, folders).
- `lib/processor.ts` - Handles text minification (regex-based whitespace normalization and a state-machine comment stripper).
- `lib/pdfWriter.ts` - Converts raw text data into an uncompressed PDF structure using binary buffers.
- `public/index.html` - The HTML front-end interface.

### ⚙️ Default Ignore Rules

By default, the tool is configured to skip common non-source files to keep your PDFs lean:

- **Folders**: node_modules, .git, .next, dist, build, .vscode, etc.
- **Extensions**: .png, .jpg, .pdf, .zip, .mp4, .exe, .dll, etc.
- **Exact Files**: LICENSE, .gitignore, .DS_Store, etc.
- **Prefixes**: .env, .pnp


### 📜 License

[MIT](LICENSE)
