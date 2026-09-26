// src/app/music/page.tsx

import { redirect } from "next/navigation";

import MusicClient from "@/components/music/MusicClient";
import { createClient } from "@/lib/supabase/server";

export default async function MusicPage() {
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
            Akun ini belum terdaftar sebagai anggota
            workspace Love4ever.
          </p>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * TRACKS
   * =========================================================
   */

  const {
    data: tracks,
    error: tracksError,
  } =
    await supabase
      .from("music_tracks")
      .select(
        `
        id,
        couple_id,
        added_by,
        title,
        artist,
        album,
        source_type,
        external_url,
        audio_path,
        cover_path,
        is_favorite,
        created_at,
        updated_at
        `
      )
      .eq(
        "couple_id",
        membership.couple_id
      )
      .order(
        "is_favorite",
        {
          ascending: false,
        }
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  if (tracksError) {
    console.error(
      "Music query error:",
      tracksError
    );
  }

  /*
   * =========================================================
   * SIGNED URLS
   * =========================================================
   */

  const tracksWithUrls =
    await Promise.all(
      (tracks ?? []).map(
        async (track) => {
          let audioUrl:
            | string
            | null = null;

          let coverUrl:
            | string
            | null = null;

          if (track.audio_path) {
            const {
              data,
            } =
              await supabase.storage
                .from(
                  "music-audio"
                )
                .createSignedUrl(
                  track.audio_path,
                  60 * 60
                );

            audioUrl =
              data?.signedUrl ??
              null;
          }

          if (track.cover_path) {
            const {
              data,
            } =
              await supabase.storage
                .from(
                  "music-covers"
                )
                .createSignedUrl(
                  track.cover_path,
                  60 * 60
                );

            coverUrl =
              data?.signedUrl ??
              null;
          }

          return {
            ...track,

            audio_url:
              audioUrl,

            cover_url:
              coverUrl,
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
    <MusicClient
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
      initialTracks={
        tracksWithUrls
      }
    />
  );
}