/* Vereenvoudigde OneDrive-sync voor WhatNow. Anders dan bokkiep is hier GEEN end-to-end encryptie:
 * film-voorkeuren zijn niet gevoelig zoals banktransacties. We syncen het AppState-document als één
 * JSON-blob, met backup-vóór-overwrite en optimistic concurrency (eTag/If-Match). */
import { getToken, getTokenSilent, isSyncConfigured } from "./msal";
import { backupRemote, downloadData, getRemoteMeta, uploadData } from "./graphClient";
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

export type SyncOutcome = "pushed" | "pulled" | "noop";

/* Push de lokale state naar OneDrive (met backup en If-Match). Het token wordt doorgegeven zodat
 * één sync-ronde niet meerdere keren een token (en dus mogelijk een popup) hoeft te vragen. */
export async function pushToOneDrive(token: string, expectedEtag?: string): Promise<void> {
  await backupRemote(token);
  const state = await getState();
  const meta = await uploadData(token, state, expectedEtag);
  await setSyncMeta({ lastSyncedAt: new Date().toISOString(), remoteEtag: meta.eTag });
}

/* Beslis automatisch push/pull op basis van updatedAt-tijdstempels.
 * - Geen remote-bestand → push.
 * - Remote nieuwer dan lokaal → pull (overschrijf lokaal).
 * - Lokaal nieuwer of gelijk → push. */
async function syncWithToken(token: string): Promise<SyncOutcome> {
  const remoteMeta = await getRemoteMeta(token);
  const local = await getState();

  if (!remoteMeta) {
    await pushToOneDrive(token);
    return "pushed";
  }

  const remote = (await downloadData(token)) as AppState | null;
  const remoteUpdated = remote?.updatedAt ?? "1970-01-01T00:00:00.000Z";

  if (remote && remoteUpdated > local.updatedAt) {
    await replaceState(remote);
    await setSyncMeta({ lastSyncedAt: new Date().toISOString(), remoteEtag: remoteMeta.eTag });
    return "pulled";
  }

  await pushToOneDrive(token, remoteMeta.eTag);
  return "pushed";
}

/* Handmatige sync (Settings): mag een inlog-popup openen als het stille token verlopen is. */
export async function syncNow(): Promise<SyncOutcome> {
  return syncWithToken(await getToken());
}

/* Stille sync bij app-start: alleen als sync geconfigureerd is én er stil een token te krijgen is
 * (account in cache, token nog geldig). Opent NOOIT een popup en faalt stil — bij geen verbinding
 * of offline gaat de app gewoon door op de lokale state. Geeft de uitkomst, of null als er niets
 * (stil) te syncen viel. */
export async function trySilentSync(): Promise<SyncOutcome | null> {
  if (!isSyncConfigured()) return null;
  const token = await getTokenSilent();
  if (!token) return null;
  try {
    return await syncWithToken(token);
  } catch {
    return null;
  }
}

export async function lastSyncedAt(): Promise<string | null> {
  return (await getSyncMeta()).lastSyncedAt;
}
