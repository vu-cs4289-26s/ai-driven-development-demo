import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createGrid, findPath, renderPath } from "./pathfinder.js";

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
function assertValidPath(grid, path, start, end) {
  assert.ok(path.length > 0, "Path should not be empty");

  // Starts at start
  assert.deepEqual(path[0], start, "Path should start at the start position");

  // Ends at end
  assert.deepEqual(
    path[path.length - 1],
    end,
    "Path should end at the end position"
  );

  for (let i = 0; i < path.length; i++) {
    const [r, c] = path[i];

    // Within bounds
    assert.ok(
      r >= 0 && r < grid.length && c >= 0 && c < grid[0].length,
      `Path position [${r}, ${c}] is out of bounds`
    );

    // Not on a wall
    assert.equal(grid[r][c], 0, `Path passes through wall at [${r}, ${c}]`);

    // Each step is adjacent to the previous
    if (i > 0) {
      assert.ok(
        isAdjacent(path[i - 1], path[i]),
        `Path steps [${path[i - 1]}] -> [${path[i]}] are not adjacent`
      );
    }
  }
}

/**
 * Run BFS ourselves (cardinal-only) to compute the known optimal path length.
 * Returns the path length (# of cells including start and end), or 0 if blocked.
 */
function bfsOptimalLength4Dir(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  if (start[0] === end[0] && start[1] === end[1]) return 1;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const dist = Array.from({ length: rows }, () => Array(cols).fill(-1));
  visited[start[0]][start[1]] = true;
  dist[start[0]][start[1]] = 1;
  const queue = [start];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited[nr][nc] || grid[nr][nc] === 1) continue;
      visited[nr][nc] = true;
      dist[nr][nc] = dist[r][c] + 1;
      if (nr === end[0] && nc === end[1]) return dist[nr][nc];
      queue.push([nr, nc]);
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// createGrid
// ---------------------------------------------------------------------------

describe("createGrid", () => {
  it("creates a grid with the correct number of rows and columns", () => {
    const grid = createGrid(3, 4);
    assert.equal(grid.length, 3);
    for (const row of grid) {
      assert.equal(row.length, 4);
    }
  });

  it("initializes all cells as walkable (0) when no walls are given", () => {
    const grid = createGrid(2, 3);
    for (const row of grid) {
      for (const cell of row) {
        assert.equal(cell, 0);
      }
    }
  });

  it("places walls at the specified positions", () => {
    const walls = [
      [0, 1],
      [2, 0],
    ];
    const grid = createGrid(3, 3, walls);
    assert.equal(grid[0][1], 1);
    assert.equal(grid[2][0], 1);
    assert.equal(grid[0][0], 0);
    assert.equal(grid[1][1], 0);
  });

  it("handles an empty walls array", () => {
    const grid = createGrid(2, 2, []);
    assert.equal(grid[0][0], 0);
    assert.equal(grid[1][1], 0);
  });

  it("creates a 1x1 grid", () => {
    const grid = createGrid(1, 1);
    assert.equal(grid.length, 1);
    assert.equal(grid[0].length, 1);
    assert.equal(grid[0][0], 0);
  });

  it("rows are independent — mutating one does not affect another", () => {
    const grid = createGrid(3, 3);
    grid[0][0] = 1;
    assert.equal(grid[1][0], 0, "Row 1 should be unaffected by mutating row 0");
    assert.equal(grid[2][0], 0, "Row 2 should be unaffected by mutating row 0");
  });

  it("creates a large grid with correct dimensions and wall placement", () => {
    const walls = [];
    for (let r = 0; r < 100; r++) {
      walls.push([r, 50]); // wall column down the middle
    }
    const grid = createGrid(100, 100, walls);
    assert.equal(grid.length, 100);
    assert.equal(grid[0].length, 100);
    // Verify all walls placed
    for (let r = 0; r < 100; r++) {
      assert.equal(grid[r][50], 1, `Wall missing at [${r}, 50]`);
      assert.equal(grid[r][49], 0, `Cell [${r}, 49] should be walkable`);
      assert.equal(grid[r][51], 0, `Cell [${r}, 51] should be walkable`);
    }
  });

  it("places many walls on a dense grid", () => {
    // Fill nearly every cell as a wall
    const walls = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!(r === 0 && c === 0) && !(r === 4 && c === 4)) {
          walls.push([r, c]);
        }
      }
    }
    const grid = createGrid(5, 5, walls);
    assert.equal(grid[0][0], 0, "Start corner should be walkable");
    assert.equal(grid[4][4], 0, "End corner should be walkable");
    assert.equal(grid[2][2], 1, "Center should be a wall");
    assert.equal(grid[0][1], 1);
  });
});

