/**
 * Create a 2D grid of the given dimensions.
 *
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {number[][]} [walls] - Array of [row, col] positions that are impassable
 * @returns {number[][]} 2D array where 0 = walkable, 1 = wall
 */
export function createGrid(rows, cols, walls = []) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(0);
    }
    grid.push(row);
  }
  for (const [r, c] of walls) {
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      grid[r][c] = 1;
    }
  }
  return grid;
}

/**
 * Find the shortest path from start to end on the grid using BFS.
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

  if (sr < 0 || sr >= rows || sc < 0 || sc >= cols) return [];
  if (er < 0 || er >= rows || ec < 0 || ec >= cols) return [];
  if (grid[sr][sc] === 1 || grid[er][ec] === 1) return [];
  if (sr === er && sc === ec) return [[sr, sc]];

  const queue = [[sr, sc]];
  const visited = new Set([`${sr},${sc}`]);
  const parent = new Map();

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const [r, c] = queue.shift();

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;

      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        grid[nr][nc] === 0 &&
        !visited.has(key)
      ) {
        visited.add(key);
        parent.set(key, `${r},${c}`);

        if (nr === er && nc === ec) {
          const path = [[er, ec]];
          let current = `${er},${ec}`;
          while (parent.has(current)) {
            const prev = parent.get(current);
            const [pr, pc] = prev.split(",").map(Number);
            path.unshift([pr, pc]);
            current = prev;
          }
          return path;
        }

        queue.push([nr, nc]);
      }
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
  const rows = grid.length;
  const cols = grid[0].length;
  const [sr, sc] = start;
  const [er, ec] = end;

  const pathSet = new Set(path.map(([r, c]) => `${r},${c}`));

  const lines = [];
  for (let r = 0; r < rows; r++) {
    const rowChars = [];
    for (let c = 0; c < cols; c++) {
      if (r === sr && c === sc) {
        rowChars.push("S");
      } else if (r === er && c === ec) {
        rowChars.push("E");
      } else if (pathSet.has(`${r},${c}`)) {
        rowChars.push("*");
      } else if (grid[r][c] === 1) {
        rowChars.push("#");
      } else {
        rowChars.push(".");
      }
    }
    lines.push(rowChars.join(" "));
  }

  return lines.join("\n");
}
