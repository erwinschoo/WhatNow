/* Simpele bestand-cache zodat herhaald draaien goedkoop is: TMDB/OMDb-responses en Claude-output
 * worden per film op schijf bewaard en hergebruikt. */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(HERE, "..", "cache");

function ensure() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

export function cacheGet<T>(key: string): T | null {
  ensure();
  const f = join(CACHE_DIR, `${key}.json`);
  if (!existsSync(f)) return null;
  try {
    return JSON.parse(readFileSync(f, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function cacheSet(key: string, value: unknown): void {
  ensure();
  writeFileSync(join(CACHE_DIR, `${key}.json`), JSON.stringify(value, null, 2), "utf-8");
}

/* Haal uit cache of bereken-en-bewaar. */
export async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const val = await fn();
  cacheSet(key, val);
  return val;
}