// ---------------------------------------------------------------------------
// findPath
// ---------------------------------------------------------------------------

describe("findPath", () => {
  it("finds a path on a wide-open grid", () => {
    const grid = createGrid(3, 3);
    const path = findPath(grid, [0, 0], [2, 2]);
    assertValidPath(grid, path, [0, 0], [2, 2]);
  });

  it("finds a path around obstacles", () => {
    // . # .
    // . # .
    // . . .
    const grid = createGrid(3, 3, [
      [0, 1],
      [1, 1],
    ]);
    const path = findPath(grid, [0, 0], [0, 2]);
    assertValidPath(grid, path, [0, 0], [0, 2]);
  });

  it("returns an empty array when no path exists", () => {
    // Wall completely blocks left from right
    const grid = createGrid(3, 3, [
      [0, 1],
      [1, 1],
      [2, 1],
    ]);
    const path = findPath(grid, [0, 0], [0, 2]);
    assert.ok(Array.isArray(path), "Should return an array");
    assert.equal(path.length, 0, "Should return an empty array when blocked");
  });

  it("returns a single-element path when start equals end", () => {
    const grid = createGrid(3, 3);
    const path = findPath(grid, [1, 1], [1, 1]);
    assert.ok(Array.isArray(path));
    assert.equal(path.length, 1);
    assert.deepEqual(path[0], [1, 1]);
  });

  it("finds the optimal path in a straight corridor", () => {
    const grid = createGrid(1, 5);
    const path = findPath(grid, [0, 0], [0, 4]);
    assertValidPath(grid, path, [0, 0], [0, 4]);
    assert.equal(path.length, 5, "Straight corridor path should be 5 cells");
  });

  it("navigates a maze-like grid", () => {
    // 5x5 with a serpentine wall pattern
    // . . . . .
    // # # # # .
    // . . . . .
    // . # # # #
    // . . . . .
    const walls = [
      [1, 0], [1, 1], [1, 2], [1, 3],
      [3, 1], [3, 2], [3, 3], [3, 4],
    ];
    const grid = createGrid(5, 5, walls);
    const path = findPath(grid, [0, 0], [4, 4]);
    assertValidPath(grid, path, [0, 0], [4, 4]);
  });

  it("works when start and end are adjacent", () => {
    const grid = createGrid(2, 2);
    const path = findPath(grid, [0, 0], [0, 1]);
    assertValidPath(grid, path, [0, 0], [0, 1]);
    assert.equal(path.length, 2);
  });

  // --- New: optimality tests ---

  it("finds the optimal path on a 10x10 open grid (cardinal)", () => {
    // Cardinal-only shortest from [0,0] to [9,9] = 19 steps (9 down + 9 right + 1 for start)
    const grid = createGrid(10, 10);
    const path = findPath(grid, [0, 0], [9, 9]);
    assertValidPath(grid, path, [0, 0], [9, 9]);
    // Must be at most 19 (cardinal optimal). If diagonal, could be 10.
    assert.ok(
      path.length <= 19,
      `Path is longer than cardinal optimal: ${path.length}`
    );
  });

  it("returns optimal path length on serpentine maze", () => {
    // The serpentine forces a specific route length
    const walls = [
      [1, 0], [1, 1], [1, 2], [1, 3],
      [3, 1], [3, 2], [3, 3], [3, 4],
    ];
    const grid = createGrid(5, 5, walls);
    const path = findPath(grid, [0, 0], [4, 4]);
    assertValidPath(grid, path, [0, 0], [4, 4]);
    const optimal = bfsOptimalLength4Dir(grid, [0, 0], [4, 4]);
    // If they use diagonal, path may be shorter than cardinal optimal, but must still be valid
    assert.ok(
      path.length <= optimal,
      `Path (${path.length}) is longer than cardinal BFS optimal (${optimal})`
    );
  });

  // --- New: boundary & edge tests ---

  it("navigates a vertical corridor (tall narrow grid)", () => {
    // 10x1 grid — only one path: straight down
    const grid = createGrid(10, 1);
    const path = findPath(grid, [0, 0], [9, 0]);
    assertValidPath(grid, path, [0, 0], [9, 0]);
    assert.equal(path.length, 10, "10x1 corridor path should be 10 cells");
  });

  it("navigates a horizontal corridor (wide flat grid)", () => {
    // 1x20 grid
    const grid = createGrid(1, 20);
    const path = findPath(grid, [0, 0], [0, 19]);
    assertValidPath(grid, path, [0, 0], [0, 19]);
    assert.equal(path.length, 20, "1x20 corridor path should be 20 cells");
  });

  it("finds path from corner to corner on a large open grid", () => {
    const grid = createGrid(20, 20);
    const path = findPath(grid, [0, 0], [19, 19]);
    assertValidPath(grid, path, [0, 0], [19, 19]);
  });

  it("handles start and end on the grid boundary (edges)", () => {
    const grid = createGrid(5, 5);
    // Top-right to bottom-left
    const path = findPath(grid, [0, 4], [4, 0]);
    assertValidPath(grid, path, [0, 4], [4, 0]);
  });

  // --- New: tricky wall configurations ---

  it("finds path when immediate neighbor of start is walled off", () => {
    // End is 1 cell to the right, but a wall blocks the direct path
    // S # E
    // . . .
    const grid = createGrid(2, 3, [[0, 1]]);
    const path = findPath(grid, [0, 0], [0, 2]);
    assertValidPath(grid, path, [0, 0], [0, 2]);
    // Must go around: [0,0] → [1,0] → [1,1] → [1,2] → [0,2] (or via diagonal)
    assert.ok(path.length >= 3, "Path must go around the wall");
  });

  it("navigates a single-cell-wide winding corridor", () => {
    // A forced winding path through a 5x5 grid:
    // S # . . .
    // . # . # .
    // . . . # .
    // . # # # .
    // . . . . E
    const walls = [
      [0, 1],
      [1, 1], [1, 3],
      [2, 3],
      [3, 1], [3, 2], [3, 3],
    ];
    const grid = createGrid(5, 5, walls);
    const path = findPath(grid, [0, 0], [4, 4]);
    assertValidPath(grid, path, [0, 0], [4, 4]);
  });

  it("returns empty array when start is surrounded by walls", () => {
    // . # .
    // # S #
    // . # .
    // (S is at [1,1], completely boxed in for cardinal movement)
    const walls = [
      [0, 1],
      [1, 0], [1, 2],
      [2, 1],
    ];
    const grid = createGrid(3, 3, walls);
    const path = findPath(grid, [1, 1], [0, 0]);
    // For cardinal movement, start is boxed in → no path
    // For diagonal, [1,1] → [0,0] is valid (diagonal, no wall at [0,0])
    // So we just verify it's either empty or valid
    if (path.length > 0) {
      assertValidPath(grid, path, [1, 1], [0, 0]);
    } else {
      assert.equal(path.length, 0);
    }
  });

  it("handles a grid where the only path goes along the perimeter", () => {
    // 4x4 grid, entire interior is walled off
    // . . . .
    // . # # .
    // . # # .
    // . . . .
    const walls = [
      [1, 1], [1, 2],
      [2, 1], [2, 2],
    ];
    const grid = createGrid(4, 4, walls);
    const path = findPath(grid, [0, 0], [3, 3]);
    assertValidPath(grid, path, [0, 0], [3, 3]);
    // No cell in the path should be interior
    for (const [r, c] of path) {
      assert.equal(grid[r][c], 0, `Path goes through wall at [${r}, ${c}]`);
    }
  });

  it("returns empty array for completely walled grid (except start and end)", () => {
    // 3x3 grid, everything is a wall except [0,0] and [2,2]
    const walls = [
      [0, 1], [0, 2],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1],
    ];
    const grid = createGrid(3, 3, walls);
    const path = findPath(grid, [0, 0], [2, 2]);
    assert.ok(Array.isArray(path));
    assert.equal(path.length, 0, "Should be blocked — no passable route");
  });

  it("handles dense obstacle field with a thin passable route", () => {
    // 7x7 grid, walls everywhere except a thin L-shaped corridor
    // S . # # # # #
    // # . # # # # #
    // # . # # # # #
    // # . . . . . .
    // # # # # # # .
    // # # # # # # .
    // # # # # # # E
    const walls = [];
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        walls.push([r, c]);
      }
    }
    // Carve the corridor
    const corridor = [
      [0, 0], [0, 1],
      [1, 1], [2, 1],
      [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6],
      [4, 6], [5, 6], [6, 6],
    ];
    const corridorSet = new Set(corridor.map(([r, c]) => `${r},${c}`));
    const actualWalls = walls.filter(([r, c]) => !corridorSet.has(`${r},${c}`));
    const grid = createGrid(7, 7, actualWalls);

    const path = findPath(grid, [0, 0], [6, 6]);
    assertValidPath(grid, path, [0, 0], [6, 6]);
    // Verify no path step is on a wall
    for (const [r, c] of path) {
      assert.equal(grid[r][c], 0, `Path passes through wall at [${r}, ${c}]`);
    }
    // Optimal cardinal length through this corridor is 13
    assert.ok(
      path.length <= 13,
      `Path (${path.length}) is longer than expected for the carved corridor`
    );
  });

  it("finds path on a large 50x50 grid with wall barriers", () => {
    // Two horizontal barriers with gaps at opposite ends
    const walls = [];
    for (let c = 0; c < 49; c++) walls.push([15, c]); // gap at col 49
    for (let c = 1; c < 50; c++) walls.push([35, c]); // gap at col 0
    const grid = createGrid(50, 50, walls);
    const path = findPath(grid, [0, 0], [49, 49]);
    assertValidPath(grid, path, [0, 0], [49, 49]);
  });

  it("path contains no duplicate positions", () => {
    const grid = createGrid(5, 5, [[1, 1], [1, 2], [2, 3]]);
    const path = findPath(grid, [0, 0], [4, 4]);
    assertValidPath(grid, path, [0, 0], [4, 4]);
    const seen = new Set();
    for (const [r, c] of path) {
      const key = `${r},${c}`;
      assert.ok(!seen.has(key), `Duplicate position in path: [${r}, ${c}]`);
      seen.add(key);
    }
  });

  it("returns path as an array of arrays (not objects or flat)", () => {
    const grid = createGrid(3, 3);
    const path = findPath(grid, [0, 0], [2, 2]);
    assert.ok(Array.isArray(path), "Path should be an array");
    for (const step of path) {
      assert.ok(Array.isArray(step), `Each step should be an array, got: ${typeof step}`);
      assert.equal(step.length, 2, `Each step should have 2 elements [row, col]`);
      assert.equal(typeof step[0], "number");
      assert.equal(typeof step[1], "number");
    }
  });

  it("finds correct path on asymmetric rectangular grid", () => {
    // 3 rows, 8 cols, wall in the middle row
    // . . . . . . . .
    // # # # . # # # #
    // . . . . . . . .
    const walls = [
      [1, 0], [1, 1], [1, 2],
      [1, 4], [1, 5], [1, 6], [1, 7],
    ];
    const grid = createGrid(3, 8, walls);
    const path = findPath(grid, [0, 0], [2, 7]);
    assertValidPath(grid, path, [0, 0], [2, 7]);
    // Must go through the gap at [1,3]
    const passesGap = path.some(([r, c]) => r === 1 && c === 3);
    assert.ok(passesGap, "Path should pass through the gap at [1, 3]");
  });
});

