import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config";
import { providerRouter } from "./providerRouter";
import { metricsMiddleware, metricsHandler } from "./metrics";

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"], allowedHeaders: ["*"] }));
app.use(morgan("dev"));
app.use(metricsMiddleware);

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    providers: config.providers.map((provider) => provider.name)
  });
});

app.get("/metrics", metricsHandler);

app.get("/v1/models", async (_req: Request, res: Response) => {
  try {
    const allModels: object[] = [];

    for (const provider of config.providers) {
      try {
        const response = await fetch(`${provider.baseUrl}/v1/models`, {
          headers: { Authorization: `Bearer ${provider.apiKey || "sk-no-key"}` },
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const json = (await response.json()) as { data?: object[] };
          allModels.push(...(json.data || []));
        }
      } catch {
        // Skip unreachable providers so one bad upstream does not break model listing.
      }
    }

    res.json({ object: "list", data: allModels });
  } catch {
    res.status(500).json({ error: { message: "Failed to list models", type: "server_error" } });
  }
});

app.use("/v1", providerRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: { message: "Not found", type: "invalid_request_error" } });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: { message: err.message || "Internal server error", type: "server_error" } });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\nOpenAI-compatible proxy running on http://localhost:${PORT}`);
  console.log(`   Base URL for clients: http://localhost:${PORT}/v1`);
  console.log(`   Loaded providers: ${config.providers.map((provider) => provider.name).join(", ") || "none"}\n`);
});

export default app;
