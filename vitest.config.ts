import { defineConfig } from "vitest/config";

// Unit tests for the parts that cost money, data or trust if they break
// silently: billing, webhooks, visitor records, safety helpers and
// translations. Run with `npm test`.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.{ts,js}"],
    // The Firestore rules tests need the emulator: `npm run test:rules`.
    exclude: ["tests/rules/**", "node_modules/**"],
    environment: "node",
    env: {
      SHOPIFY_API_SECRET: "test-shopify-secret",
      LEMONSQUEEZY_WEBHOOK_SECRET: "test-lemon-secret",
    },
  },
});
