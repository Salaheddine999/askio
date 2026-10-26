import { defineConfig } from "vitest/config";

// Firestore security rules tests. They need the Firestore emulator (and so
// Java), so they run apart from `npm test`: `npm run test:rules` starts the
// emulator, runs them and stops it.
export default defineConfig({
  test: {
    include: ["tests/rules/**/*.test.ts"],
    environment: "node",
    testTimeout: 20_000,
    hookTimeout: 30_000,
    // One emulator database shared by every test, so run the files in order.
    fileParallelism: false,
  },
});
