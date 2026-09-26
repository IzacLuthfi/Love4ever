// src/proxy.ts

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(
  request: NextRequest
) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Jalankan Proxy pada halaman aplikasi,
     * tetapi abaikan file static Next.js,
     * image, logo, manifest, dll.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};