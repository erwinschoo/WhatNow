/* Vereenvoudigde OneDrive-sync voor WhatNow. Anders dan bokkiep is hier GEEN end-to-end encryptie:
 * film-voorkeuren zijn niet gevoelig zoals banktransacties. We syncen het AppState-document als één
 * JSON-blob, met backup-vóór-overwrite en optimistic concurrency (eTag/If-Match). */
import { getToken } from "./msal";
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

/* Push de lokale state naar OneDrive (met backup en If-Match). */
export async function pushToOneDrive(expectedEtag?: string): Promise<void> {
  const token = await getToken();
  await backupRemote(token);
  const state = await getState();
  const meta = await uploadData(token, state, expectedEtag);
  await setSyncMeta({ lastSyncedAt: new Date().toISOString(), remoteEtag: meta.eTag });
}

/* Beslis automatisch push/pull op basis van updatedAt-tijdstempels.
 * - Geen remote-bestand → push.
 * - Remote nieuwer dan lokaal → pull (overschrijf lokaal).
 * - Lokaal nieuwer of gelijk → push. */
export async function syncNow(): Promise<SyncOutcome> {
  const token = await getToken();
  const remoteMeta = await getRemoteMeta(token);
  const local = await getState();

  if (!remoteMeta) {
    await pushToOneDrive();
    return "pushed";
  }

  const remote = (await downloadData(token)) as AppState | null;
  const remoteUpdated = remote?.updatedAt ?? "1970-01-01T00:00:00.000Z";

  if (remote && remoteUpdated > local.updatedAt) {
    await replaceState(remote);
    await setSyncMeta({ lastSyncedAt: new Date().toISOString(), remoteEtag: remoteMeta.eTag });
    return "pulled";
  }

  await pushToOneDrive(remoteMeta.eTag);
  return "pushed";
}

export async function lastSyncedAt(): Promise<string | null> {
  return (await getSyncMeta()).lastSyncedAt;
}
