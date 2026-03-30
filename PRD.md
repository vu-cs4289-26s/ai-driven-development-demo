# BFS Pathfinder — Product Requirements Document

## Overview

Build a JavaScript module that finds the shortest path between two points on a 2D grid using **Breadth-First Search (BFS)**. The module should also be able to render the grid and path as ASCII art in the terminal.

The function signatures are already defined in `pathfinder.js` — your job is to implement them so that all tests in `pathfinder.test.js` pass.

## What Already Exists

| File | Purpose |
|---|---|
| `pathfinder.js` | Function stubs with JSDoc — implement these |
| `pathfinder.test.js` | Pre-written tests — your implementation must pass these |
| `package.json` | Run tests with `npm test` |

## Functions to Implement

All functions are in `pathfinder.js`. See the JSDoc comments in that file for full type signatures.

### `createGrid(rows, cols, walls?)`

Create a 2D array representing a grid.

- Each cell is `0` (walkable) or `1` (wall).
- `walls` is an optional array of `[row, col]` positions to mark as impassable.
- All other cells should be `0`.

### `findPath(grid, start, end)`

Find the shortest path from `start` to `end` on the grid using **BFS**.

- `start` and `end` are `[row, col]` coordinates.
- Return an array of `[row, col]` positions from start to end, **inclusive** of both endpoints.
- If no path exists, return an **empty array** `[]`.
- If `start` equals `end`, return a single-element array `[[row, col]]`.

### `renderPath(grid, path, start, end)`

Render the grid as an ASCII string for terminal output.

- Use these characters:
  - `S` — start position
  - `E` — end position
  - `*` — path cell (not start or end)
  - `#` — wall
  - `.` — walkable empty cell (not on the path)
- Each row of the grid should be one line in the output.
- Separate cells with a space.

Example output for a 3x3 grid:
```
S * .
. # *
. . E
```

## Open Design Decisions

The following decisions are intentionally left unspecified. **Ask the user which option they prefer before implementing:**

### 1. Diagonal Movement

Should the pathfinder allow diagonal movement?

- **A)** Cardinal only — 4 directions (up, down, left, right)
- **B)** Cardinal + diagonal — 8 directions (including diagonals)

This affects how neighbors are discovered during BFS. The tests are written to accept either choice.

### 2. Invalid Input Handling

If the start or end position is on a wall or out of bounds, should the function:

- **A)** Return an empty array `[]` (treat it like "no path found")
- **B)** Throw a descriptive error

The tests only cover valid inputs, so either approach will pass — but pick one and be consistent.

## Running Tests

```bash
npm test
```

All tests use Node's built-in test runner (`node:test`). No additional dependencies are needed.

## Verification

Once all tests pass locally, create a pull request. GitHub Actions CI will run the same tests to verify your implementation.
