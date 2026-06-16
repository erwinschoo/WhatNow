/* CDN-afbeeldingen op de juiste maat opvragen (Netflix-stijl: exact de pixelmaat van het vakje).
 * TMDB-poster/backdrop-URL's hebben het formaat https://image.tmdb.org/t/p/{size}/{file}.jpg —
 * we herschrijven het {size}-segment (bv. w500 → w342). Niet-TMDB-URL's en lege waarden blijven
 * ongemoeid, zodat de aanroep altijd veilig is. */

/* Toegestane TMDB-maten (poster + backdrop). 'original' bestaat ook maar willen we juist vermijden. */
export type TmdbSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "w1280";

const TMDB_PATH = "/t/p/";

export function tmdbImage(url: string | undefined, size: TmdbSize): string | undefined {
  if (!url) return url;
  const i = url.indexOf(TMDB_PATH);
  if (i === -1) return url; // geen TMDB-URL → ongewijzigd
  const start = i + TMDB_PATH.length;
  const end = url.indexOf("/", start);
  if (end === -1) return url;
  return url.slice(0, start) + size + url.slice(end);
}
