import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "https://askio.vercel.app";

  return {
    root: rootDir,
    cacheDir: resolve(rootDir, "node_modules/.vite"),
    plugins: [react()],
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
