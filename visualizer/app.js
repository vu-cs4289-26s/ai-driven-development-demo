import { createGrid, findPath } from "/pathfinder.js";

const canvas = document.getElementById("grid-canvas");
const ctx = canvas.getContext("2d");

let gridRows = 20;
let gridCols = 30;
let grid = [];
let start = [0, 0];
let end = [0, 0];
let isMouseDown = false;
let implemented = false;

// Animation
let animId = null;
let visitedOrder = [];
let userPath = [];
let animIdx = 0;
let pathIdx = 0;
let phase = "idle";
let shownVisited = new Set();
let shownPath = new Set();

const COLORS = {
  empty: "#fff",
  wall: "#393d56",
  start: "#2b9348",
  end: "#e03e3e",
  visited: "#bbd0ff",
  path: "#f4a623",
  line: "#ddd",
};

// DOM
const $rows = document.getElementById("rows");
const $cols = document.getElementById("cols");
const $density = document.getElementById("wall-density");
const $densityVal = document.getElementById("wall-density-val");
const $speed = document.getElementById("speed");
const $mode = document.getElementById("mode");
const $run = document.getElementById("btn-run");
const $status = document.getElementById("status");

// ── Validate implementation on load ─────────────────────

function checkImplementation() {
  try {
    const testGrid = createGrid(2, 2);
    if (!Array.isArray(testGrid) || testGrid.length !== 2 || !Array.isArray(testGrid[0])) {
      return false;
    }
    const testPath = findPath(testGrid, [0, 0], [1, 1]);
    if (!Array.isArray(testPath)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function disableControls() {
  document.querySelectorAll("#controls button, #controls input, #controls select").forEach(
    (el) => (el.disabled = true)
  );
  $status.textContent = "Implement createGrid() and findPath() in pathfinder.js first";
}

// ── Grid ────────────────────────────────────────────────

function initGrid() {
  gridRows = clamp(parseInt($rows.value) || 20, 2, 80);
  gridCols = clamp(parseInt($cols.value) || 30, 2, 80);
  grid = createGrid(gridRows, gridCols);
  start = [0, 0];
  end = [gridRows - 1, gridCols - 1];
  resetAnim();
  resize();
  draw();
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// ── Canvas sizing ───────────────────────────────────────

let cell = 20;

function resize() {
  const w = window.innerWidth - 40;
  const h = window.innerHeight - document.getElementById("controls").offsetHeight - 40;
  cell = Math.max(4, Math.min(Math.floor(w / gridCols), Math.floor(h / gridRows)));
  canvas.width = gridCols * cell;
  canvas.height = gridRows * cell;
}

// ── Drawing ─────────────────────────────────────────────

function key(r, c) { return r * gridCols + c; }

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const x = c * cell, y = r * cell, k = key(r, c);
      let color;
      if (r === start[0] && c === start[1]) color = COLORS.start;
      else if (r === end[0] && c === end[1]) color = COLORS.end;
      else if (shownPath.has(k)) color = COLORS.path;
      else if (shownVisited.has(k)) color = COLORS.visited;
      else if (grid[r] && grid[r][c] === 1) color = COLORS.wall;
      else color = COLORS.empty;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, cell, cell);

      if (cell > 6) {
        ctx.strokeStyle = COLORS.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
      }

      if (cell >= 16) {
        if (r === start[0] && c === start[1]) label(x, y, "S");
        else if (r === end[0] && c === end[1]) label(x, y, "E");
      }
    }
  }
}

function label(x, y, txt) {
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.max(10, cell * 0.5)}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(txt, x + cell / 2, y + cell / 2);
}

// ── Instrumented BFS for animation trace ────────────────
// This exists solely to generate the visited-cell ordering for the
// step-by-step animation. The actual path shown is from the user's findPath().

function bfsTrace(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  const [sr, sc] = start;
  const [er, ec] = end;

  if (sr === er && sc === ec) return [[sr, sc]];

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const order = [];

  seen[sr][sc] = true;
  order.push([sr, sc]);
  const queue = [[sr, sc]];

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (seen[nr][nc] || grid[nr][nc] === 1) continue;
      seen[nr][nc] = true;
      order.push([nr, nc]);
      if (nr === er && nc === ec) return order;
      queue.push([nr, nc]);
    }
  }
  return order;
}

// ── Mouse ───────────────────────────────────────────────

function cellAt(e) {
  const rect = canvas.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / cell);
  const r = Math.floor((e.clientY - rect.top) / cell);
  return r >= 0 && r < gridRows && c >= 0 && c < gridCols ? [r, c] : null;
}

