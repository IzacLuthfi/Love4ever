// src/app/login/page.tsx

"use client";

import Image from "next/image";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { useState } from "react";

import {

  ArrowRight,

  Eye,

  EyeOff,

  Lock,

  Mail,

} from "lucide-react";

import Swal from "sweetalert2";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {

  const router =

    useRouter();

  const [

    email,

    setEmail,

  ] =

    useState("");

  const [

    password,

    setPassword,

  ] =

    useState("");

  const [

    showPassword,

    setShowPassword,

  ] =

    useState(false);

  const [

    isLoading,

    setIsLoading,

  ] =

    useState(false);

  const handleLogin =

    async (

      event:

        React.FormEvent<HTMLFormElement>

    ) => {

      event.preventDefault();

      const cleanEmail =

        email.trim();

      if (

        !cleanEmail ||

        !password

      ) {

        await Swal.fire({

          icon:

            "warning",

          title:

            "Incomplete",

          text:

            "Enter your email and password.",

          confirmButtonText:

            "OK",

          confirmButtonColor:

            "#083b59",

          background:

            "#fffdf9",

          color:

            "#123d59",

        });

        return;

      }

      setIsLoading(

        true

      );

      try {

        const supabase =

          createClient();

        const {

          data,

          error,

        } =

          await supabase.auth

            .signInWithPassword({

              email:

                cleanEmail,

              password,

            });

        if (error) {

          let message =

            "Email or password is incorrect.";

          if (

            error.message

              .toLowerCase()

              .includes(

                "email not confirmed"

              )

          ) {

            message =

              "Please confirm your email first.";

          }

          await Swal.fire({

            icon:

              "error",

            title:

              "Unable to sign in",

            text:

              message,

            confirmButtonText:

              "Try again",

            confirmButtonColor:

              "#083b59",

            background:

              "#fffdf9",

            color:

              "#123d59",

          });

          return;

        }

        if (!data.user) {

          await Swal.fire({

            icon:

              "error",

            title:

              "Unable to sign in",

            text:

              "User not found.",

            confirmButtonText:

              "OK",

            confirmButtonColor:

              "#083b59",

            background:

              "#fffdf9",

            color:

              "#123d59",

          });

          return;

        }

        router.replace(

          "/dashboard"

        );

      } catch (error) {

        console.error(

          "Login error:",

          error

        );

        await Swal.fire({

          icon:

            "error",

          title:

            "Connection error",

          text:

            "Please try again in a moment.",

          confirmButtonText:

            "OK",

          confirmButtonColor:

            "#083b59",

          background:

            "#fffdf9",

          color:

            "#123d59",

        });

      } finally {

        setIsLoading(

          false

        );

      }

    };

  return (

    <main

      className="

        min-h-[100svh]

        bg-[#f7f7f4]

        text-ocean-950

      "

    >

      <div

        className="

          mx-auto

          grid

          min-h-[100svh]

          max-w-[1600px]

          lg:grid-cols-[1.08fr_0.92fr]

        "

      >

        {/* IMAGE */}

        <section

          className="

            hidden

            p-6

            lg:block

            xl:p-8

          "

        >

          <div

            className="

              relative

              h-full

              min-h-[calc(100svh-64px)]

              overflow-hidden

              rounded-[32px]

              bg-ocean-950

            "

          >

            <Image

              src="/images/login.jpg"

              alt="Love4ever"

              fill

              priority

              className="

                object-cover

              "

            />

            <div

              className="

                absolute

                inset-0

                bg-[linear-gradient(180deg,rgba(6,42,63,0.04)_20%,rgba(6,42,63,0.72)_100%)]

              "

            />

            <div

              className="

                absolute

                bottom-0

                left-0

                right-0

                flex

                items-end

                justify-between

                gap-6

                p-8

                text-white

                xl:p-10

              "

            >

              <div>

                <p

                  className="

                    font-display

                    text-[32px]

                    font-semibold

                    tracking-[-0.035em]

                  "

                >

                  Love4ever

                </p>

                <p

                  className="

                    mt-1

                    text-xs

                    text-white/58

                  "

                >

                  Izac & Lian

                </p>

              </div>

              <p

                className="

                  text-[10px]

                  text-white/45

                "

              >

                07.10.2024

              </p>

            </div>

          </div>

        </section>

        {/* FORM */}

        <section

          className="

            flex

            min-h-[100svh]

            items-center

            justify-center

            px-5

            py-10

            sm:px-8

            lg:px-14

            xl:px-20

          "

        >

          <div

            className="

              w-full

              max-w-[430px]

            "

          >

            <div

              className="

                mb-10

                lg:hidden

              "

            >

              <p

                className="

                  font-display

                  text-xl

                  font-semibold

                  tracking-[-0.02em]

                "

              >

                Love4ever

              </p>

              <p

                className="

                  mt-1

                  text-[10px]

                  text-ink-soft

                "

              >

                Izac & Lian

              </p>

            </div>

            <div>

              <h1

                className="

                  font-display

                  text-[42px]

                  font-semibold

                  leading-none

                  tracking-[-0.045em]

                  text-ocean-950

                  sm:text-[48px]

                "

              >

                Welcome back

              </h1>

              <p

                className="

                  mt-4

                  text-sm

                  text-ink-soft

                "

              >

                Sign in to Love4ever.

              </p>

            </div>

            <form

              onSubmit={

                handleLogin

              }

              className="

                mt-9

                space-y-5

              "

            >

              <div>

                <label

                  htmlFor="email"

                  className="

                    mb-2

                    block

                    text-xs

                    font-semibold

                    text-ocean-900

                  "

                >

                  Email

                </label>

                <div

                  className="

                    relative

                  "

                >

                  <Mail

                    size={16}

                    strokeWidth={1.8}

                    className="

                      absolute

                      left-4

                      top-1/2

                      -translate-y-1/2

                      text-ink-soft/55

                    "

                  />

                  <input

                    id="email"

                    name="email"

                    type="email"

                    value={

                      email

                    }

                    onChange={(

                      event

                    ) =>

                      setEmail(

                        event.target.value

                      )

                    }

                    placeholder="Email"

                    autoComplete="email"

                    disabled={

                      isLoading

                    }

                    className="

                      w-full

                      rounded-[14px]

                      border

                      border-ocean-100

                      bg-white

                      py-3.5

                      pl-11

                      pr-4

                      text-sm

                      text-ocean-950

                      outline-none

                      transition

                      placeholder:text-ink-soft/35

                      focus:border-ocean-300

                      focus:ring-4

                      focus:ring-ocean-100/40

                      disabled:cursor-not-allowed

                      disabled:opacity-60

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

                    text-xs

                    font-semibold

                    text-ocean-900

                  "

                >

                  Password

                </label>

                <div

                  className="

                    relative

                  "

                >

                  <Lock

                    size={16}

                    strokeWidth={1.8}

                    className="

                      absolute

                      left-4

                      top-1/2

                      -translate-y-1/2

                      text-ink-soft/55

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

                    value={

                      password

                    }

                    onChange={(

                      event

                    ) =>

                      setPassword(

                        event.target.value

                      )

                    }

                    placeholder="Password"

                    autoComplete="current-password"

                    disabled={

                      isLoading

                    }

                    className="

                      w-full

                      rounded-[14px]

                      border

                      border-ocean-100

                      bg-white

                      py-3.5

                      pl-11

                      pr-12

                      text-sm

                      text-ocean-950

                      outline-none

                      transition

                      placeholder:text-ink-soft/35

                      focus:border-ocean-300

                      focus:ring-4

                      focus:ring-ocean-100/40

                      disabled:cursor-not-allowed

                      disabled:opacity-60

                    "

                  />

                  <button

                    type="button"

                    onClick={() =>

                      setShowPassword(

                        (

                          current

                        ) =>

                          !current

                      )

                    }

                    disabled={

                      isLoading

                    }

                    aria-label={

                      showPassword

                        ? "Hide password"

                        : "Show password"

                    }

                    className="

                      absolute

                      right-3

                      top-1/2

                      flex

                      h-8

                      w-8

                      -translate-y-1/2

                      items-center

                      justify-center

                      rounded-full

                      text-ink-soft/55

                      transition

                      hover:bg-ocean-50

                      hover:text-ocean-900

                    "

                  >

                    {showPassword ? (

                      <EyeOff

                        size={16}

                      />

                    ) : (

                      <Eye

                        size={16}

                      />

                    )}

                  </button>

                </div>

              </div>

              <button

                type="submit"

                disabled={

                  isLoading

                }

                className="

                  group

                  flex

                  w-full

                  items-center

                  justify-center

                  gap-2.5

                  rounded-[14px]

                  bg-ocean-950

                  px-5

                  py-3.5

                  text-sm

                  font-semibold

                  text-white

                  transition

                  hover:bg-ocean-800

                  active:scale-[0.99]

                  disabled:cursor-not-allowed

                  disabled:opacity-50

                "

              >

                {isLoading ? (

                  <>

                    <span

                      className="

                        h-4

                        w-4

                        animate-spin

                        rounded-full

                        border-2

                        border-white/25

                        border-t-white

                      "

                    />

                    Signing in

                  </>

                ) : (

                  <>

                    Sign in

                    <ArrowRight

                      size={15}

                      className="

                        transition-transform

                        group-hover:translate-x-0.5

                      "

                    />

                  </>

                )}

              </button>

            </form>

            <div

              className="

                mt-7

                flex

                items-center

                justify-between

                gap-4

                border-t

                border-ocean-100

                pt-6

              "

            >

              <p

                className="

                  text-xs

                  text-ink-soft

                "

              >

                New here?

              </p>

              <Link

                href="/register"

                className="

                  text-xs

                  font-semibold

                  text-ocean-800

                  transition

                  hover:text-ocean-950

                "

              >

                Create account

              </Link>

            </div>

          </div>

        </section>

      </div>

    </main>

  );

}
