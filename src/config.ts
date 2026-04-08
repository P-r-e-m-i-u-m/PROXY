import dotenv from "dotenv";
dotenv.config();

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  /** Comma-separated model prefixes/names this provider handles, e.g. "gpt-,text-" */
  modelPrefixes: string[];
  /** Weight for load-balancing when multiple providers can handle a model */
  weight: number;
}

export interface AppConfig {
  port: number;
  providers: ProviderConfig[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

function parseProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  // Support multiple providers via numbered env vars:
  //   PROVIDER_1_NAME, PROVIDER_1_BASE_URL, PROVIDER_1_API_KEY, PROVIDER_1_MODEL_PREFIXES, PROVIDER_1_WEIGHT
  // Or single via PROVIDER_BASE_URL etc.
  let index = 1;
  while (true) {
    const prefix = `PROVIDER_${index}`;
    const baseUrl = process.env[`${prefix}_BASE_URL`];
    if (!baseUrl) break;
    providers.push({
      name: process.env[`${prefix}_NAME`] || `provider-${index}`,
      baseUrl: baseUrl.replace(/\/$/, ""),
      apiKey: process.env[`${prefix}_API_KEY`],
      modelPrefixes: (process.env[`${prefix}_MODEL_PREFIXES`] || "").split(",").filter(Boolean),
      weight: parseInt(process.env[`${prefix}_WEIGHT`] || "1", 10),
    });
    index++;
  }

  // Fallback: single provider from PROVIDER_BASE_URL
  if (providers.length === 0 && process.env.PROVIDER_BASE_URL) {
    providers.push({
      name: process.env.PROVIDER_NAME || "default",
      baseUrl: process.env.PROVIDER_BASE_URL.replace(/\/$/, ""),
      apiKey: process.env.PROVIDER_API_KEY,
      modelPrefixes: (process.env.PROVIDER_MODEL_PREFIXES || "").split(",").filter(Boolean),
      weight: 1,
    });
  }

  // Built-in free providers if none configured
  if (providers.length === 0) {
    const builtIn: ProviderConfig[] = [
      {
        name: "openai-free-1",
        baseUrl: "https://api.openai-proxy.net",
        modelPrefixes: ["gpt-", "text-", "dall-e", "whisper"],
        weight: 1,
      },
      {
        name: "openai-free-2",
        baseUrl: "https://free.churchless.tech",
        modelPrefixes: ["gpt-3", "text-davinci"],
        weight: 1,
      },
    ];
    console.warn(
      "⚠️  No providers configured via env vars. Using built-in free endpoints.\n" +
        "   These may be unreliable. Set PROVIDER_1_BASE_URL in your .env for a custom provider.\n"
    );
    return builtIn;
  }

  return providers;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || "3000", 10),
  providers: parseProviders(),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
};
