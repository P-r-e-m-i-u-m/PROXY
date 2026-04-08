# OpenAI Reverse Proxy

A free, self-hosted reverse proxy for the OpenAI API — written in TypeScript/Node.js.  
Drop-in compatible with any OpenAI client library. Just change the `base_url`.

## Features

- **Streaming support** — server-sent events (SSE) pass through with zero buffering
- **Multi-provider load balancing** — configure multiple upstream endpoints with weighted routing
- **Auto-retry** — failed requests are retried against a different provider automatically
- **Full endpoint coverage** — chat, completions, embeddings, images, audio, files, fine-tuning, moderations
- **Docker-first** — single `docker compose up` to run; optional bundled chat web UI (LibreChat)
- **Zero dependency on OpenAI keys** — works with any OpenAI-compatible free endpoint

---

## Quick Start

### Option A — Docker (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/your-username/openai-reverse-proxy.git
cd openai-reverse-proxy

# 2. Configure providers
cp .env.example .env
# Edit .env and set PROVIDER_1_BASE_URL to your free endpoint

# 3. Start the proxy
docker compose up -d

# Proxy is now available at http://localhost:3000
```

### Option B — Docker with Chat UI

Runs the proxy **plus** [LibreChat](https://docs.librechat.ai) — a full ChatGPT-like web interface.

```bash
cp .env.example .env          # configure providers
docker compose -f docker-compose.with-ui.yml up -d
```

Then open **http://localhost:3080** in your browser.

### Option C — Run directly on your machine

**Linux / macOS**
```bash
cp .env.example .env          # configure providers
chmod +x start.sh
./start.sh
```

**Windows**
```
copy .env.example .env
start.bat
```

Requires **Node.js 18+**.

---

## Configuration

All configuration is done through environment variables (`.env` file).

### Provider setup

You can configure one or more upstream OpenAI-compatible endpoints.

```env
# Provider 1
PROVIDER_1_NAME=my-provider
PROVIDER_1_BASE_URL=https://your-free-endpoint.example.com
PROVIDER_1_API_KEY=sk-optional-key      # leave blank if not needed
PROVIDER_1_MODEL_PREFIXES=gpt-,text-    # comma-separated; empty = catch-all
PROVIDER_1_WEIGHT=2                     # higher = more traffic in load-balancing

# Provider 2 (optional fallback)
PROVIDER_2_NAME=fallback
PROVIDER_2_BASE_URL=https://another-endpoint.example.com
PROVIDER_2_WEIGHT=1
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PROVIDER_N_BASE_URL` | Yes | — | Base URL of the upstream endpoint (no trailing slash) |
| `PROVIDER_N_NAME` | No | `provider-N` | Human-readable label for logs |
| `PROVIDER_N_API_KEY` | No | — | Injected as `Authorization: Bearer …` header |
| `PROVIDER_N_MODEL_PREFIXES` | No | *(catch-all)* | Comma-separated model name prefixes |
| `PROVIDER_N_WEIGHT` | No | `1` | Load-balancing weight |
| `PORT` | No | `3000` | Port the proxy listens on |

### Finding free providers

The proxy works with **any** OpenAI-compatible endpoint. Some places to find free ones:

- GitHub search: `openai api proxy free`  
- [poe.com](https://poe.com) via unofficial wrappers  
- Self-hosted [LocalAI](https://localai.io) or [Ollama](https://ollama.ai) with an OpenAI shim  

> **Note:** Free third-party proxies are operated by individuals and may be unreliable, rate-limited, or log your requests. Use them at your own discretion and never send sensitive data.

---

## Using the proxy

The proxy is a drop-in replacement. Just point your client's `base_url` at it.

### Python (openai SDK)

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-no-key-required",   # any non-empty string
    base_url="http://localhost:3000/v1",
)

# Streaming example
stream = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True,
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="", flush=True)
```

### Node.js (openai SDK)

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-no-key-required",
  baseURL: "http://localhost:3000/v1",
});

const stream = await client.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: "Hello!" }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
}
```

### curl

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-no-key" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

---

## Endpoints

All standard OpenAI v1 endpoints are proxied:

| Endpoint | Method |
|---|---|
| `/v1/chat/completions` | POST |
| `/v1/completions` | POST |
| `/v1/embeddings` | POST |
| `/v1/models` | GET (merged from all providers) |
| `/v1/images/generations` | POST |
| `/v1/images/edits` | POST |
| `/v1/images/variations` | POST |
| `/v1/audio/transcriptions` | POST |
| `/v1/audio/translations` | POST |
| `/v1/audio/speech` | POST |
| `/v1/files` | GET, POST |
| `/v1/files/:id` | GET, DELETE |
| `/v1/fine_tuning/jobs` | GET, POST |
| `/v1/moderations` | POST |

Plus two utility endpoints:

| Endpoint | Description |
|---|---|
| `GET /health` | Returns `{"status":"ok"}` — useful for uptime monitors |
| `GET /metrics` | Prometheus-compatible counters |

---

## Development

```bash
npm install
cp .env.example .env
npm run dev          # ts-node-dev with hot reload
```

### Build for production

```bash
npm run build        # compiles TypeScript → dist/
npm start
```

---

## Project structure

```
openai-reverse-proxy/
├── src/
│   ├── server.ts          # Express app setup, health/metrics routes
│   ├── providerRouter.ts  # Core proxy logic, streaming, retry, routing
│   ├── config.ts          # Env-var config loader
│   └── metrics.ts         # Simple in-memory Prometheus metrics
├── Dockerfile
├── docker-compose.yml               # Proxy only
├── docker-compose.with-ui.yml       # Proxy + LibreChat web UI
├── start.sh                         # Linux/macOS quick-start
├── start.bat                        # Windows quick-start
├── .env.example
├── package.json
└── tsconfig.json
```

---

## License

MIT
