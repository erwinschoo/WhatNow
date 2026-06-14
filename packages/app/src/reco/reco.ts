/* Aanbevelingslogica — geport uit het design (components.jsx: feelMatch, seedWhy, seedChain).
 * Werkt op de geladen catalogus i.p.v. mock-globals. De thematische keten gebruikt de precomputed
 * `chain` per film (offline via embeddings), met een feel-match-fallback voor de rest. */
import type { CatalogFilm, Feel } from "../data/types";
import { FEELS } from "../data/config";
import { getCatalog } from "../data/catalog";

/* Afstand tussen een gewenste feel en die van een film → 0..100 (100 = perfecte match). */
export function feelMatch(target: Partial<Feel>, filmFeel: Feel): number {
  let d = 0;
  for (const f of FEELS) {
    d += Math.abs((target[f.key] ?? 5) - filmFeel[f.key]);
  }
  return Math.max(0, Math.round(100 - (d / (FEELS.length * 10)) * 100));
}

/* Waarom een film aanbevolen wordt t.o.v. een seed-film (gedeelde thema's, anders feel-match). */
export function seedWhy(seed: CatalogFilm | null, film: CatalogFilm): string {
  if (!seed || seed.id === film.id) return film.why;
  const shared = film.themes.filter((t) => seed.themes.includes(t));
  if (shared.length >= 2) return `Deelt ${shared[0].toLowerCase()} & ${shared[1].toLowerCase()} met ${seed.title}.`;
  if (shared.length === 1) return `Net als ${seed.title} draait dit om ${shared[0].toLowerCase()}.`;
  const fm = feelMatch(seed.feel, film.feel);
  return `${fm}% match op sfeer met ${seed.title}.`;
}

/* Gesorteerde aanbevelingsketen vanuit een seed: eerst de precomputed keten, daarna de rest
 * op feel-match. */
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

/* Profiel-gewogen "voor jou"-feed: rangschik de catalogus op overlap met favoriete thema's,
 * de gewenste feel, en bonus voor reeds hoog-gewaardeerde verwanten. Blijft de hele catalogus
 * teruggeven (geen harde cap → blijft doorscrollen). */
export function personalFeed(opts: {
  favoriteThemes: string[];
  feelTarget: Partial<Feel>;
  seen: string[];
}): CatalogFilm[] {
  const { films } = getCatalog();
  const fav = new Set(opts.favoriteThemes);
  const score = (f: CatalogFilm) => {
    const themeHits = f.themes.filter((t) => fav.has(t)).length;
    return themeHits * 18 + feelMatch(opts.feelTarget, f.feel) * 0.4 + f.scores.imdb;
  };
  return [...films].sort((a, b) => score(b) - score(a));
}
