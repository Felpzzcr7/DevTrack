// Service worker do DevTrack: deixa o app instalável e abrindo rápido.
// Os DADOS (/api) nunca são guardados em cache: eles vivem no servidor (SQLite).
const VERSION = "v1";
const SHELL = `devtrack-shell-${VERSION}`;
const ASSETS = `devtrack-assets-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(["/", "/manifest.webmanifest", "/favicon.svg"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, ASSETS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // dados: sempre direto da rede

  // Abrir o app / navegar: rede primeiro (pega versão nova), cache se estiver offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Arquivos com hash (/assets/...) nunca mudam: cache primeiro. Demais: cache + atualiza em segundo plano.
  const immutable = url.pathname.startsWith("/assets/");
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached && immutable) return cached;
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(immutable ? ASSETS : SHELL).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
