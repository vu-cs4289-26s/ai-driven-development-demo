import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createGrid, findPath, renderPath } from "./pathfinder.js";
import {
  randomInt,
  randomWalls,
  buildGrid,
  referenceBFS,
  generateSolvableScenario,
  generateUnsolvableScenario,
  describeScenario,
} from "./test-generator.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if two [row, col] cells are adjacent (allows 4-dir or 8-dir). */
function isAdjacent(a, b) {
  const dr = Math.abs(a[0] - b[0]);
  const dc = Math.abs(a[1] - b[1]);
  return dr <= 1 && dc <= 1 && dr + dc > 0;
}

/** Validate that a path is legal on the given grid. */
function assertValidPath(grid, path, start, end, context = "") {
  const ctx = context ? ` | ${context}` : "";
  assert.ok(path.length > 0, `Path should not be empty${ctx}`);

  assert.deepEqual(
    path[0],
    start,
    `Path should start at [${start}]${ctx}`
  );
  assert.deepEqual(
    path[path.length - 1],
    end,
    `Path should end at [${end}]${ctx}`
  );

  for (let i = 0; i < path.length; i++) {
    const [r, c] = path[i];
    assert.ok(
      r >= 0 && r < grid.length && c >= 0 && c < grid[0].length,
      `Path position [${r},${c}] is out of bounds${ctx}`
    );
    assert.equal(
      grid[r][c],
      0,
      `Path passes through wall at [${r},${c}]${ctx}`
    );
    if (i > 0) {
      assert.ok(
        isAdjacent(path[i - 1], path[i]),
        `Steps [${path[i - 1]}] → [${path[i]}] are not adjacent${ctx}`
      );
    }
  }
}

/**
 * Parse a renderPath output string into a 2-D character array.
 * Each row is split by whitespace so "S # ." becomes ["S", "#", "."].
 */
function parseRendered(output) {
  return output
    .trim()
    .split("\n")
    .map((line) => line.trim().split(/\s+/));
}

// =========================================================================
//  STATIC SMOKE TESTS
//  A handful of deterministic tests that verify basic contract & edge cases.
// =========================================================================

// ---------------------------------------------------------------------------
// createGrid — smoke
// ---------------------------------------------------------------------------

describe("createGrid — smoke tests", () => {
  it("creates a grid with the correct number of rows and columns", () => {
    const grid = createGrid(3, 4);
    assert.equal(grid.length, 3);
    for (const row of grid) assert.equal(row.length, 4);
  });

  it("initializes all cells as walkable (0) when no walls are given", () => {
    const grid = createGrid(2, 3);
    for (const row of grid) {
      for (const cell of row) assert.equal(cell, 0);
    }
  });

  it("places walls at the specified positions", () => {
    const grid = createGrid(3, 3, [
      [0, 1],
      [2, 0],
    ]);
    assert.equal(grid[0][1], 1);
    assert.equal(grid[2][0], 1);
    assert.equal(grid[0][0], 0);
    assert.equal(grid[1][1], 0);
  });

  it("creates a 1×1 grid", () => {
    const grid = createGrid(1, 1);
    assert.equal(grid.length, 1);
    assert.equal(grid[0].length, 1);
    assert.equal(grid[0][0], 0);
  });
});

// ---------------------------------------------------------------------------
// findPath — smoke
// ---------------------------------------------------------------------------

describe("findPath — smoke tests", () => {
  it("finds a path on a wide-open grid", () => {
    const grid = createGrid(3, 3);
    const path = findPath(grid, [0, 0], [2, 2]);
    assertValidPath(grid, path, [0, 0], [2, 2]);
  });

  it("finds a path around obstacles", () => {
    const grid = createGrid(3, 3, [
      [0, 1],
      [1, 1],
    ]);
    const path = findPath(grid, [0, 0], [0, 2]);
    assertValidPath(grid, path, [0, 0], [0, 2]);
  });

  it("returns an empty array when no path exists", () => {
    const grid = createGrid(3, 3, [
      [0, 1],
      [1, 1],
      [2, 1],
    ]);
    const path = findPath(grid, [0, 0], [0, 2]);
    assert.ok(Array.isArray(path), "Should return an array");
    assert.equal(path.length, 0, "Should return empty when blocked");
  });

  it("returns a single-element path when start equals end", () => {
    const grid = createGrid(3, 3);
    const path = findPath(grid, [1, 1], [1, 1]);
    assert.ok(Array.isArray(path));
    assert.equal(path.length, 1);
    assert.deepEqual(path[0], [1, 1]);
  });

  it("returns path as array of [row, col] arrays", () => {
    const grid = createGrid(3, 3);
    const path = findPath(grid, [0, 0], [2, 2]);
    assert.ok(Array.isArray(path));
    for (const step of path) {
      assert.ok(Array.isArray(step), `Step should be array, got ${typeof step}`);
      assert.equal(step.length, 2);
      assert.equal(typeof step[0], "number");
      assert.equal(typeof step[1], "number");
    }
  });
});

