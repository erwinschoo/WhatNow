/* OneDrive-sync voor WhatNow. Anders dan bokkiep is hier GEEN end-to-end encryptie: film-voorkeuren
 * zijn niet gevoelig zoals banktransacties. We syncen het AppState-document als één JSON-blob.
 *
 * Conflictmodel (P2): geen last-write-wins meer. Bij divergentie MERGEN we per veld —
 * verzamelingen (watchlist, seen, quizscores) worden samengevoegd, voorkeuren/scalars nemen de
 * waarde van de recentste kant (updatedAt). Schrijven gebeurt met optimistic concurrency
 * (eTag/If-Match); een 412 (remote intussen gewijzigd) lost zichzelf op via pull→merge→push-retry.
 *
 * Auto-sync: scheduleSync() debounced een stille sync na lokale mutaties; pull bij app-start
 * (Splash) en bij terugkeren naar de tab (visibilitychange/focus) loopt via dezelfde weg. */
import { getToken, getTokenSilent, isSyncConfigured } from "./msal";
import { backupRemote, downloadData, getRemoteMeta, RemoteChangedError, uploadData } from "./graphClient";
import { db, getState, replaceState, type AppState } from "../db/db";

interface SyncMeta {
  lastSyncedAt: string | null;
  remoteEtag: string | null;
}

const SYNC_META_KEY = "syncMeta";

async function getSyncMeta(): Promise<SyncMeta> {
  const row = await db.kv.get(SYNC_META_KEY);
  return (row?.value as SyncMeta) ?? { lastSyncedAt: null, remoteEtag: null };
}
async function setSyncMeta(meta: SyncMeta): Promise<void> {
  await db.kv.put({ key: SYNC_META_KEY, value: meta });
}

export type SyncOutcome = "pushed" | "pulled" | "merged" | "noop";

/* ── Merge ──────────────────────────────────────────────────────────────────────────────────── */

