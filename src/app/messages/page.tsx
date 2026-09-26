// src/app/messages/page.tsx

import { redirect } from "next/navigation";

import MessagesClient from "@/components/messages/MessagesClient";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
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
   * MY PROFILE
   * =========================================================
   */

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

  /*
   * =========================================================
   * MY COUPLE MEMBERSHIP
   * =========================================================
   */

  const {
    data: membership,
  } =
    await supabase
      .from("couple_members")
      .select(
        `
        couple_id
        `
      )
      .eq(
        "user_id",
        user.id
      )
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
            Akun ini belum terdaftar sebagai
            anggota workspace Love4ever.
          </p>
        </div>
      </main>
    );
  }

  const coupleId =
    membership.couple_id;

  /*
   * =========================================================
   * COUPLE
   * =========================================================
   */

  const {
    data: couple,
  } =
    await supabase
      .from("couples")
      .select(
        `
        id,
        name
        `
      )
      .eq(
        "id",
        coupleId
      )
      .maybeSingle();

  /*
   * =========================================================
   * FIND PARTNER
   * =========================================================
   */

  const {
    data: partnerMembership,
  } =
    await supabase
      .from("couple_members")
      .select(
        `
        user_id
        `
      )
      .eq(
        "couple_id",
        coupleId
      )
      .neq(
        "user_id",
        user.id
      )
      .limit(1)
      .maybeSingle();

  let partner: {
    id: string;
    fullName: string;
    nickname: string;
    avatarUrl:
      | string
      | null;
  } | null = null;

  if (
    partnerMembership
  ) {
    const {
      data:
        partnerProfile,
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
          partnerMembership.user_id
        )
        .maybeSingle();

    partner = {
      id:
        partnerMembership.user_id,

      fullName:
        partnerProfile?.full_name ||
        "Partner",

      nickname:
        partnerProfile?.nickname ||
        partnerProfile?.full_name ||
        "Partner",

      avatarUrl:
        partnerProfile?.avatar_url ??
        null,
    };
  }

  /*
   * =========================================================
   * MESSAGES
   *
   * Ambil 150 pesan terbaru lalu reverse
   * supaya urutan di client tetap lama → baru.
   * =========================================================
   */

  const {
    data: messages,
    error: messagesError,
  } =
    await supabase
      .from("messages")
      .select(
        `
        id,
        couple_id,
        sender_id,
        content,
        edited_at,
        created_at,
        updated_at
        `
      )
      .eq(
        "couple_id",
        coupleId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(150);

  if (
    messagesError
  ) {
    console.error(
      "Messages query error:",
      messagesError
    );
  }

  const initialMessages =
    [...(messages ?? [])]
      .reverse();

  /*
   * =========================================================
   * CLIENT
   * =========================================================
   */

  return (
    <MessagesClient
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
      partner={
        partner
      }
      couple={{
        id:
          coupleId,

        name:
          couple?.name ||
          "Love4ever",
      }}
      initialMessages={
        initialMessages
      }
    />
  );
}