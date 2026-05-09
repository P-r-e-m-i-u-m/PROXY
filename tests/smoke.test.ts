import assert from "node:assert/strict";
import { parseProvidersFromEnv } from "../src/config";
import { selectProviderFromList } from "../src/providerRouter";

const providers = parseProvidersFromEnv({
  PROVIDER_1_NAME: "primary",
  PROVIDER_1_BASE_URL: "https://primary.example.com/",
  PROVIDER_1_MODEL_PREFIXES: "gpt-, text-",
  PROVIDER_1_WEIGHT: "2",
  PROVIDER_2_NAME: "fallback",
  PROVIDER_2_BASE_URL: "https://fallback.example.com",
  PROVIDER_2_WEIGHT: "1"
});

assert.equal(providers.length, 2);
assert.equal(providers[0].baseUrl, "https://primary.example.com");
assert.deepEqual(providers[0].modelPrefixes, ["gpt-", "text-"]);
assert.equal(providers[0].weight, 2);

const gptProvider = selectProviderFromList(providers, "gpt-4o", () => 0);
assert.equal(gptProvider?.name, "primary");

const unknownModelProvider = selectProviderFromList(providers, "unknown-model", () => 0.99);
assert.equal(unknownModelProvider?.name, "fallback");

const noneConfigured = parseProvidersFromEnv({});
assert.equal(noneConfigured.length, 0);

console.log("Smoke tests passed.");