// ---------------------------------------------------------------------------
// renderPath
// ---------------------------------------------------------------------------

describe("renderPath", () => {
  it("returns a string", () => {
    const grid = createGrid(2, 2);
    const result = renderPath(grid, [[0, 0]], [0, 0], [0, 0]);
    assert.equal(typeof result, "string");
  });

  it("marks the start position with S", () => {
    const grid = createGrid(2, 2);
    const path = [
      [0, 0],
      [1, 1],
    ];
    const result = renderPath(grid, path, [0, 0], [1, 1]);
    assert.ok(result.includes("S"), "Output should contain S for start");
  });

  it("marks the end position with E", () => {
    const grid = createGrid(2, 2);
    const path = [
      [0, 0],
      [1, 1],
    ];
    const result = renderPath(grid, path, [0, 0], [1, 1]);
    assert.ok(result.includes("E"), "Output should contain E for end");
  });

  it("marks walls with #", () => {
    const grid = createGrid(2, 2, [[0, 1]]);
    const path = [
      [0, 0],
      [1, 0],
      [1, 1],
    ];
    const result = renderPath(grid, path, [0, 0], [1, 1]);
    assert.ok(result.includes("#"), "Output should contain # for walls");
  });

  it("marks path cells with *", () => {
    const grid = createGrid(1, 3);
    const path = [
      [0, 0],
      [0, 1],
      [0, 2],
    ];
    const result = renderPath(grid, path, [0, 0], [0, 2]);
    assert.ok(result.includes("*"), "Output should contain * for path cells");
  });

  it("has the correct number of lines for the grid", () => {
    const grid = createGrid(4, 3);
    const result = renderPath(grid, [[0, 0]], [0, 0], [0, 0]);
    const lines = result.trim().split("\n");
    assert.equal(lines.length, 4, `Expected 4 lines, got ${lines.length}`);
  });

  it("marks empty walkable cells with .", () => {
    const grid = createGrid(2, 2);
    const path = [
      [0, 0],
      [0, 1],
    ];
    const result = renderPath(grid, path, [0, 0], [0, 1]);
    assert.ok(
      result.includes("."),
      "Output should contain . for empty walkable cells"
    );
  });

  // --- New: exact string match ---

  it("produces exact expected output for a known small grid", () => {
    // 3x3, wall at [0,1], path: [0,0] → [1,0] → [2,0] → [2,1] → [2,2]
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
    // Row 0: S=start, #=wall, .=empty
    assert.equal(lines[0], "S # .");
    // Row 1: *=path, .=empty, .=empty
    assert.equal(lines[1], "* . .");
    // Row 2: *=path, *=path, E=end
    assert.equal(lines[2], "* * E");
  });

  it("renders empty path correctly (no * markers) on blocked grid", () => {
    // Grid is fully blocked, no path
    const grid = createGrid(3, 3, [
      [0, 1],
      [1, 1],
      [2, 1],
    ]);
    const emptyPath = [];
    const result = renderPath(grid, emptyPath, [0, 0], [0, 2]);
    // Should still render the grid with S and E but no * markers
    assert.ok(result.includes("S"), "Should show start even with empty path");
    assert.ok(result.includes("E"), "Should show end even with empty path");
    assert.ok(!result.includes("*"), "Should have no path markers when path is empty");
  });

  it("renders single-cell grid where start equals end", () => {
    const grid = createGrid(1, 1);
    const path = [[0, 0]];
    const result = renderPath(grid, path, [0, 0], [0, 0]);
    const trimmed = result.trim();
    // Should show S (start takes priority when start === end)
    assert.ok(
      trimmed === "S" || trimmed === "E",
      `Single cell should be S or E, got: "${trimmed}"`
    );
  });

  it("renders a larger grid with all cell types present", () => {
    // 3x4 grid with walls, path, empty cells, start, end
    // S * . #
    // . * # .
    // . * * E
    const grid = createGrid(3, 4, [[0, 3], [1, 2]]);
    const path = [
      [0, 0], [0, 1],
      [1, 1],
      [2, 1], [2, 2], [2, 3],
    ];
    const result = renderPath(grid, path, [0, 0], [2, 3]);
    assert.ok(result.includes("S"), "Missing start marker");
    assert.ok(result.includes("E"), "Missing end marker");
    assert.ok(result.includes("*"), "Missing path markers");
    assert.ok(result.includes("#"), "Missing wall markers");
    assert.ok(result.includes("."), "Missing empty cell markers");
    const lines = result.trim().split("\n");
    assert.equal(lines.length, 3, "Should have 3 rows");
  });

  // --- New: end-to-end pipeline ---

  it("end-to-end: createGrid → findPath → renderPath produces valid output", () => {
    const grid = createGrid(5, 5, [
      [1, 0], [1, 1], [1, 2], [1, 3],
      [3, 1], [3, 2], [3, 3], [3, 4],
    ]);
    const path = findPath(grid, [0, 0], [4, 4]);
    assertValidPath(grid, path, [0, 0], [4, 4]);

    const rendered = renderPath(grid, path, [0, 0], [4, 4]);
    assert.equal(typeof rendered, "string");

    const lines = rendered.trim().split("\n");
    assert.equal(lines.length, 5, "Rendered output should have 5 rows");

    // First character of first line should be S
    assert.ok(lines[0].trim().startsWith("S"), "First cell should be S");
    // Last character of last line should be E
    assert.ok(lines[4].trim().endsWith("E"), "Last cell should be E");

    // Count characters
    assert.ok(rendered.includes("#"), "Rendered output should show walls");
    assert.ok(rendered.includes("*"), "Rendered output should show path");
  });

  it("end-to-end: blocked path renders grid without path markers", () => {
    const grid = createGrid(3, 3, [
      [0, 1],
      [1, 1],
      [2, 1],
    ]);
    const path = findPath(grid, [0, 0], [0, 2]);
    assert.equal(path.length, 0, "Path should be empty (blocked)");

    const rendered = renderPath(grid, path, [0, 0], [0, 2]);
    assert.ok(rendered.includes("S"), "Should still render start");
    assert.ok(rendered.includes("E"), "Should still render end");
    assert.ok(!rendered.includes("*"), "No path markers when blocked");
    assert.ok(rendered.includes("#"), "Should render walls");
  });

  it("end-to-end: single cell where start equals end", () => {
    const grid = createGrid(3, 3);
    const path = findPath(grid, [1, 1], [1, 1]);
    assert.equal(path.length, 1);

    const rendered = renderPath(grid, path, [1, 1], [1, 1]);
    const lines = rendered.trim().split("\n");
    assert.equal(lines.length, 3);
    // The center cell should be S (or E), surrounded by dots
    assert.ok(
      rendered.includes("S") || rendered.includes("E"),
      "Center cell should be marked"
    );
  });
});
