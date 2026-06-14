/* Datamodel voor WhatNow — leidend voor zowel de gebundelde catalogus als de pipeline-output.
 * Afgeleid van het design (Design/WhatNow_extracted/data.jsx). De feel-sleutels blijven
 * bewust gelijk (comedic/emotional, niet comedicValue/emotionalDepth) zodat pipeline en app matchen. */

export type FeelKey = "cinematography" | "intrigue" | "comedic" | "emotional" | "pace";

export type Feel = Record<FeelKey, number>; // elk 0–10

export interface FilmScores {
  imdb: number; // 0–10
  rt: number; // 0–100
  mc: number; // 0–100
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
  scores: FilmScores;
  feel: Feel;
  why: string;
  synopsis: string;
  trivia: string[];
  /* Poster: TMDB-CDN-URL in de echte catalogus. `grad`/`ink` zijn de gradient-fallback/placeholder
   * uit het design en worden getoond tijdens het laden of als er geen poster is. */
  posterUrl?: string;
  backdropUrl?: string;
  grad: [string, string];
  ink: string;
  /* Precomputed thematische keten ("meer zoals dit"): id's van de dichtstbijzijnde films,
   * offline berekend via embeddings. Vervangt de hardgecodeerde CHAINS uit het design. */
  chain: string[];
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number; // index in options
  fact: string;
  film: string; // film-id
}

export interface Catalog {
  version: number;
  films: CatalogFilm[];
  quiz: QuizQuestion[];
}
