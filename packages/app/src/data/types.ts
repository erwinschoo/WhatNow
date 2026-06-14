/* Datamodel voor WhatNow — leidend voor de gebundelde/gehoste catalogus en de pipeline-output.
 * De feel-sleutels blijven gelijk (comedic/emotional). Thema's zijn nu een 0–10 vector
 * (themeScores) met een afgeleide top-N labellijst (themes) voor chips/back-compat. */

export type FeelKey = "cinematography" | "intrigue" | "comedic" | "emotional" | "pace";
export type Feel = Record<FeelKey, number>; // elk 0–10

/* Canonieke thema-sleutels (lowercase, ascii). Labels staan in data/config.ts (THEMES). */
export type ThemeKey =
  | "herinnering" | "identiteit" | "eenzaamheid" | "tijd" | "klasse" | "verlangen" | "lot"
  | "dromen" | "technologie" | "geweld" | "familie" | "hebzucht" | "geloof" | "verlies";

export type ThemeScores = Partial<Record<ThemeKey, number>>; // elk 0–10

export interface FilmScores {
  tmdb?: number; // 0–10, vrijwel altijd aanwezig (TMDB-rating)
  imdb?: number; // 0–10 (OMDb)
  rt?: number; // 0–100 (OMDb, Rotten Tomatoes)
  mc?: number; // 0–100 (OMDb, Metacritic)
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
  themes: string[]; // afgeleide top-N labels (voor chips); themeScores is leidend
  themeScores?: ThemeScores; // 0–10 per thema (gradient) — ontbreekt in de mock-fallback
  scores: FilmScores;
  feel: Feel;
  why: string;
  synopsis: string;
  trivia: string[];
  posterUrl?: string;
  backdropUrl?: string;
  grad: [string, string];
  ink: string;
  chain: string[]; // precomputed thematische buren (embeddings)
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  fact: string;
  film: string;
}

export interface Catalog {
  version: number;
  films: CatalogFilm[];
  quiz: QuizQuestion[];
}

/* Klein meta-bestand voor de versie-gestuurde update (zie data/catalog.ts). */
export interface CatalogMeta {
  version: number;
  count: number;
}