function paint(pos) {
  if (!pos) return;
  const [r, c] = pos;
  const mode = $mode.value;
  if (mode === "wall" && !(r === start[0] && c === start[1]) && !(r === end[0] && c === end[1])) {
    grid[r][c] = 1;
  } else if (mode === "erase") {
    grid[r][c] = 0;
  } else if (mode === "start") {
    start = [r, c]; grid[r][c] = 0;
  } else if (mode === "end") {
    end = [r, c]; grid[r][c] = 0;
  }
  draw();
}

canvas.addEventListener("mousedown", (e) => { isMouseDown = true; paint(cellAt(e)); });
canvas.addEventListener("mousemove", (e) => {
  if (isMouseDown && ($mode.value === "wall" || $mode.value === "erase")) paint(cellAt(e));
});
window.addEventListener("mouseup", () => { isMouseDown = false; });

// ── Controls ────────────────────────────────────────────

document.getElementById("btn-new-grid").addEventListener("click", initGrid);

document.getElementById("btn-random-walls").addEventListener("click", () => {
  const d = parseInt($density.value) / 100;
  for (let r = 0; r < gridRows; r++)
    for (let c = 0; c < gridCols; c++) {
      if ((r === start[0] && c === start[1]) || (r === end[0] && c === end[1])) continue;
      grid[r][c] = Math.random() < d ? 1 : 0;
    }
  resetAnim(); draw();
});

document.getElementById("btn-clear-walls").addEventListener("click", () => {
  for (let r = 0; r < gridRows; r++) for (let c = 0; c < gridCols; c++) grid[r][c] = 0;
  resetAnim(); draw();
});

$density.addEventListener("input", () => { $densityVal.textContent = $density.value + "%"; });

document.getElementById("btn-reset").addEventListener("click", () => { resetAnim(); draw(); });

// ── Solve + Animate ─────────────────────────────────────

$run.addEventListener("click", () => {
  resetAnim();
  $run.disabled = true;
  $status.textContent = "Running findPath()...";

  try {
    const result = findPath(grid, start, end);

    if (!Array.isArray(result)) {
      $status.textContent = "findPath() must return an array";
      $run.disabled = false;
      return;
    }

    userPath = result;
    visitedOrder = bfsTrace(grid, start, end);

    if (visitedOrder.length <= 1 && start[0] === end[0] && start[1] === end[1]) {
      $status.textContent = "Start = End — path: 1 step";
      $run.disabled = false;
      draw();
      return;
    }

    phase = "visiting";
    $status.textContent = "Exploring...";
    animate();
  } catch (err) {
    $status.textContent = "findPath() threw: " + err.message;
    $run.disabled = false;
  }
});

function speed() {
  const s = parseInt($speed.value);
  if (s <= 10) return 1;
  if (s <= 30) return 2;
  if (s <= 50) return 4;
  if (s <= 70) return 10;
  if (s <= 85) return 25;
  if (s <= 95) return 50;
  return visitedOrder.length + userPath.length;
}

function animate() {
  if (phase === "visiting") {
    const n = speed();
    for (let i = 0; i < n && animIdx < visitedOrder.length; i++) {
      const [r, c] = visitedOrder[animIdx++];
      shownVisited.add(key(r, c));
    }
    if (animIdx >= visitedOrder.length) {
      if (userPath.length > 0) {
        phase = "pathing";
        $status.textContent = "Tracing path...";
      } else {
        phase = "done";
        $status.textContent = "No path found (findPath returned [])";
        $run.disabled = false;
        draw();
        return;
      }
    }
    draw();
    animId = requestAnimationFrame(animate);
    return;
  }
  if (phase === "pathing") {
    const n = Math.max(1, Math.floor(speed() / 3));
    for (let i = 0; i < n && pathIdx < userPath.length; i++) {
      const [r, c] = userPath[pathIdx++];
      shownPath.add(key(r, c));
    }
    if (pathIdx >= userPath.length) {
      phase = "done";
      $status.textContent = "Done — path: " + userPath.length + " steps, explored: " + visitedOrder.length + " cells";
      $run.disabled = false;
      draw();
      return;
    }
    draw();
    animId = requestAnimationFrame(animate);
  }
}

function resetAnim() {
  if (animId) cancelAnimationFrame(animId);
  animId = null;
  phase = "idle";
  animIdx = 0; pathIdx = 0;
  shownVisited = new Set();
  shownPath = new Set();
  visitedOrder = []; userPath = [];
  $status.textContent = "Ready";
  $run.disabled = false;
}

// ── Boot ────────────────────────────────────────────────

window.addEventListener("resize", () => { resize(); draw(); });

implemented = checkImplementation();
if (!implemented) {
  disableControls();
  // Draw an empty placeholder canvas
  resize();
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
} else {
  initGrid();
}
