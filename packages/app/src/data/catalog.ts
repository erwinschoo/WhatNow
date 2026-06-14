/* Laadt de gebundelde filmcatalogus (public/data/catalog.json), met de mock-catalogus als fallback
 * zolang de pipeline nog geen echte catalogus heeft gegenereerd. De service worker cachet
 * catalog.json voor offline gebruik. */
import type { Catalog, CatalogFilm, QuizQuestion } from "./types";
import { MOCK_CATALOG } from "./mockCatalog";

export interface LoadedCatalog {
  version: number;
  films: CatalogFilm[];
  quiz: QuizQuestion[];
  byId: Record<string, CatalogFilm>;
}

function index(cat: Catalog): LoadedCatalog {
  return {
    version: cat.version,
    films: cat.films,
    quiz: cat.quiz,
    byId: Object.fromEntries(cat.films.map((f) => [f.id, f])),
  };
}

let loaded: LoadedCatalog | null = null;

export async function loadCatalog(): Promise<LoadedCatalog> {
  if (loaded) return loaded;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/catalog.json`, { cache: "no-cache" });
    if (res.ok) {
      const cat = (await res.json()) as Catalog;
      if (cat && Array.isArray(cat.films) && cat.films.length > 0) {
        loaded = index(cat);
        return loaded;
      }
    }
  } catch {
    // val terug op de gebundelde mock-catalogus
  }
  loaded = index(MOCK_CATALOG);
  return loaded;
}

/* Synchrone toegang ná loadCatalog(); gooit als de catalogus nog niet geladen is. */
export function getCatalog(): LoadedCatalog {
  if (!loaded) throw new Error("Catalogus nog niet geladen — roep eerst loadCatalog() aan.");
  return loaded;
}
