// src/app/gallery/page.tsx

import { redirect } from "next/navigation";

import GalleryClient from "@/components/gallery/GalleryClient";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const SIGNED_URL_BATCH_SIZE = 100;

export default async function GalleryPage() {
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
     PROFILE + MEMBERSHIP

     Keduanya tidak saling bergantung, jadi jalankan paralel.
  ========================================================= */

  const [profileResult, membershipResult] = await Promise.all([
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
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const membership = membershipResult.data;

  if (profileResult.error) {
    console.error(
      "Gallery profile error:",
      profileResult.error
    );
  }

  if (membershipResult.error) {
    console.error(
      "Gallery membership error:",
      membershipResult.error
    );
  }

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

  /* =========================================================
     ALBUMS + PHOTO METADATA

     Metadata foto tetap diambil sekaligus karena ringan dan
     dibutuhkan untuk Album / Favorites / Vault.

     Yang berat adalah:
     - signed URL satu per satu
     - semua <Image> dirender sekaligus

     GalleryClient membatasi render menjadi 20 foto per batch.
  ========================================================= */

  const [albumsResult, photosResult] = await Promise.all([
    supabase
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
      }),

    supabase
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
      }),
  ]);

  if (albumsResult.error) {
    console.error(
      "Gallery albums error:",
      albumsResult.error
    );
  }

  if (photosResult.error) {
    console.error(
      "Gallery photos error:",
      photosResult.error
    );
  }

  const albums = albumsResult.data ?? [];
  const photos = photosResult.data ?? [];

  /* =========================================================
     SIGNED URL — BATCH PER BUCKET

     Sebelumnya:
       100 foto = 100 request createSignedUrl()

     Sekarang:
       100 foto dari bucket yang sama = 1 request

     Ini biasanya memangkas waktu masuk Gallery secara besar.
  ========================================================= */

  const photosWithUrls = photos.map((photo) => ({
    ...photo,
    signed_url: null as string | null,
  }));

  const bucketGroups = new Map<
    string,
    Array<{
      index: number;
      path: string;
    }>
  >();

  photos.forEach((photo, index) => {
    const existing =
      bucketGroups.get(photo.storage_bucket) ?? [];

    existing.push({
      index,
      path: photo.storage_path,
    });

    bucketGroups.set(
      photo.storage_bucket,
      existing
    );
  });

  await Promise.all(
    Array.from(bucketGroups.entries()).map(
      async ([bucket, entries]) => {
        for (
          let start = 0;
          start < entries.length;
          start += SIGNED_URL_BATCH_SIZE
        ) {
          const chunk = entries.slice(
            start,
            start + SIGNED_URL_BATCH_SIZE
          );

          const paths = chunk.map(
            (entry) => entry.path
          );

          const {
            data,
            error,
          } = await supabase.storage
            .from(bucket)
            .createSignedUrls(
              paths,
              SIGNED_URL_TTL_SECONDS
            );

          if (error) {
            console.error(
              `Gallery signed URLs error (${bucket}):`,
              error
            );

            continue;
          }

          (data ?? []).forEach(
            (signedItem, resultIndex) => {
              const entry = chunk[resultIndex];

              if (!entry) {
                return;
              }

              photosWithUrls[entry.index].signed_url =
                signedItem?.signedUrl ?? null;
            }
          );
        }
      }
    )
  );

  /* =========================================================
     CLIENT
  ========================================================= */

  return (
    <GalleryClient
      user={{
        id: user.id,
        email: user.email ?? "",
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
      initialAlbums={albums}
      initialPhotos={photosWithUrls}
    />
  );
}
