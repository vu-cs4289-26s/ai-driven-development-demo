/**
 * Create a 2D grid of the given dimensions.
 *
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {number[][]} [walls] - Array of [row, col] positions that are impassable
 * @returns {number[][]} 2D array where 0 = walkable, 1 = wall
 */
export function createGrid(rows, cols, walls = []) {
  // TODO: Implement
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
  // TODO: Implement
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
  // TODO: Implement
}
