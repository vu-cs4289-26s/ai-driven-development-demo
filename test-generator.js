/**
 * Runtime test scenario generators for the pathfinder module.
 *
 * Every grid, wall placement, and start/end position is generated randomly
 * at test time. This makes test inputs unpredictable — an AI agent cannot
 * game them by reading the repository or CI logs.
 *
 * The reference BFS oracle independently computes correct answers so the
 * test suite can validate any implementation without hardcoded expectations.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Random integer in [min, max] inclusive. */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Build a rows×cols grid and place walls. */
export function buildGrid(rows, cols, walls = []) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (const [r, c] of walls) {
    grid[r][c] = 1;
  }
  return grid;
}

/**
 * Generate random wall positions, guaranteeing that `exclude` cells stay
 * walkable.
 *
 * @param {number} rows
 * @param {number} cols
 * @param {number} density  Probability (0–1) that any non-excluded cell is a wall.
 * @param {number[][]} [exclude]  Cells that must remain walkable (e.g. start, end).
 * @returns {number[][]} Wall positions as [row, col] pairs.
 */
export function randomWalls(rows, cols, density, exclude = []) {
  const skip = new Set(exclude.map(([r, c]) => `${r},${c}`));
  const walls = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (skip.has(`${r},${c}`)) continue;
      if (Math.random() < density) walls.push([r, c]);
    }
  }
  return walls;
}

// ---------------------------------------------------------------------------
// Reference BFS oracle — cardinal-only, O(V + E)
// ---------------------------------------------------------------------------

/**
 * Compute the shortest path using cardinal (4-direction) BFS.
 *
 * Uses typed arrays and an index-based queue so it can handle 1 000 × 1 000
 * grids without the O(n) penalty of Array.prototype.shift().
 *
 * @param {number[][]} grid  2-D grid (0 = walkable, 1 = wall).
 * @param {number[]} start   [row, col] origin.
 * @param {number[]} end     [row, col] destination.
 * @returns {number[][]} Optimal path as [[r,c], …], or [] if unreachable.
 */
export function referenceBFS(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  const [sr, sc] = start;
  const [er, ec] = end;

  if (sr === er && sc === ec) return [[sr, sc]];

  // Flat index helpers
  const idx = (r, c) => r * cols + c;
  const totalCells = rows * cols;

  const visited = new Uint8Array(totalCells);
  const parentIdx = new Int32Array(totalCells).fill(-1);

  visited[idx(sr, sc)] = 1;

  // Index-based queue (O(1) dequeue)
  const queue = new Int32Array(totalCells);
  let front = 0;
  let back = 0;
  queue[back++] = idx(sr, sc);

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (front < back) {
    const ci = queue[front++];
    const r = (ci / cols) | 0;
    const c = ci % cols;

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const ni = idx(nr, nc);
      if (visited[ni] || grid[nr][nc] === 1) continue;

      visited[ni] = 1;
      parentIdx[ni] = ci;

      if (nr === er && nc === ec) {
        // Reconstruct path
        const path = [];
        let cur = ni;
        while (cur !== -1) {
          path.push([(cur / cols) | 0, cur % cols]);
          cur = parentIdx[cur];
        }
        path.reverse();
        return path;
      }

      queue[back++] = ni;
    }
  }

  return [];
}

// ---------------------------------------------------------------------------
// Scenario generators
// ---------------------------------------------------------------------------

/**
 * Generate a solvable pathfinding scenario.
 *
 * Picks random start/end positions, sprinkles random walls at the given
 * density, and verifies solvability with the reference BFS.  Retries up
 * to 50 times; falls back to an open grid if nothing works.
 */
export function generateSolvableScenario(rows, cols, wallDensity) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const start = [randomInt(0, rows - 1), randomInt(0, cols - 1)];
    let end = [randomInt(0, rows - 1), randomInt(0, cols - 1)];

    // Guarantee start ≠ end (unless 1×1)
    if (rows * cols > 1) {
      while (start[0] === end[0] && start[1] === end[1]) {
        end = [randomInt(0, rows - 1), randomInt(0, cols - 1)];
      }
    }

    const walls = randomWalls(rows, cols, wallDensity, [start, end]);
    const grid = buildGrid(rows, cols, walls);
    const optimalPath = referenceBFS(grid, start, end);

    if (optimalPath.length > 0) {
      return { grid, walls, start, end, optimalPath, rows, cols };
    }
  }

  // Fallback — an open grid always has a path
  const start = [0, 0];
  const end = [rows - 1, cols - 1];
  const grid = buildGrid(rows, cols, []);
  const optimalPath = referenceBFS(grid, start, end);
  return { grid, walls: [], start, end, optimalPath, rows, cols };
}

/**
 * Generate an unsolvable scenario by completely surrounding the start
 * cell with walls (all 8 neighbours, blocking both cardinal and diagonal
 * movement).
 *
 * @param {number} rows  Must be ≥ 3.
 * @param {number} cols  Must be ≥ 3.
 */
export function generateUnsolvableScenario(rows, cols) {
  // Place start in the interior so all 8 neighbours exist
  const sr = randomInt(1, rows - 2);
  const sc = randomInt(1, cols - 2);
  const start = [sr, sc];

  // Place end far away
  const er = sr <= rows / 2 ? rows - 1 : 0;
  const ec = sc <= cols / 2 ? cols - 1 : 0;
  const end = [er, ec];

  // Wall every neighbour of start (skip end if adjacent)
  const walls = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = sr + dr;
      const nc = sc + dc;
      if (nr === er && nc === ec) continue; // keep end walkable
      walls.push([nr, nc]);
    }
  }

  // Sprinkle extra walls for variety (avoid start & end)
  const extra = randomWalls(rows, cols, 0.15, [start, end, ...walls]);
  walls.push(...extra);

  const grid = buildGrid(rows, cols, walls);
  return { grid, walls, start, end, rows, cols };
}

// ---------------------------------------------------------------------------
// Debug helpers
// ---------------------------------------------------------------------------

/**
 * Human-readable scenario description for failed-test diagnostics.
 * Includes the full ASCII grid for small grids (≤ 15 × 15).
 */
export function describeScenario(scenario) {
  const { rows, cols, start, end, walls } = scenario;
  let desc = `${rows}×${cols}, start=[${start}], end=[${end}], ${walls?.length ?? "?"} walls`;

  if (rows <= 15 && cols <= 15 && scenario.grid) {
    desc +=
      "\n" +
      scenario.grid
        .map((row, r) =>
          row
            .map((cell, c) => {
              if (r === start[0] && c === start[1]) return "S";
              if (r === end[0] && c === end[1]) return "E";
              return cell === 1 ? "#" : ".";
            })
            .join(" ")
        )
        .join("\n");
  }

  return desc;
}
