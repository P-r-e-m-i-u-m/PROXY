import { Request, Response, NextFunction } from "express";

const counters: Record<string, number> = {
  requests_total: 0,
  responses_total: 0,
  errors_total: 0,
  streaming_requests: 0,
};

export function incrementMetric(key: string, amount = 1) {
  counters[key] = (counters[key] || 0) + amount;
}

export function metricsMiddleware(_req: Request, _res: Response, next: NextFunction) {
  next();
}

export function metricsHandler(_req: Request, res: Response) {
  // Prometheus text format
  const lines = Object.entries(counters)
    .map(([k, v]) => `# TYPE ${k} counter\n${k} ${v}`)
    .join("\n");
  res.setHeader("Content-Type", "text/plain; version=0.0.4");
  res.send(lines);
}
