/* Versie-gestuurde catalogus-levering.
 *
 * Bij het laden halen we een klein catalog-meta.json (no-store) op en vergelijken de versie met wat
 * lokaal in IndexedDB staat. Alleen bij verschil downloaden we de volledige catalog.json opnieuw en
 * cachen die in IndexedDB. Zo verversen we niet onnodig en updaten clients zonder app-rebuild.
 * Fallbacks: offline → lokale cache; geen cache → gebundelde mock-catalogus. */
import type { Catalog, CatalogFilm, CatalogMeta, QuizQuestion } from "./types";
import { MOCK_CATALOG } from "./mockCatalog";
import { db } from "../db/db";

export interface LoadedCatalog {
  version: number;
  films: CatalogFilm[];
  quiz: QuizQuestion[];
  byId: Record<string, CatalogFilm>;
}

const CATALOG_KEY = "catalog";
const CATALOG_VERSION_KEY = "catalogVersion";
const META_URL = `${import.meta.env.BASE_URL}data/catalog-meta.json`;
const CATALOG_URL = `${import.meta.env.BASE_URL}data/catalog.json`;

function index(cat: Catalog): LoadedCatalog {
  return {
    version: cat.version,
    films: cat.films,
    quiz: cat.quiz,
    byId: Object.fromEntries(cat.films.map((f) => [f.id, f])),
  };
}

async function readCached(): Promise<Catalog | null> {
  try {
    const row = await db.kv.get(CATALOG_KEY);
    const cat = row?.value as Catalog | undefined;
    return cat && Array.isArray(cat.films) && cat.films.length > 0 ? cat : null;
  } catch {
    return null;
  }
}

async function writeCached(cat: Catalog): Promise<void> {
  await db.kv.put({ key: CATALOG_KEY, value: cat });
  await db.kv.put({ key: CATALOG_VERSION_KEY, value: cat.version });
}

async function localVersion(): Promise<number | null> {
  try {
    const row = await db.kv.get(CATALOG_VERSION_KEY);
    return typeof row?.value === "number" ? row.value : null;
  } catch {
    return null;
  }
}

async function fetchJson<T>(url: string, cache: RequestCache): Promise<T | null> {
  try {
    const res = await fetch(url, { cache });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type BootMode = "fetch" | "update" | "check";

/* Bepaalt — vóór de eventuele grote download — welke splash-modus past:
 *   geen lokale versie        → 'fetch'  (eerste keer / verse cache nodig)
 *   meta-versie ≠ lokaal       → 'update' (nieuwe catalogus beschikbaar)
 *   gelijk / meta onbereikbaar → 'check'  (niets te doen; korte controle)
 * Doet alleen de lichte meta-fetch, niet de volledige catalog.json. */
export async function decideBootMode(): Promise<BootMode> {
  const local = await localVersion();
  if (local === null) return "fetch";
  const meta = await fetchJson<CatalogMeta>(META_URL, "no-store");
  if (meta && meta.version !== local) return "update";
  return "check";
}

let loaded: LoadedCatalog | null = null;

export async function loadCatalog(force = false): Promise<LoadedCatalog> {
  if (loaded && !force) return loaded;
  if (force) loaded = null; // verse versiecheck afdwingen (bv. "Controleer op updates")

  const meta = await fetchJson<CatalogMeta>(META_URL, "no-store");
  const local = await localVersion();

  // Versie ongewijzigd → gebruik de lokale cache (geen grote download).
  if (meta && local !== null && meta.version === local) {
    const cached = await readCached();
    if (cached) return (loaded = index(cached));
  }

  // Versie gewijzigd of nog niets lokaal → volledige catalogus downloaden.
  if (meta && (local === null || meta.version !== local)) {
    const fresh = await fetchJson<Catalog>(CATALOG_URL, "no-cache");
    if (fresh && Array.isArray(fresh.films) && fresh.films.length > 0) {
      await writeCached(fresh).catch(() => {});
      return (loaded = index(fresh));
    }
  }

  // Offline / meta-fetch faalde → lokale cache, anders de gebundelde mock.
  const cached = await readCached();
  if (cached) return (loaded = index(cached));
  return (loaded = index(MOCK_CATALOG));
}

/* Synchrone toegang ná loadCatalog(); gooit als de catalogus nog niet geladen is. */
export function getCatalog(): LoadedCatalog {
  if (!loaded) throw new Error("Catalogus nog niet geladen — roep eerst loadCatalog() aan.");
  return loaded;
}
