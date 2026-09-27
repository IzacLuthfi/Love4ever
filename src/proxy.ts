// src/proxy.ts

import {
  type NextRequest,
} from "next/server";

import {
  updateSession,
} from "@/lib/supabase/proxy";

export async function proxy(
  request: NextRequest
) {
  return await updateSession(
    request
  );
}

export const config = {
  matcher: [
    /*
     * Jalankan proxy pada route aplikasi.
     *
     * Abaikan:
     * - Next static
     * - Next image optimizer
     * - favicon
     * - manifest
     * - service worker
     * - offline page
     * - asset gambar/font
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline.html|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};