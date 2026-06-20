/* Lokaal-eerste opslag van de PERSOONLIJKE data (geen filmcatalogus) via Dexie/IndexedDB.
 * De volledige app-state past in één klein document; dat document is ook precies wat we als
 * snapshot naar OneDrive syncen. useLiveQuery zorgt voor reactiviteit. */
import Dexie, { type Table } from "dexie";
import type { Feel } from "../data/types";
import type { LangId } from "../i18n/dict";

export interface AppState {
  onboarded: boolean;
  lang: LangId; // UI-taal; bronstrings zijn NL
  level: string | null;
  favoriteGenres: string[];
  favoriteThemes: string[];
  watchlist: string[]; // film-ids
  seen: string[]; // film-ids
  feelTarget: Feel;
  tuneFacets: { genres: string[]; decades: string[]; cult: boolean };
  quizScores: { pct: number; at: string }[];
  seed: string | null;
  syncEnabled: boolean; // OneDrive-sync ingesteld (bij onboarding of via Settings) → stille pull bij herstart
  updatedAt: string; // ISO — gebruikt voor sync-conflictbeslissingen
}

export const DEFAULT_STATE: AppState = {
  onboarded: false,
  lang: "nl",
  level: null,
  favoriteGenres: [],
  favoriteThemes: [],
  watchlist: [],
  seen: [],
  feelTarget: { cinematography: 8, intrigue: 7, comedic: 3, emotional: 7, pace: 4 },
  tuneFacets: { genres: [], decades: [], cult: false },
  quizScores: [],
  seed: null,
  syncEnabled: false,
  updatedAt: "1970-01-01T00:00:00.000Z",
};

interface KVRow {
  key: string;
  value: unknown;
}

class WhatNowDB extends Dexie {
  kv!: Table<KVRow, string>;
  constructor() {
    super("whatnow");
    this.version(1).stores({ kv: "key" });
  }
}

export const db = new WhatNowDB();

const STATE_KEY = "appState";

export async function getState(): Promise<AppState> {
  const row = await db.kv.get(STATE_KEY);
  return { ...DEFAULT_STATE, ...((row?.value as Partial<AppState>) ?? {}) };
}

/* Read-modify-write van de app-state. Zet automatisch updatedAt. */
export async function patchState(patch: Partial<AppState>): Promise<AppState> {
  const next: AppState = { ...(await getState()), ...patch, updatedAt: new Date().toISOString() };
  await db.kv.put({ key: STATE_KEY, value: next });
  return next;
}

/* Vervang de volledige state (bv. na een pull vanuit OneDrive). */
export async function replaceState(state: AppState): Promise<void> {
  await db.kv.put({ key: STATE_KEY, value: state });
}

/* Live-query helper: het ruwe state-document (of undefined vóór eerste schrijf). */
export function liveStateRow() {
  return db.kv.get(STATE_KEY);
}
