import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { LanguageProvider } from "./i18n";
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
