import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { LanguageProvider } from "./i18n";
import { reloadForNewVersion } from "./utils/lazyPage";
import { startMonitoring } from "./utils/monitoring";

startMonitoring();

// Vite reports a page's code or styles failing to preload here, typically
// after a deploy replaced them. Reload once to get the new version.
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewVersion()) event.preventDefault();
});
// Fonts are served from our own domain, not Google's: loading them from
// Google sends every visitor's IP address there, which EU courts have
// treated as a GDPR breach without consent.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "./index.css";
import "./typography.css";
import { Analytics } from "@vercel/analytics/react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Analytics />
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>
);
