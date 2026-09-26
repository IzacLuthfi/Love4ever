// src/app/planner/page.tsx

import { redirect } from "next/navigation";

import PlannerClient from "@/components/planner/PlannerClient";
import { createClient } from "@/lib/supabase/server";

export default async function PlannerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select(
        "full_name, nickname, avatar_url"
      )
      .eq("id", user.id)
      .single();

  const { data: membership } =
    await supabase
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
              leading-7
              text-ink-soft
            "
          >
            Akun ini belum terdaftar sebagai
            anggota Love4ever.
          </p>
        </div>
      </main>
    );
  }

  const { data: plans } =
    await supabase
      .from("plans")
      .select(
        `
        id,
        couple_id,
        created_by,
        title,
        description,
        plan_date,
        plan_time,
        location_name,
        maps_url,
        budget,
        status,
        created_at,
        updated_at
        `
      )
      .eq(
        "couple_id",
        membership.couple_id
      )
      .order(
        "plan_date",
        {
          ascending: true,
        }
      )
      .order(
        "plan_time",
        {
          ascending: true,
        }
      );

  return (
    <PlannerClient
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
      coupleId={
        membership.couple_id
      }
      initialPlans={
        plans ?? []
      }
    />
  );
}