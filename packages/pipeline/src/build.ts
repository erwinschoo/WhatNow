/* Orchestrator (catalogus v2): TMDB discover → nl-details → OMDb-supplement (top) → embeddings →
 * thema-/feel-scores + ketens → hero-overrides → catalog.json + catalog-meta.json.
 *
 * Bron: TMDB hoofdbron (discover/keywords/nl-plots/posters), OMDb supplement (RT/MC, top ~1000).
 * Thema-/feel-scores worden automatisch afgeleid uit embeddings (gratis, schaalt); de hero-set uit
 * enrichments.json overschrijft feel/trivia/quiz/why/grad/ink/cult. Idempotent via de bestand-cache.
 *
 *   npm run build              → ~5000 films (TARGET)
 *   npm run build:sample       → ~200 films
 *   tsx src/build.ts --limit N → N films
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cached } from "./cache.js";
import { discoverPage, findTmdbId, getDetails } from "./tmdb.js";
import { getById } from "./omdb.js";
import { computeChains, embedMany } from "./embed.js";
import { FEEL_DESCRIPTORS, THEME_DESCRIPTORS, scoreAxes } from "./derive.js";
import { mapLimit } from "./concurrency.js";
import type { Catalog, CatalogFilm, CatalogMeta, Feel, FeelKey, HeroEnrichment, QuizQuestion, ThemeKey, ThemeScores } from "./types.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const APP_DATA = join(ROOT, "..", "app", "public", "data");
const TARGET_DEFAULT = 5000;
const OMDB_BUDGET = 1000; // top-N op populariteit krijgt RT/Metacritic (1000/dag)

try { (process as any).loadEnvFile?.(join(ROOT, ".env")); } catch { /* keys via omgeving */ }

const THEME_LABELS: Record<ThemeKey, string> = {
  herinnering: "Herinnering", identiteit: "Identiteit", eenzaamheid: "Eenzaamheid", tijd: "Tijd",
  klasse: "Klasse", verlangen: "Verlangen", lot: "Lot", dromen: "Dromen", technologie: "Technologie",
  geweld: "Geweld", familie: "Familie", hebzucht: "Hebzucht", geloof: "Geloof", verlies: "Verlies",
};

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const decadeOf = (year: number) => `${Math.floor(year / 10) * 10}s`;

function hashStr(s: string): number { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function hslHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}
function placeholderGrad(id: string): { grad: [string, string]; ink: string } {
  const hue = hashStr(id) % 360;
  return { grad: [hslHex(hue, 45, 22), hslHex((hue + 28) % 360, 50, 8)], ink: hslHex(hue, 60, 75) };
}

function topThemes(scores: ThemeScores): string[] {
  const sorted = (Object.keys(scores) as ThemeKey[]).sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));
  const strong = sorted.filter((k) => (scores[k] ?? 0) >= 6).slice(0, 4);
  return (strong.length ? strong : sorted.slice(0, 2)).map((k) => THEME_LABELS[k]);
}

interface Seed { id?: string; title: string; year?: number; imdbId?: string }

async function discoverIds(target: number): Promise<number[]> {
  const ids: number[] = [];
  const seen = new Set<number>();
  for (let page = 1; ids.length < target && page <= 500; page++) {
    const hits = await cached(`discover-votes-${page}`, () => discoverPage(page, { sortBy: "vote_count.desc", minVotes: 200 }));
    if (!hits.length) break;
    for (const h of hits) if (!seen.has(h.id)) { seen.add(h.id); ids.push(h.id); }
  }
  return ids.slice(0, target);
}

