/* Aanbevelingslogica. Werkt op de geladen catalogus. Thema-matching gebruikt de 0–10 themeScores-
 * vector wanneer aanwezig (gradient), met terugval op categorische label-overlap voor de mock. */
import type { CatalogFilm, Feel } from "../data/types";
import { FEELS, THEME_KEY } from "../data/config";
import { getCatalog } from "../data/catalog";

/* Afstand tussen een gewenste feel en die van een film → 0..100 (100 = perfecte match). */
export function feelMatch(target: Partial<Feel>, filmFeel: Feel): number {
  let d = 0;
  for (const f of FEELS) {
    d += Math.abs((target[f.key] ?? 5) - filmFeel[f.key]);
  }
  return Math.max(0, Math.round(100 - (d / (FEELS.length * 10)) * 100));
}

/* Hoe sterk past een film bij de favoriete thema's van de gebruiker → 0..1.
 * Met themeScores: gemiddelde 0–10-score over de gekozen thema's. Anders: binaire label-overlap. */
export function themeMatch(favoriteLabels: string[], film: CatalogFilm): number {
  if (!favoriteLabels.length) return 0;
  if (film.themeScores) {
    let sum = 0;
    for (const label of favoriteLabels) {
      const key = THEME_KEY[label];
      sum += (key && film.themeScores[key]) || 0;
    }
    return sum / (favoriteLabels.length * 10);
  }
  const fav = new Set(favoriteLabels);
  return film.themes.filter((t) => fav.has(t)).length / favoriteLabels.length;
}

const headlineRating = (f: CatalogFilm) => f.scores.imdb ?? f.scores.tmdb ?? 0;

/* De sterkst gedeelde thema's tussen twee films (op themeScores, anders labels). */
function sharedThemes(a: CatalogFilm, b: CatalogFilm): string[] {
  if (a.themeScores && b.themeScores) {
    return Object.keys(a.themeScores)
      .map((k) => ({ k, s: Math.min(a.themeScores![k as keyof typeof a.themeScores] ?? 0, b.themeScores![k as keyof typeof b.themeScores] ?? 0) }))
      .filter((x) => x.s >= 6)
      .sort((x, y) => y.s - x.s)
      .map((x) => b.themes.find((t) => t.toLowerCase() === x.k) ?? x.k);
  }
  return b.themes.filter((t) => a.themes.includes(t));
}

/* Waarom een film aanbevolen wordt t.o.v. een seed-film. */
export function seedWhy(seed: CatalogFilm | null, film: CatalogFilm): string {
  if (!seed || seed.id === film.id) return film.why;
  const shared = sharedThemes(seed, film);
  if (shared.length >= 2) return `Deelt ${shared[0].toLowerCase()} & ${shared[1].toLowerCase()} met ${seed.title}.`;
  if (shared.length === 1) return `Net als ${seed.title} draait dit om ${shared[0].toLowerCase()}.`;
  const fm = feelMatch(seed.feel, film.feel);
  return `${fm}% match op sfeer met ${seed.title}.`;
}

/* Gesorteerde aanbevelingsketen vanuit een seed: eerst de precomputed keten, daarna de rest op
 * feel-match. */
export function seedChain(seed: CatalogFilm | null): CatalogFilm[] {
  if (!seed) return [];
  const { films, byId } = getCatalog();
  const ids = seed.chain ?? [];
  const inChain = ids.map((id) => byId[id]).filter(Boolean) as CatalogFilm[];
  const rest = films
    .filter((f) => f.id !== seed.id && !ids.includes(f.id))
    .sort((a, b) => feelMatch(seed.feel, b.feel) - feelMatch(seed.feel, a.feel));
  return [...inChain, ...rest];
}

/* Profiel-gewogen "voor jou"-feed: thema-match (gradient) + gewenste feel + waardering. Blijft de
 * hele catalogus teruggeven (geen harde cap → blijft doorscrollen). */
export function personalFeed(opts: {
  favoriteThemes: string[];
  feelTarget: Partial<Feel>;
  seen: string[];
}): CatalogFilm[] {
  const { films } = getCatalog();
  const score = (f: CatalogFilm) =>
    themeMatch(opts.favoriteThemes, f) * 100 + feelMatch(opts.feelTarget, f.feel) * 0.4 + headlineRating(f);
  return [...films].sort((a, b) => score(b) - score(a));
}
