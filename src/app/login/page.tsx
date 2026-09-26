// src/app/login/page.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Eye,
  EyeOff,
  Heart,
  Lock,
  Mail,
  MapPin,
  Music2,
  Sparkles,
} from "lucide-react";
import Swal from "sweetalert2";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(true);

  const [isLoading, setIsLoading] =
    useState(false);

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      await Swal.fire({
        icon: "warning",
        title: "Belum lengkap ♡",
        text: "Isi email dan password terlebih dahulu.",
        confirmButtonText: "Oke",
        confirmButtonColor: "#1688b5",
      });

      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        let message =
          "Email atau password tidak sesuai.";

        if (
          error.message
            .toLowerCase()
            .includes("email not confirmed")
        ) {
          message =
            "Email ini belum dikonfirmasi. Silakan cek email terlebih dahulu.";
        }

        await Swal.fire({
          icon: "error",
          title: "Login gagal",
          text: message,
          confirmButtonText: "Coba lagi",
          confirmButtonColor: "#1688b5",
        });

        return;
      }

      if (!data.user) {
        await Swal.fire({
          icon: "error",
          title: "Login gagal",
          text: "User tidak ditemukan.",
          confirmButtonText: "Oke",
          confirmButtonColor: "#1688b5",
        });

        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Welcome Back ♡",
        text: "Selamat datang kembali di Love4ever.",
        timer: 1300,
        showConfirmButton: false,
      });

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Terjadi kesalahan",
        text: "Tidak dapat terhubung ke server. Coba lagi sebentar.",
        confirmButtonText: "Oke",
        confirmButtonColor: "#1688b5",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#f9fcfd]">
      <div
        className="
          absolute inset-0
          bg-[radial-gradient(circle_at_10%_10%,rgba(103,197,226,0.28),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(244,219,184,0.38),transparent_30%),linear-gradient(145deg,#f3fbff_0%,#fffdf8_48%,#f6eee4_100%)]
        "
      />

      <div
        className="
          absolute
          -left-28
          top-20
          h-80
          w-80
          rounded-full
          bg-ocean-300/20
          blur-3xl
        "
      />

      <div
        className="
          absolute
          -right-28
          bottom-12
          h-96
          w-96
          rounded-full
          bg-cream-deep/40
          blur-3xl
        "
      />

      <div
        className="
          relative
          z-10
          mx-auto
          grid
          min-h-[100svh]
          max-w-[1600px]
          lg:grid-cols-[1.05fr_0.95fr]
        "
      >
        {/* LEFT DESKTOP */}

        <section
          className="
            relative
            hidden
            overflow-hidden
            p-8
            lg:flex
            xl:p-12
          "
        >
          <div
            className="
              love-gradient
              relative
              flex
              w-full
              flex-col
              overflow-hidden
              rounded-[42px]
              p-10
              text-white
              shadow-love-lg
              xl:p-14
            "
          >
            <div
              className="
                absolute
                -right-24
                -top-20
                h-80
                w-80
                rounded-full
                bg-white/10
                blur-xl
              "
            />

            <div
              className="
                absolute
                -bottom-36
                -left-24
                h-[420px]
                w-[420px]
                rounded-full
                bg-ocean-300/20
                blur-2xl
              "
            />

            <div className="relative z-10 flex items-center gap-4">
              <Image
                src="/icons/love4ever-logo.png"
                alt="Love4ever"
                width={70}
                height={70}
                priority
                className="
                  h-16
                  w-16
                  rounded-[20px]
                  border
                  border-white/30
                  object-cover
                  shadow-lg
                "
              />

              <div>
                <h1 className="font-display text-3xl font-semibold">
                  Love4ever
                </h1>

                <p className="mt-1 text-sm text-white/70">
                  Every memory, every plan, forever.
                </p>
              </div>
            </div>

            <div
              className="
                relative
                z-10
                my-auto
                max-w-2xl
                py-12
              "
            >
              <div
                className="
                  mb-6
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/20
                  bg-white/10
                  px-4
                  py-2
                  text-sm
                  backdrop-blur-xl
                "
              >
                <Sparkles size={16} />

                Our little world
              </div>

              <h2
                className="
                  font-display
                  text-5xl
                  font-semibold
                  leading-[1.05]
                  xl:text-7xl
                "
              >
                Welcome back
                <br />
                to our story.
              </h2>

              <p
                className="
                  mt-6
                  max-w-xl
                  text-base
                  leading-8
                  text-white/75
                  xl:text-lg
                "
              >
                Semua kenangan, rencana kecil, lagu,
                tempat, pesan, dan cerita kita tersimpan
                dalam satu ruang yang hanya milik kita.
              </p>

              <div
                className="
                  mt-10
                  grid
                  grid-cols-2
                  gap-3
                  xl:grid-cols-4
                "
              >
                <Feature
                  icon={Camera}
                  label="Memories"
                />

                <Feature
                  icon={CalendarDays}
                  label="Plans"
                />

                <Feature
                  icon={MapPin}
                  label="Places"
                />

                <Feature
                  icon={Music2}
                  label="Music"
                />
              </div>
            </div>

            <div
              className="
                relative
                z-10
                flex
                items-center
                justify-between
                border-t
                border-white/15
                pt-6
                text-sm
                text-white/65
              "
            >
              <span>Izac & Lian</span>

              <div className="flex items-center gap-2">
                <Heart
                  size={15}
                  fill="currentColor"
                />

                7 October 2024
              </div>
            </div>
          </div>
        </section>

        {/* LOGIN */}

        <section
          className="
            flex
            min-h-[100svh]
            items-center
            justify-center
            px-5
            py-8
            sm:px-8
            lg:px-10
            xl:px-16
          "
        >
          <div className="w-full max-w-[520px]">
            <div
              className="
                mb-8
                flex
                items-center
                justify-center
                gap-3
                lg:hidden
              "
            >
              <Image
                src="/icons/love4ever-logo.png"
                alt="Love4ever"
                width={58}
                height={58}
                priority
                className="
                  h-14
                  w-14
                  rounded-2xl
                  object-cover
                  shadow-lg
                "
              />

              <div>
                <h1
                  className="
                    font-display
                    text-2xl
                    font-semibold
                    text-ocean-950
                  "
                >
                  Love4ever
                </h1>

                <p className="text-xs text-ink-soft">
                  Izac & Lian
                </p>
              </div>
            </div>

            <div
              className="
                glass-card-strong
                rounded-[32px]
                p-6
                sm:p-8
                xl:p-10
              "
            >
              <div>
                <div
                  className="
                    mb-4
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                    bg-ocean-100
                    text-ocean-700
                  "
                >
                  <Heart
                    size={22}
                    fill="currentColor"
                  />
                </div>

                <h2
                  className="
                    font-display
                    text-4xl
                    font-semibold
                    text-ocean-950
                    sm:text-5xl
                  "
                >
                  Welcome Back
                </h2>

                <p
                  className="
                    mt-3
                    text-sm
                    leading-7
                    text-ink-soft
                    sm:text-base
                  "
                >
                  Masuk dan lanjutkan cerita kecil kita.
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                className="mt-8 space-y-5"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="
                      mb-2
                      block
                      text-sm
                      font-semibold
                      text-ocean-900
                    "
                  >
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={19}
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-ocean-600
                      "
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="your@email.com"
                      autoComplete="email"
                      className="
                        love-input
                        rounded-2xl
                        py-4
                        pl-12
                        pr-4
                        text-sm
                        text-ocean-950
                      "
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="
                      mb-2
                      block
                      text-sm
                      font-semibold
                      text-ocean-900
                    "
                  >
                    Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={19}
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-ocean-600
                      "
                    />

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="
                        love-input
                        rounded-2xl
                        py-4
                        pl-12
                        pr-12
                        text-sm
                        text-ocean-950
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) =>
                            !current
                        )
                      }
                      className="
                        absolute
                        right-4
                        top-1/2
                        -translate-y-1/2
                        text-ink-soft
                        transition
                        hover:text-ocean-700
                      "
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                  "
                >
                  <label
                    className="
                      flex
                      cursor-pointer
                      items-center
                      gap-2
                      text-sm
                      text-ink-soft
                    "
                  >
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) =>
                        setRememberMe(
                          event.target.checked
                        )
                      }
                      className="
                        h-4
                        w-4
                        accent-[#1688b5]
                      "
                    />

                    Remember me
                  </label>

                  <button
                    type="button"
                    className="
                      text-sm
                      font-semibold
                      text-ocean-700
                      transition
                      hover:text-ocean-900
                    "
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    love-button
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-3
                    rounded-2xl
                    py-4
                    font-semibold
                    disabled:cursor-not-allowed
                    disabled:opacity-70
                  "
                >
                  {isLoading ? (
                    <>
                      <span
                        className="
                          h-5
                          w-5
                          animate-spin
                          rounded-full
                          border-2
                          border-white/30
                          border-t-white
                        "
                      />

                      Entering...
                    </>
                  ) : (
                    <>
                      Login to Love4ever

                      <ArrowRight size={19} />
                    </>
                  )}
                </button>
              </form>

              <div
                className="
                  my-7
                  flex
                  items-center
                  gap-4
                "
              >
                <div className="h-px flex-1 bg-ocean-100" />

                <Heart
                  size={13}
                  className="text-ocean-300"
                  fill="currentColor"
                />

                <div className="h-px flex-1 bg-ocean-100" />
              </div>

              <p className="text-center text-sm text-ink-soft">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="
                    font-bold
                    text-ocean-700
                    transition
                    hover:text-ocean-950
                  "
                >
                  Create account
                </Link>
              </p>
            </div>

            <p
              className="
                mt-5
                text-center
                text-xs
                leading-6
                text-ink-soft/70
              "
            >
              Made with ♡ for Izac & Lian
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/15
        bg-white/10
        px-4
        py-4
        backdrop-blur-lg
      "
    >
      <Icon
        size={20}
        className="mb-3 text-white"
      />

      <p className="text-sm font-semibold">
        {label}
      </p>
    </div>
  );
}