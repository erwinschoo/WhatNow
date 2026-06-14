/* TMDB-fetchers (v3 REST). Levert details, genres, keywords, regisseur en poster/backdrop-URLs. */
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

function key(): string {
  const k = process.env.TMDB_API_KEY;
  if (!k) throw new Error("TMDB_API_KEY ontbreekt (zie .env.example).");
  return k;
}

async function get(path: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", key());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${path} → ${res.status}`);
  return res.json();
}

export interface TmdbDetails {
  tmdbId: number;
  imdbId?: string;
  title: string;
  year: number;
  runtime: number;
  genres: string[];
  keywords: string[];
  overview: string;
  dir: string;
  posterUrl?: string;
  backdropUrl?: string;
  voteAverage: number;
  voteCount: number;
}

export async function findTmdbId(title: string, year?: number): Promise<number | null> {
  const j = await get("/search/movie", { query: title, ...(year ? { year: String(year) } : {}) });
  const results: any[] = j.results ?? [];
  if (!results.length) return null;
  // Prefer exact-jaar match, anders de meest populaire treffer.
  const exact = year ? results.find((r) => (r.release_date ?? "").startsWith(String(year))) : null;
  return (exact ?? results[0]).id;
}

export async function getDetails(tmdbId: number): Promise<TmdbDetails> {
  const j = await get(`/movie/${tmdbId}`, { append_to_response: "credits,keywords" });
  const dir = (j.credits?.crew ?? []).find((c: any) => c.job === "Director")?.name ?? "Onbekend";
  const keywords = (j.keywords?.keywords ?? []).map((k: any) => k.name as string);
  const year = j.release_date ? Number(j.release_date.slice(0, 4)) : 0;
  return {
    tmdbId,
    imdbId: j.imdb_id ?? undefined,
    title: j.title,
    year,
    runtime: j.runtime ?? 0,
    genres: (j.genres ?? []).map((g: any) => g.name as string),
    keywords,
    overview: j.overview ?? "",
    dir,
    posterUrl: j.poster_path ? `${IMG}/w500${j.poster_path}` : undefined,
    backdropUrl: j.backdrop_path ? `${IMG}/w1280${j.backdrop_path}` : undefined,
    voteAverage: j.vote_average ?? 0,
    voteCount: j.vote_count ?? 0,
  };
}
