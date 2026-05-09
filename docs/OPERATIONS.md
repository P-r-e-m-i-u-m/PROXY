# Operations

## Local Check

```bash
npm run check
```

This runs:

- TypeScript build
- smoke tests

## Health Check

```bash
curl http://localhost:3000/health
```

Expected shape:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "providers": ["primary"]
}
```

## Metrics

```bash
curl http://localhost:3000/metrics
```

Counters:

- `requests_total`
- `responses_total`
- `errors_total`
- `streaming_requests`

## Deployment Checklist

- Configure at least one provider.
- Keep `.env` out of git.
- Put authentication in front of the gateway.
- Use HTTPS in production.
- Avoid untrusted third-party upstream providers for sensitive traffic.
- Monitor `/health` and `/metrics`.
- Rotate provider keys if logs or infrastructure are exposed.

## Common Failure Modes

### `No providers available`

No provider is configured. Set `PROVIDER_1_BASE_URL`.

### Empty `/v1/models`

The configured upstreams did not return model lists or were unreachable.

### Streaming hangs

Check whether the upstream provider supports streaming for the requested endpoint and model.

### 502 upstream error

The gateway reached a provider but the provider failed or closed the connection.
