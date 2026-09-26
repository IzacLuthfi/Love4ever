// src/lib/supabase/proxy.ts

import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

export async function updateSession(
  request: NextRequest
) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet, headers) {
          /*
           * Update cookie di request
           * supaya Server Component menerima
           * session terbaru.
           */
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value
              );
            }
          );

          /*
           * Buat response baru berdasarkan
           * request yang sudah diperbarui.
           */
          supabaseResponse =
            NextResponse.next({
              request,
            });

          /*
           * Kirim session cookie terbaru
           * kembali ke browser.
           */
          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              supabaseResponse.cookies.set(
                name,
                value,
                options
              );
            }
          );

          /*
           * Copy header penting yang diberikan
           * oleh Supabase SSR.
           */
          Object.entries(headers).forEach(
            ([key, value]) => {
              supabaseResponse.headers.set(
                key,
                value
              );
            }
          );
        },
      },
    }
  );

  /*
   * Verifikasi session user.
   */
  const { data } =
    await supabase.auth.getClaims();

  const user = data?.claims;

  const pathname =
    request.nextUrl.pathname;

  /*
   * =========================================
   * PUBLIC ROUTES
   * =========================================
   */

  const isSplashPage =
    pathname === "/";

  const isLoginPage =
    pathname === "/login";

  const isRegisterPage =
    pathname === "/register";

  const isAuthCallback =
    pathname === "/auth" ||
    pathname.startsWith("/auth/");

  const isPublicRoute =
    isSplashPage ||
    isLoginPage ||
    isRegisterPage ||
    isAuthCallback;

  /*
   * =========================================
   * USER BELUM LOGIN
   * =========================================
   */

  if (!user && !isPublicRoute) {
    const url =
      request.nextUrl.clone();

    url.pathname = "/login";

    const redirectResponse =
      NextResponse.redirect(url);

    /*
     * Copy cookie dari response Supabase
     * satu per satu.
     *
     * Next.js ResponseCookies tidak mempunyai
     * method setAll().
     */
    supabaseResponse.cookies
      .getAll()
      .forEach(({ name, value }) => {
        redirectResponse.cookies.set(
          name,
          value
        );
      });

    copyCacheHeaders(
      supabaseResponse,
      redirectResponse
    );

    return redirectResponse;
  }

  /*
   * =========================================
   * USER SUDAH LOGIN
   * =========================================
   *
   * Kalau user sudah login lalu membuka
   * login/register, langsung ke dashboard.
   */

  if (
    user &&
    (isLoginPage || isRegisterPage)
  ) {
    const url =
      request.nextUrl.clone();

    url.pathname = "/dashboard";

    const redirectResponse =
      NextResponse.redirect(url);

    supabaseResponse.cookies
      .getAll()
      .forEach(({ name, value }) => {
        redirectResponse.cookies.set(
          name,
          value
        );
      });

    copyCacheHeaders(
      supabaseResponse,
      redirectResponse
    );

    return redirectResponse;
  }

  return supabaseResponse;
}

/*
 * ===========================================
 * COPY CACHE HEADERS
 * ===========================================
 */

function copyCacheHeaders(
  source: NextResponse,
  target: NextResponse
) {
  const headers = [
    "cache-control",
    "expires",
    "pragma",
  ];

  headers.forEach((header) => {
    const value =
      source.headers.get(header);

    if (value) {
      target.headers.set(
        header,
        value
      );
    }
  });
}