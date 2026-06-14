/* Orchestrator: seed → OMDb (ruwe data + poster + scores) → verrijking uit enrichments.json
 * (in-sessie door Claude gegenereerd, géén betaalde API) → embeddings/ketens → catalog.json.
 *
 * TMDB is optioneel: staat er een TMDB_API_KEY, dan halen we daar betere poster/backdrop + keywords
 * bij. Staat er een ANTHROPIC_API_KEY én ontbreekt de verrijking, dan valt het terug op de API.
 * Idempotent dankzij de bestand-cache.
 *
 *   01 seed      seed.json
 *   02 fetch     OMDb per film (gecached); optioneel TMDB-augmentatie
 *   03 enrich    enrichments.json ("Titel (jaar)") — of API-fallback
 *   04 embed     lokale embeddings → thematische keten per film
 *   05 bundle    catalog.json → packages/app/public/data/
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cached } from "./cache.js";
import { getById, getByTitle } from "./omdb.js";
import { findTmdbId, getDetails } from "./tmdb.js";
import { enrich } from "./enrich.js";
import { computeChains } from "./embed.js";
import type { Catalog, CatalogFilm, Enrichment, QuizQuestion } from "./types.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const APP_DATA = join(ROOT, "..", "app", "public", "data");

try {
  (process as any).loadEnvFile?.(join(ROOT, ".env"));
} catch {
  /* keys via omgeving */
}

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const decadeOf = (year: number) => `${Math.floor(year / 10) * 10}s`;

interface Seed { id?: string; title: string; year?: number; imdbId?: string }

async function main() {
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg >= 0 ? Number(process.argv[limitArg + 1]) : Infinity;
  const hasTmdb = !!process.env.TMDB_API_KEY;
  const hasApi = !!process.env.ANTHROPIC_API_KEY;

  const seeds: Seed[] = JSON.parse(readFileSync(join(ROOT, "seed.json"), "utf-8"));
  const enrichments: Record<string, Enrichment> = existsSync(join(ROOT, "enrichments.json"))
    ? JSON.parse(readFileSync(join(ROOT, "enrichments.json"), "utf-8"))
    : {};
  const selected = seeds.slice(0, limit);
  console.log(`[01] ${selected.length} films in seed${hasTmdb ? " · TMDB aan" : ""}${hasApi ? " · API-fallback aan" : ""}.`);

  const films: CatalogFilm[] = [];
  const quizPool: QuizQuestion[] = [];
  const skipped: string[] = [];

  for (const seed of selected) {
    const key = `${seed.title} (${seed.year ?? ""})`.replace(" ()", "");
    const id = seed.id ?? (slug(`${seed.title}-${seed.year ?? ""}`) || slug(seed.title));
    try {
      // 03a — verrijking: bestand eerst, anders API-fallback (indien key), anders overslaan
      let enr: Enrichment | undefined = enrichments[key];
      if (!enr && !hasApi) { skipped.push(`${key} (geen verrijking in enrichments.json)`); continue; }

      // 02 — OMDb (gecached). IMDb-id is exact; titel-zoeken is fallback.
      const raw = seed.imdbId
        ? await cached(`omdb-id-${seed.imdbId}`, () => getById(seed.imdbId!))
        : await cached(`omdb-title-${id}`, () => getByTitle(seed.title, seed.year));
      if (!raw) { skipped.push(`${key} (geen OMDb-treffer)`); continue; }

      // 02b — optionele TMDB-augmentatie (betere poster/backdrop + keywords)
      let posterUrl = raw.posterUrl;
      let backdropUrl: string | undefined;
      let keywords: string[] = [];
      if (hasTmdb) {
        try {
          const tmdbId = await cached(`tmdbid-${id}`, () => findTmdbId(seed.title, seed.year));
          if (tmdbId) {
            const d = await cached(`details-${tmdbId}`, () => getDetails(tmdbId));
            posterUrl = d.posterUrl ?? posterUrl;
            backdropUrl = d.backdropUrl;
            keywords = d.keywords;
          }
        } catch { /* TMDB-augmentatie is best-effort */ }
      }

      // 03b — API-fallback als er geen bestand-verrijking is
      if (!enr) {
        enr = await cached(`enrich-${id}`, () =>
          enrich({ id, tmdbId: 0, imdbId: raw.imdbId, title: raw.title, year: raw.year, dir: raw.dir,
            runtime: raw.runtime, genres: raw.genres, keywords, overview: raw.plot, posterUrl,
            backdropUrl, scores: raw.scores, voteCount: 0 }),
        );
      }

      films.push({
        id, title: raw.title, year: raw.year || seed.year || 0, dir: raw.dir, runtime: raw.runtime,
        genres: raw.genres, decade: decadeOf(raw.year || seed.year || 0), cult: enr.cult ?? false,
        themes: enr.themes, scores: raw.scores, feel: enr.feel, why: enr.why, synopsis: enr.synopsis,
        trivia: enr.trivia, posterUrl, backdropUrl, grad: enr.grad, ink: enr.ink, chain: [],
      });
      (enr.quiz ?? []).forEach((q) => quizPool.push({ ...q, film: id }));
      console.log(`  ✓ ${raw.title} (${raw.year})${posterUrl ? "" : " [geen poster]"}`);
    } catch (e) {
      skipped.push(`${key} (${e instanceof Error ? e.message : e})`);
    }
  }

  // 04 — embeddings → ketens
  console.log(`[04] Embeddings + ketens voor ${films.length} films…`);
  const chains = await computeChains(
    films.map((f) => ({ id: f.id, text: `${f.title}. Thema's: ${f.themes.join(", ")}. ${f.synopsis} Genres: ${f.genres.join(", ")}` })),
  );
  for (const f of films) f.chain = (chains[f.id] ?? []).filter((cid) => films.some((x) => x.id === cid));

  // 05 — bundle
  if (!existsSync(APP_DATA)) mkdirSync(APP_DATA, { recursive: true });
  const catalog: Catalog = { version: Math.floor(Date.now() / 1000), films, quiz: quizPool };
  writeFileSync(join(APP_DATA, "catalog.json"), JSON.stringify(catalog), "utf-8");

  console.log(`\n[05] Geschreven: ${join(APP_DATA, "catalog.json")} — ${films.length} films, ${quizPool.length} quizvragen.`);
  if (skipped.length) {
    console.log(`\n⚠ ${skipped.length} overgeslagen (niet stilzwijgend):`);
    skipped.forEach((s) => console.log(`   - ${s}`));
  }
  const incomplete = films.filter((f) => !f.posterUrl);
  if (incomplete.length) console.log(`\nℹ ${incomplete.length} films zonder poster (gradient-fallback): ${incomplete.map((f) => f.id).join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