// ---------------------------------------------------------------------------
// renderPath — smoke
// ---------------------------------------------------------------------------

describe("renderPath — smoke tests", () => {
  it("returns a string", () => {
    const grid = createGrid(2, 2);
    const result = renderPath(grid, [[0, 0]], [0, 0], [0, 0]);
    assert.equal(typeof result, "string");
  });

  it("produces exact expected output for a known small grid", () => {
    const grid = createGrid(3, 3, [[0, 1]]);
    const path = [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
    ];
    const result = renderPath(grid, path, [0, 0], [2, 2]);
    const lines = result.trim().split("\n").map((l) => l.trim());
    assert.equal(lines[0], "S # .");
    assert.equal(lines[1], "* . .");
    assert.equal(lines[2], "* * E");
  });

  it("has the correct number of lines for the grid", () => {
    const grid = createGrid(4, 3);
    const result = renderPath(grid, [[0, 0]], [0, 0], [0, 0]);
    const lines = result.trim().split("\n");
    assert.equal(lines.length, 4);
  });

  it("renders empty path correctly — no * markers", () => {
    const grid = createGrid(3, 3, [
      [0, 1],
      [1, 1],
      [2, 1],
    ]);
    const result = renderPath(grid, [], [0, 0], [0, 2]);
    assert.ok(result.includes("S"), "Should show start");
    assert.ok(result.includes("E"), "Should show end");
    assert.ok(!result.includes("*"), "No path markers when path is empty");
  });

  it("end-to-end: createGrid → findPath → renderPath", () => {
    const grid = createGrid(5, 5, [
      [1, 0], [1, 1], [1, 2], [1, 3],
      [3, 1], [3, 2], [3, 3], [3, 4],
    ]);
    const path = findPath(grid, [0, 0], [4, 4]);
    assertValidPath(grid, path, [0, 0], [4, 4]);

    const rendered = renderPath(grid, path, [0, 0], [4, 4]);
    assert.equal(typeof rendered, "string");
    const lines = rendered.trim().split("\n");
    assert.equal(lines.length, 5);
    assert.ok(lines[0].trim().startsWith("S"));
    assert.ok(lines[4].trim().endsWith("E"));
    assert.ok(rendered.includes("#"));
    assert.ok(rendered.includes("*"));
  });
});

// =========================================================================
//  DYNAMIC TESTS — randomly generated at runtime
//  New grids, wall layouts, and start/end positions every run.
// =========================================================================

const DYNAMIC_COUNT = 20;

// ---------------------------------------------------------------------------
// createGrid — dynamic (20 tests)
// ---------------------------------------------------------------------------

