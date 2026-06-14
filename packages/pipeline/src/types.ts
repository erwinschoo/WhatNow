/* Spiegelt het app-datamodel (packages/app/src/data/types.ts). Bewust gedupliceerd zodat de
 * pipeline een los pakket blijft; houd de feel-sleutels gelijk (comedic/emotional). */
export type FeelKey = "cinematography" | "intrigue" | "comedic" | "emotional" | "pace";
export type Feel = Record<FeelKey, number>;

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
  scores: { imdb: number; rt: number; mc: number };
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

/* Tussenresultaat ná TMDB/OMDb, vóór Claude-verrijking. */
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
  overview: string;
  posterUrl?: string;
  backdropUrl?: string;
  scores: { imdb: number; rt: number; mc: number };
  voteCount: number;
}

/* Door Claude gegenereerde verrijking per film. */
export interface Enrichment {
  feel: Feel;
  themes: string[];
  why: string;
  synopsis: string;
  trivia: string[];
  quiz: { q: string; options: string[]; answer: number; fact: string }[];
  grad: [string, string];
  ink: string;
}
