/* Spiegelt het app-datamodel (packages/app/src/data/types.ts). Bewust gedupliceerd zodat de
 * pipeline een los pakket blijft; houd feel- en thema-sleutels gelijk. */
export type FeelKey = "cinematography" | "intrigue" | "comedic" | "emotional" | "pace";
export type Feel = Record<FeelKey, number>;

export type ThemeKey =
  | "herinnering" | "identiteit" | "eenzaamheid" | "tijd" | "klasse" | "verlangen" | "lot"
  | "dromen" | "technologie" | "geweld" | "familie" | "hebzucht" | "geloof" | "verlies";
export type ThemeScores = Partial<Record<ThemeKey, number>>;

export interface FilmScores {
  tmdb?: number;
  imdb?: number;
  rt?: number;
  mc?: number;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  fact: string;
  film: string;
}

export interface CatalogFilm {
  id: string;
  title: string;
  year: number;
  dir: string;
  runtime: number;
  genres: string[];
  decade: string;
  cult: boolean;
  themes: string[];
  themeScores: ThemeScores;
  scores: FilmScores;
  feel: Feel;
  why: string;
  synopsis: string;
  trivia: string[];
  posterUrl?: string;
  backdropUrl?: string;
  grad: [string, string];
  ink: string;
  chain: string[];
}

export interface Catalog {
  version: number;
  films: CatalogFilm[];
  quiz: QuizQuestion[];
}

export interface CatalogMeta {
  version: number;
  count: number;
}

/* Hero-verrijking (in-sessie door Claude), gecommit in enrichments.json (gekeyd op "Titel (jaar)").
 * Overschrijft de automatisch afgeleide waarden voor de populairste films. Alle velden optioneel. */
export interface HeroEnrichment {
  feel?: Feel;
  themes?: string[];
  why?: string;
  synopsis?: string;
  trivia?: string[];
  quiz?: { q: string; options: string[]; answer: number; fact: string }[];
  grad?: [string, string];
  ink?: string;
  cult?: boolean;
}

/* Ruwe film ná TMDB (+optioneel OMDb), vóór afleiding. */
export interface RawFilm {
  id: string;
  tmdbId: number;
  imdbId?: string;
  title: string;
  year: number;
  dir: string;
  runtime: number;
  genres: string[];
  keywords: string[];
  overview: string; // nl-NL
  posterUrl?: string;
  backdropUrl?: string;
  scores: FilmScores;
  popularity: number;
}
