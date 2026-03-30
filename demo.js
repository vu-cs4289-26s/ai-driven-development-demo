import { createGrid, findPath, renderPath } from "./pathfinder.js";

console.log("=== BFS Pathfinder Visualization ===\n");

// --- Open grid ---
console.log("1. Open 3x3 grid  [0,0] → [2,2]");
console.log("   No walls — shortest path\n");
const g1 = createGrid(3, 3);
const p1 = findPath(g1, [0, 0], [2, 2]);
console.log(renderPath(g1, p1, [0, 0], [2, 2]));
console.log(`\n   Path (${p1.length} steps): ${p1.map((s) => `[${s}]`).join(" → ")}\n`);

// --- Obstacles ---
console.log("2. 3x3 grid with wall  [0,0] → [0,2]");
console.log("   Must go around the barrier\n");
const g2 = createGrid(3, 3, [
  [0, 1],
  [1, 1],
]);
const p2 = findPath(g2, [0, 0], [0, 2]);
console.log(renderPath(g2, p2, [0, 0], [0, 2]));
console.log(`\n   Path (${p2.length} steps): ${p2.map((s) => `[${s}]`).join(" → ")}\n`);

// --- Serpentine maze ---
console.log("3. 5x5 serpentine maze  [0,0] → [4,4]");
console.log("   Walls force a winding path\n");
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
const g3 = createGrid(5, 5, walls);
const p3 = findPath(g3, [0, 0], [4, 4]);
console.log(renderPath(g3, p3, [0, 0], [4, 4]));
console.log(`\n   Path (${p3.length} steps): ${p3.map((s) => `[${s}]`).join(" → ")}\n`);

// --- No path ---
console.log("4. 3x3 fully blocked  [0,0] → [0,2]");
console.log("   Wall splits the grid — no path exists\n");
const g4 = createGrid(3, 3, [
  [0, 1],
  [1, 1],
  [2, 1],
]);
const p4 = findPath(g4, [0, 0], [0, 2]);
console.log(renderPath(g4, p4, [0, 0], [0, 2]));
console.log(`\n   Path: ${p4.length === 0 ? "NONE (blocked)" : p4}\n`);

// --- Straight corridor ---
console.log("5. 1x8 straight corridor  [0,0] → [0,7]\n");
const g5 = createGrid(1, 8);
const p5 = findPath(g5, [0, 0], [0, 7]);
console.log(renderPath(g5, p5, [0, 0], [0, 7]));
console.log(`\n   Path (${p5.length} steps): ${p5.map((s) => `[${s}]`).join(" → ")}\n`);
