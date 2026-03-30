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
    const row = new Array(cols).fill(0);
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

  // Validation: return empty array for invalid inputs
  if (sr < 0 || sr >= rows || sc < 0 || sc >= cols ||
      er < 0 || er >= rows || ec < 0 || ec >= cols ||
      grid[sr][sc] === 1 || grid[er][ec] === 1) {
    return [];
  }

  // Edge case: start equals end
  if (sr === er && sc === ec) {
    return [[sr, sc]];
  }

  // BFS setup
  const queue = [[sr, sc, [[sr, sc]]]];
  const visited = new Set([`${sr},${sc}`]);
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length > 0) {
    const [r, c, path] = queue.shift();

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;

      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
          grid[nr][nc] !== 1 && !visited.has(key)) {
        const newPath = [...path, [nr, nc]];

        if (nr === er && nc === ec) {
          return newPath;
        }

        visited.add(key);
        queue.push([nr, nc, newPath]);
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

  // Create a Set of path positions for O(1) lookup
  const pathSet = new Set();
  for (const [r, c] of path) {
    pathSet.add(`${r},${c}`);
  }

  const lines = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const isStart = r === sr && c === sc;
      const isEnd = r === er && c === ec;
      const isPath = pathSet.has(`${r},${c}`);
      const isWall = grid[r][c] === 1;

      if (isStart) {
        row.push('S');
      } else if (isEnd) {
        row.push('E');
      } else if (isPath) {
        row.push('*');
      } else if (isWall) {
        row.push('#');
      } else {
        row.push('.');
      }
    }
    lines.push(row.join(' '));
  }

  return lines.join('\n');
}
