/* Statische UI-configuratie (geen catalogusdata): feel-dimensies, onboarding-opties en badges.
 * Uit het design (Design/WhatNow_extracted/data.jsx). */
import type { FeelKey } from "./types";

export interface FeelDef {
  key: FeelKey;
  label: string;
  lo: string;
  hi: string;
}

export const FEELS: FeelDef[] = [
  { key: "cinematography", label: "Cinematografie", lo: "Functioneel", hi: "Schilderachtig" },
  { key: "intrigue", label: "Intrige", lo: "Rechttoe", hi: "Raadselachtig" },
  { key: "comedic", label: "Humor", lo: "Bloedserieus", hi: "Speels" },
  { key: "emotional", label: "Emotionele diepte", lo: "Koel", hi: "Hartverscheurend" },
  { key: "pace", label: "Tempo", lo: "Beschouwend", hi: "Strak" },
];

export const GENRES = ["Sci-Fi", "Drama", "Thriller", "Romance", "Crime", "Mystery"];
export const DECADES = ["1960s", "2000s", "2010s", "2020s"];

export interface WatchLevel {
  id: string;
  label: string;
  sub: string;
  films: string;
}

export const WATCH_LEVELS: WatchLevel[] = [
  { id: "soms", label: "Af en toe", sub: "Een paar films per maand", films: "~2/mnd" },
  { id: "regelmatig", label: "Regelmatig", sub: "Wekelijkse filmavond", films: "~1/week" },
  { id: "liefhebber", label: "Filmliefhebber", sub: "Je leeft voor cinema", films: "~3/week" },
  { id: "dagelijks", label: "Dagelijks", sub: "Eén per dag, minstens", films: "~7/week" },
];

export const ONB_GENRES = ["Sci-Fi", "Drama", "Thriller", "Romance", "Crime", "Mystery", "Comedy", "Horror", "Documentaire", "Animatie"];
export const ONB_THEMES = ["Herinnering", "Identiteit", "Eenzaamheid", "Tijd", "Klasse", "Verlangen", "Lot", "Dromen", "Technologie", "Geweld", "Familie", "Hebzucht", "Geloof", "Verlies"];

export interface BadgeDef {
  id: string;
  label: string;
  icon: string;
  sub: string;
}

/* Definities van de badges; of een badge verdiend is, wordt afgeleid uit de gebruikersdata
 * (zie state/profile.ts). */
export const BADGES: BadgeDef[] = [
  { id: "cinephile", label: "Cinefiel", icon: "film", sub: "50+ films gezien" },
  { id: "theme", label: "Thema-ontdekker", icon: "compass", sub: "10 thematische ketens gevolgd" },
  { id: "night", label: "Nachtbraker", icon: "moon", sub: "20 films na middernacht" },
  { id: "quizmaster", label: "Quizmeester", icon: "star", sub: "5 quizzes 100% gehaald" },
  { id: "decade", label: "Tijdreiziger", icon: "clock", sub: "Film uit elk decennium sinds 1950" },
  { id: "complete", label: "Voltooier", icon: "check", sub: "Een hele thematische keten af" },
];
