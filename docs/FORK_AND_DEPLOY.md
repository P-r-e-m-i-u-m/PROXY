# Fork And Deploy

This guide helps developers fork PROXY and turn it into their own AI API gateway.

## 1. Fork The Repo

Open the GitHub repo and click **Fork**.

Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/PROXY.git
cd PROXY
```

## 2. Configure Providers

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000

PROVIDER_1_NAME=primary
PROVIDER_1_BASE_URL=https://api.example.com/v1
PROVIDER_1_API_KEY=sk-your-provider-key
PROVIDER_1_MODEL_PREFIXES=gpt-,text-
PROVIDER_1_WEIGHT=2

PROVIDER_2_NAME=local
PROVIDER_2_BASE_URL=http://localhost:11434/v1
PROVIDER_2_MODEL_PREFIXES=llama,mistral,codellama
PROVIDER_2_WEIGHT=1
```

## 3. Verify Locally

```bash
npm install
npm run check
npm run dev
```

Health check:

```bash
curl http://localhost:3000/health
```

## 4. Test A Chat Request

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer gateway-client-key" \
  -d @examples/chat-completion.request.json
```

## 5. Run With Docker

```bash
docker compose up -d
```

## 6. Production Checklist

- Add authentication in front of the gateway.
- Use HTTPS.
- Configure trusted upstream providers only.
- Keep `.env` out of git.
- Monitor `/health`.
- Scrape `/metrics`.
- Rotate provider keys after testing.

## Good First Fork Customizations

- Add your own provider presets.
- Add an auth middleware.
- Add request timeout configuration.
- Add structured JSON logging.
- Add a deployment guide for your platform.
