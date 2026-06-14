/* OMDb-fetcher: IMDB-rating + Rotten Tomatoes % + Metacritic-score, opgezocht op IMDb-id. */
const BASE = "https://www.omdbapi.com/";

function key(): string | null {
  return process.env.OMDB_API_KEY ?? null;
}

export interface OmdbScores {
  imdb: number; // 0–10
  rt: number; // 0–100
  mc: number; // 0–100
}

export interface OmdbRaw {
  imdbId?: string;
  title: string;
  year: number;
  runtime: number;
  genres: string[];
  dir: string;
  plot: string;
  posterUrl?: string;
  scores: OmdbScores;
}

function parseScores(j: any): OmdbScores {
  const imdb = j.imdbRating && j.imdbRating !== "N/A" ? Number(j.imdbRating) : 0;
  const mc = j.Metascore && j.Metascore !== "N/A" ? Number(j.Metascore) : 0;
  const rtRating = (j.Ratings ?? []).find((r: any) => r.Source === "Rotten Tomatoes");
  const rt = rtRating ? Number(String(rtRating.Value).replace("%", "")) : 0;
  return {
    imdb: Number.isFinite(imdb) ? imdb : 0,
    rt: Number.isFinite(rt) ? rt : 0,
    mc: Number.isFinite(mc) ? mc : 0,
  };
}

function mapRaw(j: any, fallbackYear?: number): OmdbRaw {
  return {
    imdbId: j.imdbID,
    title: j.Title,
    year: j.Year ? Number(String(j.Year).slice(0, 4)) : fallbackYear ?? 0,
    runtime: j.Runtime && j.Runtime !== "N/A" ? Number(String(j.Runtime).replace(/[^0-9]/g, "")) : 0,
    genres: j.Genre && j.Genre !== "N/A" ? String(j.Genre).split(",").map((s: string) => s.trim()) : [],
    dir: j.Director && j.Director !== "N/A" ? String(j.Director).split(",")[0].trim() : "Onbekend",
    plot: j.Plot && j.Plot !== "N/A" ? j.Plot : "",
    posterUrl: j.Poster && j.Poster !== "N/A" ? j.Poster : undefined,
    scores: parseScores(j),
  };
}

async function fetchOmdb(params: Record<string, string>): Promise<any> {
  const k = key();
  if (!k) throw new Error("OMDB_API_KEY ontbreekt (zie .env.example).");
  const url = new URL(BASE);
  url.searchParams.set("apikey", k);
  url.searchParams.set("tomatoes", "true");
  for (const [p, v] of Object.entries(params)) url.searchParams.set(p, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OMDb ${JSON.stringify(params)} → ${res.status}`);
  return res.json();
}

/* Exact opzoeken op IMDb-id — de betrouwbare route voor films met dubbelzinnige titels. */
export async function getById(imdbId: string): Promise<OmdbRaw | null> {
  const j = await fetchOmdb({ i: imdbId });
  if (j.Response === "False") return null;
  return mapRaw(j);
}

/* Volledige ruwe film opzoeken op titel (+jaar) — fallback als er geen IMDb-id is. */
export async function getByTitle(title: string, year?: number): Promise<OmdbRaw | null> {
  const j = await fetchOmdb({ t: title, type: "movie", ...(year ? { y: String(year) } : {}) });
  if (j.Response === "False") return null;
  return mapRaw(j, year);
}

export async function getScores(imdbId: string | undefined): Promise<OmdbScores> {
  const k = key();
  if (!k || !imdbId) return { imdb: 0, rt: 0, mc: 0 };
  const url = new URL(BASE);
  url.searchParams.set("apikey", k);
  url.searchParams.set("i", imdbId);
  url.searchParams.set("tomatoes", "true");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OMDb ${imdbId} → ${res.status}`);
  const j: any = await res.json();
  if (j.Response === "False") return { imdb: 0, rt: 0, mc: 0 };
  const imdb = j.imdbRating && j.imdbRating !== "N/A" ? Number(j.imdbRating) : 0;
  const mc = j.Metascore && j.Metascore !== "N/A" ? Number(j.Metascore) : 0;
  const rtRating = (j.Ratings ?? []).find((r: any) => r.Source === "Rotten Tomatoes");
  const rt = rtRating ? Number(String(rtRating.Value).replace("%", "")) : 0;
  return {
    imdb: Number.isFinite(imdb) ? imdb : 0,
    rt: Number.isFinite(rt) ? rt : 0,
    mc: Number.isFinite(mc) ? mc : 0,
  };
}
