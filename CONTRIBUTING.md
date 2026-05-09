# Contributing

Thanks for helping improve PROXY.

## Development Setup

```bash
git clone https://github.com/P-r-e-m-i-u-m/PROXY.git
cd PROXY
cp .env.example .env
npm install
npm run check
npm run dev
```

## Before Opening A PR

- Keep the change focused.
- Run `npm run check`.
- Update docs when behavior or configuration changes.
- Do not commit `.env`, API keys, logs, or provider credentials.
- Explain how the change was tested.

## Good Areas To Contribute

- Gateway authentication
- Provider circuit breakers
- Request timeout configuration
- Structured JSON logging
- Redis-backed rate limiting
- Integration tests with mock upstreams

## Review Standard

A good PR should be easy to verify. Include:

- What changed
- Why it matters
- How to test it
