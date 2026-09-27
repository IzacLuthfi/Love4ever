/* =========================================================
   LOVE4EVER SERVICE WORKER
   public/sw.js
========================================================= */

const CACHE_VERSION =
  "love4ever-v1";

const STATIC_CACHE =
  `${CACHE_VERSION}-static`;

const RUNTIME_CACHE =
  `${CACHE_VERSION}-runtime`;

const OFFLINE_URL =
  "/offline.html";

/*
 * File yang aman disimpan ketika
 * Service Worker pertama kali di-install.
 */
const PRECACHE_URLS = [
  OFFLINE_URL,

  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];

/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
  "install",
  (event) => {
    event.waitUntil(
      caches
        .open(
          STATIC_CACHE
        )
        .then(
          (cache) =>
            cache.addAll(
              PRECACHE_URLS
            )
        )
        .then(() => {
          /*
           * Aktifkan SW baru tanpa
           * menunggu tab lama ditutup.
           */
          return self.skipWaiting();
        })
    );
  }
);

/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      Promise.all([
        /*
         * Hapus cache versi lama.
         */
        caches
          .keys()
          .then(
            (
              cacheNames
            ) =>
              Promise.all(
                cacheNames
                  .filter(
                    (
                      cacheName
                    ) =>
                      ![
                        STATIC_CACHE,
                        RUNTIME_CACHE,
                      ].includes(
                        cacheName
                      )
                  )
                  .map(
                    (
                      cacheName
                    ) =>
                      caches.delete(
                        cacheName
                      )
                  )
              )
          ),

        /*
         * SW langsung mengambil
         * kontrol atas tab terbuka.
         */
        self.clients.claim(),
      ])
    );
  }
);

/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
  "fetch",
  (event) => {
    const request =
      event.request;

    /*
     * Hanya GET.
     *
     * Jangan pernah cache:
     * POST
     * PUT
     * DELETE
     * auth request
     * upload
     * dan request mutation lainnya.
     */
    if (
      request.method !==
      "GET"
    ) {
      return;
    }

    const url =
      new URL(
        request.url
      );

    /*
     * Jangan sentuh request
     * dari domain lain.
     *
     * Ini penting supaya Supabase,
     * Spotify, YouTube, dll tetap
     * menggunakan network normal.
     */
    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }

    /*
     * Jangan cache API.
     */
    if (
      url.pathname.startsWith(
        "/api/"
      )
    ) {
      return;
    }

    /*
     * Jangan cache development HMR.
     */
    if (
      url.pathname.startsWith(
        "/_next/webpack-hmr"
      )
    ) {
      return;
    }

    /*
     * =============================================
     * PAGE NAVIGATION
     *
     * Network first.
     *
     * Kalau internet mati:
     * tampilkan offline.html
     * =============================================
     */

    if (
      request.mode ===
      "navigate"
    ) {
      event.respondWith(
        networkFirstNavigation(
          request
        )
      );

      return;
    }

    /*
     * =============================================
     * NEXT.JS STATIC FILES
     *
     * Hash filename membuat file aman
     * menggunakan cache-first.
     * =============================================
     */

    if (
      url.pathname.startsWith(
        "/_next/static/"
      )
    ) {
      event.respondWith(
        cacheFirst(
          request
        )
      );

      return;
    }

    /*
     * =============================================
     * LOCAL IMAGES / FONTS / CSS / JS
     * =============================================
     */

    if (
      [
        "image",
        "font",
        "style",
        "script",
      ].includes(
        request.destination
      )
    ) {
      event.respondWith(
        staleWhileRevalidate(
          request
        )
      );
    }
  }
);

/* =========================================================
   NETWORK FIRST
========================================================= */

async function networkFirstNavigation(
  request
) {
  try {
    /*
     * Halaman selalu diambil dari network
     * supaya session Supabase dan data
     * server tetap fresh.
     */
    return await fetch(
      request
    );
  } catch {
    /*
     * Kalau benar-benar offline.
     */
    const cachedOffline =
      await caches.match(
        OFFLINE_URL
      );

    if (
      cachedOffline
    ) {
      return cachedOffline;
    }

    return new Response(
      "You are offline.",
      {
        status:
          503,

        headers: {
          "Content-Type":
            "text/plain; charset=utf-8",
        },
      }
    );
  }
}

/* =========================================================
   CACHE FIRST
========================================================= */

async function cacheFirst(
  request
) {
  const cached =
    await caches.match(
      request
    );

  if (
    cached
  ) {
    return cached;
  }

  try {
    const response =
      await fetch(
        request
      );

    if (
      canCache(
        response
      )
    ) {
      const cache =
        await caches.open(
          RUNTIME_CACHE
        );

      await cache.put(
        request,
        response.clone()
      );
    }

    return response;
  } catch {
    return new Response(
      "",
      {
        status:
          504,

        statusText:
          "Offline",
      }
    );
  }
}

/* =========================================================
   STALE WHILE REVALIDATE
========================================================= */

async function staleWhileRevalidate(
  request
) {
  const cache =
    await caches.open(
      RUNTIME_CACHE
    );

  const cached =
    await cache.match(
      request
    );

  const networkPromise =
    fetch(
      request
    )
      .then(
        async (
          response
        ) => {
          if (
            canCache(
              response
            )
          ) {
            await cache.put(
              request,
              response.clone()
            );
          }

          return response;
        }
      )
      .catch(
        () =>
          null
      );

  if (
    cached
  ) {
    /*
     * Update cache di background.
     */
    eventSafe(
      networkPromise
    );

    return cached;
  }

  const response =
    await networkPromise;

  if (
    response
  ) {
    return response;
  }

  return new Response(
    "",
    {
      status:
        504,

      statusText:
        "Offline",
    }
  );
}

/* =========================================================
   CACHE VALIDATION
========================================================= */

function canCache(
  response
) {
  return (
    response &&
    response.status ===
      200 &&
    response.type !==
      "opaque"
  );
}

/*
 * Membiarkan promise berjalan tanpa
 * membuat unhandled rejection.
 */
function eventSafe(
  promise
) {
  promise.catch(
    () => {}
  );
}

/* =========================================================
   MANUAL UPDATE
========================================================= */

self.addEventListener(
  "message",
  (event) => {
    if (
      event.data?.type ===
      "SKIP_WAITING"
    ) {
      self.skipWaiting();
    }
  }
);