/**
 * Create a 2D grid of the given dimensions.
 *
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {number[][]} [walls] - Array of [row, col] positions that are impassable
 * @returns {number[][]} 2D array where 0 = walkable, 1 = wall
 */
export function createGrid(rows, cols, walls = []) {
  // Create grid with independent rows
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols).fill(0);
    grid.push(row);
  }

  // Place walls
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
 * or an empty array if no path exists
 */
export function findPath(grid, start, end) {
  const rows = grid.length;
  if (rows === 0) return [];
  const cols = grid[0].length;

  const [startRow, startCol] = start;
  const [endRow, endCol] = end;

  // Check if start or end is out of bounds
  if (
    startRow < 0 ||
    startRow >= rows ||
    startCol < 0 ||
    startCol >= cols ||
    endRow < 0 ||
    endRow >= rows ||
    endCol < 0 ||
    endCol >= cols
  ) {
    return [];
  }

  // Check if start or end is on a wall
  if (grid[startRow][startCol] === 1 || grid[endRow][endCol] === 1) {
    return [];
  }

  // Edge case: start equals end
  if (startRow === endRow && startCol === endCol) {
    return [[startRow, startCol]];
  }

  // BFS
  const queue = [[startRow, startCol, [[startRow, startCol]]]];
  const visited = new Set([`${startRow},${startCol}`]);

  // 4-directional movement: up, down, left, right
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const [row, col, path] = queue.shift();

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      const key = `${newRow},${newCol}`;

      // Check bounds
      if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) {
        continue;
      }

      // Check if wall or visited
      if (grid[newRow][newCol] === 1 || visited.has(key)) {
        continue;
      }

      // Build new path
      const newPath = [...path, [newRow, newCol]];

      // Check if reached end
      if (newRow === endRow && newCol === endCol) {
        return newPath;
      }

      // Mark visited and enqueue
      visited.add(key);
      queue.push([newRow, newCol, newPath]);
    }
  }

  // No path found
  return [];
}

/**
 * Render the grid and path as an ASCII string for terminal output.
 *
 * Characters:
 * S = start
 * E = end
 * * = path
 * # = wall
 * . = walkable empty cell
 *
 * @param {number[][]} grid - 2D grid
 * @param {number[][]} path - Array of [row, col] positions representing the path
 * @param {number[]} start - [row, col] starting position
 * @param {number[]} end - [row, col] ending position
 * @returns {string} ASCII representation of the grid with the path marked
 */
export function renderPath(grid, path, start, end) {
  const rows = grid.length;
  if (rows === 0) return "";
  const cols = grid[0].length;

  const [startRow, startCol] = start;
  const [endRow, endCol] = end;

  // Create a set of path positions for O(1) lookup
  const pathSet = new Set(path.map(([r, c]) => `${r},${c}`));

  // Build the output
  const lines = [];
  for (let r = 0; r < rows; r++) {
    const rowChars = [];
    for (let c = 0; c < cols; c++) {
      const isStart = r === startRow && c === startCol;
      const isEnd = r === endRow && c === endCol;
      const isPath = pathSet.has(`${r},${c}`);
      const isWall = grid[r][c] === 1;

      if (isStart) {
        rowChars.push("S");
      } else if (isEnd) {
        rowChars.push("E");
      } else if (isPath) {
        rowChars.push("*");
      } else if (isWall) {
        rowChars.push("#");
      } else {
        rowChars.push(".");
      }
    }
    lines.push(rowChars.join(" "));
  }

  return lines.join("\n");
}
