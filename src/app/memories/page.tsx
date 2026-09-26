// src/app/memories/page.tsx

import {
  redirect,
} from "next/navigation";

import MemoriesClient from "@/components/memories/MemoriesClient";
import { createClient } from "@/lib/supabase/server";

export default async function MemoriesPage() {
  const supabase =
    await createClient();

  /*
   * =========================================================
   * AUTH
   * =========================================================
   */

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login"
    );
  }

  /*
   * =========================================================
   * PROFILE
   * =========================================================
   */

  const {
    data:
      profile,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        `
        full_name,
        nickname,
        avatar_url
        `
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

  /*
   * =========================================================
   * COUPLE MEMBERSHIP
   * =========================================================
   */

  const {
    data:
      membership,
  } =
    await supabase
      .from(
        "couple_members"
      )
      .select(
        "couple_id"
      )
      .eq(
        "user_id",
        user.id
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    !membership
  ) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-cloud
          px-5
        "
      >
        <div
          className="
            glass-card
            max-w-md
            rounded-[30px]
            p-8
            text-center
          "
        >
          <h1
            className="
              font-display
              text-3xl
              font-semibold
              text-ocean-950
            "
          >
            Couple belum
            terhubung
          </h1>

          <p
            className="
              mt-3
              text-sm
              leading-7
              text-ink-soft
            "
          >
            Akun ini belum
            terdaftar sebagai
            anggota workspace
            Love4ever.
          </p>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * MEMORIES
   * =========================================================
   */

  const {
    data:
      memories,
    error:
      memoriesError,
  } =
    await supabase
      .from(
        "memories"
      )
      .select(
        `
        id,
        couple_id,
        created_by,
        source_plan_id,
        title,
        story,
        memory_date,
        memory_time,
        location_name,
        maps_url,
        latitude,
        longitude,
        created_at,
        updated_at
        `
      )
      .eq(
        "couple_id",
        membership.couple_id
      )
      .order(
        "memory_date",
        {
          ascending:
            false,
        }
      )
      .order(
        "memory_time",
        {
          ascending:
            false,
        }
      );

  if (
    memoriesError
  ) {
    console.error(
      "Memories query error:",
      memoriesError
    );
  }

  const safeMemories =
    memories ?? [];

  /*
   * =========================================================
   * MEMORY PHOTOS
   * =========================================================
   *
   * Kita ambil semua photo metadata
   * untuk menghitung jumlah foto dan
   * menentukan cover tiap memory.
   */

  const memoryIds =
    safeMemories.map(
      (
        memory
      ) =>
        memory.id
    );

  let memoryPhotos:
    {
      id: string;
      memory_id: string;
      storage_path: string;
      is_cover: boolean;
      created_at: string;
    }[] = [];

  if (
    memoryIds.length >
    0
  ) {
    const {
      data:
        photos,
      error:
        photosError,
    } =
      await supabase
        .from(
          "memory_photos"
        )
        .select(
          `
          id,
          memory_id,
          storage_path,
          is_cover,
          created_at
          `
        )
        .in(
          "memory_id",
          memoryIds
        )
        .order(
          "created_at",
          {
            ascending:
              true,
          }
        );

    if (
      photosError
    ) {
      console.error(
        "Memory photos query error:",
        photosError
      );
    }

    memoryPhotos =
      photos ?? [];
  }

  /*
   * =========================================================
   * BUILD MEMORY MEDIA INFO
   * =========================================================
   */

  const memoriesWithMedia =
    await Promise.all(
      safeMemories.map(
        async (
          memory
        ) => {
          const photos =
            memoryPhotos.filter(
              (
                photo
              ) =>
                photo.memory_id ===
                memory.id
            );

          const cover =
            photos.find(
              (
                photo
              ) =>
                photo.is_cover
            ) ??
            photos[0] ??
            null;

          let coverUrl:
            string | null =
            null;

          if (
            cover
          ) {
            const {
              data:
                signedData,
              error:
                signedError,
            } =
              await supabase.storage
                .from(
                  "memory-photos"
                )
                .createSignedUrl(
                  cover.storage_path,
                  60 * 60
                );

            if (
              signedError
            ) {
              console.error(
                "Memory cover signed URL error:",
                signedError
              );
            }

            coverUrl =
              signedData?.signedUrl ??
              null;
          }

          return {
            ...memory,

            cover_url:
              coverUrl,

            photo_count:
              photos.length,
          };
        }
      )
    );

  /*
   * =========================================================
   * CLIENT
   * =========================================================
   */

  return (
    <MemoriesClient
      user={{
        id:
          user.id,

        email:
          user.email ??
          "",

        fullName:
          profile?.full_name ||
          "Love",

        nickname:
          profile?.nickname ||
          profile?.full_name ||
          "Love",

        avatarUrl:
          profile?.avatar_url ??
          null,
      }}
      coupleId={
        membership.couple_id
      }
      initialMemories={
        memoriesWithMedia
      }
    />
  );
}