describe("createGrid — dynamic", () => {
  for (let i = 0; i < DYNAMIC_COUNT; i++) {
    // Mix of sizes: mostly small/medium, a few larger
    const rows = i < 15 ? randomInt(2, 100) : randomInt(100, 300);
    const cols = i < 15 ? randomInt(2, 100) : randomInt(100, 300);
    const density = Math.random() * 0.5;
    const walls = randomWalls(rows, cols, density);

    it(`[${i + 1}/${DYNAMIC_COUNT}] ${rows}×${cols} grid, ${walls.length} walls`, () => {
      const grid = createGrid(rows, cols, walls);

      // --- Dimensions ---
      assert.equal(grid.length, rows, `Expected ${rows} rows`);
      for (let r = 0; r < rows; r++) {
        assert.equal(grid[r].length, cols, `Row ${r}: expected ${cols} cols`);
      }

      // --- Wall placement & walkable cells ---
      const wallSet = new Set(walls.map(([r, c]) => `${r},${c}`));
      const mismatches = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const expected = wallSet.has(`${r},${c}`) ? 1 : 0;
          if (grid[r][c] !== expected) {
            mismatches.push({ r, c, got: grid[r][c], expected });
          }
        }
      }
      assert.equal(
        mismatches.length,
        0,
        `${mismatches.length} cell(s) wrong: ${JSON.stringify(mismatches.slice(0, 5))}`
      );

      // --- Row independence (no shared array references) ---
      if (rows >= 2) {
        // Rows must be distinct objects — not aliased references
        assert.notStrictEqual(grid[0], grid[1], "Rows should be independent arrays");
        // Mutating one row must not affect another
        const savedR0 = grid[0][0];
        const savedR1 = grid[1][0];
        grid[0][0] = savedR0 === 0 ? 99 : 0; // flip to a different value
        assert.equal(
          grid[1][0],
          savedR1,
          "Mutating row 0 should not affect row 1"
        );
        grid[0][0] = savedR0; // restore
      }
    });
  }
});

// ---------------------------------------------------------------------------
// findPath — dynamic solvable (15 tests, including 3 × 1000×1000)
// ---------------------------------------------------------------------------

describe("findPath — dynamic solvable", () => {
  const SOLVABLE_COUNT = 15;

  const configs = [];
  // 12 small/medium
  for (let i = 0; i < 12; i++) {
    configs.push({
      rows: randomInt(5, 100),
      cols: randomInt(5, 100),
      density: Math.random() * 0.3,
      label: "small/medium",
    });
  }
  // 3 stress tests
  for (let i = 0; i < 3; i++) {
    configs.push({
      rows: 1000,
      cols: 1000,
      density: 0.1 + Math.random() * 0.15,
      label: "stress 1000×1000",
    });
  }

  for (let i = 0; i < configs.length; i++) {
    const { rows, cols, density, label } = configs[i];

    it(`[${i + 1}/${SOLVABLE_COUNT}] ${label}: ${rows}×${cols}, ~${(density * 100).toFixed(0)}% walls`, () => {
      const scenario = generateSolvableScenario(rows, cols, density);
      const { grid, start, end, optimalPath } = scenario;

      const path = findPath(grid, start, end);
      const ctx = describeScenario(scenario);

      // Must be a valid path
      assertValidPath(grid, path, start, end, ctx);

      // Must be optimal (no longer than reference BFS)
      assert.ok(
        path.length <= optimalPath.length,
        `Path length ${path.length} exceeds optimal ${optimalPath.length} | ${ctx}`
      );

      // No duplicate positions
      const seen = new Set();
      for (const [r, c] of path) {
        const key = `${r},${c}`;
        assert.ok(!seen.has(key), `Duplicate position [${r},${c}] | ${ctx}`);
        seen.add(key);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// findPath — dynamic unsolvable (5 tests)
// ---------------------------------------------------------------------------

describe("findPath — dynamic unsolvable", () => {
  const UNSOLVABLE_COUNT = 5;

  for (let i = 0; i < UNSOLVABLE_COUNT; i++) {
    const rows = randomInt(5, 50);
    const cols = randomInt(5, 50);

    it(`[${i + 1}/${UNSOLVABLE_COUNT}] blocked ${rows}×${cols}`, () => {
      const scenario = generateUnsolvableScenario(rows, cols);
      const { grid, start, end } = scenario;
      const ctx = describeScenario(scenario);

      const path = findPath(grid, start, end);

      assert.ok(Array.isArray(path), `Should return an array | ${ctx}`);
      assert.equal(path.length, 0, `Should return [] when blocked | ${ctx}`);
    });
  }
});

// ---------------------------------------------------------------------------
// renderPath — dynamic solvable (15 tests)
// ---------------------------------------------------------------------------

describe("renderPath — dynamic solvable", () => {
  const RENDER_SOLVABLE = 15;

  for (let i = 0; i < RENDER_SOLVABLE; i++) {
    const rows = randomInt(3, 30);
    const cols = randomInt(3, 30);

    it(`[${i + 1}/${RENDER_SOLVABLE}] rendered ${rows}×${cols} with path`, () => {
      const scenario = generateSolvableScenario(rows, cols, Math.random() * 0.3);
      const { grid, start, end, optimalPath } = scenario;
      const ctx = describeScenario(scenario);

      const output = renderPath(grid, optimalPath, start, end);
      const chars = parseRendered(output);

      // Correct number of lines
      assert.equal(chars.length, rows, `Expected ${rows} rows | ${ctx}`);

      // Each line has correct column count
      for (let r = 0; r < rows; r++) {
        assert.equal(
          chars[r].length,
          cols,
          `Row ${r}: expected ${cols} cols, got ${chars[r].length} | ${ctx}`
        );
      }

      // S at start
      assert.equal(
        chars[start[0]][start[1]],
        "S",
        `Expected S at [${start}] | ${ctx}`
      );

      // E at end (unless start == end, then S takes priority)
      if (start[0] !== end[0] || start[1] !== end[1]) {
        assert.equal(
          chars[end[0]][end[1]],
          "E",
          `Expected E at [${end}] | ${ctx}`
        );
      }

      // Walls are #
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] === 1) {
            // Wall cells that are not start/end should be #
            const isStart = r === start[0] && c === start[1];
            const isEnd = r === end[0] && c === end[1];
            if (!isStart && !isEnd) {
              assert.equal(
                chars[r][c],
                "#",
                `Expected # at wall [${r},${c}] | ${ctx}`
              );
            }
          }
        }
      }

      // Path intermediate cells (not start/end) are *
      const pathSet = new Set(optimalPath.map(([r, c]) => `${r},${c}`));
      for (const [r, c] of optimalPath) {
        const isStart = r === start[0] && c === start[1];
        const isEnd = r === end[0] && c === end[1];
        if (!isStart && !isEnd) {
          assert.equal(
            chars[r][c],
            "*",
            `Expected * at path cell [${r},${c}] | ${ctx}`
          );
        }
      }

      // Empty walkable cells (not on path, not wall, not start, not end) are .
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const isStart = r === start[0] && c === start[1];
          const isEnd = r === end[0] && c === end[1];
          const isWall = grid[r][c] === 1;
          const isPath = pathSet.has(`${r},${c}`);
          if (!isStart && !isEnd && !isWall && !isPath) {
            assert.equal(
              chars[r][c],
              ".",
              `Expected . at empty cell [${r},${c}] | ${ctx}`
            );
          }
        }
      }

      // Only valid characters
      const validChars = new Set(["S", "E", "*", "#", "."]);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          assert.ok(
            validChars.has(chars[r][c]),
            `Unexpected char '${chars[r][c]}' at [${r},${c}] | ${ctx}`
          );
        }
      }
    });
  }
});

