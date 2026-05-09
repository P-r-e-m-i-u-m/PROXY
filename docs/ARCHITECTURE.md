# Architecture

PROXY is a small OpenAI-compatible gateway built around three concerns:

- configuration
- provider selection
- request forwarding

## Request Flow

```text
client
  |
  v
Express server
  |
  +-- /health
  +-- /metrics
  +-- /v1/models
  |
  v
provider router
  |
  +-- read request body
  +-- detect requested model
  +-- choose matching provider
  +-- forward request and stream response
  +-- retry on upstream failure
```

## Provider Selection

Providers are configured with numbered environment variables:

```text
PROVIDER_1_NAME
PROVIDER_1_BASE_URL
PROVIDER_1_API_KEY
PROVIDER_1_MODEL_PREFIXES
PROVIDER_1_WEIGHT
```

Routing rules:

- If a request includes a model, providers with matching prefixes are preferred.
- A provider with no prefixes acts as a catch-all.
- If no provider matches the model, the router falls back to all configured providers.
- If multiple providers match, weighted random selection is used.

## Streaming

The gateway preserves server-sent event responses. It forwards upstream response headers, disables buffering headers where useful, and pipes the upstream response directly to the client.

## Failure Handling

If an upstream request fails before response headers are sent, the router retries with the original request body. This allows transient upstream failures to recover without requiring the client to retry.

## Security Boundary

The gateway is not an authentication product by itself. It should sit behind trusted network controls, an API gateway, or app-level authentication before being exposed publicly.
