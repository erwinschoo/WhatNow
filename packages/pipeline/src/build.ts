/* Orchestrator: seed → TMDB+OMDb → Claude-verrijking → embeddings/ketens → catalog.json.
 * Idempotent dankzij de bestand-cache; draai met `npm run build` (of `build:sample` voor ~10 films).
 *
 * Stappen:
 *   01 seed       seed.json inlezen
 *   02 fetch      TMDB-details + OMDb-scores per film (gecached)
 *   03 enrich     Claude: feel/thema's/why/synopsis/trivia/quiz (gecached)
 *   04 embed      lokale embeddings → thematische keten (chain) per film
 *   05 bundle     catalog.json wegschrijven naar packages/app/public/data/
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cached } from "./cache.js";
import { findTmdbId, getDetails } from "./tmdb.js";
import { getScores } from "./omdb.js";
import { enrich } from "./enrich.js";
import { computeChains } from "./embed.js";
import type { Catalog, CatalogFilm, Enrichment, QuizQuestion, RawFilm } from "./types.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const APP_DATA = join(ROOT, "..", "app", "public", "data");

// .env laden (Node 20.12+).
try {
  (process as any).loadEnvFile?.(join(ROOT, ".env"));
} catch {
  /* geen .env — keys moeten dan via de omgeving komen */
}

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const decadeOf = (year: number) => `${Math.floor(year / 10) * 10}s`;

interface Seed { title: string; year?: number }

async function main() {
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg >= 0 ? Number(process.argv[limitArg + 1]) : Infinity;

  const seeds: Seed[] = JSON.parse(readFileSync(join(ROOT, "seed.json"), "utf-8"));
  const selected = seeds.slice(0, limit);
  console.log(`[01] ${selected.length} films in seed (van ${seeds.length}).`);

  const films: CatalogFilm[] = [];
  const skipped: string[] = [];

  for (const seed of selected) {
    const id = slug(`${seed.title}-${seed.year ?? ""}`).replace(/-+$/, "") || slug(seed.title);
    try {
      // 02 — fetch (gecached)
      const tmdbId = await cached(`tmdbid-${id}`, () => findTmdbId(seed.title, seed.year));
      if (!tmdbId) { skipped.push(`${seed.title} (geen TMDB-treffer)`); continue; }
      const details = await cached(`details-${tmdbId}`, () => getDetails(tmdbId));
      const scores = await cached(`omdb-${details.imdbId ?? tmdbId}`, () => getScores(details.imdbId));

      const raw: RawFilm = {
        id, tmdbId, imdbId: details.imdbId, title: details.title, year: details.year || seed.year || 0,
        dir: details.dir, runtime: details.runtime, genres: details.genres, keywords: details.keywords,
        overview: details.overview, posterUrl: details.posterUrl, backdropUrl: details.backdropUrl,
        scores, voteCount: details.voteCount,
      };

      // 03 — enrich (gecached)
      const enr: Enrichment = await cached(`enrich-${id}`, () => enrich(raw));

      films.push({
        id, title: raw.title, year: raw.year, dir: raw.dir, runtime: raw.runtime,
        genres: raw.genres, decade: decadeOf(raw.year),
        cult: details.voteAverage >= 7.8 && details.voteCount > 0 && details.voteCount < 400000,
        themes: enr.themes, scores: raw.scores, feel: enr.feel, why: enr.why, synopsis: enr.synopsis,
        trivia: enr.trivia, posterUrl: raw.posterUrl, backdropUrl: raw.backdropUrl,
        grad: enr.grad, ink: enr.ink, chain: [],
      });
      // Quiz-vragen bewaren we los, gekoppeld aan deze film-id.
      (enr.quiz ?? []).forEach((q) => quizPool.push({ ...q, film: id }));
      console.log(`  ✓ ${raw.title} (${raw.year})`);
    } catch (e) {
      skipped.push(`${seed.title} (${e instanceof Error ? e.message : e})`);
    }
  }

  // 04 — embeddings → ketens
  console.log(`[04] Embeddings + ketens voor ${films.length} films…`);
  const chains = await computeChains(
    films.map((f) => ({ id: f.id, text: `${f.title}. Thema's: ${f.themes.join(", ")}. ${f.synopsis} Keywords: ${f.genres.join(", ")}` })),
  );
  for (const f of films) f.chain = (chains[f.id] ?? []).filter((cid) => films.some((x) => x.id === cid));

  // 05 — bundle
  if (!existsSync(APP_DATA)) mkdirSync(APP_DATA, { recursive: true });
  const catalog: Catalog = { version: Math.floor(Date.now() / 1000), films, quiz: quizPool };
  writeFileSync(join(APP_DATA, "catalog.json"), JSON.stringify(catalog), "utf-8");

  console.log(`\n[05] Geschreven: ${join(APP_DATA, "catalog.json")}`);
  console.log(`     ${films.length} films, ${quizPool.length} quizvragen.`);
  if (skipped.length) {
    console.log(`\n⚠ ${skipped.length} overgeslagen (niet stilzwijgend):`);
    skipped.forEach((s) => console.log(`   - ${s}`));
  }
  const incomplete = films.filter((f) => !f.themes.length || !f.trivia.length || !f.posterUrl);
  if (incomplete.length) console.log(`\n⚠ ${incomplete.length} films met onvolledige data: ${incomplete.map((f) => f.id).join(", ")}`);
}

const quizPool: QuizQuestion[] = [];

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
