import dotenv from "dotenv";
dotenv.config();

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  modelPrefixes: string[];
  weight: number;
}

export interface AppConfig {
  port: number;
  providers: ProviderConfig[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

export function parseProvidersFromEnv(env: NodeJS.ProcessEnv): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  let index = 1;
  while (true) {
    const prefix = `PROVIDER_${index}`;
    const baseUrl = env[`${prefix}_BASE_URL`];
    if (!baseUrl) break;

    providers.push({
      name: env[`${prefix}_NAME`] || `provider-${index}`,
      baseUrl: trimTrailingSlash(baseUrl),
      apiKey: env[`${prefix}_API_KEY`],
      modelPrefixes: parseCsv(env[`${prefix}_MODEL_PREFIXES`]),
      weight: parsePositiveInt(env[`${prefix}_WEIGHT`], 1)
    });
    index++;
  }

  if (providers.length === 0 && env.PROVIDER_BASE_URL) {
    providers.push({
      name: env.PROVIDER_NAME || "default",
      baseUrl: trimTrailingSlash(env.PROVIDER_BASE_URL),
      apiKey: env.PROVIDER_API_KEY,
      modelPrefixes: parseCsv(env.PROVIDER_MODEL_PREFIXES),
      weight: 1
    });
  }

  return providers;
}

function parseCsv(value = ""): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

export const config: AppConfig = {
  port: parsePositiveInt(process.env.PORT, 3000),
  providers: parseProvidersFromEnv(process.env),
  rateLimitWindowMs: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  rateLimitMax: parsePositiveInt(process.env.RATE_LIMIT_MAX, 100)
};
