// src/app/memories/[id]/page.tsx

import {
  notFound,
  redirect,
} from "next/navigation";

import MemoryDetailClient from "@/components/memories/MemoryDetailClient";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const SIGNED_URL_BATCH_SIZE = 100;

type MemoryDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MemoryDetailPage({
  params,
}: MemoryDetailPageProps) {
  const { id } = await params;

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
     PROFILE + MEMORY

     Tidak saling bergantung, jadi jalankan paralel.
  ========================================================= */

  const [profileResult, memoryResult] = await Promise.all([
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
      .eq("id", id)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const memory = memoryResult.data;

  if (profileResult.error) {
    console.error(
      "Memory detail profile error:",
      profileResult.error
    );
  }

  if (memoryResult.error) {
    console.error(
      "Memory detail query error:",
      memoryResult.error
    );
  }

  if (!memory) {
    notFound();
  }

  /* =========================================================
     PHOTOS
  ========================================================= */

  const {
    data: photos,
    error: photosError,
  } = await supabase
    .from("memory_photos")
    .select(
      `
      id,
      memory_id,
      uploaded_by,
      storage_path,
      caption,
      is_cover,
      sort_order,
      created_at
      `
    )
    .eq("memory_id", id)
    .order("is_cover", {
      ascending: false,
    })
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (photosError) {
    console.error(
      "Memory detail photos error:",
      photosError
    );
  }

  const safePhotos = photos ?? [];

  /* =========================================================
     SIGNED URL — ONE BATCH REQUEST
  ========================================================= */

  const paths = safePhotos.map(
    (photo) => photo.storage_path
  );

  let signedUrls: Array<
    string | null
  > = [];

  if (paths.length > 0) {
    signedUrls = Array.from(
      { length: paths.length },
      () => null as string | null
    );

    for (
      let start = 0;
      start < paths.length;
      start += SIGNED_URL_BATCH_SIZE
    ) {
      const chunk = paths.slice(
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
          "Memory detail signed URLs error:",
          signedError
        );

        continue;
      }

      (signedData ?? []).forEach(
        (signedItem, index) => {
          signedUrls[start + index] =
            signedItem?.signedUrl ?? null;
        }
      );
    }
  }

  const photosWithUrl = safePhotos.map(
    (photo, index) => ({
      ...photo,
      signed_url:
        signedUrls[index] ??
        null,
    })
  );

  /* =========================================================
     CLIENT
  ========================================================= */

  return (
    <MemoryDetailClient
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
      initialMemory={memory}
      initialPhotos={photosWithUrl}
    />
  );
}
