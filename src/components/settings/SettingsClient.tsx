// src/components/settings/SettingsClient.tsx

"use client";

import Link from "next/link";

import {
  type FormEvent,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  LockKeyhole,
  Save,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Swal from "sweetalert2";

import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { createClient } from "@/lib/supabase/client";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type SettingsUser = {
  id: string;

  email: string;

  fullName: string;

  nickname: string;

  avatarUrl:
    | string
    | null;
};

type CoupleSettings = {
  id: string;

  name: string;

  anniversaryDate: string;
};

type SettingsClientProps = {
  user:
    SettingsUser;

  couple:
    | CoupleSettings
    | null;
};

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function SettingsClient({
  user,
  couple,
}: SettingsClientProps) {
  const [
    coupleName,
    setCoupleName,
  ] =
    useState(
      couple?.name ??
      ""
    );

  const [
    anniversaryDate,
    setAnniversaryDate,
  ] =
    useState(
      couple?.anniversaryDate ??
      ""
    );

  const [
    isSavingCouple,
    setIsSavingCouple,
  ] =
    useState(false);

  const [
    newPassword,
    setNewPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    isChangingPassword,
    setIsChangingPassword,
  ] =
    useState(false);

  /*
   * =========================================================
   * SAVE COUPLE
   * =========================================================
   */

  const handleSaveCouple =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (!couple) {
        return;
      }

      const name =
        coupleName.trim();

      if (!name) {
        await showWarning(
          "Nama belum diisi",
          "Nama couple wajib diisi."
        );

        return;
      }

      if (
        !anniversaryDate
      ) {
        await showWarning(
          "Tanggal belum diisi",
          "Tanggal anniversary wajib diisi."
        );

        return;
      }

      setIsSavingCouple(
        true
      );

      try {
        const supabase =
          createClient();

        const {
          error,
        } =
          await supabase
            .from("couples")
            .update({
              name,

              anniversary_date:
                anniversaryDate,
            })
            .eq(
              "id",
              couple.id
            );

        if (error) {
          await showError(
            "Settings gagal disimpan",
            error.message
          );

          return;
        }

        await Swal.fire({
          icon:
            "success",

          title:
            "Couple settings diperbarui",

          text:
            "Perubahan akan otomatis digunakan di Dashboard dan halaman lainnya.",

          timer:
            1500,

          showConfirmButton:
            false,
        });
      } finally {
        setIsSavingCouple(
          false
        );
      }
    };

  /*
   * =========================================================
   * PASSWORD
   * =========================================================
   */

  const handleChangePassword =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        newPassword.length <
        8
      ) {
        await showWarning(
          "Password terlalu pendek",
          "Gunakan minimal 8 karakter."
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        await showWarning(
          "Password berbeda",
          "Konfirmasi password harus sama."
        );

        return;
      }

      const confirm =
        await Swal.fire({
          icon:
            "question",

          title:
            "Ganti password?",

          text:
            "Password login akun ini akan diperbarui.",

          showCancelButton:
            true,

          confirmButtonText:
            "Change Password",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#1688b5",
        });

      if (
        !confirm.isConfirmed
      ) {
        return;
      }

      setIsChangingPassword(
        true
      );

      try {
        const supabase =
          createClient();

        const {
          error,
        } =
          await supabase.auth.updateUser({
            password:
              newPassword,
          });

        if (error) {
          await showError(
            "Password gagal diperbarui",
            error.message
          );

          return;
        }

        setNewPassword("");
        setConfirmPassword("");

        await Swal.fire({
          icon:
            "success",

          title:
            "Password diperbarui",

          text:
            "Gunakan password baru pada login berikutnya.",

          confirmButtonColor:
            "#1688b5",
        });
      } finally {
        setIsChangingPassword(
          false
        );
      }
    };

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div
      className="
        min-h-[100svh]
        bg-[radial-gradient(circle_at_10%_0%,rgba(103,197,226,0.22),transparent_26%),radial-gradient(circle_at_90%_10%,rgba(244,219,184,0.32),transparent_28%),linear-gradient(145deg,#f5fbfe_0%,#fffdf8_48%,#f7efe5_100%)]
      "
    >
      <AppSidebar
        user={user}
      />

      <MobileBottomNav />

      <main
        className="
          min-h-[100svh]
          px-4
          pb-28
          pt-4
          sm:px-6
          sm:pt-6
          lg:ml-[290px]
          lg:px-7
          lg:pb-8
          xl:px-10
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1200px]
          "
        >
          {/* HEADER */}

          <header>
            <Link
              href="/dashboard"
              className="
                mb-3
                inline-flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-ink-soft
                transition
                hover:text-ocean-700
              "
            >
              <ChevronLeft
                size={17}
              />

              Dashboard
            </Link>

            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.22em]
                text-ocean-500
              "
            >
              Configuration
            </p>

            <h1
              className="
                mt-1
                font-display
                text-3xl
                font-semibold
                text-ocean-950
                sm:text-4xl
              "
            >
              Settings
            </h1>

            <p
              className="
                mt-2
                max-w-xl
                text-sm
                leading-6
                text-ink-soft
              "
            >
              Kelola informasi couple dan keamanan akun.
            </p>
          </header>

          <section
            className="
              mt-7
              grid
              gap-5
              xl:grid-cols-2
            "
          >
            {/* COUPLE SETTINGS */}

            <form
              onSubmit={
                handleSaveCouple
              }
              className="
                glass-card
                rounded-[30px]
                p-5
                sm:p-7
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-[15px]
                    bg-ocean-100
                    text-ocean-700
                  "
                >
                  <Heart
                    size={19}
                  />
                </div>

                <div>
                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.18em]
                      text-ocean-500
                    "
                  >
                    Relationship
                  </p>

                  <h2
                    className="
                      font-display
                      text-2xl
                      font-semibold
                      text-ocean-950
                    "
                  >
                    Couple Settings
                  </h2>
                </div>
              </div>

              {couple ? (
                <>
                  <div
                    className="
                      mt-7
                      space-y-5
                    "
                  >
                    <Field
                      label="Couple Name"
                      icon={
                        Heart
                      }
                    >
                      <input
                        type="text"
                        value={
                          coupleName
                        }
                        onChange={(
                          event
                        ) =>
                          setCoupleName(
                            event.target.value
                          )
                        }
                        className="
                          love-input
                          w-full
                          rounded-[15px]
                          px-4
                          py-3
                          text-sm
                        "
                      />
                    </Field>

                    <Field
                      label="Anniversary Date"
                      icon={
                        CalendarDays
                      }
                    >
                      <input
                        type="date"
                        value={
                          anniversaryDate
                        }
                        onChange={(
                          event
                        ) =>
                          setAnniversaryDate(
                            event.target.value
                          )
                        }
                        className="
                          love-input
                          w-full
                          rounded-[15px]
                          px-4
                          py-3
                          text-sm
                        "
                      />
                    </Field>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isSavingCouple
                    }
                    className="
                      love-button
                      mt-7
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-[15px]
                      px-5
                      py-3
                      text-sm
                      font-semibold
                      disabled:opacity-60
                    "
                  >
                    <Save
                      size={16}
                    />

                    {isSavingCouple
                      ? "Saving..."
                      : "Save Couple Settings"}
                  </button>
                </>
              ) : (
                <p
                  className="
                    mt-6
                    text-sm
                    leading-7
                    text-ink-soft
                  "
                >
                  Akun ini belum memiliki couple workspace.
                </p>
              )}
            </form>

            {/* PASSWORD */}

            <form
              onSubmit={
                handleChangePassword
              }
              className="
                glass-card
                rounded-[30px]
                p-5
                sm:p-7
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-[15px]
                    bg-ocean-100
                    text-ocean-700
                  "
                >
                  <KeyRound
                    size={19}
                  />
                </div>

                <div>
                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.18em]
                      text-ocean-500
                    "
                  >
                    Security
                  </p>

                  <h2
                    className="
                      font-display
                      text-2xl
                      font-semibold
                      text-ocean-950
                    "
                  >
                    Change Password
                  </h2>
                </div>
              </div>

              <div
                className="
                  mt-7
                  space-y-5
                "
              >
                <Field
                  label="New Password"
                  icon={
                    LockKeyhole
                  }
                >
                  <div
                    className="
                      relative
                    "
                  >
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        newPassword
                      }
                      onChange={(
                        event
                      ) =>
                        setNewPassword(
                          event.target.value
                        )
                      }
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                      className="
                        love-input
                        w-full
                        rounded-[15px]
                        py-3
                        pl-4
                        pr-12
                        text-sm
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
                      className="
                        absolute
                        right-4
                        top-1/2
                        -translate-y-1/2
                        text-ink-soft
                      "
                    >
                      {showPassword ? (
                        <EyeOff
                          size={17}
                        />
                      ) : (
                        <Eye
                          size={17}
                        />
                      )}
                    </button>
                  </div>
                </Field>

                <Field
                  label="Confirm New Password"
                  icon={
                    ShieldCheck
                  }
                >
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(
                      event
                    ) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    autoComplete="new-password"
                    placeholder="Repeat new password"
                    className="
                      love-input
                      w-full
                      rounded-[15px]
                      px-4
                      py-3
                      text-sm
                    "
                  />
                </Field>
              </div>

              <button
                type="submit"
                disabled={
                  isChangingPassword
                }
                className="
                  mt-7
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-[15px]
                  bg-ocean-700
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-ocean-800
                  disabled:opacity-60
                "
              >
                <KeyRound
                  size={16}
                />

                {isChangingPassword
                  ? "Updating..."
                  : "Change Password"}
              </button>
            </form>
          </section>

          {/* ACCOUNT */}

          <section
            className="
              glass-card
              mt-5
              rounded-[30px]
              p-5
              sm:p-7
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-[15px]
                  bg-ocean-100
                  text-ocean-700
                "
              >
                <Settings2
                  size={19}
                />
              </div>

              <div>
                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-ocean-500
                  "
                >
                  Account
                </p>

                <h2
                  className="
                    font-display
                    text-2xl
                    font-semibold
                    text-ocean-950
                  "
                >
                  Account Information
                </h2>
              </div>
            </div>

            <div
              className="
                mt-6
                grid
                gap-3
                sm:grid-cols-2
              "
            >
              <InfoBox
                icon={
                  UserRound
                }
                label="Profile"
                value={
                  user.nickname
                }
              />

              <InfoBox
                icon={
                  ShieldCheck
                }
                label="Email"
                value={
                  user.email
                }
              />
            </div>

            <div
              className="
                mt-5
                rounded-[18px]
                border
                border-ocean-100
                bg-ocean-50/60
                p-4
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >
                <ShieldCheck
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                    text-ocean-600
                  "
                />

                <p
                  className="
                    text-xs
                    leading-6
                    text-ink-soft
                  "
                >
                  Data Planner, Memories, Notes, Messages,
                  Gallery, dan Music dibatasi berdasarkan
                  couple membership melalui Supabase RLS.
                </p>
              </div>
            </div>

            <Link
              href="/profile"
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-ocean-700
              "
            >
              <UserRound
                size={15}
              />

              Open Profile
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}

