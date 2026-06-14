/* Centrale app-context (geport uit app.jsx). Navigatie/overlay-state is efemeer (useState);
 * persistente state (onboarding, watchlist, gezien, feel-voorkeuren, quizscores, seed) leeft in
 * Dexie en wordt reactief gelezen via useLiveQuery. Mutaties schrijven via patchState. */
import { createContext, useContext, useState, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { Feel } from "../data/types";
import { DEFAULT_STATE, getState, patchState, type AppState } from "../db/db";

/* Vaste design-keuzes (voorheen het Tweaks-panel uit het prototype). */
export const TWEAKS = {
  feedLayout: "tiktok" as "tiktok" | "rows",
  cardStyle: "poster" as "poster" | "editorial" | "minimal",
  tuneStyle: "sheet" as "sheet" | "fullscreen",
  quizStyle: "tap" as "tap" | "swipe",
  reduceMotion: false,
};

export type TabId = "discover" | "watchlist" | "quiz" | "profile";

export interface WNContext {
  t: typeof TWEAKS;
  // persistente state
  onboarded: boolean;
  watchlist: string[];
  seen: string[];
  favoriteThemes: string[];
  feelTarget: Feel;
  tuneFacets: AppState["tuneFacets"];
  seed: string | null;
  lastQuizScore: number | null;
  // navigatie
  tab: TabId;
  setTab: (t: TabId) => void;
  filmId: string | null;
  openFilm: (id: string) => void;
  closeFilm: () => void;
  tuneOpen: boolean;
  openTune: () => void;
  closeTune: () => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  quizActive: boolean;
  quizScope: string;
  startQuiz: (scope?: string) => void;
  openFilmQuiz: (id: string) => void;
  endQuiz: (retry?: boolean) => void;
  saveQuizScore: (pct: number) => void;
  // mutaties
  setSeed: (id: string) => void;
  clearSeed: () => void;
  toggleWatchlist: (id: string) => void;
  toggleSeen: (id: string) => void;
  setFeelTarget: (f: Feel) => void;
  setTuneFacets: (f: AppState["tuneFacets"]) => void;
  finishOnboarding: (p: { level: string; genres: string[]; themes: string[] }) => void;
  resetOnboarding: () => void;
}

const WN = createContext<WNContext | null>(null);
export const useWN = (): WNContext => {
  const ctx = useContext(WN);
  if (!ctx) throw new Error("useWN buiten AppProvider");
  return ctx;
};

async function toggleInArray(field: "watchlist" | "seen", id: string) {
  const s = await getState();
  const arr = s[field];
  await patchState({ [field]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const state = useLiveQuery(getState, [], DEFAULT_STATE);

  const [tab, setTab] = useState<TabId>("discover");
  const [filmId, setFilmId] = useState<string | null>(null);
  const [tuneOpen, setTuneOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [quizScope, setQuizScope] = useState("all");

  const quizScores = state.quizScores ?? [];
  const lastQuizScore = quizScores.length ? quizScores[quizScores.length - 1].pct : null;

  const ctx: WNContext = {
    t: TWEAKS,
    onboarded: state.onboarded,
    watchlist: state.watchlist,
    seen: state.seen,
    favoriteThemes: state.favoriteThemes,
    feelTarget: state.feelTarget,
    tuneFacets: state.tuneFacets,
    seed: state.seed,
    lastQuizScore,

    tab,
    setTab,
    filmId,
    openFilm: (id) => setFilmId(id),
    closeFilm: () => setFilmId(null),
    tuneOpen,
    openTune: () => setTuneOpen(true),
    closeTune: () => setTuneOpen(false),
    settingsOpen,
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
    searchOpen,
    openSearch: () => setSearchOpen(true),
    closeSearch: () => setSearchOpen(false),
    quizActive,
    quizScope,
    startQuiz: (scope) => { setQuizScope(scope || "all"); setQuizActive(true); },
    openFilmQuiz: (id) => { setQuizScope(id); setQuizActive(true); },
    endQuiz: (retry) => { setQuizActive(false); if (retry) setTimeout(() => setQuizActive(true), 80); },
    saveQuizScore: (pct) => {
      void (async () => {
        const s = await getState();
        await patchState({ quizScores: [...s.quizScores, { pct, at: new Date().toISOString() }] });
      })();
    },

    setSeed: (id) => { void patchState({ seed: id }); setSearchOpen(false); setTab("discover"); setFilmId(null); },
    clearSeed: () => { void patchState({ seed: null }); },
    toggleWatchlist: (id) => { void toggleInArray("watchlist", id); },
    toggleSeen: (id) => { void toggleInArray("seen", id); },
    setFeelTarget: (f) => { void patchState({ feelTarget: f }); },
    setTuneFacets: (f) => { void patchState({ tuneFacets: f }); },
    finishOnboarding: (p) => {
      void patchState({ onboarded: true, level: p.level, favoriteGenres: p.genres, favoriteThemes: p.themes });
      setTab("discover");
    },
    resetOnboarding: () => { setSettingsOpen(false); void patchState({ onboarded: false }); },
  };

  return <WN.Provider value={ctx}>{children}</WN.Provider>;
}
