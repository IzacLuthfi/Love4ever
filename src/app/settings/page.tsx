// src/app/settings/page.tsx

import { redirect } from "next/navigation";

import SettingsClient from "@/components/settings/SettingsClient";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
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
      data,
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
      data;
  }

  return (
    <SettingsClient
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
    />
  );
}