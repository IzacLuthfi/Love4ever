// src/app/layout.tsx

import type {
  Metadata,
  Viewport,
} from "next";

import type {
  ReactNode,
} from "react";

import "./globals.css";

import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

/*
 * =========================================================
 * METADATA
 * =========================================================
 */

export const metadata: Metadata = {
  applicationName:
    "Love4ever",

  title: {
    default:
      "Love4ever",

    template:
      "%s · Love4ever",
  },

  description:
    "A private space for our memories, plans, messages, photos, and music.",

  /*
   * Menggunakan static manifest dari:
   *
   * public/manifest.json
   */
  manifest:
    "/manifest.json",

  /*
   * =======================================================
   * ICONS
   * =======================================================
   */

  icons: {
    /*
     * Browser / general app icon
     */
    icon: [
      {
        url:
          "/icons/icon-192.png",

        sizes:
          "192x192",

        type:
          "image/png",
      },

      {
        url:
          "/icons/icon-512.png",

        sizes:
          "512x512",

        type:
          "image/png",
      },
    ],

    /*
     * iPhone / iPad home screen
     */
    apple: [
      {
        url:
          "/icons/apple-touch-icon.png",

        sizes:
          "180x180",

        type:
          "image/png",
      },
    ],

    /*
     * Optional fallback icon
     */
    shortcut: [
      {
        url:
          "/icons/icon-192.png",

        type:
          "image/png",
      },
    ],
  },

  /*
   * =======================================================
   * APPLE PWA
   * =======================================================
   */

  appleWebApp: {
    capable:
      true,

    title:
      "Love4ever",

    statusBarStyle:
      "default",
  },

  /*
   * Jangan otomatis ubah angka
   * seperti nomor HP menjadi link.
   */
  formatDetection: {
    telephone:
      false,

    email:
      false,

    address:
      false,
  },

  /*
   * =======================================================
   * OTHER
   * =======================================================
   */

  other: {
    "mobile-web-app-capable":
      "yes",

    "apple-mobile-web-app-capable":
      "yes",

    "apple-mobile-web-app-title":
      "Love4ever",
  },
};

/*
 * =========================================================
 * VIEWPORT / PWA THEME
 * =========================================================
 */

export const viewport: Viewport = {
  width:
    "device-width",

  initialScale:
    1,

  maximumScale:
    1,

  viewportFit:
    "cover",

  themeColor:
    "#083b59",

  colorScheme:
    "light",
};

/*
 * =========================================================
 * ROOT LAYOUT
 * =========================================================
 */

export default function RootLayout({
  children,
}: Readonly<{
  children:
    ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body>
        {/*
         * Register Service Worker.
         *
         * ServiceWorkerRegister yang kita buat
         * hanya aktif saat production.
         */}
        <ServiceWorkerRegister />

        {children}
      </body>
    </html>
  );
}