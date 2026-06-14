/* Leidt het profiel-scherm (stats, top-thema's, genre-verdeling, badges) af uit de ECHTE
 * gebruikersdata — geen hardgecodeerde PROFILE-mock meer. */
import type { AppState } from "../db/db";
import type { LoadedCatalog } from "../data/catalog";
import { BADGES, WATCH_LEVELS } from "../data/config";

export interface DerivedProfile {
  level: string;
  levelPct: number;
  stats: { seen: number; watchlist: number; hours: number; quizAvg: number };
  topThemes: { label: string; n: number }[];
  genreBars: { label: string; n: number }[];
  quizHistory: number[];
  badges: { id: string; label: string; icon: string; sub: string; earned: boolean }[];
}

function levelLabel(id: string | null): string {
  return WATCH_LEVELS.find((l) => l.id === id)?.label ?? "Filmkijker";
}

export function deriveProfile(state: AppState, cat: LoadedCatalog): DerivedProfile {
  const seenFilms = state.seen.map((id) => cat.byId[id]).filter(Boolean);

  const minutes = seenFilms.reduce((s, f) => s + (f.runtime ?? 0), 0);
  const hours = Math.round(minutes / 60);

  const themeCount = new Map<string, number>();
  const genreCount = new Map<string, number>();
  for (const f of seenFilms) {
    f.themes.forEach((t) => themeCount.set(t, (themeCount.get(t) ?? 0) + 1));
    f.genres.forEach((g) => genreCount.set(g, (genreCount.get(g) ?? 0) + 1));
  }
  const topThemes = [...themeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, n]) => ({ label, n }));
  const genreBars = [...genreCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, n]) => ({ label, n }));

  const quizHistory = state.quizScores.slice(-7).map((q) => q.pct);
  const quizAvg = quizHistory.length ? Math.round(quizHistory.reduce((s, p) => s + p, 0) / quizHistory.length) : 0;

  // Voortgang naar het volgende niveau: ruwe maat op basis van aantal gezien (0–50).
  const levelPct = Math.min(1, seenFilms.length / 50);

  const perfectQuizzes = state.quizScores.filter((q) => q.pct === 100).length;
  const decadesSeen = new Set(seenFilms.map((f) => f.decade));
  const earned: Record<string, boolean> = {
    cinephile: seenFilms.length >= 50,
    theme: topThemes.length >= 4 && (topThemes[0]?.n ?? 0) >= 10,
    night: false, // geen tijdstip-data in v1
    quizmaster: perfectQuizzes >= 5,
    decade: decadesSeen.size >= 5,
    complete: false, // keten-voltooiing nog niet getrackt in v1
  };

  return {
    level: levelLabel(state.level),
    levelPct,
    stats: { seen: seenFilms.length, watchlist: state.watchlist.length, hours, quizAvg },
    topThemes,
    genreBars,
    quizHistory,
    badges: BADGES.map((b) => ({ ...b, earned: earned[b.id] ?? false })),
  };
}
