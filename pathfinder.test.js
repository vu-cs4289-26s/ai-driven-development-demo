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
    // Other cells remain walkable
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
    // . # .
    // . # .
    // . # .
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
    // 1x5 corridor — only one shortest path regardless of diagonal setting
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
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
      [3, 1],
      [3, 2],
      [3, 3],
      [3, 4],
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
    // 1x3 grid, path goes through middle cell
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
    // 2x2 grid, path only on [0,0] -> [0,1]
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
});
