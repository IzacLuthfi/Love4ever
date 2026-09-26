// src/app/profile/page.tsx

import { redirect } from "next/navigation";

import ProfileClient from "@/components/profile/ProfileClient";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase =
    await createClient();

  /*
   * =========================================================
   * AUTH
   * =========================================================
   */

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /*
   * =========================================================
   * PROFILE
   * =========================================================
   */

  const {
    data: profile,
  } =
    await supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        nickname,
        avatar_url,
        bio,
        created_at,
        updated_at
        `
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

  /*
   * =========================================================
   * MEMBERSHIP
   * =========================================================
   */

  const {
    data: membership,
  } =
    await supabase
      .from("couple_members")
      .select("couple_id")
      .eq(
        "user_id",
        user.id
      )
      .limit(1)
      .maybeSingle();

  let couple: {
    id: string;
    name: string;
    anniversary_date: string;
  } | null = null;

  if (
    membership
  ) {
    const {
      data: coupleData,
    } =
      await supabase
        .from("couples")
        .select(
          `
          id,
          name,
          anniversary_date
          `
        )
        .eq(
          "id",
          membership.couple_id
        )
        .maybeSingle();

    couple =
      coupleData;
  }

  /*
   * =========================================================
   * STATS
   * =========================================================
   */

  let totalPlans =
    0;

  let totalMemories =
    0;

  let totalNotes =
    0;

  let totalPhotos =
    0;

  if (
    membership
  ) {
    const [
      plansResult,
      memoriesResult,
      notesResult,
    ] =
      await Promise.all([
        supabase
          .from("plans")
          .select(
            "*",
            {
              count:
                "exact",
              head:
                true,
            }
          )
          .eq(
            "couple_id",
            membership.couple_id
          ),

        supabase
          .from("memories")
          .select(
            "*",
            {
              count:
                "exact",
              head:
                true,
            }
          )
          .eq(
            "couple_id",
            membership.couple_id
          ),

        supabase
          .from("notes")
          .select(
            "*",
            {
              count:
                "exact",
              head:
                true,
            }
          )
          .eq(
            "couple_id",
            membership.couple_id
          ),
      ]);

    totalPlans =
      plansResult.count ??
      0;

    totalMemories =
      memoriesResult.count ??
      0;

    totalNotes =
      notesResult.count ??
      0;

    /*
     * Foto harus dicari
     * melalui memories.
     */

    const {
      data: memoryRows,
    } =
      await supabase
        .from("memories")
        .select("id")
        .eq(
          "couple_id",
          membership.couple_id
        );

    const memoryIds =
      (
        memoryRows ??
        []
      ).map(
        (memory) =>
          memory.id
      );

    if (
      memoryIds.length >
      0
    ) {
      const {
        count,
      } =
        await supabase
          .from(
            "memory_photos"
          )
          .select(
            "*",
            {
              count:
                "exact",
              head:
                true,
            }
          )
          .in(
            "memory_id",
            memoryIds
          );

      totalPhotos =
        count ?? 0;
    }
  }

  return (
    <ProfileClient
      user={{
        id:
          user.id,

        email:
          user.email ??
          "",
      }}
      initialProfile={{
        fullName:
          profile?.full_name ??
          "",

        nickname:
          profile?.nickname ??
          "",

        avatarUrl:
          profile?.avatar_url ??
          null,

        bio:
          profile?.bio ??
          "",

        createdAt:
          profile?.created_at ??
          new Date().toISOString(),
      }}
      couple={
        couple
          ? {
              id:
                couple.id,

              name:
                couple.name,

              anniversaryDate:
                couple.anniversary_date,
            }
          : null
      }
      stats={{
        plans:
          totalPlans,

        memories:
          totalMemories,

        photos:
          totalPhotos,

        notes:
          totalNotes,
      }}
    />
  );
}