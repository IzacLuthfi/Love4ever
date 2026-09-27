// src/lib/supabase/proxy.ts

import {
  createServerClient,
} from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

/*
 * =========================================================
 * UPDATE SESSION
 * =========================================================
 */

export async function updateSession(
  request: NextRequest
) {
  /*
   * Response utama.
   */
  let supabaseResponse =
    NextResponse.next({
      request,
    });

  /*
   * =======================================================
   * SUPABASE
   * =======================================================
   */

  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,

      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,

      {
        cookies: {
          /*
           * Ambil semua cookie dari request.
           */
          getAll() {
            return request.cookies.getAll();
          },

          /*
           * Jika Supabase melakukan refresh token,
           * update request + response cookie.
           */
          setAll(
            cookiesToSet
          ) {
            /*
             * Update cookie pada request.
             *
             * Server Components setelah proxy
             * akan menerima session terbaru.
             */
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value
                );
              }
            );

            /*
             * Buat response baru dari request
             * yang cookie-nya sudah diperbarui.
             */
            supabaseResponse =
              NextResponse.next({
                request,
              });

            /*
             * Kirim cookie baru ke browser.
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
          },
        },
      }
    );

  /*
   * =======================================================
   * AUTH
   * =======================================================
   */

  const {
    data,
  } =
    await supabase.auth
      .getClaims();

  const user =
    data?.claims ?? null;

  const pathname =
    request.nextUrl.pathname;

  /*
   * =======================================================
   * PUBLIC ROUTES
   * =======================================================
   */

  const isSplashPage =
    pathname === "/";

  const isLoginPage =
    pathname === "/login";

  const isRegisterPage =
    pathname === "/register";

  const isAuthCallback =
    pathname === "/auth" ||
    pathname.startsWith(
      "/auth/"
    );

  const isPublicRoute =
    isSplashPage ||
    isLoginPage ||
    isRegisterPage ||
    isAuthCallback;

  /*
   * =======================================================
   * PROTECTED ROUTES
   * =======================================================
   *
   * Kalau belum login dan mencoba membuka halaman
   * private → redirect ke login.
   */

  if (
    !user &&
    !isPublicRoute
  ) {
    const url =
      request.nextUrl.clone();

    url.pathname =
      "/login";

    url.search =
      "";

    const redirectResponse =
      NextResponse.redirect(
        url
      );

    /*
     * Pertahankan cookie yang mungkin
     * baru direfresh Supabase.
     */
    supabaseResponse.cookies
      .getAll()
      .forEach(
        (cookie) => {
          redirectResponse.cookies.set(
            cookie.name,
            cookie.value
          );
        }
      );

    return redirectResponse;
  }

  /*
   * =======================================================
   * IMPORTANT
   * =======================================================
   *
   * Jangan redirect user yang sudah login dari
   * /login ke /dashboard di sini.
   *
   * Tujuannya:
   *
   * /
   * ↓
   * Splash
   * ↓
   * /login
   * ↓
   * login berhasil
   * ↓
   * /dashboard
   *
   * Dengan begitu tidak ada redirect silang antara
   * Splash → Login dan Proxy → Dashboard.
   */

  return supabaseResponse;
}