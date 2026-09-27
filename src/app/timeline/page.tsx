// src/app/timeline/page.tsx

import { redirect } from "next/navigation";

import TimelineClient from "@/components/timeline/TimelineClient";
import { createClient } from "@/lib/supabase/server";

type MemoryRow = {
  id: string;
  couple_id: string;
  title: string;
  story: string | null;
  memory_date: string;
  memory_time: string | null;
  location_name: string | null;
  created_at: string;
};

type CoverRow = {
  memory_id: string;
  storage_path: string;
};

export default async function TimelinePage() {
  const supabase =
    await createClient();

  /* =========================================================
     AUTH
  ========================================================= */

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

  /* =========================================================
     PROFILE
  ========================================================= */

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

  /* =========================================================
     COUPLE MEMBERSHIP
  ========================================================= */

  const {
    data:
      membership,
  } =
    await supabase
      .from(
        "couple_members"
      )
      .select(
        `
        couple_id
        `
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
          bg-[#f7f7f4]
          px-5
        "
      >
        <div
          className="
            max-w-md
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
            Timeline tersedia setelah akun
            terhubung ke couple.
          </p>
        </div>
      </main>
    );
  }

  const coupleId =
    membership.couple_id;

  /* =========================================================
     COUPLE
  ========================================================= */

  const {
    data:
      couple,
    error:
      coupleError,
  } =
    await supabase
      .from(
        "couples"
      )
      .select(
        `
        id,
        name,
        anniversary_date
        `
      )
      .eq(
        "id",
        coupleId
      )
      .maybeSingle();

  if (
    coupleError
  ) {
    console.error(
      "Timeline couple query:",
      coupleError
    );
  }

  /* =========================================================
     MEMORIES
  ========================================================= */

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
        title,
        story,
        memory_date,
        memory_time,
        location_name,
        created_at
        `
      )
      .eq(
        "couple_id",
        coupleId
      )
      .order(
        "memory_date",
        {
          ascending:
            true,
        }
      )
      .order(
        "memory_time",
        {
          ascending:
            true,
          nullsFirst:
            false,
        }
      );

  if (
    memoriesError
  ) {
    console.error(
      "Timeline memories query:",
      memoriesError
    );
  }

  const memoryRows =
    (
      memories ??
      []
    ) as MemoryRow[];

  /* =========================================================
     COVER PHOTOS
  ========================================================= */

  const memoryIds =
    memoryRows.map(
      (
        memory
      ) =>
        memory.id
    );

  let coverRows:
    CoverRow[] =
    [];

  if (
    memoryIds.length >
    0
  ) {
    const {
      data:
        covers,
      error:
        coversError,
    } =
      await supabase
        .from(
          "memory_photos"
        )
        .select(
          `
          memory_id,
          storage_path
          `
        )
        .in(
          "memory_id",
          memoryIds
        )
        .eq(
          "is_cover",
          true
        );

    if (
      coversError
    ) {
      console.error(
        "Timeline covers query:",
        coversError
      );
    }

    coverRows =
      (
        covers ??
        []
      ) as CoverRow[];
  }

  const coverPathByMemory =
    new Map(
      coverRows.map(
        (
          cover
        ) => [
          cover.memory_id,
          cover.storage_path,
        ]
      )
    );

  const timelineMemories =
    await Promise.all(
      memoryRows.map(
        async (
          memory
        ) => {
          const storagePath =
            coverPathByMemory.get(
              memory.id
            );

          let coverUrl:
            | string
            | null =
            null;

          if (
            storagePath
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
                  storagePath,
                  60 * 60 * 6
                );

            if (
              signedError
            ) {
              console.error(
                "Timeline signed URL:",
                signedError
              );
            }

            coverUrl =
              signedData
                ?.signedUrl ??
              null;
          }

          return {
            ...memory,
            cover_url:
              coverUrl,
          };
        }
      )
    );

  /* =========================================================
     CLIENT
  ========================================================= */

  return (
    <TimelineClient
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
      couple={{
        id:
          couple?.id ||
          coupleId,

        name:
          couple?.name ||
          "Love4ever",

        anniversaryDate:
          couple?.anniversary_date ??
          null,
      }}
      memories={
        timelineMemories
      }
    />
  );
}