async function main() {
  const limitArg = process.argv.indexOf("--limit");
  const target = limitArg >= 0 ? Number(process.argv[limitArg + 1]) : TARGET_DEFAULT;

  const seeds: Seed[] = JSON.parse(readFileSync(join(ROOT, "seed.json"), "utf-8"));
  const hero: Record<string, HeroEnrichment> = existsSync(join(ROOT, "enrichments.json"))
    ? JSON.parse(readFileSync(join(ROOT, "enrichments.json"), "utf-8"))
    : {};

  // 01 — discover + hero-tmdbIds samenvoegen
  console.log(`[01] Discover tot ~${target} films…`);
  const discovered = await discoverIds(target);
  const heroByTmdb = new Map<number, Seed>();
  for (const s of seeds) {
    const tmdbId = await cached(`tmdbid-${s.id ?? slug(s.title)}`, () => findTmdbId(s.title, s.year));
    if (tmdbId) heroByTmdb.set(tmdbId, s);
  }
  const tmdbIds = Array.from(new Set<number>([...discovered, ...heroByTmdb.keys()]));
  console.log(`     ${tmdbIds.length} unieke film-ids (incl. ${heroByTmdb.size} hero).`);

  // 02 — details (TMDB, nl-NL), concurrency
  console.log(`[02] Details ophalen…`);
  const raws = (await mapLimit(tmdbIds, 12, async (tmdbId) => {
    try {
      const d = await cached(`details-${tmdbId}`, () => getDetails(tmdbId));
      if (!d.title || !d.year) return null;
      const seed = heroByTmdb.get(tmdbId);
      const id = seed?.id ?? slug(`${d.title}-${d.year}`);
      return { id, seed, d };
    } catch { return null; }
  })).filter(Boolean) as { id: string; seed?: Seed; d: Awaited<ReturnType<typeof getDetails>> }[];

  // 03 — OMDb-supplement voor de top-N op populariteit (RT/MC + IMDb-rating)
  const byPop = [...raws].sort((a, b) => b.d.popularity - a.d.popularity);
  const omdbSet = new Set(byPop.slice(0, OMDB_BUDGET).map((r) => r.id));
  console.log(`[03] OMDb (RT/MC) voor top ${Math.min(OMDB_BUDGET, raws.length)}…`);
  const omdb: Record<string, { imdb?: number; rt?: number; mc?: number }> = {};
  await mapLimit(raws.filter((r) => omdbSet.has(r.id) && r.d.imdbId), 5, async (r) => {
    try {
      const o = await cached(`omdb-id-${r.d.imdbId}`, () => getById(r.d.imdbId!));
      if (o) omdb[r.id] = { imdb: o.scores.imdb || undefined, rt: o.scores.rt || undefined, mc: o.scores.mc || undefined };
    } catch { /* sla over */ }
  });

  // 04 — embeddings (één keer) → thema-/feel-scores + ketens
  console.log(`[04] Embeddings + afleiding voor ${raws.length} films…`);
  const vectors = await embedMany(raws.map((r) => `${r.d.title}. ${r.d.overview} Thema's en sfeer: ${r.d.keywords.join(", ")}. Genres: ${r.d.genres.join(", ")}.`));
  const themeScored = await scoreAxes<ThemeKey>(vectors, THEME_DESCRIPTORS);
  const feelScored = await scoreAxes<FeelKey>(vectors, FEEL_DESCRIPTORS);
  const chains = computeChains(raws.map((r) => r.id), vectors);

  // 05 — assembleren
  const films: CatalogFilm[] = [];
  const quizPool: QuizQuestion[] = [];
  raws.forEach((r, i) => {
    const key = `${r.d.title} (${r.d.year})`;
    const h: HeroEnrichment = (r.seed && hero[`${r.seed.title} (${r.seed.year})`]) || hero[key] || {};
    const themeScores = themeScored[i] as ThemeScores;
    const feel: Feel = h.feel ?? feelScored[i];
    const pal = h.grad && h.ink ? { grad: h.grad, ink: h.ink } : placeholderGrad(r.id);
    const labels = topThemes(themeScores);
    films.push({
      id: r.id, title: r.d.title, year: r.d.year, dir: r.d.dir, runtime: r.d.runtime, genres: r.d.genres,
      decade: decadeOf(r.d.year), cult: h.cult ?? (r.d.voteAverage >= 7.8 && r.d.voteCount > 0 && r.d.voteCount < 200000),
      themes: h.themes ?? labels, themeScores,
      scores: { tmdb: r.d.voteAverage || undefined, ...omdb[r.id] },
      feel, why: h.why ?? `Sterk op ${labels.slice(0, 2).map((l) => l.toLowerCase()).join(" & ")}.`,
      synopsis: h.synopsis ?? r.d.overview, trivia: h.trivia ?? [],
      posterUrl: r.d.posterUrl, backdropUrl: r.d.backdropUrl, grad: pal.grad, ink: pal.ink,
      chain: (chains[r.id] ?? []),
    });
    (h.quiz ?? []).forEach((q) => quizPool.push({ ...q, film: r.id }));
  });

  // 06 — bundle + meta
  if (!existsSync(APP_DATA)) mkdirSync(APP_DATA, { recursive: true });
  const version = Math.floor(Date.now() / 1000);
  const catalog: Catalog = { version, films, quiz: quizPool };
  const meta: CatalogMeta = { version, count: films.length };
  writeFileSync(join(APP_DATA, "catalog.json"), JSON.stringify(catalog), "utf-8");
  writeFileSync(join(APP_DATA, "catalog-meta.json"), JSON.stringify(meta), "utf-8");

  const noPoster = films.filter((f) => !f.posterUrl).length;
  const noSynopsis = films.filter((f) => !f.synopsis).length;
  const withRt = films.filter((f) => f.scores.rt).length;
  console.log(`\n[06] Geschreven: catalog.json (${films.length} films, ${quizPool.length} quizvragen, v${version}).`);
  console.log(`     RT/MC: ${withRt} · zonder poster: ${noPoster} · zonder synopsis: ${noSynopsis} · hero-quiz: ${quizPool.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
