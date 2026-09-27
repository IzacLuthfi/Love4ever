// src/app/memories/page.tsx

import { redirect } from "next/navigation";

import MemoriesClient from "@/components/memories/MemoriesClient";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const SIGNED_URL_BATCH_SIZE = 100;

export default async function MemoriesPage() {
  const supabase = await createClient();

  /* =========================================================
     AUTH
  ========================================================= */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /* =========================================================
     PROFILE + COUPLE MEMBERSHIP

     Jalankan paralel karena tidak saling bergantung.
  ========================================================= */

  const [profileResult, membershipResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        `
        full_name,
        nickname,
        avatar_url
        `
      )
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const membership = membershipResult.data;

  if (profileResult.error) {
    console.error(
      "Memories profile error:",
      profileResult.error
    );
  }

  if (membershipResult.error) {
    console.error(
      "Memories membership error:",
      membershipResult.error
    );
  }

  if (!membership) {
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
            Couple belum terhubung
          </h1>

          <p
            className="
              mt-3
              text-sm
              leading-7
              text-ink-soft
            "
          >
            Akun ini belum terdaftar sebagai anggota workspace
            Love4ever.
          </p>
        </div>
      </main>
    );
  }

  const coupleId = membership.couple_id;

  /* =========================================================
     MEMORIES

     Metadata tetap diambil supaya:
     - year filter lengkap
     - stats lengkap
     - Memory Map lengkap

     MemoryClient hanya merender 20 card per batch.
  ========================================================= */

  const {
    data: memories,
    error: memoriesError,
  } = await supabase
    .from("memories")
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
    .eq("couple_id", coupleId)
    .order("memory_date", {
      ascending: false,
    })
    .order("memory_time", {
      ascending: false,
    });

  if (memoriesError) {
    console.error(
      "Memories query error:",
      memoriesError
    );
  }

  const safeMemories = memories ?? [];

  /* =========================================================
     MEMORY PHOTO METADATA
  ========================================================= */

  const memoryIds = safeMemories.map(
    (memory) => memory.id
  );

  type MemoryPhotoMeta = {
    id: string;
    memory_id: string;
    storage_path: string;
    is_cover: boolean;
    created_at: string;
  };

  let memoryPhotos: MemoryPhotoMeta[] = [];

  if (memoryIds.length > 0) {
    const {
      data: photos,
      error: photosError,
    } = await supabase
      .from("memory_photos")
      .select(
        `
        id,
        memory_id,
        storage_path,
        is_cover,
        created_at
        `
      )
      .in("memory_id", memoryIds)
      .order("created_at", {
        ascending: true,
      });

    if (photosError) {
      console.error(
        "Memory photos query error:",
        photosError
      );
    }

    memoryPhotos = photos ?? [];
  }

  /* =========================================================
     GROUP PHOTOS ONCE

     Sebelumnya setiap memory melakukan memoryPhotos.filter().
     Kalau memory dan photo banyak, pekerjaan ini berulang-ulang.

     Sekarang photo dikelompokkan satu kali menggunakan Map.
  ========================================================= */

  const photosByMemory = new Map<
    string,
    MemoryPhotoMeta[]
  >();

  for (const photo of memoryPhotos) {
    const current =
      photosByMemory.get(photo.memory_id) ?? [];

    current.push(photo);
    photosByMemory.set(
      photo.memory_id,
      current
    );
  }

  const mediaMeta = safeMemories.map(
    (memory) => {
      const photos =
        photosByMemory.get(memory.id) ?? [];

      const cover =
        photos.find(
          (photo) => photo.is_cover
        ) ??
        photos[0] ??
        null;

      return {
        memory,
        photoCount: photos.length,
        coverPath:
          cover?.storage_path ??
          null,
      };
    }
  );

  /* =========================================================
     SIGN ALL COVER URLS IN ONE STORAGE REQUEST

     Sebelumnya:
       50 memories = sampai 50 createSignedUrl() request

     Sekarang:
       semua cover = 1 createSignedUrls() request
  ========================================================= */

  const uniqueCoverPaths = Array.from(
    new Set(
      mediaMeta
        .map((item) => item.coverPath)
        .filter(
          (path): path is string =>
            Boolean(path)
        )
    )
  );

  const signedCoverByPath = new Map<
    string,
    string
  >();

  if (uniqueCoverPaths.length > 0) {
    for (
      let start = 0;
      start < uniqueCoverPaths.length;
      start += SIGNED_URL_BATCH_SIZE
    ) {
      const chunk = uniqueCoverPaths.slice(
        start,
        start + SIGNED_URL_BATCH_SIZE
      );

      const {
        data: signedData,
        error: signedError,
      } = await supabase.storage
        .from("memory-photos")
        .createSignedUrls(
          chunk,
          SIGNED_URL_TTL_SECONDS
        );

      if (signedError) {
        console.error(
          "Memory cover signed URLs error:",
          signedError
        );

        continue;
      }

      (signedData ?? []).forEach(
        (signedItem, index) => {
          const path = chunk[index];

          if (
            path &&
            signedItem?.signedUrl
          ) {
            signedCoverByPath.set(
              path,
              signedItem.signedUrl
            );
          }
        }
      );
    }
  }

  /* =========================================================
     BUILD CLIENT DATA
  ========================================================= */

  const memoriesWithMedia = mediaMeta.map(
    ({
      memory,
      photoCount,
      coverPath,
    }) => ({
      ...memory,
      cover_url: coverPath
        ? signedCoverByPath.get(
            coverPath
          ) ?? null
        : null,
      photo_count: photoCount,
    })
  );

  /* =========================================================
     CLIENT
  ========================================================= */

  return (
    <MemoriesClient
      user={{
        id: user.id,
        email:
          user.email ?? "",
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
      coupleId={coupleId}
      initialMemories={
        memoriesWithMedia
      }
    />
  );
}
