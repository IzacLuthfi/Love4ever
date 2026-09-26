// src/app/gallery/page.tsx

import { redirect } from "next/navigation";

import GalleryClient from "@/components/gallery/GalleryClient";
import { createClient } from "@/lib/supabase/server";

export default async function GalleryPage() {
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
   * MEMBERSHIP
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
      <main className="flex min-h-screen items-center justify-center bg-cloud px-5">
        <div className="glass-card max-w-md rounded-[30px] p-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-ocean-950">
            Couple belum terhubung
          </h1>
        </div>
      </main>
    );
  }

  const coupleId = membership.couple_id;

  /*
   * =========================================================
   * ALBUMS
   * =========================================================
   */

  const {
    data: albums,
    error: albumsError,
  } = await supabase
    .from("gallery_albums")
    .select(
      `
      id,
      couple_id,
      created_by,
      owner_id,
      name,
      description,
      visibility,
      created_at,
      updated_at
      `
    )
    .eq("couple_id", coupleId)
    .order("created_at", {
      ascending: false,
    });

  if (albumsError) {
    console.error(
      "Gallery albums error:",
      albumsError
    );
  }

  /*
   * =========================================================
   * PHOTOS
   * =========================================================
   */

  const {
    data: photos,
    error: photosError,
  } = await supabase
    .from("gallery_photos")
    .select(
      `
      id,
      couple_id,
      album_id,
      uploaded_by,
      owner_id,
      storage_bucket,
      storage_path,
      title,
      caption,
      visibility,
      source_type,
      source_memory_photo_id,
      is_favorite,
      created_at,
      updated_at
      `
    )
    .eq("couple_id", coupleId)
    .order("created_at", {
      ascending: false,
    });

  if (photosError) {
    console.error(
      "Gallery photos error:",
      photosError
    );
  }

  /*
   * =========================================================
   * SIGNED URL
   * =========================================================
   */

  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data, error } =
        await supabase.storage
          .from(photo.storage_bucket)
          .createSignedUrl(
            photo.storage_path,
            60 * 60
          );

      if (error) {
        console.error(
          "Gallery signed URL error:",
          error
        );
      }

      return {
        ...photo,

        signed_url:
          data?.signedUrl ?? null,
      };
    })
  );

  return (
    <GalleryClient
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
      initialAlbums={albums ?? []}
      initialPhotos={photosWithUrls}
    />
  );
}