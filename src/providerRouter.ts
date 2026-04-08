import { Router, Request, Response } from "express";
import { config, ProviderConfig } from "./config";
import { incrementMetric } from "./metrics";
import * as http from "http";
import * as https from "https";
import { URL } from "url";

export const providerRouter = Router();

// ----- Provider selection -----

function selectProvider(model?: string): ProviderConfig | undefined {
  const candidates = model
    ? config.providers.filter(
        (p) =>
          p.modelPrefixes.length === 0 || // catch-all provider
          p.modelPrefixes.some((prefix) => model.startsWith(prefix) || model === prefix)
      )
    : config.providers;

  const pool = candidates.length > 0 ? candidates : config.providers;
  if (pool.length === 0) return undefined;

  // Weighted random selection
  const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const p of pool) {
    rand -= p.weight;
    if (rand <= 0) return p;
  }
  return pool[pool.length - 1];
}

// ----- Body reading helper -----

function readBody(req: Request): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// ----- Core proxy handler -----

async function proxyRequest(req: Request, res: Response, retries = 2): Promise<void> {
  const bodyBuffer = await readBody(req);

  let requestedModel: string | undefined;
  try {
    const parsed = JSON.parse(bodyBuffer.toString());
    requestedModel = parsed.model;
  } catch {
    // non-JSON body (e.g. transcription multipart) — model unknown
  }

  const provider = selectProvider(requestedModel);
  if (!provider) {
    res.status(503).json({ error: { message: "No providers available", type: "server_error" } });
    return;
  }

  const targetUrl = new URL(`${provider.baseUrl}${req.path}`);
  // Preserve query params
  for (const [key, value] of Object.entries(req.query)) {
    targetUrl.searchParams.set(key, String(value));
  }

  const isHttps = targetUrl.protocol === "https:";
  const lib = isHttps ? https : http;

  const headers: Record<string, string> = {};
  // Forward safe headers
  for (const [k, v] of Object.entries(req.headers)) {
    const lower = k.toLowerCase();
    if (["host", "connection", "transfer-encoding"].includes(lower)) continue;
    headers[k] = Array.isArray(v) ? v.join(", ") : (v as string);
  }
  // Inject provider API key if set
  if (provider.apiKey) {
    headers["authorization"] = `Bearer ${provider.apiKey}`;
  } else if (!headers["authorization"]) {
    headers["authorization"] = "Bearer sk-no-key-required";
  }
  headers["content-length"] = String(bodyBuffer.length);

  const options: http.RequestOptions = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (isHttps ? 443 : 80),
    path: targetUrl.pathname + (targetUrl.search || ""),
    method: req.method,
    headers,
  };

  incrementMetric("requests_total");

  return new Promise((resolve) => {
    const proxyReq = lib.request(options, (proxyRes) => {
      incrementMetric("responses_total");

      // Forward status and headers
      res.status(proxyRes.statusCode || 200);
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        if (["transfer-encoding", "connection"].includes(k.toLowerCase())) continue;
        if (v !== undefined) res.setHeader(k, v as string | string[]);
      }

      const isStream =
        (proxyRes.headers["content-type"] || "").includes("text/event-stream") ||
        bodyBuffer.toString().includes('"stream":true');

      if (isStream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("X-Accel-Buffering", "no");
        incrementMetric("streaming_requests");
        proxyRes.pipe(res, { end: true });
      } else {
        proxyRes.pipe(res, { end: true });
      }

      proxyRes.on("end", () => resolve());
    });

    proxyReq.on("error", async (err) => {
      incrementMetric("errors_total");
      console.error(`Proxy error (provider: ${provider.name}):`, err.message);

      if (retries > 0 && !res.headersSent) {
        console.log(`Retrying... (${retries} retries left)`);
        // Re-push body so it can be read again
        req.push = () => false;
        // Recreate a fake readable
        const { Readable } = await import("stream");
        const fakeReq = Object.assign(Readable.from([bodyBuffer]), req) as unknown as Request;
        await proxyRequest(fakeReq, res, retries - 1);
      } else if (!res.headersSent) {
        res.status(502).json({
          error: {
            message: `Upstream provider (${provider.name}) error: ${err.message}`,
            type: "server_error",
          },
        });
      }
      resolve();
    });

    proxyReq.write(bodyBuffer);
    proxyReq.end();
  });
}

// ----- Routes -----

// Chat completions
providerRouter.post("/chat/completions", (req, res) => proxyRequest(req, res));

// Legacy completions
providerRouter.post("/completions", (req, res) => proxyRequest(req, res));

// Embeddings
providerRouter.post("/embeddings", (req, res) => proxyRequest(req, res));

// Image generation
providerRouter.post("/images/generations", (req, res) => proxyRequest(req, res));
providerRouter.post("/images/edits", (req, res) => proxyRequest(req, res));
providerRouter.post("/images/variations", (req, res) => proxyRequest(req, res));

// Audio
providerRouter.post("/audio/transcriptions", (req, res) => proxyRequest(req, res));
providerRouter.post("/audio/translations", (req, res) => proxyRequest(req, res));
providerRouter.post("/audio/speech", (req, res) => proxyRequest(req, res));

// Fine-tuning
providerRouter.get("/fine_tuning/jobs", (req, res) => proxyRequest(req, res));
providerRouter.post("/fine_tuning/jobs", (req, res) => proxyRequest(req, res));
providerRouter.get("/fine_tuning/jobs/:id", (req, res) => proxyRequest(req, res));

// Files
providerRouter.get("/files", (req, res) => proxyRequest(req, res));
providerRouter.post("/files", (req, res) => proxyRequest(req, res));
providerRouter.delete("/files/:id", (req, res) => proxyRequest(req, res));
providerRouter.get("/files/:id", (req, res) => proxyRequest(req, res));

// Moderations
providerRouter.post("/moderations", (req, res) => proxyRequest(req, res));

// Catch-all — forward anything else under /v1
providerRouter.all("*", (req, res) => proxyRequest(req, res));
