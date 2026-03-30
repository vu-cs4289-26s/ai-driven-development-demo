/**
 * Create a 2D grid of the given dimensions.
 *
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {number[][]} [walls] - Array of [row, col] positions that are impassable
 * @returns {number[][]} 2D array where 0 = walkable, 1 = wall
 */
export function createGrid(rows, cols, walls = []) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (const [r, c] of walls) {
    grid[r][c] = 1;
  }
  return grid;
}

/**
 * Find the shortest path from start to end on the grid using BFS.
 * Uses 4-directional (cardinal) movement.
 *
 * @param {number[][]} grid - 2D grid (0 = walkable, 1 = wall)
 * @param {number[]} start - [row, col] starting position
 * @param {number[]} end - [row, col] ending position
 * @returns {number[][]} Array of [row, col] positions from start to end (inclusive),
 *                        or an empty array if no path exists
 */
export function findPath(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  const [sr, sc] = start;
  const [er, ec] = end;

  // Start equals end
  if (sr === er && sc === ec) {
    return [[sr, sc]];
  }

  // Cardinal directions: up, down, left, right
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  // Each queue entry stores [row, col] — we reconstruct the path via a parent map
  const parent = Array.from({ length: rows }, () => Array(cols).fill(null));

  visited[sr][sc] = true;
  const queue = [[sr, sc]];

  while (queue.length > 0) {
    const [r, c] = queue.shift();

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited[nr][nc]) continue;
      if (grid[nr][nc] === 1) continue;

      visited[nr][nc] = true;
      parent[nr][nc] = [r, c];

      if (nr === er && nc === ec) {
        // Reconstruct path
        const path = [[er, ec]];
        let cur = [er, ec];
        while (cur[0] !== sr || cur[1] !== sc) {
          cur = parent[cur[0]][cur[1]];
          path.push(cur);
        }
        path.reverse();
        return path;
      }

      queue.push([nr, nc]);
    }
  }

  return [];
}

/**
 * Render the grid and path as an ASCII string for terminal output.
 *
 * Characters:
 *   S = start
 *   E = end
 *   * = path
 *   # = wall
 *   . = walkable empty cell
 *
 * @param {number[][]} grid - 2D grid
 * @param {number[][]} path - Array of [row, col] positions representing the path
 * @param {number[]} start - [row, col] starting position
 * @param {number[]} end - [row, col] ending position
 * @returns {string} ASCII representation of the grid with the path marked
 */
export function renderPath(grid, path, start, end) {
  const pathSet = new Set(path.map(([r, c]) => `${r},${c}`));
  const [sr, sc] = start;
  const [er, ec] = end;

  const lines = grid.map((row, r) => {
    return row
      .map((cell, c) => {
        if (r === sr && c === sc) return "S";
        if (r === er && c === ec) return "E";
        if (cell === 1) return "#";
        if (pathSet.has(`${r},${c}`)) return "*";
        return ".";
      })
      .join(" ");
  });

  return lines.join("\n");
}
