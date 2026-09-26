// src/app/memories/[id]/page.tsx

import {
  notFound,
  redirect,
} from "next/navigation";

import MemoryDetailClient from "@/components/memories/MemoryDetailClient";
import { createClient } from "@/lib/supabase/server";

type MemoryDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MemoryDetailPage({
  params,
}: MemoryDetailPageProps) {
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

  /*
   * PROFILE
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
      .single();

  /*
   * MEMORY
   */

  const {
    data: memory,
  } =
    await supabase
      .from("memories")
      .select(
        `
        id,
        couple_id,
        created_by,
        source_plan_id,
        title,
        story,
        memory_date,
        memory_time,
        location_name,
        maps_url,
        latitude,
        longitude,
        created_at,
        updated_at
        `
      )
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (!memory) {
    notFound();
  }

  /*
   * PHOTOS
   */

  const {
    data: photos,
  } =
    await supabase
      .from("memory_photos")
      .select(
        `
        id,
        memory_id,
        uploaded_by,
        storage_path,
        caption,
        is_cover,
        sort_order,
        created_at
        `
      )
      .eq(
        "memory_id",
        id
      )
      .order(
        "is_cover",
        {
          ascending: false,
        }
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

  /*
   * SIGNED URL
   */

  const photosWithUrl =
    await Promise.all(
      (photos ?? []).map(
        async (photo) => {
          const {
            data,
          } =
            await supabase.storage
              .from(
                "memory-photos"
              )
              .createSignedUrl(
                photo.storage_path,
                60 * 60
              );

          return {
            ...photo,

            signed_url:
              data?.signedUrl ??
              null,
          };
        }
      )
    );

  return (
    <MemoryDetailClient
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
      initialMemory={
        memory
      }
      initialPhotos={
        photosWithUrl
      }
    />
  );
}