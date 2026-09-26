// src/app/dashboard/page.tsx

import { redirect } from "next/navigation";

import DashboardClient from "@/components/dashboard/DashboardClient";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  /*
   * =========================================================
   * AUTH
   * =========================================================
   */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /*
   * =========================================================
   * PROFILE
   * =========================================================
   */

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      full_name,
      nickname,
      avatar_url
      `
    )
    .eq("id", user.id)
    .maybeSingle();

  /*
   * =========================================================
   * COUPLE MEMBERSHIP
   * =========================================================
   */

  const { data: membership } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

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

  /*
   * =========================================================
   * COUPLE
   * =========================================================
   */

  const { data: couple } = await supabase
    .from("couples")
    .select(
      `
      id,
      name,
      anniversary_date
      `
    )
    .eq("id", coupleId)
    .maybeSingle();

  /*
   * =========================================================
   * PLANS
   * =========================================================
   */

  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select(
      `
      id,
      title,
      plan_date,
      plan_time,
      location_name,
      status,
      cover_path,
      completed_at,
      created_at
      `
    )
    .eq("couple_id", coupleId);

  if (plansError) {
    console.error(
      "Dashboard plans query error:",
      plansError
    );
  }

  const safePlans = plans ?? [];

  const plannedPlans = safePlans.filter(
    (plan) => plan.status === "planned"
  );

  const donePlans = safePlans.filter(
    (plan) => plan.status === "done"
  );

  /*
   * =========================================================
   * NEXT PLAN
   * =========================================================
   */

  const today = getTodayForIndonesia();

  const nextPlanRaw =
    plannedPlans
      .filter((plan) => plan.plan_date >= today)
      .sort((a, b) => {
        const first = new Date(
          `${a.plan_date}T${a.plan_time || "00:00"}`
        ).getTime();

        const second = new Date(
          `${b.plan_date}T${b.plan_time || "00:00"}`
        ).getTime();

        return first - second;
      })[0] ?? null;

  let nextPlanCoverUrl: string | null = null;

  if (nextPlanRaw?.cover_path) {
    const {
      data: signedData,
      error: signedError,
    } = await supabase.storage
      .from("plan-covers")
      .createSignedUrl(
        nextPlanRaw.cover_path,
        60 * 60
      );

    if (signedError) {
      console.error(
        "Next plan cover signed URL error:",
        signedError
      );
    }

    nextPlanCoverUrl =
      signedData?.signedUrl ?? null;
  }

  const nextPlan = nextPlanRaw
    ? {
        id: nextPlanRaw.id,
        title: nextPlanRaw.title,
        planDate: nextPlanRaw.plan_date,
        planTime: nextPlanRaw.plan_time,
        locationName: nextPlanRaw.location_name,
        coverUrl: nextPlanCoverUrl,
      }
    : null;

  /*
   * =========================================================
   * MEMORIES
   * =========================================================
   */

  const {
    data: memories,
    error: memoriesError,
  } = await supabase
    .from("memories")
    .select(
      `
      id,
      title,
      story,
      memory_date,
      memory_time,
      location_name,
      created_at
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
      "Dashboard memories query error:",
      memoriesError
    );
  }

  const safeMemories = memories ?? [];

  /*
   * =========================================================
   * MEMORY PHOTOS
   * =========================================================
   */

  const memoryIds = safeMemories.map(
    (memory) => memory.id
  );

  let memoryPhotos: {
    id: string;
    memory_id: string;
    storage_path: string;
    is_cover: boolean;
    created_at: string;
  }[] = [];

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
      .in(
        "memory_id",
        memoryIds
      )
      .order("created_at", {
        ascending: true,
      });

    if (photosError) {
      console.error(
        "Dashboard memory photos query error:",
        photosError
      );
    }

    memoryPhotos = photos ?? [];
  }

  /*
   * =========================================================
   * LATEST MEMORY
   * =========================================================
   */

  const latestMemoryRaw =
    safeMemories[0] ?? null;

  let latestMemoryCoverUrl:
    | string
    | null = null;

  let latestMemoryPhotoCount = 0;

  if (latestMemoryRaw) {
    const latestPhotos =
      memoryPhotos.filter(
        (photo) =>
          photo.memory_id ===
          latestMemoryRaw.id
      );

    latestMemoryPhotoCount =
      latestPhotos.length;

    const cover =
      latestPhotos.find(
        (photo) =>
          photo.is_cover
      ) ??
      latestPhotos[0] ??
      null;

    if (cover) {
      const {
        data: signedData,
        error: signedError,
      } = await supabase.storage
        .from("memory-photos")
        .createSignedUrl(
          cover.storage_path,
          60 * 60
        );

      if (signedError) {
        console.error(
          "Latest memory cover signed URL error:",
          signedError
        );
      }

      latestMemoryCoverUrl =
        signedData?.signedUrl ??
        null;
    }
  }

  const latestMemory =
    latestMemoryRaw
      ? {
          id: latestMemoryRaw.id,
          title: latestMemoryRaw.title,
          story: latestMemoryRaw.story,
          memoryDate:
            latestMemoryRaw.memory_date,
          memoryTime:
            latestMemoryRaw.memory_time,
          locationName:
            latestMemoryRaw.location_name,
          coverUrl:
            latestMemoryCoverUrl,
          photoCount:
            latestMemoryPhotoCount,
        }
      : null;

  /*
   * =========================================================
   * DASHBOARD
   * =========================================================
   */

  return (
    <DashboardClient
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
      couple={{
        name:
          couple?.name ||
          "Izac & Lian",

        anniversaryDate:
          couple?.anniversary_date ||
          "2024-10-07",
      }}
      stats={{
        totalPlans:
          safePlans.length,

        plannedPlans:
          plannedPlans.length,

        donePlans:
          donePlans.length,

        totalMemories:
          safeMemories.length,

        totalPhotos:
          memoryPhotos.length,
      }}
      nextPlan={nextPlan}
      latestMemory={latestMemory}
    />
  );
}

/*
 * =========================================================
 * LOCAL DATE
 * =========================================================
 */

function getTodayForIndonesia() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Jakarta",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );

  return formatter.format(
    new Date()
  );
}