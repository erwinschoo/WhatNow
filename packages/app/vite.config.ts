import { execSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/* Vite's dependency-cache (deps_temp_*) verhuizen naar de OS-tempmap wanneer het project onder
 * OneDrive staat. OneDrive synct/vergrendelt anders node_modules/.vite, wat op Windows een
 * `EPERM: rmdir` geeft zodra Vite z'n cache opnieuw opbouwt. Buiten OneDrive: Vite-default. */
function resolveCacheDir(): string | undefined {
  const here = fileURLToPath(new URL(".", import.meta.url));
  if (!/onedrive/i.test(here)) return undefined;
  const dir = join(tmpdir(), "whatnow-vite-cache");
  try { mkdirSync(dir, { recursive: true }); } catch { /* bestaat al / niet kritiek */ }
  return dir;
}

/* Injecteert een Content-Security-Policy als <meta> in de PRODUCTIE-build.
 * GitHub Pages kan geen HTTP-headers zetten, dus de CSP gaat in de HTML zelf.
 * Alleen bij `build` (niet in dev — daar zou het Vite's HMR/inline scripts breken).
 * De hashes van inline <script>-blokken (de thema-bootstrap) worden automatisch
 * berekend, zodat we 'unsafe-inline' voor scripts kunnen vermijden. */
function cspPlugin(): Plugin {
  let isBuild = false;
  return {
    name: "whatnow-csp",
    configResolved(c) { isBuild = c.command === "build"; },
    transformIndexHtml: {
      order: "post",
      handler(html) {
        if (!isBuild) return html;
        const hashes = new Set<string>();
        for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
          if (!m[1]) continue;
          hashes.add(`'sha256-${createHash("sha256").update(m[1], "utf8").digest("base64")}'`);
        }
        const csp = [
          "default-src 'self'",
          `script-src 'self' ${[...hashes].join(" ")}`.trim(),
          "style-src 'self' 'unsafe-inline'", // React inline-styles (style={{…}})
          // img: posters van TMDB-CDN en OMDb (Amazon), plus data/blob voor placeholders/profielfoto.
          "img-src 'self' data: blob: https://image.tmdb.org https://m.media-amazon.com",
          // graph + login voor OneDrive-sync; de OneDrive-content-hosts zijn nodig omdat een
          // GET op bestandsinhoud bij een persoonlijk account 302-redirect naar een download-host.
          "connect-src 'self' https://graph.microsoft.com https://login.microsoftonline.com https://*.microsoftpersonalcontent.com https://*.dms.live.com https://*.sharepoint.com",
          "frame-src https://login.microsoftonline.com", // MSAL silent-token iframe
          "font-src 'self' https://fonts.gstatic.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; ");
        return html.replace("</head>", `  <meta http-equiv="Content-Security-Policy" content="${csp}">\n  </head>`);
      },
    },
  };
}

// GitHub Pages serveert op een subpad: https://<gebruiker>.github.io/WhatNow/
const base = process.env.GITHUB_PAGES === "true" ? "/WhatNow/" : "/";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));
const clean = (v: string) => v.replace(/^[^0-9]*/, "");
function gitCommit(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "—";
  }
}

export default defineConfig({
  base,
  cacheDir: resolveCacheDir(),
  // Unieke dev-poort (zie ../../Projects/DEV-SERVERS.md). strictPort: faal hard bij bezetting
  // i.p.v. stilletjes een andere poort kiezen — anders klopt de MSAL-redirect-URI niet meer.
  server: { port: 5320, strictPort: true },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __GIT_COMMIT__: JSON.stringify(gitCommit()),
  },
  plugins: [
    cspPlugin(),
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/pwa",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "script-defer",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "WhatNow — filmcompagnon",
        short_name: "WhatNow",
        description: "Diepe, thematische filmsuggesties afgestemd op jouw smaak — plus quizzes en trivia.",
        lang: "nl",
        theme_color: "#08080a",
        background_color: "#08080a",
        display: "standalone",
        start_url: ".",
        scope: ".",
        // v1 gebruikt het SVG-icoon (geldig voor installatie). Voor scherpe maskable-PNG's
        // op alle platforms: genereer pwa-192/512 + maskable met @vite-pwa/assets-generator
        // en voeg ze hier toe (zie README).
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // data/ (catalog.json + catalog-meta.json) NIET precachen: die beheren we zelf via de
        // versiecheck + IndexedDB (zie src/data/catalog.ts), anders serveert de SW een stale catalogus.
        globIgnores: ["**/data/**"],
      },
      devOptions: { enabled: true, type: "module", navigateFallback: "index.html" },
    }),
  ],
});
