/**
 * Create a 2D grid of the given dimensions.
 *
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {number[][]} [walls] - Array of [row, col] positions that are impassable
 * @returns {number[][]} 2D array where 0 = walkable, 1 = wall
 */
export function createGrid(rows, cols, walls = []) {
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(0));
  for (const [row, col] of walls) {
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      grid[row][col] = 1;
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
  if (rows === 0) return [];
  const cols = grid[0].length;
  
  const [startRow, startCol] = start;
  const [endRow, endCol] = end;
  
  // Check bounds
  if (startRow < 0 || startRow >= rows || startCol < 0 || startCol >= cols ||
      endRow < 0 || endRow >= rows || endCol < 0 || endCol >= cols) {
    return [];
  }
  
  // Check if start or end is a wall
  if (grid[startRow][startCol] === 1 || grid[endRow][endCol] === 1) {
    return [];
  }
  
  // If start equals end
  if (startRow === endRow && startCol === endCol) {
    return [[startRow, startCol]];
  }
  
  // BFS
  const queue = [[startRow, startCol]];
  const visited = new Set([`${startRow},${startCol}`]);
  const parent = new Map();
  parent.set(`${startRow},${startCol}`, null);
  
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
  
  while (queue.length > 0) {
    const [row, col] = queue.shift();
    
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
      
      visited.add(key);
      parent.set(key, [row, col]);
      queue.push([newRow, newCol]);
      
      // Check if reached end
      if (newRow === endRow && newCol === endCol) {
        // Reconstruct path
        const path = [];
        let current = [newRow, newCol];
        while (current !== null) {
          path.unshift(current);
          current = parent.get(`${current[0]},${current[1]}`);
        }
        return path;
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
  if (rows === 0) return '';
  const cols = grid[0].length;
  
  const [startRow, startCol] = start;
  const [endRow, endCol] = end;
  
  // Create a set for quick lookup of path cells
  const pathSet = new Set(path.map(([r, c]) => `${r},${c}`));
  
  const lines = [];
  for (let r = 0; r < rows; r++) {
    const rowChars = [];
    for (let c = 0; c < cols; c++) {
      let char;
      if (r === startRow && c === startCol) {
        char = 'S';
      } else if (r === endRow && c === endCol) {
        char = 'E';
      } else if (pathSet.has(`${r},${c}`)) {
        char = '*';
      } else if (grid[r][c] === 1) {
        char = '#';
      } else {
        char = '.';
      }
      rowChars.push(char);
    }
    lines.push(rowChars.join(' '));
  }
  
  return lines.join('\n');
}
