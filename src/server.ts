import express, { Request, Response, NextFunction } from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config";
import { providerRouter } from "./providerRouter";
import { metricsMiddleware, metricsHandler } from "./metrics";

const app = express();

// --- Middleware ---
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"], allowedHeaders: ["*"] }));
app.use(morgan("dev"));
app.use(metricsMiddleware);

// Health + metrics endpoints
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", version: "1.0.0", providers: config.providers.map((p) => p.name) });
});
app.get("/metrics", metricsHandler);

// Models list endpoint — merged from all providers
app.get("/v1/models", async (_req: Request, res: Response) => {
  try {
    const allModels: object[] = [];
    for (const provider of config.providers) {
      try {
        const resp = await fetch(`${provider.baseUrl}/v1/models`, {
          headers: { Authorization: `Bearer ${provider.apiKey || "sk-no-key"}` },
          signal: AbortSignal.timeout(5000),
        });
        if (resp.ok) {
          const json: any = await resp.json();
          allModels.push(...(json.data || []));
        }
      } catch {
        // skip unreachable provider
      }
    }
    res.json({ object: "list", data: allModels });
  } catch (err) {
    res.status(500).json({ error: { message: "Failed to list models", type: "server_error" } });
  }
});

// Main proxy — all /v1/* routes are routed to the right provider
app.use("/v1", providerRouter);

// 404 fallback
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: { message: "Not found", type: "invalid_request_error" } });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: { message: err.message || "Internal server error", type: "server_error" } });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n🚀  OpenAI Reverse Proxy running on http://localhost:${PORT}`);
  console.log(`   Base URL for clients: http://localhost:${PORT}/v1`);
  console.log(`   Loaded providers: ${config.providers.map((p) => p.name).join(", ")}\n`);
});

export default app;
