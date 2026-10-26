import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { LanguageProvider } from "./i18n";
import { reloadForNewVersion } from "./utils/lazyPage";

// Vite reports a page's code or styles failing to preload here, typically
// after a deploy replaced them. Reload once to get the new version.
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewVersion()) event.preventDefault();
});
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
