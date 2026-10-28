import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

// Vercel's Node can't require() an ES module, which newer Node versions can.
// firebase-admin 14 pulled in such a dependency (jose 6, via jwks-rsa) and
// every API function crashed on Vercel while working locally. This loads the
// server's Firebase modules the way Vercel does, so it can't happen again.
describe("API dependencies on Vercel's runtime", () => {
  it.each(["firebase-admin/app", "firebase-admin/auth", "firebase-admin/firestore", "firebase-admin/messaging"])(
    "%s loads without require() of an ES module",
    (name) => {
      const result = spawnSync(
        process.execPath,
        ["--no-experimental-require-module", "--input-type=module", "-e", `await import(${JSON.stringify(name)});`],
        { encoding: "utf8", timeout: 30_000 }
      );
      expect(result.stderr).not.toMatch(/ERR_REQUIRE_ESM/);
      expect(result.status).toBe(0);
    }
  );
});
