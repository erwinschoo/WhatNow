# WhatNow

Een gratis Progressive Web App die diepe, **thematische** filmsuggesties geeft — afgestemd met
"feel"-sliders (cinematografie, intrige, humor, emotionele diepte, tempo), met quizzes en trivia.
Sleek zwart design met een warm amber-accent. Tweede app in de gratis "franchise" na bokkiep.

## Structuur (monorepo)

```
WhatNow/
├── packages/
│   ├── app/        # de PWA (React + TS + Vite + vite-plugin-pwa)
│   └── pipeline/   # offline build-pipeline → packages/app/public/data/catalog.json
├── Design/         # referentie-design (React/Babel-prototype + screenshots)
└── .github/workflows/deploy.yml   # deploy naar GitHub Pages
```

**Twee datalagen.** De gedeelde **filmcatalogus** is read-only, offline gebouwd en gebundeld in de
app (`public/data/catalog.json`); posters komen live van de TMDB-CDN. **Persoonlijke data**
(kijkprofiel, watchlist, gezien, feel-voorkeuren, quizscores) leeft lokaal-eerst in IndexedDB en
synct optioneel naar de **OneDrive App Folder** via Microsoft Graph (bokkiep-patroon).

## De app draaien

```bash
cd packages/app
npm install
cp .env.example .env     # optioneel: vul VITE_MS_CLIENT_ID in voor OneDrive-sync
npm run dev              # http://localhost:5320
npm run build            # productie-build (tsc + vite)
npm run preview          # build lokaal serveren (PWA/offline testen)
```

Zonder catalog.json valt de app terug op een gebundelde mock-catalogus (15 films uit het design),
dus hij werkt direct.

### OneDrive-sync configureren
Maak een **Microsoft Entra** "single-page application"-registratie aan (persoonlijke
Microsoft-accounts) met redirect-URI's `http://localhost:5320/` en
`https://<gebruiker>.github.io/WhatNow/`, delegated permissions `Files.ReadWrite.AppFolder` +
`User.Read`. Zet de client-ID in `packages/app/.env` als `VITE_MS_CLIENT_ID`.

## De catalogus genereren (pipeline)

```bash
cd packages/pipeline
npm install
cp .env.example .env     # TMDB_API_KEY, OMDB_API_KEY, ANTHROPIC_API_KEY
npm run build:sample     # ~10 films (snel testen)
npm run build            # volledige seed (zie seed.json)
```

De pipeline: TMDB (details/keywords/posters) + OMDb (IMDB/RT/Metacritic) ophalen → **Claude**
genereert feel-scores, thema's, 'waarom', NL-synopsis, trivia en quizvragen → lokale **embeddings**
(`@xenova/transformers`) bepalen de thematische keten per film → alles wordt gebundeld als
`packages/app/public/data/catalog.json`. Resultaten worden gecached (`cache/`), dus herdraaien is
goedkoop. Films met onvolledige data worden expliciet gelogd (geen stille gaten).

Breid de catalogus uit door titels toe te voegen aan `packages/pipeline/seed.json`.

## Deploy

Push naar `main` → GitHub Actions bouwt `packages/app` met `GITHUB_PAGES=true` (base `/WhatNow/`)
en publiceert naar GitHub Pages. Zet `VITE_MS_CLIENT_ID` als repository-variabele voor sync.

## Nog te doen / nice-to-have
- **Raster-iconen:** v1 gebruikt het SVG-icoon (geldig voor installatie). Voor scherpe
  maskable-PNG's: `npx @vite-pwa/assets-generator` op `public/icon.svg`, dan de PNG's terugzetten in
  `vite.config.ts` → `manifest.icons`.
- **TMDB-attributie** staat in het Sync/instellingen-scherm (verplicht per TMDB-voorwaarden).
- **Donatielink** in Settings is nog een placeholder-knop.