function union(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

/* Quizscores samenvoegen en dedupliceren op tijdstempel+score (een score is uniek per moment). */
function mergeQuiz(a: AppState["quizScores"], b: AppState["quizScores"]): AppState["quizScores"] {
  const seen = new Set<string>();
  const out: AppState["quizScores"] = [];
  for (const q of [...a, ...b]) {
    const k = `${q.at}:${q.pct}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(q);
  }
  return out.sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : 0));
}

/* Voeg twee versies van de state samen: verzamelingen unie, voorkeuren/scalars van de recentste
 * kant (updatedAt), booleans logisch-of. updatedAt = de nieuwste van de twee. */
function mergeState(a: AppState, b: AppState): AppState {
  const newer = a.updatedAt >= b.updatedAt ? a : b;
  return {
    onboarded: a.onboarded || b.onboarded,
    syncEnabled: a.syncEnabled || b.syncEnabled,
    lang: newer.lang,
    level: newer.level,
    favoriteGenres: newer.favoriteGenres,
    favoriteThemes: newer.favoriteThemes,
    feelTarget: newer.feelTarget,
    tuneFacets: newer.tuneFacets,
    seed: newer.seed,
    watchlist: union(a.watchlist, b.watchlist),
    seen: union(a.seen, b.seen),
    quizScores: mergeQuiz(a.quizScores, b.quizScores),
    updatedAt: newer.updatedAt,
  };
}

/* Vergelijkbare sleutel van de betekenisvolle data (zonder updatedAt en zonder volgorde), zodat we
 * kunnen bepalen of een kant iets mist — en dus of er gepulld/gepusht moet worden. */
function dataKey(s: AppState): string {
  return JSON.stringify({
    onboarded: s.onboarded,
    syncEnabled: s.syncEnabled,
    lang: s.lang,
    level: s.level,
    favoriteGenres: [...s.favoriteGenres].sort(),
    favoriteThemes: [...s.favoriteThemes].sort(),
    feelTarget: s.feelTarget,
    tuneFacets: { ...s.tuneFacets, genres: [...s.tuneFacets.genres].sort(), decades: [...s.tuneFacets.decades].sort() },
    seed: s.seed,
    watchlist: [...s.watchlist].sort(),
    seen: [...s.seen].sort(),
    quizScores: s.quizScores.map((q) => `${q.at}:${q.pct}`).sort(),
  });
}

/* ── Push / sync ────────────────────────────────────────────────────────────────────────────── */

/* Push de lokale state naar OneDrive. `backup` maakt vóór de overwrite een getimestampte kopie —
 * aan voor handmatige syncs, uit voor routine-auto-pushes (merge maakt blind dataverlies
 * onwaarschijnlijk, en het scheelt een Graph-call per mutatie). */
export async function pushToOneDrive(token: string, expectedEtag?: string, backup = true): Promise<void> {
  if (backup) await backupRemote(token);
  const state = await getState();
  const meta = await uploadData(token, state, expectedEtag);
  await setSyncMeta({ lastSyncedAt: new Date().toISOString(), remoteEtag: meta.eTag });
}

/* Eén sync-ronde met een al verkregen token. Merget lokaal/remote en schrijft beide kanten bij waar
 * nodig. Een 412 (remote intussen gewijzigd) wordt opgevangen: opnieuw lezen, mergen en pushen. */
async function syncWithToken(token: string, backup: boolean): Promise<SyncOutcome> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const remoteMeta = await getRemoteMeta(token);
    const local = await getState();

    // Nog geen remote-bestand → eerste push.
    if (!remoteMeta) {
      await pushToOneDrive(token, undefined, backup);
      return "pushed";
    }

    const remote = (await downloadData(token)) as AppState | null;
    if (!remote || typeof remote.updatedAt !== "string") {
      // Onleesbaar/leeg remote-bestand → overschrijf met lokaal (met If-Match).
      try {
        await pushToOneDrive(token, remoteMeta.eTag, backup);
        return "pushed";
      } catch (e) {
        if (e instanceof RemoteChangedError) continue;
        throw e;
      }
    }

    const merged = mergeState(local, remote);
    const pullNeeded = dataKey(merged) !== dataKey(local);
    const pushNeeded = dataKey(merged) !== dataKey(remote);

    if (pullNeeded) await replaceState(merged);
    if (!pushNeeded) {
      await setSyncMeta({ lastSyncedAt: new Date().toISOString(), remoteEtag: remoteMeta.eTag });
      return pullNeeded ? "pulled" : "noop";
    }

    // pushToOneDrive leest getState() → bij pullNeeded is dat de zojuist weggeschreven merge.
    try {
      await pushToOneDrive(token, remoteMeta.eTag, backup);
      return pullNeeded ? "merged" : "pushed";
    } catch (e) {
      if (e instanceof RemoteChangedError) continue; // remote veranderde tussendoor → opnieuw mergen
      throw e;
    }
  }
  throw new Error("Sync kon niet afronden: de OneDrive-versie bleef wijzigen.");
}

/* Handmatige sync (Settings): mag een inlog-popup openen als het stille token verlopen is. */
export async function syncNow(): Promise<SyncOutcome> {
  return syncWithToken(await getToken(), true);
}

/* Stille sync (app-start, auto-sync): alleen als sync geconfigureerd is én er stil een token te
 * krijgen is. Opent NOOIT een popup en faalt stil — bij geen verbinding/offline gaat de app door op
 * de lokale state. Geeft de uitkomst, of null als er niets (stil) te syncen viel. */
export async function trySilentSync(): Promise<SyncOutcome | null> {
  if (!isSyncConfigured()) return null;
  const token = await getTokenSilent();
  if (!token) return null;
  try {
    return await syncWithToken(token, false);
  } catch {
    return null;
  }
}

export async function lastSyncedAt(): Promise<string | null> {
  return (await getSyncMeta()).lastSyncedAt;
}

/* ── Auto-sync orchestrator ─────────────────────────────────────────────────────────────────── */

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let running = false;
let rerun = false;

async function runSync(): Promise<void> {
  if (running) { rerun = true; return; } // tijdens een lopende sync nieuwe mutatie → één keer herhalen
  running = true;
  try {
    await trySilentSync();
  } catch {
    /* stil — auto-sync is best-effort */
  } finally {
    running = false;
    if (rerun) { rerun = false; scheduleSync(800); }
  }
}

/* Plan een gedebouncede stille sync (na lokale mutaties of bij terugkeer naar de tab). Meerdere
 * snelle aanroepen vallen samen tot één sync. No-op als sync niet geconfigureerd is. */
export function scheduleSync(delayMs = 2500): void {
  if (!isSyncConfigured()) return;
  if (syncTimer !== null) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { syncTimer = null; void runSync(); }, delayMs);
}
