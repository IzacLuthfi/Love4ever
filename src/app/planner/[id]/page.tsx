// src/app/planner/[id]/page.tsx

import {
  notFound,
  redirect,
} from "next/navigation";

import PlanDetailClient from "@/components/planner/PlanDetailClient";
import { createClient } from "@/lib/supabase/server";

type PlanDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PlanDetailPage({
  params,
}: PlanDetailPageProps) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: profile,
  } =
    await supabase
      .from("profiles")
      .select(
        "full_name, nickname, avatar_url"
      )
      .eq(
        "id",
        user.id
      )
      .single();

  /*
   * ============================================
   * PLAN
   * ============================================
   */

  const {
    data: plan,
  } =
    await supabase
      .from("plans")
      .select(`
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
        cover_path,
        completed_at,
        created_at,
        updated_at
      `)
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (!plan) {
    notFound();
  }

  /*
   * ============================================
   * TASKS
   * ============================================
   */

  const {
    data: tasks,
  } =
    await supabase
      .from(
        "plan_tasks"
      )
      .select(`
        id,
        plan_id,
        title,
        is_completed,
        created_at
      `)
      .eq(
        "plan_id",
        id
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

  /*
   * ============================================
   * EXISTING MEMORY
   * ============================================
   */

  const {
    data: memory,
  } =
    await supabase
      .from("memories")
      .select("id")
      .eq(
        "source_plan_id",
        id
      )
      .maybeSingle();

  /*
   * ============================================
   * PRIVATE COVER URL
   * ============================================
   */

  let coverUrl:
    | string
    | null = null;

  if (
    plan.cover_path
  ) {
    const {
      data,
    } =
      await supabase.storage
        .from(
          "plan-covers"
        )
        .createSignedUrl(
          plan.cover_path,
          60 * 60
        );

    coverUrl =
      data?.signedUrl ??
      null;
  }

  return (
    <PlanDetailClient
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
      initialPlan={
        plan
      }
      initialTasks={
        tasks ?? []
      }
      initialCoverUrl={
        coverUrl
      }
      initialMemoryId={
        memory?.id ??
        null
      }
    />
  );
}