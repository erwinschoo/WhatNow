/* Centrale app-context (geport uit app.jsx). Navigatie/overlay-state is efemeer (useState);
 * persistente state (onboarding, watchlist, gezien, feel-voorkeuren, quizscores, seed) leeft in
 * Dexie en wordt reactief gelezen via useLiveQuery. Mutaties schrijven via patchState. */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { Feel } from "../data/types";
import { DEFAULT_STATE, getState, patchState, type AppState } from "../db/db";
import type { LangId } from "../i18n/dict";
import { makeTr, type Tr } from "../i18n/i18n";
import { decideBootMode, type BootMode } from "../data/catalog";
import { scheduleSync } from "../sync/syncEngine";

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
  // i18n
  lang: LangId;
  tr: Tr;
  setLang: (l: LangId) => void;
  // boot / splash
  catalogReady: boolean;
  boot: { mode: BootMode } | null;
  /* null = boot-beslissing loopt nog; true = eerste run (wizard laadt zelf de catalogus in de
   * laatste stap); false = al ge-onboard (normale herstart via Splash). */
  firstRun: boolean | null;
  checkUpdates: () => void;
  // her-onboarding
  reonboard: boolean;
  cancelOnboarding: () => void;
  // persistente state
  onboarded: boolean;
  watchlist: string[];
  seen: string[];
  favoriteThemes: string[];
  feelTarget: Feel;
  tuneFacets: AppState["tuneFacets"];
  seed: string | null;
  syncEnabled: boolean;
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
  setSyncEnabled: (v: boolean) => void;
  finishOnboarding: (p: { level: string; genres: string[]; themes: string[] }) => void;
  resetOnboarding: () => void;
  endBoot: () => void;
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
  const [catalogReady, setCatalogReady] = useState(false);
  const [boot, setBoot] = useState<{ mode: BootMode } | null>(null);
  const [firstRun, setFirstRun] = useState<boolean | null>(null);
  const [reonboard, setReonboard] = useState(false);

  /* Koude start (één keer). De beslissing leunt op de lokale IndexedDB-record (getState), niet op
   * de live-default — zo flitst de wizard nooit even op mobiel.
   *   - Nog niet ge-onboard → firstRun: de wizard verschijnt meteen en laadt zélf de catalogus in
   *     z'n laatste stap (geen aparte fetch-splash ervóór, geen tweede splash erna).
   *   - Wel ge-onboard → bepaal de splash-modus (catalogus-versiecheck) en toon de Splash; die
   *     laadt de catalogus én doet — als sync is ingesteld — een stille OneDrive-pull, vóór we via
   *     onDone (endBoot) op Ontdek belanden. */
  const bootedOnce = useRef(false);
  useEffect(() => {
    if (bootedOnce.current) return;
    bootedOnce.current = true;
    void (async () => {
      const s = await getState();
      if (!s.onboarded) {
        setFirstRun(true);
        return;
      }
      setFirstRun(false);
      setBoot({ mode: await decideBootMode() });
    })();
  }, []);

  /* Auto-sync: na een lokale mutatie (updatedAt verandert) plannen we — als sync is ingesteld — een
   * gedebouncede stille push/merge naar OneDrive. De eerste waarneming (mount/boot) slaan we over;
   * de boot-pull in de Splash dekt dat al. */
  const lastSyncedUpdatedAt = useRef<string | null>(null);
  useEffect(() => {
    if (!state.syncEnabled) return;
    if (lastSyncedUpdatedAt.current === null) { lastSyncedUpdatedAt.current = state.updatedAt; return; }
    if (lastSyncedUpdatedAt.current === state.updatedAt) return;
    lastSyncedUpdatedAt.current = state.updatedAt;
    scheduleSync();
  }, [state.updatedAt, state.syncEnabled]);

  /* Pull-merge bij terugkeer naar de app (een ander toestel/tab kan intussen hebben gesynct). */
  const syncEnabledRef = useRef(state.syncEnabled);
  syncEnabledRef.current = state.syncEnabled;
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && syncEnabledRef.current) scheduleSync(400);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  const tr = makeTr(state.lang);
  const quizScores = state.quizScores ?? [];
  const lastQuizScore = quizScores.length ? quizScores[quizScores.length - 1].pct : null;

  const ctx: WNContext = {
    t: TWEAKS,
    lang: state.lang,
    tr,
    setLang: (l) => { void patchState({ lang: l }); },
    catalogReady,
    boot,
    firstRun,
    checkUpdates: () => {
      setSettingsOpen(false);
      void decideBootMode().then((mode) => setBoot({ mode }));
    },
    reonboard,
    cancelOnboarding: () => setReonboard(false),
    onboarded: state.onboarded,
    watchlist: state.watchlist,
    seen: state.seen,
    favoriteThemes: state.favoriteThemes,
    feelTarget: state.feelTarget,
    tuneFacets: state.tuneFacets,
    seed: state.seed,
    syncEnabled: state.syncEnabled,
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
    setSyncEnabled: (v) => { void patchState({ syncEnabled: v }); },
    /* Afronden van de wizard. Bij de eerste run is de catalogus al geladen in de laatste
     * wizard-stap; bij her-onboarding stond die er al. We zetten catalogReady/firstRun hier
     * synchroon zodat we direct naar Ontdek gaan — géén tweede splash. */
    finishOnboarding: (p) => {
      void patchState({ onboarded: true, level: p.level, favoriteGenres: p.genres, favoriteThemes: p.themes });
      setReonboard(false);
      setFirstRun(false);
      setCatalogReady(true);
      setTab("discover");
    },
    /* Start de wizard opnieuw zónder het profiel te wissen; `reonboard` toont de annuleren-knop
     * en laat `onboarded` staan, zodat annuleren netjes terugkeert. */
    resetOnboarding: () => { setSettingsOpen(false); setReonboard(true); },
    endBoot: () => { setCatalogReady(true); setBoot(null); },
  };

  return <WN.Provider value={ctx}>{children}</WN.Provider>;
}
