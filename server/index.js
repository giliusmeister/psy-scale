import http from "node:http";
import path from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = "127.0.0.1";

export function getDefaultQuestionnairesDir() {
  return path.resolve(process.cwd(), "src", "questionnaires");
}

export async function listQuestionnaireFiles(
  questionnairesDir = getDefaultQuestionnairesDir(),
) {
  const entries = await readdir(questionnairesDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function applyCommonHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

function sendJson(req, res, statusCode, body) {
  const payload = JSON.stringify(body, null, 2);

  applyCommonHeaders(res);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });

  res.end(req.method === "HEAD" ? undefined : payload);
}

function sendNotFound(req, res) {
  sendJson(req, res, 404, { error: "Not found" });
}

function decodePathname(url) {
  try {
    return decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
}

function resolveQuestionnairePath(questionnairesDir, routePath) {
  if (!routePath || routePath.includes("\0")) {
    return null;
  }

  const baseDir = path.resolve(questionnairesDir);
  const filePath = path.resolve(baseDir, routePath);
  const relativePath = path.relative(baseDir, filePath);
  const isInsideBase =
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));

  if (!isInsideBase || path.extname(filePath).toLowerCase() !== ".json") {
    return null;
  }

  return filePath;
}

async function serveQuestionnaire(req, res, questionnairesDir, routePath) {
  const filePath = resolveQuestionnairePath(questionnairesDir, routePath);

  if (!filePath) {
    sendNotFound(req, res);
    return;
  }

  try {
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      sendNotFound(req, res);
      return;
    }

    const payload = await readFile(filePath);

    applyCommonHeaders(res);
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": payload.byteLength,
    });
    res.end(req.method === "HEAD" ? undefined : payload);
  } catch (error) {
    if (error?.code === "ENOENT") {
      sendNotFound(req, res);
      return;
    }

    console.error("[questionnaires-api] Failed to read questionnaire", error);
    sendJson(req, res, 500, { error: "Internal server error" });
  }
}

export function createQuestionnairesServer(options = {}) {
  const questionnairesDir = path.resolve(
    options.questionnairesDir ??
      process.env.QUESTIONNAIRES_DIR ??
      getDefaultQuestionnairesDir(),
  );

  return http.createServer(async (req, res) => {
    applyCommonHeaders(res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (!["GET", "HEAD"].includes(req.method)) {
      sendJson(req, res, 405, { error: "Method not allowed" });
      return;
    }

    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = decodePathname(url);

    if (!pathname) {
      sendJson(req, res, 400, { error: "Bad request" });
      return;
    }

    if (pathname === "/api/questionnaires") {
      try {
        sendJson(req, res, 200, await listQuestionnaireFiles(questionnairesDir));
      } catch (error) {
        console.error("[questionnaires-api] Failed to list questionnaires", error);
        sendJson(req, res, 500, { error: "Internal server error" });
      }

      return;
    }

    if (pathname.startsWith("/questionnaires/")) {
      const routePath = pathname.slice("/questionnaires/".length);
      await serveQuestionnaire(req, res, questionnairesDir, routePath);
      return;
    }

    sendNotFound(req, res);
  });
}

export function startServer(options = {}) {
  const port = Number(options.port ?? process.env.PORT ?? DEFAULT_PORT);
  const host = options.host ?? process.env.HOST ?? DEFAULT_HOST;
  const server = createQuestionnairesServer(options);

  server.listen(port, host, () => {
    console.log(`[questionnaires-api] Listening on http://${host}:${port}`);
    console.log(
      `[questionnaires-api] Serving ${path.resolve(
        options.questionnairesDir ??
          process.env.QUESTIONNAIRES_DIR ??
          getDefaultQuestionnairesDir(),
      )}`,
    );
  });

  server.on("error", (error) => {
    console.error("[questionnaires-api] Failed to start", error);
    process.exitCode = 1;
  });

  return server;
}

const entryPoint =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href;

if (import.meta.url === entryPoint) {
  startServer();
}
