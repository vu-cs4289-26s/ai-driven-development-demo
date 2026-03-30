import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = 3000;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
};

const server = createServer(async (req, res) => {
  if (req.method !== "GET") {
    res.writeHead(405).end("Method not allowed");
    return;
  }

  // Serve pathfinder.js from project root so the browser can import it
  if (req.url === "/pathfinder.js") {
    try {
      const content = await readFile(join(__dirname, "pathfinder.js"));
      res.writeHead(200, { "Content-Type": "application/javascript" });
      res.end(content);
    } catch {
      res.writeHead(404).end("pathfinder.js not found");
    }
    return;
  }

  // Everything else comes from visualizer/
  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = join(__dirname, "visualizer", filePath);

  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(content);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Pathfinder Visualizer running at ${url}`);

  const cmd =
    process.platform === "darwin" ? `open ${url}` :
    process.platform === "win32" ? `start ${url}` :
    `xdg-open ${url}`;

  exec(cmd, () => {});
});
