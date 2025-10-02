// server/index.ts
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Trust proxy only in production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Lightweight API logger with response snippet
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch {}
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  // register routes; some implementations return an http.Server, others not
  const maybeServer = await registerRoutes(app);

  // Central error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    try { console.error(err); } catch {}
  });

  // Dev: Vite middleware; Prod: static files
  if (app.get("env") === "development") {
    await setupVite(app, maybeServer);
  } else {
    serveStatic(app);
  }

  // Port/host (Windows-safe defaults)
  const port = Number(process.env.PORT ?? 5000);
  const host = process.env.BIND_HOST ?? "127.0.0.1";

  // Prefer returned server if present, else bind Express directly
  const listen =
    maybeServer && typeof (maybeServer as any).listen === "function"
      ? (maybeServer as any).listen.bind(maybeServer)
      : app.listen.bind(app);

  // IMPORTANT: use (port, host) signature; DO NOT pass an options object (breaks on Windows)
  listen(port, host, () => {
    log(`serving on http://${host}:${port} (env=${app.get("env")})`);
  });
})().catch((e) => {
  console.error("Fatal bootstrap error:", e);
  process.exit(1);
});