// ---------------------------------------------------------------------------
// renderPath — dynamic unsolvable (5 tests)
// ---------------------------------------------------------------------------

describe("renderPath — dynamic unsolvable", () => {
  const RENDER_UNSOLVABLE = 5;

  for (let i = 0; i < RENDER_UNSOLVABLE; i++) {
    const rows = randomInt(5, 25);
    const cols = randomInt(5, 25);

    it(`[${i + 1}/${RENDER_UNSOLVABLE}] rendered ${rows}×${cols} blocked`, () => {
      const scenario = generateUnsolvableScenario(rows, cols);
      const { grid, start, end } = scenario;
      const ctx = describeScenario(scenario);

      const output = renderPath(grid, [], start, end);
      const chars = parseRendered(output);

      // Correct dimensions
      assert.equal(chars.length, rows, `Expected ${rows} rows | ${ctx}`);
      for (let r = 0; r < rows; r++) {
        assert.equal(chars[r].length, cols, `Row ${r}: expected ${cols} cols | ${ctx}`);
      }

      // S at start, E at end
      assert.equal(chars[start[0]][start[1]], "S", `Expected S at [${start}] | ${ctx}`);
      if (start[0] !== end[0] || start[1] !== end[1]) {
        assert.equal(chars[end[0]][end[1]], "E", `Expected E at [${end}] | ${ctx}`);
      }

      // No * markers (empty path)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          assert.notEqual(
            chars[r][c],
            "*",
            `Unexpected * at [${r},${c}] with empty path | ${ctx}`
          );
        }
      }
    });
  }
});
