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
