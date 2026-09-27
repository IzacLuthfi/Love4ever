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

  Lock,

  Mail,

  User,

} from "lucide-react";

import Swal from "sweetalert2";

import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {

  const router =

    useRouter();

  const [

    fullName,

    setFullName,

  ] =

    useState("");

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

    confirmation,

    setConfirmation,

  ] =

    useState("");

  const [

    showPassword,

    setShowPassword,

  ] =

    useState(false);

  const [

    showConfirmation,

    setShowConfirmation,

  ] =

    useState(false);

  const [

    isLoading,

    setIsLoading,

  ] =

    useState(false);

  const handleRegister =

    async (

      event:

        React.FormEvent<HTMLFormElement>

    ) => {

      event.preventDefault();

      const cleanName =

        fullName.trim();

      const cleanEmail =

        email.trim();

      if (

        !cleanName ||

        !cleanEmail ||

        !password ||

        !confirmation

      ) {

        await Swal.fire({

          icon:

            "warning",

          title:

            "Incomplete",

          text:

            "Complete all fields first.",

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

      if (

        password.length <

        6

      ) {

        await Swal.fire({

          icon:

            "warning",

          title:

            "Password too short",

          text:

            "Use at least 6 characters.",

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

      if (

        password !==

        confirmation

      ) {

        await Swal.fire({

          icon:

            "error",

          title:

            "Passwords do not match",

          text:

            "Check your password confirmation.",

          confirmButtonText:

            "Check again",

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

            .signUp({

              email:

                cleanEmail,

              password,

              options: {

                data: {

                  full_name:

                    cleanName,

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

              "This email is already registered.";

          }

          await Swal.fire({

            icon:

              "error",

            title:

              "Unable to register",

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

        if (

          data.session

        ) {

          router.replace(

            "/dashboard"

          );

          return;

        }

        await Swal.fire({

          icon:

            "success",

          title:

            "Account created",

          text:

            "Check your email to confirm your account.",

          confirmButtonText:

            "Go to login",

          confirmButtonColor:

            "#083b59",

          background:

            "#fffdf9",

          color:

            "#123d59",

        });

        router.replace(

          "/login"

        );

      } catch (error) {

        console.error(

          "Register error:",

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

          lg:grid-cols-[0.92fr_1.08fr]

        "

      >

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

              max-w-[440px]

            "

          >

            <div

              className="

                mb-8

                flex

                items-center

                justify-between

                gap-4

              "

            >

              <Link

                href="/login"

                className="

                  group

                  inline-flex

                  items-center

                  gap-2

                  text-xs

                  font-semibold

                  text-ink-soft

                  transition

                  hover:text-ocean-950

                "

              >

                <ArrowLeft

                  size={14}

                  className="

                    transition-transform

                    group-hover:-translate-x-0.5

                  "

                />

                Back

              </Link>

              <p

                className="

                  font-display

                  text-lg

                  font-semibold

                  tracking-[-0.02em]

                  lg:hidden

                "

              >

                Love4ever

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

                Create account

              </h1>

              <p

                className="

                  mt-4

                  text-sm

                  text-ink-soft

                "

              >

                Join Love4ever.

              </p>

            </div>

            <form

              onSubmit={

                handleRegister

              }

              className="

                mt-9

                space-y-4

              "

            >

              <Field

                id="full-name"

                label="Full Name"

                icon={User}

              >

                <input

                  id="full-name"

                  name="full-name"

                  type="text"

                  value={

                    fullName

                  }

                  onChange={(

                    event

                  ) =>

                    setFullName(

                      event.target.value

                    )

                  }

                  placeholder="Full name"

                  autoComplete="name"

                  disabled={

                    isLoading

                  }

                  className={

                    inputClass

                  }

                />

              </Field>

              <Field

                id="register-email"

                label="Email"

                icon={Mail}

              >

                <input

                  id="register-email"

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

                  className={

                    inputClass

                  }

                />

              </Field>

              <Field

                id="register-password"

                label="Password"

                icon={Lock}

              >

                <input

                  id="register-password"

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

                  placeholder="Minimum 6 characters"

                  autoComplete="new-password"

                  disabled={

                    isLoading

                  }

                  className={`

                    ${inputClass}

                    pr-12

                  `}

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

                  className={

                    passwordToggleClass

                  }

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

              </Field>

              <Field

                id="confirmation"

                label="Confirm Password"

                icon={Lock}

              >

                <input

                  id="confirmation"

                  name="confirmation"

                  type={

                    showConfirmation

                      ? "text"

                      : "password"

                  }

                  value={

                    confirmation

                  }

                  onChange={(

                    event

                  ) =>

                    setConfirmation(

                      event.target.value

                    )

                  }

                  placeholder="Confirm password"

                  autoComplete="new-password"

                  disabled={

                    isLoading

                  }

                  className={`

                    ${inputClass}

                    pr-12

                  `}

                />

                <button

                  type="button"

                  onClick={() =>

                    setShowConfirmation(

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

                    showConfirmation

                      ? "Hide password"

                      : "Show password"

                  }

                  className={

                    passwordToggleClass

                  }

                >

                  {showConfirmation ? (

                    <EyeOff

                      size={16}

                    />

                  ) : (

                    <Eye

                      size={16}

                    />

                  )}

                </button>

              </Field>

              <button

                type="submit"

                disabled={

                  isLoading

                }

                className="

                  group

                  mt-2

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

                    Creating account

                  </>

                ) : (

                  <>

                    Create account

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

                Already registered?

              </p>

              <Link

                href="/login"

                className="

                  text-xs

                  font-semibold

                  text-ocean-800

                  transition

                  hover:text-ocean-950

                "

              >

                Sign in

              </Link>

            </div>

          </div>

        </section>

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

              src="/images/register.jpg"

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

      </div>

    </main>

  );

}

function Field({

  id,

  label,

  icon: Icon,

  children,

}: {

  id:

    string;

  label:

    string;

  icon:

    React.ElementType;

  children:

    React.ReactNode;

}) {

  return (

    <div>

      <label

        htmlFor={

          id

        }

        className="

          mb-2

          block

          text-xs

          font-semibold

          text-ocean-900

        "

      >

        {label}

      </label>

      <div

        className="

          relative

        "

      >

        <Icon

          size={16}

          strokeWidth={1.8}

          className="

            pointer-events-none

            absolute

            left-4

            top-1/2

            z-10

            -translate-y-1/2

            text-ink-soft/55

          "

        />

        {children}

      </div>

    </div>

  );

}

const inputClass = `

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

`;

const passwordToggleClass = `

  absolute

  right-3

  top-1/2

  z-20

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

  disabled:opacity-40

`;
