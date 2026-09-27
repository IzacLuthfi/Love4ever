// src/components/profile/ProfileClient.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Camera,
  Settings,
} from "lucide-react";

import Swal from "sweetalert2";

import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

import { createClient } from "@/lib/supabase/client";
import {
  IMAGE_ACCEPT,
  normalizeImageFile,
} from "@/utils/image";
/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type ProfileUser = {
  id: string;
  email: string;
};

type ProfileData = {
  fullName: string;
  nickname: string;

  avatarUrl:
    | string
    | null;

  bio: string;

  createdAt: string;
};

type CoupleData = {
  id: string;

  name: string;

  anniversaryDate: string;
};

type ProfileStats = {
  plans: number;
  memories: number;
  photos: number;
  notes: number;
};

type ProfileClientProps = {
  user: ProfileUser;

  initialProfile:
    ProfileData;

  couple:
    | CoupleData
    | null;

  stats:
    ProfileStats;
};

/*
 * =========================================================
 * STYLES
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

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function ProfileClient({
  user,
  initialProfile,
  couple,
  stats,
}: ProfileClientProps) {
  /*
   * =========================================================
   * PROFILE STATE
   * =========================================================
   */

  const [
    profile,
    setProfile,
  ] =
    useState<ProfileData>(
      initialProfile
    );

  const [
    fullName,
    setFullName,
  ] =
    useState(
      initialProfile.fullName
    );

  const [
    nickname,
    setNickname,
  ] =
    useState(
      initialProfile.nickname
    );

  const [
    bio,
    setBio,
  ] =
    useState(
      initialProfile.bio
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    isUploading,
    setIsUploading,
  ] =
    useState(false);

  /*
   * =========================================================
   * DERIVED
   * =========================================================
   */

  const displayName =
    profile.nickname?.trim() ||
    profile.fullName?.trim() ||
    "Profile";

  const hasChanges =
    useMemo(() => {
      return (
        fullName.trim() !==
          profile.fullName.trim() ||
        nickname.trim() !==
          profile.nickname.trim() ||
        bio.trim() !==
          profile.bio.trim()
      );
    }, [
      fullName,
      nickname,
      bio,
      profile,
    ]);

  const sidebarUser = {
    email:
      user.email,

    fullName:
      profile.fullName,

    nickname:
      profile.nickname ||
      profile.fullName ||
      "Profile",

    avatarUrl:
      profile.avatarUrl,
  };

  /*
   * =========================================================
   * SAVE PROFILE
   * =========================================================
   */

  const handleSave =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        isSaving ||
        !hasChanges
      ) {
        return;
      }

      const cleanName =
        fullName.trim();

      const cleanNickname =
        nickname.trim();

      const cleanBio =
        bio.trim();

      if (
        !cleanName
      ) {
        await showWarning(
          "Name required",
          "Full name cannot be empty."
        );

        return;
      }

      setIsSaving(
        true
      );

      try {
        const supabase =
          createClient();

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "profiles"
            )
            .update({
              full_name:
                cleanName,

              nickname:
                cleanNickname ||
                null,

              bio:
                cleanBio ||
                null,
            })
            .eq(
              "id",
              user.id
            )
            .select()
            .single();

        if (error) {
          throw new Error(
            error.message
          );
        }

        const nextProfile:
          ProfileData = {
          ...profile,

          fullName:
            data.full_name ??
            "",

          nickname:
            data.nickname ??
            "",

          bio:
            data.bio ??
            "",
        };

        setProfile(
          nextProfile
        );

        setFullName(
          nextProfile.fullName
        );

        setNickname(
          nextProfile.nickname
        );

        setBio(
          nextProfile.bio
        );

        await showSuccess(
          "Profile updated"
        );
      } catch (error) {
        await showError(
          "Profile could not be saved",

          error instanceof
            Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };

  /*
   * =========================================================
   * AVATAR UPLOAD
   * =========================================================
   */

  const handleAvatarUpload =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const rawFile =
  event.target.files?.[0];

if (!rawFile) {
  return;
}

setIsUploading(
  true
);

let file:
  File;

try {
  file =
    await normalizeImageFile(
      rawFile,
      {
        maxSizeMB:
          8,

        heicQuality:
          0.88,
      }
    );
} catch (error) {
  await showError(
    "Image could not be used",

    error instanceof
      Error
      ? error.message
      : "Invalid image."
  );

  setIsUploading(
    false
  );

  event.target.value =
    "";

  return;
}

      const supabase =
        createClient();

      let newPath:
        | string
        | null =
        null;

      try {
        const extension =
          getExtension(
            file.name,
            "jpg"
          );

        newPath =
          `${user.id}/avatar-${Date.now()}.${extension}`;

        /*
         * Upload new avatar.
         */

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              "profile-avatars"
            )
            .upload(
              newPath,
              file,
              {
                upsert:
                  false,

                cacheControl:
                  "3600",

                contentType:
                  file.type,
              }
            );

        if (
          uploadError
        ) {
          throw new Error(
            uploadError.message
          );
        }

        /*
         * Current project uses public avatar URLs.
         */

        const {
          data:
            publicUrlData,
        } =
          supabase.storage
            .from(
              "profile-avatars"
            )
            .getPublicUrl(
              newPath
            );

        const newUrl =
          publicUrlData.publicUrl;

        /*
         * Save URL.
         */

        const {
          error:
            profileError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .update({
              avatar_url:
                newUrl,
            })
            .eq(
              "id",
              user.id
            );

        if (
          profileError
        ) {
          await supabase.storage
            .from(
              "profile-avatars"
            )
            .remove([
              newPath,
            ]);

          throw new Error(
            profileError.message
          );
        }

        const oldAvatarUrl =
          profile.avatarUrl;

        setProfile(
          (current) => ({
            ...current,

            avatarUrl:
              newUrl,
          })
        );

        /*
         * Remove previous avatar.
         */

        const oldPath =
          extractAvatarStoragePath(
            oldAvatarUrl
          );

        if (
          oldPath &&
          oldPath !==
            newPath
        ) {
          const {
            error:
              cleanupError,
          } =
            await supabase.storage
              .from(
                "profile-avatars"
              )
              .remove([
                oldPath,
              ]);

          if (
            cleanupError
          ) {
            console.error(
              "Avatar cleanup:",
              cleanupError
            );
          }
        }

        await showSuccess(
          "Avatar updated"
        );
      } catch (error) {
        /*
         * Remove newly uploaded file
         * if something failed later.
         */

        if (
          newPath
        ) {
          await supabase.storage
            .from(
              "profile-avatars"
            )
            .remove([
              newPath,
            ]);
        }

        await showError(
          "Avatar could not be updated",

          error instanceof
            Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setIsUploading(
          false
        );

        event.target.value =
          "";
      }
    };

  /*
   * =========================================================
   * RESET FORM
   * =========================================================
   */

  const handleReset =
    () => {
      setFullName(
        profile.fullName
      );

      setNickname(
        profile.nickname
      );

      setBio(
        profile.bio
      );
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
          sidebarUser
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
              Profile
            </h1>

            <Link
              href="/settings"
              className="
                group
                inline-flex
                items-center
                gap-2
                rounded-[13px]
                border
                border-ocean-100
                bg-white/70
                px-4
                py-2.5
                text-sm
                font-semibold
                text-ocean-800
                transition
                hover:bg-white
              "
            >
              <Settings
                size={14}
                strokeWidth={1.8}
              />

              Settings

              <ArrowRight
                size={13}
                className="
                  transition-transform
                  group-hover:translate-x-0.5
                "
              />
            </Link>
          </header>

          {/* =================================================
              PROFILE HERO
          ================================================= */}

          <section
            className="
              relative
              mt-8
              overflow-hidden
              rounded-[32px]
              bg-ocean-950
              text-white
              shadow-[0_24px_65px_rgba(6,42,63,0.12)]
            "
          >
            {/* DECORATION */}

            <div
              className="
                pointer-events-none
                absolute
                -right-24
                -top-28
                h-80
                w-80
                rounded-full
                bg-ocean-400/10
                blur-[90px]
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                -bottom-36
                left-[18%]
                h-72
                w-72
                rounded-full
                bg-white/[0.05]
                blur-[90px]
              "
            />

            {/* PROFILE */}

            <div
              className="
                relative
                z-10
                flex
                flex-col
                gap-6
                p-6
                sm:flex-row
                sm:items-center
                sm:p-8
                lg:p-10
              "
            >
              {/* AVATAR */}

              <div
                className="
                  relative
                  h-28
                  w-28
                  shrink-0
                  sm:h-32
                  sm:w-32
                "
              >
                <div
                  className="
                    relative
                    h-full
                    w-full
                    overflow-hidden
                    rounded-[30px]
                    border
                    border-white/15
                    bg-white/10
                    shadow-[0_18px_40px_rgba(0,0,0,0.16)]
                  "
                >
                  {profile.avatarUrl ? (
                    <Image
                      src={
                        profile.avatarUrl
                      }
                      alt={
                        displayName
                      }
                      fill
                      unoptimized
                      priority
                      className="
                        object-cover
                      "
                    />
                  ) : (
                    <div
                      className="
                        flex
                        h-full
                        w-full
                        items-center
                        justify-center
                        bg-[linear-gradient(145deg,#0b4f71,#1688b5)]
                        font-display
                        text-[34px]
                        font-semibold
                        text-white
                      "
                    >
                      {getInitials(
                        profile.fullName ||
                        profile.nickname
                      )}
                    </div>
                  )}
                </div>

                {/* CAMERA */}

                <label
                  className="
                    absolute
                    -bottom-2
                    -right-2
                    flex
                    h-10
                    w-10
                    cursor-pointer
                    items-center
                    justify-center
                    rounded-[13px]
                    border
                    border-white/20
                    bg-white
                    text-ocean-950
                    shadow-[0_8px_24px_rgba(0,0,0,0.18)]
                    transition
                    hover:scale-[1.03]
                    active:scale-[0.97]
                  "
                  aria-label="Change avatar"
                >
                  <Camera
                    size={15}
                    strokeWidth={1.8}
                  />

                  <input
  type="file"
  accept={
    IMAGE_ACCEPT
  }
  disabled={
    isUploading
  }
  onChange={
    handleAvatarUpload
  }
  className="hidden"
/>
                </label>
              </div>

              {/* IDENTITY */}

              <div
                className="
                  min-w-0
                  flex-1
                "
              >
                <p
                  className="
                    text-xs
                    font-medium
                    text-white/40
                  "
                >
                  {isUploading
                    ? "Updating photo..."
                    : profile.fullName}
                </p>

                <h2
                  className="
                    mt-2
                    break-words
                    font-display
                    text-[42px]
                    font-semibold
                    leading-none
                    tracking-[-0.045em]
                    sm:text-[50px]
                    lg:text-[58px]
                  "
                >
                  {displayName}
                </h2>

                {profile.bio && (
                  <p
                    className="
                      mt-5
                      max-w-2xl
                      whitespace-pre-line
                      text-sm
                      leading-7
                      text-white/55
                    "
                  >
                    {profile.bio}
                  </p>
                )}

                {couple && (
                  <div
                    className="
                      mt-5
                      flex
                      flex-wrap
                      items-center
                      gap-x-2
                      gap-y-1
                      text-xs
                      text-white/40
                    "
                  >
                    <span>
                      {couple.name}
                    </span>

                    <MetaDot />

                    <span>
                      Since{" "}
                      {formatDateOnly(
                        couple.anniversaryDate
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* STATS */}

            <div
              className="
                relative
                z-10
                grid
                grid-cols-2
                border-t
                border-white/10
                sm:grid-cols-4
              "
            >
              <HeroStat
                value={
                  stats.plans
                }
                label="Plans"
              />

              <HeroStat
                value={
                  stats.memories
                }
                label="Memories"
              />

              <HeroStat
                value={
                  stats.photos
                }
                label="Photos"
              />

              <HeroStat
                value={
                  stats.notes
                }
                label="Notes"
              />
            </div>
          </section>

          {/* =================================================
              CONTENT
          ================================================= */}

          <section
            className="
              mt-5
              grid
              gap-5
              xl:grid-cols-[1.15fr_0.55fr]
            "
          >
            {/* =================================================
                PROFILE FORM
            ================================================= */}

            <form
              onSubmit={
                handleSave
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
              {/* FORM HEADER */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  border-b
                  border-ocean-100/70
                  px-6
                  py-5
                  sm:px-8
                "
              >
                <div>
                  <h2
                    className="
                      font-display
                      text-[25px]
                      font-semibold
                      tracking-[-0.025em]
                      text-ocean-950
                    "
                  >
                    Profile Details
                  </h2>

                  {hasChanges && (
                    <p
                      className="
                        mt-1
                        text-[10px]
                        text-ocean-600
                      "
                    >
                      Unsaved changes
                    </p>
                  )}
                </div>

                {hasChanges && (
                  <button
                    type="button"
                    onClick={
                      handleReset
                    }
                    disabled={
                      isSaving
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
              </div>

              {/* FIELDS */}

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
                  <div
                    className="
                      grid
                      gap-5
                      sm:grid-cols-2
                    "
                  >
                    <Field
                      label="Full Name"
                    >
                      <input
                        type="text"
                        value={
                          fullName
                        }
                        onChange={(
                          event
                        ) =>
                          setFullName(
                            event.target
                              .value
                          )
                        }
                        autoComplete="name"
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <Field
                      label="Nickname"
                    >
                      <input
                        type="text"
                        value={
                          nickname
                        }
                        onChange={(
                          event
                        ) =>
                          setNickname(
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

                  <Field
                    label="Bio"
                  >
                    <textarea
                      value={
                        bio
                      }
                      onChange={(
                        event
                      ) =>
                        setBio(
                          event.target
                            .value
                        )
                      }
                      rows={6}
                      placeholder="Write something about yourself..."
                      className={`
                        ${inputClass}
                        resize-none
                        leading-7
                      `}
                    />
                  </Field>

                  <Field
                    label="Email"
                  >
                    <input
                      type="email"
                      value={
                        user.email
                      }
                      disabled
                      className="
                        w-full
                        cursor-not-allowed
                        rounded-[14px]
                        border
                        border-ocean-100
                        bg-ocean-50/45
                        px-4
                        py-3
                        text-sm
                        text-ink-soft
                        outline-none
                      "
                    />
                  </Field>
                </div>

                {/* SAVE */}

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
                      isSaving ||
                      !hasChanges
                    }
                    className="
                      inline-flex
                      min-w-[130px]
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
                      hover:bg-ocean-800
                      active:scale-[0.98]
                      disabled:pointer-events-none
                      disabled:opacity-35
                    "
                  >
                    {isSaving
                      ? "Saving..."
                      : hasChanges
                        ? "Save Changes"
                        : "Saved"}
                  </button>
                </div>
              </div>
            </form>

            {/* =================================================
                ACCOUNT
            ================================================= */}

            <aside
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
              <div
                className="
                  border-b
                  border-ocean-100/70
                  px-6
                  py-5
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
                  Account
                </h2>
              </div>

              <div
                className="
                  p-6
                "
              >
                <div
                  className="
                    divide-y
                    divide-ocean-100/80
                  "
                >
                  <AccountRow
                    label="Member Since"
                    value={formatDate(
                      profile.createdAt
                    )}
                  />

                  {couple && (
                    <>
                      <AccountRow
                        label="Space"
                        value={
                          couple.name
                        }
                      />

                      <AccountRow
                        label="Anniversary"
                        value={formatDateOnly(
                          couple.anniversaryDate
                        )}
                      />
                    </>
                  )}

                  <AccountRow
                    label="Email"
                    value={
                      user.email
                    }
                  />
                </div>

                <Link
                  href="/settings"
                  className="
                    group
                    mt-7
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-[14px]
                    bg-ocean-950
                    px-5
                    py-3.5
                    text-sm
                    font-semibold
                    text-white
                    shadow-[0_8px_22px_rgba(6,42,63,0.11)]
                    transition
                    hover:bg-ocean-800
                  "
                  style={{
                    color:
                      "#ffffff",
                  }}
                >
                  Settings

                  <ArrowRight
                    size={14}
                    className="
                      transition-transform
                      group-hover:translate-x-0.5
                    "
                  />
                </Link>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}

/*
 * =========================================================
 * HERO STAT
 * =========================================================
 */

function HeroStat({
  value,
  label,
}: {
  value:
    number;

  label:
    string;
}) {
  return (
    <div
      className="
        border-b
        border-r
        border-white/10
        px-6
        py-5
        even:border-r-0
        sm:border-b-0
        sm:even:border-r
        sm:last:border-r-0
      "
    >
      <p
        className="
          font-display
          text-[27px]
          font-semibold
          leading-none
          tracking-[-0.035em]
          text-white
        "
      >
        {value}
      </p>

      <p
        className="
          mt-2
          text-[10px]
          font-medium
          text-white/35
        "
      >
        {label}
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
 * ACCOUNT ROW
 * =========================================================
 */

function AccountRow({
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
        py-4
        first:pt-0
        last:pb-0
      "
    >
      <p
        className="
          text-[10px]
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
 * DECORATION
 * =========================================================
 */

function MetaDot() {
  return (
    <span
      className="
        h-[3px]
        w-[3px]
        rounded-full
        bg-white/25
      "
    />
  );
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

function getExtension(
  fileName:
    string,

  fallback:
    string
) {
  const extension =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      );

  return (
    extension ||
    fallback
  );
}

function extractAvatarStoragePath(
  value:
    string | null
) {
  if (!value) {
    return null;
  }

  const marker =
    "/storage/v1/object/public/profile-avatars/";

  const index =
    value.indexOf(
      marker
    );

  if (
    index === -1
  ) {
    return null;
  }

  return decodeURIComponent(
    value.slice(
      index +
      marker.length
    )
  );
}

function formatDate(
  value:
    string
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone:
        "Asia/Jakarta",

      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    new Date(
      value
    )
  );
}

function formatDateOnly(
  value:
    string
) {
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
      900,

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