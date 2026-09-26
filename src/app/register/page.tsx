// src/app/register/page.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import Swal from "sweetalert2";

import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmation,
    setConfirmation,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmation,
    setShowConfirmation,
  ] = useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const handleRegister = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !confirmation
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Masih ada yang kosong ♡",
        text: "Lengkapi semua data terlebih dahulu.",
        confirmButtonText: "Oke",
        confirmButtonColor: "#1688b5",
      });

      return;
    }

    if (password.length < 6) {
      await Swal.fire({
        icon: "warning",
        title: "Password terlalu pendek",
        text: "Gunakan minimal 6 karakter.",
        confirmButtonText: "Oke",
        confirmButtonColor: "#1688b5",
      });

      return;
    }

    if (
      password !== confirmation
    ) {
      await Swal.fire({
        icon: "error",
        title: "Password berbeda",
        text: "Konfirmasi password belum sama.",
        confirmButtonText:
          "Periksa lagi",
        confirmButtonColor: "#1688b5",
      });

      return;
    }

    setIsLoading(true);

    try {
      const supabase =
        createClient();

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,

          options: {
            data: {
              full_name:
                fullName.trim(),
            },

            emailRedirectTo:
              `${window.location.origin}/auth/callback`,
          },
        });

      if (error) {
        let message =
          error.message;

        if (
          error.message
            .toLowerCase()
            .includes(
              "already registered"
            )
        ) {
          message =
            "Email tersebut sudah terdaftar.";
        }

        await Swal.fire({
          icon: "error",
          title:
            "Register gagal",
          text: message,
          confirmButtonText:
            "Coba lagi",
          confirmButtonColor:
            "#1688b5",
        });

        return;
      }

      /*
       * Jika Email Confirmation OFF,
       * Supabase langsung memberikan session.
       */

      if (data.session) {
        await Swal.fire({
          icon: "success",
          title:
            "Welcome to Love4ever ♡",
          text: "Akun berhasil dibuat.",
          timer: 1400,
          showConfirmButton: false,
        });

        router.replace(
          "/dashboard"
        );

        router.refresh();

        return;
      }

      /*
       * Jika Email Confirmation ON,
       * user perlu membuka email.
       */

      await Swal.fire({
        icon: "success",
        title:
          "Akun berhasil dibuat ♡",
        text:
          "Silakan cek email untuk melakukan konfirmasi akun sebelum login.",
        confirmButtonText:
          "Ke Login",
        confirmButtonColor:
          "#1688b5",
      });

      router.replace("/login");
    } catch (error) {
      console.error(
        "Register error:",
        error
      );

      await Swal.fire({
        icon: "error",
        title:
          "Terjadi kesalahan",
        text:
          "Tidak dapat terhubung ke server. Silakan coba kembali.",
        confirmButtonText: "Oke",
        confirmButtonColor:
          "#1688b5",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="
        relative
        min-h-[100svh]
        overflow-hidden
        bg-[#f9fcfd]
      "
    >
      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_10%_10%,rgba(103,197,226,0.26),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(244,219,184,0.40),transparent_30%),linear-gradient(145deg,#f3fbff_0%,#fffdf8_48%,#f6eee4_100%)]
        "
      />

      <div
        className="
          absolute
          -left-24
          bottom-16
          h-80
          w-80
          rounded-full
          bg-ocean-300/20
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
          lg:grid-cols-[0.9fr_1.1fr]
        "
      >
        {/* REGISTER */}

        <section
          className="
            flex
            items-center
            justify-center
            px-5
            py-8
            sm:px-8
            lg:px-10
            xl:px-16
          "
        >
          <div className="w-full max-w-[540px]">
            <Link
              href="/login"
              className="
                mb-6
                inline-flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-ink-soft
                transition
                hover:text-ocean-800
              "
            >
              <ArrowLeft size={17} />

              Back to login
            </Link>

            <div
              className="
                glass-card-strong
                rounded-[32px]
                p-6
                sm:p-8
                xl:p-10
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-4
                "
              >
                <Image
                  src="/icons/love4ever-logo.png"
                  alt="Love4ever"
                  width={60}
                  height={60}
                  priority
                  className="
                    h-14
                    w-14
                    rounded-2xl
                    object-cover
                    shadow-md
                  "
                />

                <div>
                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-[0.22em]
                      text-ocean-600
                    "
                  >
                    Love4ever
                  </p>

                  <p className="mt-1 text-xs text-ink-soft">
                    Our private little world
                  </p>
                </div>
              </div>

              <h1
                className="
                  mt-7
                  font-display
                  text-4xl
                  font-semibold
                  text-ocean-950
                  sm:text-5xl
                "
              >
                Create Account
              </h1>

              <p
                className="
                  mt-3
                  text-sm
                  leading-7
                  text-ink-soft
                "
              >
                Buat akun untuk menjadi bagian
                dari perjalanan Love4ever.
              </p>

              <form
                onSubmit={handleRegister}
                className="mt-8 space-y-5"
              >
                <InputGroup
                  id="full-name"
                  label="Full Name"
                  icon={User}
                >
                  <input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(
                        event.target.value
                      )
                    }
                    placeholder="Nama lengkap"
                    autoComplete="name"
                    className="
                      love-input
                      rounded-2xl
                      py-4
                      pl-12
                      pr-4
                      text-sm
                    "
                  />
                </InputGroup>

                <InputGroup
                  id="register-email"
                  label="Email"
                  icon={Mail}
                >
                  <input
                    id="register-email"
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
                    "
                  />
                </InputGroup>

                <InputGroup
                  id="register-password"
                  label="Password"
                  icon={Lock}
                >
                  <input
                    id="register-password"
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
                    placeholder="Minimal 6 karakter"
                    autoComplete="new-password"
                    className="
                      love-input
                      rounded-2xl
                      py-4
                      pl-12
                      pr-12
                      text-sm
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
                      hover:text-ocean-700
                    "
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff
                        size={19}
                      />
                    ) : (
                      <Eye
                        size={19}
                      />
                    )}
                  </button>
                </InputGroup>

                <InputGroup
                  id="confirmation"
                  label="Confirm Password"
                  icon={Lock}
                >
                  <input
                    id="confirmation"
                    type={
                      showConfirmation
                        ? "text"
                        : "password"
                    }
                    value={confirmation}
                    onChange={(event) =>
                      setConfirmation(
                        event.target.value
                      )
                    }
                    placeholder="Ulangi password"
                    autoComplete="new-password"
                    className="
                      love-input
                      rounded-2xl
                      py-4
                      pl-12
                      pr-12
                      text-sm
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmation(
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
                      hover:text-ocean-700
                    "
                    aria-label={
                      showConfirmation
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmation ? (
                      <EyeOff
                        size={19}
                      />
                    ) : (
                      <Eye
                        size={19}
                      />
                    )}
                  </button>
                </InputGroup>

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

                      Creating...
                    </>
                  ) : (
                    <>
                      Create Account

                      <ArrowRight
                        size={19}
                      />
                    </>
                  )}
                </button>
              </form>

              <p
                className="
                  mt-7
                  text-center
                  text-sm
                  text-ink-soft
                "
              >
                Sudah punya akun?{" "}
                <Link
                  href="/login"
                  className="
                    font-bold
                    text-ocean-700
                    hover:text-ocean-950
                  "
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT DESKTOP */}

        <section
          className="
            relative
            hidden
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
              justify-between
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
                -right-20
                top-0
                h-96
                w-96
                rounded-full
                bg-white/10
                blur-3xl
              "
            />

            <div
              className="
                absolute
                -bottom-32
                -left-24
                h-96
                w-96
                rounded-full
                bg-ocean-200/20
                blur-3xl
              "
            />

            <div
              className="
                relative
                z-10
                flex
                items-center
                justify-between
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                "
              >
                <Heart
                  size={17}
                  fill="currentColor"
                />

                Izac & Lian
              </div>

              <Sparkles size={22} />
            </div>

            <div
              className="
                relative
                z-10
                max-w-2xl
              "
            >
              <p
                className="
                  mb-5
                  text-sm
                  font-semibold
                  uppercase
                  tracking-[0.3em]
                  text-white/65
                "
              >
                Better Together
              </p>

              <h2
                className="
                  font-display
                  text-5xl
                  font-semibold
                  leading-[1.08]
                  xl:text-7xl
                "
              >
                One account.
                <br />
                Thousands of memories.
              </h2>

              <p
                className="
                  mt-7
                  max-w-xl
                  text-base
                  leading-8
                  text-white/75
                  xl:text-lg
                "
              >
                Love4ever dibuat bukan hanya
                untuk menyimpan foto, tetapi
                untuk menyimpan perjalanan
                yang terus bertambah setiap
                harinya.
              </p>
            </div>

            <div
              className="
                relative
                z-10
                rounded-[28px]
                border
                border-white/15
                bg-white/10
                p-6
                backdrop-blur-xl
              "
            >
              <Heart
                size={25}
                fill="currentColor"
              />

              <blockquote
                className="
                  mt-4
                  font-display
                  text-2xl
                  italic
                  leading-relaxed
                "
              >
                “Same journey, brighter
                tomorrows, always.”
              </blockquote>

              <p className="mt-4 text-sm text-white/60">
                — Love4ever ♡
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InputGroup({
  id,
  label,
  icon: Icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="
          mb-2
          block
          text-sm
          font-semibold
          text-ocean-900
        "
      >
        {label}
      </label>

      <div className="relative">
        <Icon
          size={19}
          className="
            absolute
            left-4
            top-1/2
            z-10
            -translate-y-1/2
            text-ocean-600
          "
        />

        {children}
      </div>
    </div>
  );
}