// src/components/profile/ProfileClient.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

import {
  type ChangeEvent,
  type ElementType,
  type FormEvent,
  useState,
} from "react";

import {
  CalendarDays,
  Camera,
  ChevronLeft,
  Heart,
  Images,
  NotebookPen,
  Save,
  Settings,
  Sparkles,
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
 * COMPONENT
 * =========================================================
 */

export default function ProfileClient({
  user,
  initialProfile,
  couple,
  stats,
}: ProfileClientProps) {
  const [
    profile,
    setProfile,
  ] =
    useState(
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
   * SIDEBAR USER
   * =========================================================
   */

  const sidebarUser = {
    id:
      user.id,

    email:
      user.email,

    fullName:
      profile.fullName,

    nickname:
      profile.nickname ||
      profile.fullName ||
      "Love",

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

      const cleanName =
        fullName.trim();

      const cleanNickname =
        nickname.trim();

      if (
        !cleanName
      ) {
        await showWarning(
          "Nama belum diisi",
          "Full name wajib diisi."
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
            .from("profiles")
            .update({
              full_name:
                cleanName,

              nickname:
                cleanNickname ||
                null,

              bio:
                bio.trim() ||
                null,
            })
            .eq(
              "id",
              user.id
            )
            .select()
            .single();

        if (error) {
          await showError(
            "Profile gagal disimpan",
            error.message
          );

          return;
        }

        setProfile(
          (current) => ({
            ...current,

            fullName:
              data.full_name ??
              "",

            nickname:
              data.nickname ??
              "",

            bio:
              data.bio ??
              "",
          })
        );

        setFullName(
          data.full_name ??
          ""
        );

        setNickname(
          data.nickname ??
          ""
        );

        setBio(
          data.bio ??
          ""
        );

        await Swal.fire({
          icon:
            "success",

          title:
            "Profile diperbarui",

          timer:
            1000,

          showConfirmButton:
            false,
        });
      } finally {
        setIsSaving(
          false
        );
      }
    };

  /*
   * =========================================================
   * AVATAR
   * =========================================================
   */

  const handleAvatarUpload =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        await showWarning(
          "File tidak valid",
          "Avatar harus berupa file gambar."
        );

        event.target.value =
          "";

        return;
      }

      if (
        file.size >
        8 *
          1024 *
          1024
      ) {
        await showWarning(
          "Gambar terlalu besar",
          "Ukuran maksimal avatar adalah 8 MB."
        );

        event.target.value =
          "";

        return;
      }

      setIsUploading(
        true
      );

      const supabase =
        createClient();

      let newPath:
        | string
        | null = null;

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
         * Public URL.
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
         * Save URL into profiles.
         */

        const {
          error:
            profileError,
        } =
          await supabase
            .from("profiles")
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
         * Remove previous avatar
         * if it belongs to our bucket.
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
          await supabase.storage
            .from(
              "profile-avatars"
            )
            .remove([
              oldPath,
            ]);
        }

        await Swal.fire({
          icon:
            "success",

          title:
            "Avatar diperbarui",

          timer:
            900,

          showConfirmButton:
            false,
        });
      } catch (error) {
        await showError(
          "Avatar gagal diperbarui",
          error instanceof
            Error
            ? error.message
            : "Terjadi kesalahan saat upload."
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
            max-w-[1300px]
          "
        >
          {/* HEADER */}

          <header
            className="
              flex
              items-end
              justify-between
              gap-5
            "
          >
            <div>
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
                Account
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
                Profile
              </h1>
            </div>

            <Link
              href="/settings"
              className="
                hidden
                items-center
                gap-2
                rounded-[15px]
                border
                border-ocean-100
                bg-white/70
                px-4
                py-3
                text-sm
                font-semibold
                text-ocean-700
                transition
                hover:bg-white
                sm:flex
              "
            >
              <Settings
                size={16}
              />

              Settings
            </Link>
          </header>

          {/* HERO */}

          <section
            className="
              relative
              mt-7
              overflow-hidden
              rounded-[32px]
              bg-gradient-to-br
              from-ocean-950
              via-ocean-800
              to-ocean-500
              p-6
              text-white
              shadow-love-lg
              sm:p-8
            "
          >
            <div
              className="
                absolute
                -right-20
                -top-24
                h-72
                w-72
                rounded-full
                bg-white/[0.08]
                blur-3xl
              "
            />

            <div
              className="
                relative
                z-10
                flex
                flex-col
                gap-6
                sm:flex-row
                sm:items-center
              "
            >
              {/* AVATAR */}

              <div
                className="
                  relative
                  h-28
                  w-28
                  shrink-0
                  overflow-hidden
                  rounded-[30px]
                  border
                  border-white/20
                  bg-white/10
                  shadow-xl
                "
              >
                {profile.avatarUrl ? (
                  <Image
                    src={
                      profile.avatarUrl
                    }
                    alt={
                      profile.nickname ||
                      profile.fullName
                    }
                    fill
                    unoptimized
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
                      font-display
                      text-4xl
                      font-semibold
                    "
                  >
                    {getInitials(
                      profile.fullName ||
                      profile.nickname
                    )}
                  </div>
                )}

                <label
                  className="
                    absolute
                    inset-x-2
                    bottom-2
                    flex
                    cursor-pointer
                    items-center
                    justify-center
                    gap-1.5
                    rounded-[10px]
                    bg-black/40
                    px-2
                    py-2
                    text-[10px]
                    font-semibold
                    text-white
                    backdrop-blur-xl
                  "
                >
                  <Camera
                    size={12}
                  />

                  {isUploading
                    ? "Uploading..."
                    : "Change"}

                  <input
                    type="file"
                    accept="image/*"
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

              <div
                className="
                  min-w-0
                "
              >
                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-white/55
                  "
                >
                  My Profile
                </p>

                <h2
                  className="
                    mt-1
                    font-display
                    text-4xl
                    font-semibold
                    sm:text-5xl
                  "
                >
                  {profile.nickname ||
                    profile.fullName ||
                    "Love"}
                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    text-white/60
                  "
                >
                  {
                    profile.fullName
                  }
                </p>

                {couple && (
                  <div
                    className="
                      mt-4
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-white/15
                      bg-white/10
                      px-4
                      py-2
                      text-xs
                      text-white/75
                      backdrop-blur-xl
                    "
                  >
                    <Heart
                      size={13}
                    />

                    {couple.name}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* STATS */}

          <section
            className="
              mt-5
              grid
              grid-cols-2
              gap-3
              lg:grid-cols-4
            "
          >
            <StatCard
              icon={
                CalendarDays
              }
              value={
                stats.plans
              }
              label="Plans"
            />

            <StatCard
              icon={
                Heart
              }
              value={
                stats.memories
              }
              label="Memories"
            />

            <StatCard
              icon={
                Images
              }
              value={
                stats.photos
              }
              label="Photos"
            />

            <StatCard
              icon={
                NotebookPen
              }
              value={
                stats.notes
              }
              label="Notes"
            />
          </section>

          {/* FORM */}

          <section
            className="
              mt-5
              grid
              gap-5
              xl:grid-cols-[1fr_0.42fr]
            "
          >
            <form
              onSubmit={
                handleSave
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
                  <Sparkles
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
                    Information
                  </p>

                  <h2
                    className="
                      font-display
                      text-2xl
                      font-semibold
                      text-ocean-950
                    "
                  >
                    Edit Profile
                  </h2>
                </div>
              </div>

              <div
                className="
                  mt-7
                  grid
                  gap-5
                "
              >
                <div
                  className="
                    grid
                    gap-4
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
                        event.target.value
                      )
                    }
                    rows={5}
                    placeholder="Write something about yourself..."
                    className="
                      love-input
                      w-full
                      resize-none
                      rounded-[15px]
                      px-4
                      py-3
                      text-sm
                    "
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
                      love-input
                      w-full
                      cursor-not-allowed
                      rounded-[15px]
                      px-4
                      py-3
                      text-sm
                      opacity-60
                    "
                  />
                </Field>
              </div>

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
                    isSaving
                  }
                  className="
                    love-button
                    flex
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

                  {isSaving
                    ? "Saving..."
                    : "Save Profile"}
                </button>
              </div>
            </form>

            {/* ACCOUNT */}

            <aside
              className="
                glass-card
                rounded-[30px]
                p-5
                sm:p-6
              "
            >
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
                  mt-1
                  font-display
                  text-2xl
                  font-semibold
                  text-ocean-950
                "
              >
                Details
              </h2>

              <div
                className="
                  mt-6
                  space-y-5
                "
              >
                <AccountRow
                  label="Member Since"
                  value={
                    formatDate(
                      profile.createdAt
                    )
                  }
                />

                {couple && (
                  <>
                    <AccountRow
                      label="Couple"
                      value={
                        couple.name
                      }
                    />

                    <AccountRow
                      label="Anniversary"
                      value={
                        formatDateOnly(
                          couple.anniversaryDate
                        )
                      }
                    />
                  </>
                )}
              </div>

              <Link
                href="/settings"
                className="
                  mt-7
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-[15px]
                  border
                  border-ocean-100
                  bg-white/70
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-ocean-700
                  transition
                  hover:bg-white
                "
              >
                <Settings
                  size={15}
                />

                Open Settings
              </Link>
            </aside>
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
  children,
}: {
  label: string;

  children:
    React.ReactNode;
}) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-xs
          font-bold
          text-ocean-800
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
 * STAT
 * =========================================================
 */

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon:
    ElementType;

  value:
    number;

  label:
    string;
}) {
  return (
    <div
      className="
        glass-card
        rounded-[23px]
        p-4
        sm:p-5
      "
    >
      <Icon
        size={18}
        className="
          text-ocean-600
        "
      />

      <p
        className="
          mt-4
          font-display
          text-3xl
          font-semibold
          text-ocean-950
        "
      >
        {value}
      </p>

      <p
        className="
          mt-1
          text-[10px]
          font-semibold
          text-ink-soft
        "
      >
        {label}
      </p>
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
  label: string;

  value: string;
}) {
  return (
    <div
      className="
        border-b
        border-ocean-100
        pb-4
        last:border-none
      "
    >
      <p
        className="
          text-[10px]
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
 * HELPERS
 * =========================================================
 */

function getInitials(
  value: string
) {
  if (!value.trim()) {
    return "?";
  }

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part.charAt(0)
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
  value: string
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
      value
    )
  );
}

function formatDateOnly(
  value: string
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