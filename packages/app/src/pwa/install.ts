/* Vangt het 'beforeinstallprompt'-event vroeg op (side-effect import in main.tsx) zodat
 * de app later zelf een installatie-prompt kan tonen via promptInstall(). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(available: boolean) => void>();

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
  listeners.forEach((fn) => fn(true));
});

window.addEventListener("appinstalled", () => {
  deferred = null;
  listeners.forEach((fn) => fn(false));
});

export function canInstall(): boolean {
  return deferred !== null;
}

export function onInstallAvailability(fn: (available: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* Toon de native installatie-prompt. Retourneert true bij geaccepteerd. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  listeners.forEach((fn) => fn(false));
  return outcome === "accepted";
}
