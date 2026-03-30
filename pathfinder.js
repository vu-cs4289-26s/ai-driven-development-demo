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
  const cols = grid[0]?.length || 0;

  const [sr, sc] = start;
  const [er, ec] = end;

  // Validate start position
  if (sr < 0 || sr >= rows || sc < 0 || sc >= cols) {
    throw new Error(`Start position [${sr}, ${sc}] is out of bounds`);
  }
  if (grid[sr][sc] === 1) {
    throw new Error(`Start position [${sr}, ${sc}] is a wall`);
  }

  // Validate end position
  if (er < 0 || er >= rows || ec < 0 || ec >= cols) {
    throw new Error(`End position [${er}, ${ec}] is out of bounds`);
  }
  if (grid[er][ec] === 1) {
    throw new Error(`End position [${er}, ${ec}] is a wall`);
  }

  // Edge case: start equals end
  if (sr === er && sc === ec) {
    return [[sr, sc]];
  }

  // BFS with 8 directions (cardinal + diagonal)
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  const queue = [[sr, sc, [[sr, sc]]]];
  const visited = new Set([`${sr},${sc}`]);

  while (queue.length > 0) {
    const [r, c, path] = queue.shift();

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;

      // Check bounds
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
        continue;
      }

      // Check if wall
      if (grid[nr][nc] === 1) {
        continue;
      }

      const key = `${nr},${nc}`;
      if (visited.has(key)) {
        continue;
      }

      const newPath = [...path, [nr, nc]];

      // Check if reached end
      if (nr === er && nc === ec) {
        return newPath;
      }

      visited.add(key);
      queue.push([nr, nc, newPath]);
    }
  }

  // No path found
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
  const cols = grid[0]?.length || 0;
  const [sr, sc] = start;
  const [er, ec] = end;

  // Create Set of path coordinates for O(1) lookup
  const pathSet = new Set(path.map(([r, c]) => `${r},${c}`));

  const lines = [];
  for (let r = 0; r < rows; r++) {
    const rowChars = [];
    for (let c = 0; c < cols; c++) {
      const isStart = r === sr && c === sc;
      const isEnd = r === er && c === ec;
      const isWall = grid[r][c] === 1;
      const isPath = pathSet.has(`${r},${c}`);

      if (isStart) {
        rowChars.push('S');
      } else if (isEnd) {
        rowChars.push('E');
      } else if (isPath) {
        rowChars.push('*');
      } else if (isWall) {
        rowChars.push('#');
      } else {
        rowChars.push('.');
      }
    }
    lines.push(rowChars.join(' '));
  }

  return lines.join('\n');
}
