import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "./state/AppContext";
import App from "./App";
import { loadCatalog } from "./data/catalog";
import "./pwa/install"; // side-effect: vang 'beforeinstallprompt' vroeg op
import "./styles/app.css";

async function bootstrap() {
  // Laad de filmcatalogus vóór de eerste render zodat schermen synchroon getCatalog() kunnen gebruiken.
  await loadCatalog();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppProvider>
        <App />
      </AppProvider>
    </StrictMode>,
  );
}

void bootstrap();
