// src/components/pwa/ServiceWorkerRegister.tsx

"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    /*
     * Saat development, hapus service worker lama agar cache
     * production tidak mengganggu HMR Next.js.
     *
     * Untuk test PWA lokal:
     *   npm run build
     *   npm start
     */
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            void registration.unregister();
          }
        });

      return;
    }

    let cancelled = false;

    const registerServiceWorker = async () => {
      try {
        const registration =
          await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            }
          );

        if (cancelled) {
          return;
        }

        /*
         * Cek versi sw.js terbaru setiap aplikasi dibuka.
         */
        await registration.update();

        console.info(
          "Love4ever service worker registered:",
          registration.scope
        );
      } catch (error) {
        console.error(
          "Love4ever service worker registration failed:",
          error
        );
      }
    };

    if (document.readyState === "complete") {
      void registerServiceWorker();
    } else {
      window.addEventListener(
        "load",
        registerServiceWorker,
        {
          once: true,
        }
      );
    }

    return () => {
      cancelled = true;

      window.removeEventListener(
        "load",
        registerServiceWorker
      );
    };
  }, []);

  return null;
}
