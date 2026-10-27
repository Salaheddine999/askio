import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  // The live site's final address: askio.vercel.app and the bare domain
  // redirect here, and a redirect drops POST bodies.
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "https://www.getaskio.xyz";
  // Source maps go to Sentry only on builds that have an auth token (set on
  // Vercel), and are deleted afterwards so they're never served publicly.
  const sentryToken = process.env.SENTRY_AUTH_TOKEN || env.SENTRY_AUTH_TOKEN;
  const uploadSourceMaps = Boolean(sentryToken && (process.env.SENTRY_PROJECT || env.SENTRY_PROJECT));

  return {
    root: rootDir,
    cacheDir: resolve(rootDir, "node_modules/.vite"),
    plugins: [
      react(),
      ...(uploadSourceMaps
        ? [
            sentryVitePlugin({
              org: process.env.SENTRY_ORG || env.SENTRY_ORG || "eddy-tech",
              project: process.env.SENTRY_PROJECT || env.SENTRY_PROJECT,
              authToken: sentryToken,
              // The organization lives in Sentry's EU region; without this a
              // personal token talks to the US servers and finds no project.
              url: process.env.SENTRY_URL || env.SENTRY_URL || "https://de.sentry.io/",
              release: { name: process.env.VERCEL_GIT_COMMIT_SHA },
              sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
              telemetry: false,
            }),
          ]
        : []),
    ],
    build: { sourcemap: uploadSourceMaps ? "hidden" : false },
    define: {
      // Lets the browser tag reports with the same release as the uploaded maps.
      "import.meta.env.VITE_SENTRY_RELEASE": JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA || ""),
    },
    server: {
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: true,
          timeout: 120000,
          proxyTimeout: 120000,
        },
      },
    },
  };
});
