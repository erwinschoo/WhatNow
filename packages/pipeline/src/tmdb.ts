/* TMDB-fetchers (v3 REST) — hoofdbron. Discovery (bulk), Nederlandse details, keywords, posters. */
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

export interface DiscoverHit {
  id: number;
  popularity: number;
  voteAverage: number;
  voteCount: number;
}

/* Eén discover-pagina (20 resultaten). sort_by bv. "vote_count.desc" of "popularity.desc";
 * optioneel with_genres / decennium via primary_release_date. */
export async function discoverPage(page: number, opts: { sortBy?: string; genre?: number; from?: string; to?: string; minVotes?: number } = {}): Promise<DiscoverHit[]> {
  const params: Record<string, string> = {
    sort_by: opts.sortBy ?? "vote_count.desc",
    page: String(page),
    "vote_count.gte": String(opts.minVotes ?? 300),
    include_adult: "false",
    language: "en-US",
  };
  if (opts.genre) params.with_genres = String(opts.genre);
  if (opts.from) params["primary_release_date.gte"] = opts.from;
  if (opts.to) params["primary_release_date.lte"] = opts.to;
  const j = await get("/discover/movie", params);
  return (j.results ?? []).map((r: any) => ({ id: r.id, popularity: r.popularity ?? 0, voteAverage: r.vote_average ?? 0, voteCount: r.vote_count ?? 0 }));
}

export async function findTmdbId(title: string, year?: number): Promise<number | null> {
  const j = await get("/search/movie", { query: title, ...(year ? { year: String(year) } : {}) });
  const results: any[] = j.results ?? [];
  if (!results.length) return null;
  const exact = year ? results.find((r) => (r.release_date ?? "").startsWith(String(year))) : null;
  return (exact ?? results[0]).id;
}

export interface TmdbDetails {
  tmdbId: number;
  imdbId?: string;
  title: string;
  year: number;
  runtime: number;
  genres: string[];
  keywords: string[];
  overview: string; // nl-NL (met en-US fallback)
  dir: string;
  posterUrl?: string;
  backdropUrl?: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
}

export async function getDetails(tmdbId: number): Promise<TmdbDetails> {
  const j = await get(`/movie/${tmdbId}`, { language: "nl-NL", append_to_response: "credits,keywords" });
  let overview: string = j.overview ?? "";
  if (!overview) {
    try { overview = (await get(`/movie/${tmdbId}`, { language: "en-US" })).overview ?? ""; } catch { /* laat leeg */ }
  }
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
    overview,
    dir,
    posterUrl: j.poster_path ? `${IMG}/w500${j.poster_path}` : undefined,
    backdropUrl: j.backdrop_path ? `${IMG}/w1280${j.backdrop_path}` : undefined,
    voteAverage: j.vote_average ?? 0,
    voteCount: j.vote_count ?? 0,
    popularity: j.popularity ?? 0,
  };
}
