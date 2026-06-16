import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "./state/AppContext";
import App from "./App";
import "./pwa/install"; // side-effect: vang 'beforeinstallprompt' vroeg op
import "./styles/app.css";

/* De catalogus wordt niet langer vóór de eerste render geladen: de AppProvider toont een Splash
 * tijdens het laden en mount de tab-schermen pas zodra `catalogReady` is. Zo zien gebruikers het
 * gebrande laadscherm i.p.v. een blanco wachtmoment, en blijft getCatalog() veilig (schermen
 * mounten immers pas ná de load). */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
