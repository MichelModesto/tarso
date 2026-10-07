import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = new URL("../public/", import.meta.url).pathname;
const votes = new Map();
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function json(response, body, status = 200) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

function results() {
  const tally = Array.from({ length: 20 }, (_, index) => ({ optionId: index + 1, votes: 0 }));
  for (const optionId of votes.values()) tally[optionId - 1].votes += 1;
  return { results: tally, totalVotes: votes.size };
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  const ip = request.headers["x-preview-ip"] || request.socket.remoteAddress || "local";

  if (url.pathname === "/api/results") return json(response, results());
  if (url.pathname === "/api/status") return json(response, { hasVoted: votes.has(ip), optionId: votes.get(ip) || null });
  if (url.pathname === "/api/vote" && request.method === "POST") {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const optionId = Number(JSON.parse(raw || "{}").optionId);
    if (!Number.isInteger(optionId) || optionId < 1 || optionId > 20) return json(response, { error: "Essa camisa não existe." }, 400);
    if (votes.has(ip)) return json(response, { error: "Este IP já registrou um voto.", optionId: votes.get(ip) }, 409);
    votes.set(ip, optionId);
    return json(response, { ok: true, optionId }, 201);
  }

  const requested = normalize(url.pathname === "/" ? "index.html" : url.pathname.replace(/^\//, ""));
  const path = join(root, requested);
  if (!path.startsWith(root)) {
    response.writeHead(403);
    return response.end("Forbidden");
  }

  try {
    const info = await stat(path);
    if (!info.isFile()) throw new Error("Not a file");
    const file = await readFile(path);
    response.writeHead(200, { "content-type": mimeTypes[extname(path)] || "application/octet-stream" });
    response.end(file);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

server.listen(4173, "127.0.0.1", () => {
  console.log("Preview running at http://127.0.0.1:4173");
});

