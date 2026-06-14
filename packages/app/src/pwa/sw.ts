/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { clientsClaim } from "workbox-core";

// `__WB_MANIFEST` wordt bij de build vervangen door de precache-lijst — de letterlijke
// tekst `self.__WB_MANIFEST` moet blijven staan.
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Offline-precache (app-shell + gebundelde catalog.json).
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// SPA-navigatie: serveer de geprecachte index.html voor navigaties (offline deep-links blijven werken).
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [/\/[^/?]+\.[^/]+$/],
  }),
);

// autoUpdate-pariteit: neem direct de controle over zodra de nieuwe SW activeert.
self.skipWaiting();
clientsClaim();
