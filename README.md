# OpenAI-Compatible API Gateway

> Self-hosted TypeScript gateway for routing OpenAI-compatible API traffic across multiple upstream providers with streaming, retries, health checks, and Prometheus-style metrics.

[![CI](https://github.com/P-r-e-m-i-u-m/PROXY/actions/workflows/ci.yml/badge.svg)](https://github.com/P-r-e-m-i-u-m/PROXY/actions/workflows/ci.yml)

## Why This Exists

AI apps often need more than a single hardcoded provider URL. This gateway gives developers a small operational layer in front of OpenAI-compatible providers:

- route requests by model prefix
- balance traffic across multiple upstreams
- retry failed upstream calls
- preserve streaming responses
- expose health and metrics endpoints
- keep provider keys out of client-side apps

## Features

- **OpenAI-compatible paths** under `/v1`
- **Streaming support** for server-sent event responses
- **Provider routing** by model prefix
- **Weighted load balancing** across matching providers
- **Retry fallback** when an upstream request fails
- **Merged model listing** from configured providers
- **Health check** at `/health`
- **Prometheus-style metrics** at `/metrics`
- **Docker support** with optional LibreChat stack
- **TypeScript build and smoke tests**

## Quick Start

```bash
git clone https://github.com/P-r-e-m-i-u-m/PROXY.git
cd PROXY
npm install
cp .env.example .env
npm run check
npm run dev
```

The gateway runs at:

```text
http://localhost:3000
```

Client base URL:

```text
http://localhost:3000/v1
```

## Configuration

Add at least one upstream provider to `.env`.

```env
PORT=3000

PROVIDER_1_NAME=primary
PROVIDER_1_BASE_URL=https://api.example.com/v1
PROVIDER_1_API_KEY=sk-your-provider-key
PROVIDER_1_MODEL_PREFIXES=gpt-,text-
PROVIDER_1_WEIGHT=2

PROVIDER_2_NAME=fallback
PROVIDER_2_BASE_URL=https://fallback.example.com/v1
PROVIDER_2_API_KEY=sk-fallback-key
PROVIDER_2_MODEL_PREFIXES=
PROVIDER_2_WEIGHT=1
```

`MODEL_PREFIXES` can be empty. Empty means catch-all.

## Client Usage

### Node.js

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "gateway-client-key",
  baseURL: "http://localhost:3000/v1"
});

const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello from the gateway" }]
});

console.log(response.choices[0]?.message.content);
```

### Python

```py
from openai import OpenAI

client = OpenAI(
    api_key="gateway-client-key",
    base_url="http://localhost:3000/v1",
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello from the gateway"}],
)

print(response.choices[0].message.content)
```

### curl

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer gateway-client-key" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello from the gateway"}]
  }'
```

## Operations

Health:

```bash
curl http://localhost:3000/health
```

Metrics:

```bash
curl http://localhost:3000/metrics
```

Build and test:

```bash
npm run check
```

Docker:

```bash
docker compose up -d
```

Docker with LibreChat:

```bash
docker compose -f docker-compose.with-ui.yml up -d
```

## Security Notes

- Configure your own trusted upstream providers.
- Do not send sensitive data through unknown third-party endpoints.
- Do not commit `.env` or provider API keys.
- Keep this gateway server-side. Do not expose provider credentials to browsers.
- Add authentication in front of the gateway before using it outside local development.

## Project Structure

```text
.
├── src/
│   ├── config.ts          environment parsing
│   ├── metrics.ts         in-memory counters
│   ├── providerRouter.ts  routing, retries, proxy forwarding
│   └── server.ts          Express app and operational endpoints
├── tests/
│   └── smoke.test.ts      routing/config smoke tests
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Engineering Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Operations](docs/OPERATIONS.md)

## Roadmap

- Add API-key authentication for gateway clients
- Add per-provider circuit breaker state
- Add request timeout configuration
- Add structured JSON logs
- Add optional Redis-backed rate limiting

## License

MIT
