# AI-Driven Development — Pathfinder Demo

A hands-on exercise demonstrating AI-driven development. You'll use an AI coding agent to implement a BFS pathfinding module from a product requirements document — without writing any code yourself.

## What's in This Repo

| File | Purpose |
|---|---|
| `PRD.md` | Product requirements describing what to build |
| `pathfinder.js` | Function stubs — the agent will implement these |
| `pathfinder.test.js` | Static smoke tests + dynamically generated tests (different every run) |
| `test-generator.js` | Runtime test scenario generator with a reference BFS oracle |
| `package.json` | Run tests with `npm test` |

## Prerequisites

- [Node.js](https://nodejs.org/) (v22+)
- [Git](https://git-scm.com/)
- A GitHub account with access to this repo

## Setup

### 1. Install OpenCode

[OpenCode](https://opencode.ai/) is the AI coding agent you'll use to build the implementation.

```bash
curl -fsSL https://opencode.ai/install | bash
```

### 2. Install GitHub CLI

[GitHub CLI](https://cli.github.com/) lets the agent create pull requests directly from the terminal.

```bash
# macOS
brew install gh

# or see https://cli.github.com/ for other platforms
```

Then authenticate:

```bash
gh auth login
```

### 3. Get an NVIDIA NIM API Key

We'll be using a model hosted on [NVIDIA NIM](https://developer.nvidia.com/nim).

1. Go to [build.nvidia.com](https://build.nvidia.com) and sign in
2. Find the model and grab an API key

### 4. Authenticate OpenCode with NVIDIA NIM

Run the following to add your NVIDIA NIM API key to OpenCode:

```bash
opencode auth login
```

Select NVIDIA NIM as the provider and paste your API key when prompted.

### 5. Clone and Branch

```bash
git clone <this-repo-url>
cd ai-driven-development-demo
git checkout -b <your-name>/pathfinder
```

## The Exercise

### 1. Launch OpenCode

```bash
opencode
```

### 2. Plan First (Plan Mode)

OpenCode has two modes: **Plan** and **Build**. Start in Plan mode (`ctrl+p` to switch modes) and have the agent read the codebase and think through an approach before writing any code.

Example prompts for Plan mode:

```
Read PRD.md, pathfinder.js, and pathfinder.test.js. Outline a plan for implementing the BFS pathfinder.
```

```
What data structures would work best for the BFS queue and visited set on this grid?
```

```
Look at the tests — are there any edge cases I should think about before we start coding?
```

The agent will ask you about the **2 open design decisions** in the PRD. Answer them however you like — there are no wrong answers.

### 3. Build It (Build Mode)

Switch to Build mode (`ctrl+p` → Build) and let the agent implement the solution.

Example prompts for Build mode:

```
Implement all three functions in pathfinder.js based on the PRD. Run npm test after each change.
```

```
The findPath tests are failing — read the test output and fix the implementation.
```

```
All tests pass. Commit the changes and create a pull request using gh.
```

### 4. Watch It Work

Pay attention to:

- **Does it read the PRD and test file first?** (Planning)
- **Does it ask about the open design decisions?** (Clarification)
- **How does it structure the BFS implementation?** (Code generation)
- **Does it run the tests and iterate on failures?** (Self-correction)

### 5. Verify Locally

```bash
npm test
```

You should see all 75 tests pass (14 static + 60 dynamically generated).

### 6. Create a Pull Request

Ask the agent to open a PR:

```
Commit our changes and create a pull request with a summary of what we built using gh
```

GitHub Actions CI will run the same tests on your PR. Check for the green checkmark.

## Links

- [OpenCode](https://opencode.ai/) — AI coding agent
- [NVIDIA NIM](https://developer.nvidia.com/nim) — Model hosting
- [GitHub CLI](https://cli.github.com/) — CLI for GitHub