/*
 * =========================================================
 * FIELD
 * =========================================================
 */

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;

  icon:
    React.ElementType;

  children:
    React.ReactNode;
}) {
  return (
    <div>
      <div
        className="
          mb-2
          flex
          items-center
          gap-2
        "
      >
        <Icon
          size={13}
          className="
            text-ocean-500
          "
        />

        <label
          className="
            text-xs
            font-bold
            text-ocean-800
          "
        >
          {label}
        </label>
      </div>

      {children}
    </div>
  );
}

/*
 * =========================================================
 * INFO BOX
 * =========================================================
 */

function InfoBox({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ElementType;

  label: string;

  value: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-[18px]
        border
        border-ocean-100
        bg-white/65
        p-4
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-[13px]
          bg-ocean-50
          text-ocean-600
        "
      >
        <Icon
          size={16}
        />
      </div>

      <div
        className="
          min-w-0
        "
      >
        <p
          className="
            text-[9px]
            font-bold
            uppercase
            tracking-[0.1em]
            text-ink-soft
          "
        >
          {label}
        </p>

        <p
          className="
            mt-1
            truncate
            text-sm
            font-semibold
            text-ocean-950
          "
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * ALERTS
 * =========================================================
 */

async function showWarning(
  title: string,
  message: string
) {
  await Swal.fire({
    icon:
      "warning",

    title,

    text:
      message,

    confirmButtonColor:
      "#1688b5",
  });
}

async function showError(
  title: string,
  message: string
) {
  await Swal.fire({
    icon:
      "error",

    title,

    text:
      message,

    confirmButtonColor:
      "#1688b5",
  });
}