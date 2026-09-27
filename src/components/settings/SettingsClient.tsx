// src/components/settings/SettingsClient.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Settings2,
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
 * STYLE
 * =========================================================
 */

const inputClass = `
  w-full
  rounded-[14px]
  border
  border-ocean-100
  bg-white/75
  px-4
  py-3
  text-sm
  text-ocean-950
  outline-none
  transition
  placeholder:text-ink-soft/45
  focus:border-ocean-300
  focus:bg-white
  focus:ring-4
  focus:ring-ocean-100/45
`;

const primaryButtonClass = `
  inline-flex
  items-center
  justify-center
  rounded-[13px]
  bg-ocean-950
  px-5
  py-3
  text-sm
  font-semibold
  text-white
  shadow-[0_8px_22px_rgba(6,42,63,0.12)]
  transition
  duration-200
  hover:bg-ocean-800
  active:scale-[0.98]
  disabled:pointer-events-none
  disabled:opacity-35
`;

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function SettingsClient({
  user,
  couple,
}: SettingsClientProps) {
  /*
   * =========================================================
   * COUPLE
   * =========================================================
   */

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
    savedCoupleName,
    setSavedCoupleName,
  ] =
    useState(
      couple?.name ??
      ""
    );

  const [
    savedAnniversaryDate,
    setSavedAnniversaryDate,
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

  /*
   * =========================================================
   * PASSWORD
   * =========================================================
   */

  const [
    currentPassword,
    setCurrentPassword,
  ] =
    useState("");

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
    showCurrentPassword,
    setShowCurrentPassword,
  ] =
    useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] =
    useState(false);

  const [
    isChangingPassword,
    setIsChangingPassword,
  ] =
    useState(false);

  /*
   * =========================================================
   * DERIVED
   * =========================================================
   */

  const displayName =
    user.nickname?.trim() ||
    user.fullName?.trim() ||
    "Account";

  const hasCoupleChanges =
    useMemo(() => {
      if (!couple) {
        return false;
      }

      return (
        coupleName.trim() !==
          savedCoupleName.trim() ||
        anniversaryDate !==
          savedAnniversaryDate
      );
    }, [
      couple,
      coupleName,
      anniversaryDate,
      savedCoupleName,
      savedAnniversaryDate,
    ]);

  const passwordReady =
    Boolean(
      currentPassword &&
      newPassword.length >=
        8 &&
      confirmPassword &&
      newPassword ===
        confirmPassword
    );

  const passwordStrength =
    useMemo(
      () =>
        getPasswordStrength(
          newPassword
        ),
      [newPassword]
    );

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

      if (
        !couple ||
        !hasCoupleChanges ||
        isSavingCouple
      ) {
        return;
      }

      const name =
        coupleName.trim();

      if (!name) {
        await showWarning(
          "Name required",
          "Space name cannot be empty."
        );

        return;
      }

      if (
        !anniversaryDate
      ) {
        await showWarning(
          "Date required",
          "Choose your anniversary date."
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
            .from(
              "couples"
            )
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
          throw new Error(
            error.message
          );
        }

        setCoupleName(
          name
        );

        setSavedCoupleName(
          name
        );

        setSavedAnniversaryDate(
          anniversaryDate
        );

        await showSuccess(
          "Our Space updated"
        );
      } catch (error) {
        await showError(
          "Settings could not be saved",

          error instanceof
            Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setIsSavingCouple(
          false
        );
      }
    };

  /*
   * =========================================================
   * RESET COUPLE
   * =========================================================
   */

  const handleResetCouple =
    () => {
      setCoupleName(
        savedCoupleName
      );

      setAnniversaryDate(
        savedAnniversaryDate
      );
    };

  /*
   * =========================================================
   * CHANGE PASSWORD
   * =========================================================
   */

  const handleChangePassword =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        isChangingPassword
      ) {
        return;
      }

      if (
        !currentPassword
      ) {
        await showWarning(
          "Current password required",
          "Enter your current password first."
        );

        return;
      }

      if (
        newPassword.length <
        8
      ) {
        await showWarning(
          "Password too short",
          "Use at least 8 characters."
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        await showWarning(
          "Passwords do not match",
          "Repeat the new password correctly."
        );

        return;
      }

      if (
        currentPassword ===
        newPassword
      ) {
        await showWarning(
          "Choose another password",
          "Your new password should be different from the current password."
        );

        return;
      }

      const confirmation =
        await Swal.fire({
          icon:
            "question",

          title:
            "Change password?",

          text:
            "You will use the new password the next time you sign in.",

          showCancelButton:
            true,

          confirmButtonText:
            "Change Password",

          cancelButtonText:
            "Cancel",

          confirmButtonColor:
            "#083b59",

          background:
            "#fffdf9",

          color:
            "#123d59",
        });

      if (
        !confirmation.isConfirmed
      ) {
        return;
      }

      setIsChangingPassword(
        true
      );

      try {
        const supabase =
          createClient();

        /*
         * Verify current password first.
         */

        const {
          error:
            signInError,
        } =
          await supabase.auth
            .signInWithPassword({
              email:
                user.email,

              password:
                currentPassword,
            });

        if (
          signInError
        ) {
          await showWarning(
            "Current password is incorrect",
            "Please check your current password and try again."
          );

          return;
        }

        /*
         * Change password.
         */

        const {
          error:
            updateError,
        } =
          await supabase.auth
            .updateUser({
              password:
                newPassword,
            });

        if (
          updateError
        ) {
          throw new Error(
            updateError.message
          );
        }

        setCurrentPassword(
          ""
        );

        setNewPassword(
          ""
        );

        setConfirmPassword(
          ""
        );

        setShowCurrentPassword(
          false
        );

        setShowNewPassword(
          false
        );

        await Swal.fire({
          icon:
            "success",

          title:
            "Password updated",

          text:
            "Use your new password the next time you sign in.",

          confirmButtonColor:
            "#083b59",

          background:
            "#fffdf9",

          color:
            "#123d59",
        });
      } catch (error) {
        await showError(
          "Password could not be updated",

          error instanceof
            Error
            ? error.message
            : "Something went wrong."
        );
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
        bg-[linear-gradient(145deg,#f5fbfd_0%,#fffdf9_52%,#f8f2e9_100%)]
      "
    >
      <AppSidebar
        user={
          user
        }
      />

      <MobileBottomNav />

      <main
        className="
          min-h-[100svh]
          px-4
          pb-28
          pt-6
          sm:px-6
          lg:ml-[290px]
          lg:px-8
          lg:pb-14
          lg:pt-9
          xl:px-10
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1380px]
          "
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <header
            className="
              flex
              items-end
              justify-between
              gap-5
            "
          >
            <div>
              <h1
                className="
                  font-display
                  text-[34px]
                  font-semibold
                  leading-none
                  tracking-[-0.035em]
                  text-ocean-950
                  sm:text-[40px]
                "
              >
                Settings
              </h1>

              <p
                className="
                  mt-3
                  text-xs
                  text-ink-soft
                "
              >
                Our Space and account security
              </p>
            </div>

            <Link
              href="/profile"
              className="
                group
                hidden
                items-center
                gap-3
                rounded-[15px]
                border
                border-ocean-100
                bg-white/70
                px-3
                py-2.5
                transition
                hover:bg-white
                sm:flex
              "
            >
              <MiniAvatar
                name={
                  displayName
                }
                avatarUrl={
                  user.avatarUrl
                }
              />

              <div
                className="
                  min-w-0
                  text-left
                "
              >
                <p
                  className="
                    max-w-[140px]
                    truncate
                    text-xs
                    font-semibold
                    text-ocean-950
                  "
                >
                  {displayName}
                </p>

                <p
                  className="
                    mt-0.5
                    text-[9px]
                    text-ink-soft
                  "
                >
                  Profile
                </p>
              </div>

              <ArrowRight
                size={13}
                className="
                  text-ocean-300
                  transition-transform
                  group-hover:translate-x-0.5
                  group-hover:text-ocean-700
                "
              />
            </Link>
          </header>

          {/* =================================================
              OVERVIEW
          ================================================= */}

          <section
            className="
              relative
              mt-8
              overflow-hidden
              rounded-[30px]
              bg-ocean-950
              px-6
              py-7
              text-white
              shadow-[0_22px_60px_rgba(6,42,63,0.11)]
              sm:px-8
              sm:py-8
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                -right-24
                -top-28
                h-72
                w-72
                rounded-full
                bg-ocean-400/10
                blur-[85px]
              "
            />

            <div
              className="
                relative
                z-10
                grid
                gap-7
                lg:grid-cols-[1fr_auto]
                lg:items-end
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-medium
                    text-white/40
                  "
                >
                  Our Space
                </p>

                <h2
                  className="
                    mt-3
                    max-w-3xl
                    font-display
                    text-[35px]
                    font-semibold
                    leading-[1.05]
                    tracking-[-0.04em]
                    sm:text-[44px]
                  "
                >
                  {couple?.name ||
                    "Love4ever"}
                </h2>

                {couple && (
                  <p
                    className="
                      mt-4
                      text-sm
                      text-white/45
                    "
                  >
                    Since{" "}
                    {formatDateOnly(
                      savedAnniversaryDate
                    )}
                  </p>
                )}
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-white/35
                "
              >
                <span
                  className="
                    h-[6px]
                    w-[6px]
                    rounded-full
                    bg-emerald-400
                  "
                />

                Private workspace
              </div>
            </div>
          </section>

          {/* =================================================
              SETTINGS GRID
          ================================================= */}

          <section
            className="
              mt-5
              grid
              gap-5
              xl:grid-cols-[1fr_0.95fr]
            "
          >
            {/* =================================================
                OUR SPACE
            ================================================= */}

            <form
              onSubmit={
                handleSaveCouple
              }
              className="
                overflow-hidden
                rounded-[28px]
                border
                border-ocean-100/70
                bg-white/80
                shadow-[0_14px_45px_rgba(8,59,89,0.04)]
                backdrop-blur-xl
              "
            >
              <SectionHeader
                title="Our Space"
                description="Shared relationship details used across Love4ever."
              />

              <div
                className="
                  p-6
                  sm:p-8
                "
              >
                {couple ? (
                  <>
                    <div
                      className="
                        grid
                        gap-5
                      "
                    >
                      <Field
                        label="Space Name"
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
                              event.target
                                .value
                            )
                          }
                          className={
                            inputClass
                          }
                        />
                      </Field>

                      <Field
                        label="Anniversary"
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
                              event.target
                                .value
                            )
                          }
                          className={
                            inputClass
                          }
                        />
                      </Field>
                    </div>

                    {/* ANNIVERSARY PREVIEW */}

                    <div
                      className="
                        mt-6
                        overflow-hidden
                        rounded-[20px]
                        border
                        border-ocean-100/70
                        bg-ocean-50/45
                      "
                    >
                      <div
                        className="
                          grid
                          sm:grid-cols-2
                        "
                      >
                        <PreviewValue
                          label="Space"
                          value={
                            coupleName.trim() ||
                            "—"
                          }
                        />

                        <PreviewValue
                          label="Anniversary"
                          value={
                            anniversaryDate
                              ? formatDateOnly(
                                  anniversaryDate
                                )
                              : "—"
                          }
                        />
                      </div>
                    </div>

                    {/* ACTION */}

                    <div
                      className="
                        mt-7
                        flex
                        items-center
                        justify-end
                        gap-4
                      "
                    >
                      {hasCoupleChanges && (
                        <button
                          type="button"
                          onClick={
                            handleResetCouple
                          }
                          disabled={
                            isSavingCouple
                          }
                          className="
                            text-xs
                            font-semibold
                            text-ink-soft
                            transition
                            hover:text-ocean-900
                            disabled:opacity-40
                          "
                        >
                          Reset
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={
                          isSavingCouple ||
                          !hasCoupleChanges
                        }
                        className={
                          primaryButtonClass
                        }
                      >
                        {isSavingCouple
                          ? "Saving..."
                          : hasCoupleChanges
                            ? "Save Changes"
                            : "Saved"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    className="
                      flex
                      min-h-[260px]
                      items-center
                      justify-center
                      text-center
                    "
                  >
                    <div>
                      <p
                        className="
                          font-display
                          text-2xl
                          font-semibold
                          text-ocean-950
                        "
                      >
                        No shared space
                      </p>

                      <p
                        className="
                          mt-2
                          text-sm
                          text-ink-soft
                        "
                      >
                        This account is not connected to a couple workspace.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </form>

            {/* =================================================
                SECURITY
            ================================================= */}

            <form
              onSubmit={
                handleChangePassword
              }
              className="
                overflow-hidden
                rounded-[28px]
                border
                border-ocean-100/70
                bg-white/80
                shadow-[0_14px_45px_rgba(8,59,89,0.04)]
                backdrop-blur-xl
              "
            >
              <SectionHeader
                title="Password"
                description="Update the password used to access this account."
              />

              <div
                className="
                  p-6
                  sm:p-8
                "
              >
                <div
                  className="
                    grid
                    gap-5
                  "
                >
                  {/* CURRENT PASSWORD */}

                  <Field
                    label="Current Password"
                  >
                    <PasswordInput
                      value={
                        currentPassword
                      }
                      onChange={
                        setCurrentPassword
                      }
                      visible={
                        showCurrentPassword
                      }
                      onToggleVisibility={() =>
                        setShowCurrentPassword(
                          (current) =>
                            !current
                        )
                      }
                      autoComplete="current-password"
                      placeholder="Current password"
                    />
                  </Field>

                  {/* NEW PASSWORD */}

                  <Field
                    label="New Password"
                  >
                    <PasswordInput
                      value={
                        newPassword
                      }
                      onChange={
                        setNewPassword
                      }
                      visible={
                        showNewPassword
                      }
                      onToggleVisibility={() =>
                        setShowNewPassword(
                          (current) =>
                            !current
                        )
                      }
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                    />
                  </Field>

                  {/* CONFIRM */}

                  <Field
                    label="Confirm Password"
                  >
                    <PasswordInput
                      value={
                        confirmPassword
                      }
                      onChange={
                        setConfirmPassword
                      }
                      visible={
                        showNewPassword
                      }
                      onToggleVisibility={() =>
                        setShowNewPassword(
                          (current) =>
                            !current
                        )
                      }
                      autoComplete="new-password"
                      placeholder="Repeat new password"
                    />
                  </Field>
                </div>

                {/* PASSWORD STATUS */}

                {newPassword && (
                  <div
                    className="
                      mt-6
                      rounded-[18px]
                      border
                      border-ocean-100/70
                      bg-ocean-50/45
                      p-4
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-4
                      "
                    >
                      <p
                        className="
                          text-xs
                          font-semibold
                          text-ocean-950
                        "
                      >
                        Password strength
                      </p>

                      <p
                        className={`
                          text-xs
                          font-semibold
                          ${passwordStrength.className}
                        `}
                      >
                        {
                          passwordStrength.label
                        }
                      </p>
                    </div>

                    <div
                      className="
                        mt-3
                        grid
                        grid-cols-4
                        gap-1.5
                      "
                    >
                      {Array.from({
                        length:
                          4,
                      }).map(
                        (
                          _,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                            className={`
                              h-[4px]
                              rounded-full

                              ${
                                index <
                                passwordStrength.level
                                  ? passwordStrength.barClassName
                                  : "bg-ocean-100"
                              }
                            `}
                          />
                        )
                      )}
                    </div>

                    <div
                      className="
                        mt-4
                        space-y-2
                      "
                    >
                      <Requirement
                        valid={
                          newPassword.length >=
                          8
                        }
                      >
                        At least 8 characters
                      </Requirement>

                      <Requirement
                        valid={
                          Boolean(
                            confirmPassword
                          ) &&
                          newPassword ===
                            confirmPassword
                        }
                      >
                        Passwords match
                      </Requirement>
                    </div>
                  </div>
                )}

                {/* ACTION */}

                <div
                  className="
                    mt-7
                    flex
                    justify-end
                  "
                >
                  <button
                    type="submit"
                    disabled={
                      isChangingPassword ||
                      !passwordReady
                    }
                    className={
                      primaryButtonClass
                    }
                  >
                    {isChangingPassword
                      ? "Updating..."
                      : "Change Password"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* =================================================
              ACCOUNT
          ================================================= */}

          <section
            className="
              mt-5
              overflow-hidden
              rounded-[28px]
              border
              border-ocean-100/70
              bg-white/80
              shadow-[0_14px_45px_rgba(8,59,89,0.04)]
              backdrop-blur-xl
            "
          >
            <div
              className="
                grid
                lg:grid-cols-[1fr_auto]
                lg:items-center
              "
            >
              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-4
                  p-6
                  sm:p-7
                "
              >
                <MiniAvatar
                  large
                  name={
                    displayName
                  }
                  avatarUrl={
                    user.avatarUrl
                  }
                />

                <div
                  className="
                    min-w-0
                  "
                >
                  <h2
                    className="
                      truncate
                      font-display
                      text-[24px]
                      font-semibold
                      tracking-[-0.025em]
                      text-ocean-950
                    "
                  >
                    {displayName}
                  </h2>

                  <p
                    className="
                      mt-1
                      truncate
                      text-xs
                      text-ink-soft
                    "
                  >
                    {user.email}
                  </p>
                </div>
              </div>

              <div
                className="
                  border-t
                  border-ocean-100/70
                  p-5
                  lg:border-l
                  lg:border-t-0
                  lg:p-6
                "
              >
                <Link
                  href="/profile"
                  style={{
                    color:
                      "#ffffff",
                  }}
                  className="
                    group
                    inline-flex
                    w-full
                    items-center
                    justify-center
                    gap-3
                    rounded-[13px]
                    bg-ocean-950
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    transition
                    hover:bg-ocean-800
                    lg:w-auto
                  "
                >
                  Open Profile

                  <ArrowRight
                    size={14}
                    className="
                      transition-transform
                      group-hover:translate-x-0.5
                    "
                  />
                </Link>
              </div>
            </div>
          </section>

          {/* =================================================
              SECURITY NOTE
          ================================================= */}

          <section
            className="
              mt-5
              flex
              items-start
              gap-4
              rounded-[22px]
              border
              border-ocean-100/60
              bg-ocean-50/40
              px-5
              py-4
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-[11px]
                bg-white
                text-ocean-800
                shadow-[0_5px_16px_rgba(8,59,89,0.05)]
              "
            >
              <LockKeyhole
                size={15}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <p
                className="
                  text-xs
                  font-semibold
                  text-ocean-950
                "
              >
                Private by membership
              </p>

              <p
                className="
                  mt-1
                  max-w-3xl
                  text-[11px]
                  leading-5
                  text-ink-soft
                "
              >
                Shared Love4ever data is accessed through the couple membership attached to your account.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/*
 * =========================================================
 * SECTION HEADER
 * =========================================================
 */

function SectionHeader({
  title,
  description,
}: {
  title:
    string;

  description:
    string;
}) {
  return (
    <div
      className="
        border-b
        border-ocean-100/70
        px-6
        py-5
        sm:px-8
      "
    >
      <h2
        className="
          font-display
          text-[25px]
          font-semibold
          tracking-[-0.025em]
          text-ocean-950
        "
      >
        {title}
      </h2>

      <p
        className="
          mt-1.5
          max-w-md
          text-xs
          leading-5
          text-ink-soft
        "
      >
        {description}
      </p>
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
  children,
}: {
  label:
    string;

  children:
    ReactNode;
}) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-xs
          font-medium
          text-ocean-900
        "
      >
        {label}
      </label>

      {children}
    </div>
  );
}

/*
 * =========================================================
 * PASSWORD INPUT
 * =========================================================
 */

function PasswordInput({
  value,
  onChange,
  visible,
  onToggleVisibility,
  autoComplete,
  placeholder,
}: {
  value:
    string;

  onChange: (
    value:
      string
  ) => void;

  visible:
    boolean;

  onToggleVisibility:
    () => void;

  autoComplete:
    string;

  placeholder:
    string;
}) {
  return (
    <div
      className="
        relative
      "
    >
      <input
        type={
          visible
            ? "text"
            : "password"
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        autoComplete={
          autoComplete
        }
        placeholder={
          placeholder
        }
        className={`
          ${inputClass}
          pr-12
        `}
      />

      <button
        type="button"
        onClick={
          onToggleVisibility
        }
        aria-label={
          visible
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
          text-ink-soft
          transition
          hover:bg-ocean-50
          hover:text-ocean-900
        "
      >
        {visible ? (
          <EyeOff
            size={15}
          />
        ) : (
          <Eye
            size={15}
          />
        )}
      </button>
    </div>
  );
}

/*
 * =========================================================
 * PASSWORD REQUIREMENT
 * =========================================================
 */

function Requirement({
  valid,
  children,
}: {
  valid:
    boolean;

  children:
    ReactNode;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-2
      "
    >
      <span
        className={`
          flex
          h-[17px]
          w-[17px]
          items-center
          justify-center
          rounded-full
          transition

          ${
            valid
              ? "bg-ocean-900 text-white"
              : "border border-ocean-200 bg-white text-transparent"
          }
        `}
      >
        <Check
          size={10}
          strokeWidth={2.5}
        />
      </span>

      <span
        className={`
          text-[10px]

          ${
            valid
              ? "font-medium text-ocean-800"
              : "text-ink-soft/65"
          }
        `}
      >
        {children}
      </span>
    </div>
  );
}

/*
 * =========================================================
 * PREVIEW
 * =========================================================
 */

function PreviewValue({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div
      className="
        border-b
        border-ocean-100/70
        px-4
        py-4
        last:border-b-0
        sm:border-b-0
        sm:border-r
        sm:last:border-r-0
      "
    >
      <p
        className="
          text-[9px]
          font-medium
          text-ink-soft
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1.5
          break-words
          text-sm
          font-semibold
          text-ocean-950
        "
      >
        {value}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * AVATAR
 * =========================================================
 */

function MiniAvatar({
  name,
  avatarUrl,
  large = false,
}: {
  name:
    string;

  avatarUrl:
    | string
    | null;

  large?:
    boolean;
}) {
  const size =
    large
      ? "h-14 w-14 rounded-[17px]"
      : "h-9 w-9 rounded-[11px]";

  return (
    <div
      className={`
        relative
        flex
        shrink-0
        items-center
        justify-center
        overflow-hidden
        bg-ocean-950
        font-display
        font-semibold
        text-white
        ${size}
      `}
    >
      {avatarUrl ? (
        <Image
          src={
            avatarUrl
          }
          alt={
            name
          }
          fill
          unoptimized
          className="
            object-cover
          "
        />
      ) : (
        <span
          className={
            large
              ? "text-lg"
              : "text-xs"
          }
        >
          {getInitials(
            name
          )}
        </span>
      )}
    </div>
  );
}

/*
 * =========================================================
 * PASSWORD STRENGTH
 * =========================================================
 */

function getPasswordStrength(
  password:
    string
) {
  if (!password) {
    return {
      level:
        0,

      label:
        "",

      className:
        "text-ink-soft",

      barClassName:
        "bg-ocean-200",
    };
  }

  let score =
    0;

  if (
    password.length >=
    8
  ) {
    score += 1;
  }

  if (
    password.length >=
    12
  ) {
    score += 1;
  }

  if (
    /[a-z]/i.test(
      password
    ) &&
    /\d/.test(
      password
    )
  ) {
    score += 1;
  }

  if (
    /[^a-zA-Z0-9]/.test(
      password
    )
  ) {
    score += 1;
  }

  if (
    score <= 1
  ) {
    return {
      level:
        1,

      label:
        "Weak",

      className:
        "text-heart",

      barClassName:
        "bg-heart",
    };
  }

  if (
    score === 2
  ) {
    return {
      level:
        2,

      label:
        "Fair",

      className:
        "text-amber-600",

      barClassName:
        "bg-amber-400",
    };
  }

  if (
    score === 3
  ) {
    return {
      level:
        3,

      label:
        "Good",

      className:
        "text-ocean-600",

      barClassName:
        "bg-ocean-500",
    };
  }

  return {
    level:
      4,

    label:
      "Strong",

    className:
      "text-emerald-700",

    barClassName:
      "bg-emerald-500",
  };
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getInitials(
  value:
    string
) {
  if (
    !value.trim()
  ) {
    return "?";
  }

  return value
    .trim()
    .split(
      /\s+/
    )
    .slice(
      0,
      2
    )
    .map(
      (part) =>
        part.charAt(
          0
        )
    )
    .join("")
    .toUpperCase();
}

function formatDateOnly(
  value:
    string
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    new Date(
      `${value}T00:00:00`
    )
  );
}

/*
 * =========================================================
 * ALERTS
 * =========================================================
 */

async function showSuccess(
  title:
    string
) {
  await Swal.fire({
    icon:
      "success",

    title,

    timer:
      950,

    showConfirmButton:
      false,

    background:
      "#fffdf9",

    color:
      "#123d59",
  });
}

async function showWarning(
  title:
    string,

  message:
    string
) {
  await Swal.fire({
    icon:
      "warning",

    title,

    text:
      message,

    confirmButtonColor:
      "#083b59",

    background:
      "#fffdf9",

    color:
      "#123d59",
  });
}

async function showError(
  title:
    string,

  message:
    string
) {
  await Swal.fire({
    icon:
      "error",

    title,

    text:
      message,

    confirmButtonColor:
      "#083b59",

    background:
      "#fffdf9",

    color:
      "#123d59",
  });
}