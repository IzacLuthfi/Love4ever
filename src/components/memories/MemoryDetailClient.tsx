// src/components/memories/MemoryDetailClient.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

import {
  type ChangeEvent,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Check,
  Clock3,
  ExternalLink,
  Heart,
  ImagePlus,
  Images,
  MapPin,
  Star,
  Trash2,
} from "lucide-react";

import Swal from "sweetalert2";

import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

import { createClient } from "@/lib/supabase/client";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type MemoryDetail = {
  id: string;

  couple_id: string;

  created_by: string;

  source_plan_id:
    | string
    | null;

  title: string;

  story:
    | string
    | null;

  memory_date: string;

  memory_time:
    | string
    | null;

  location_name:
    | string
    | null;

  maps_url:
    | string
    | null;

  latitude:
    | number
    | null;

  longitude:
    | number
    | null;

  created_at: string;

  updated_at: string;
};

type MemoryPhoto = {
  id: string;

  memory_id: string;

  uploaded_by: string;

  storage_path: string;

  caption:
    | string
    | null;

  is_cover: boolean;

  sort_order: number;

  created_at: string;

  signed_url:
    | string
    | null;
};

type MemoryUser = {
  id: string;

  email: string;

  fullName: string;

  nickname: string;

  avatarUrl:
    | string
    | null;
};

type MemoryDetailClientProps = {
  user:
    MemoryUser;

  initialMemory:
    MemoryDetail;

  initialPhotos:
    MemoryPhoto[];
};

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function MemoryDetailClient({
  user,
  initialMemory,
  initialPhotos,
}: MemoryDetailClientProps) {
  const [
    memory,
  ] =
    useState<MemoryDetail>(
      initialMemory
    );

  const [
    photos,
    setPhotos,
  ] =
    useState<
      MemoryPhoto[]
    >(
      initialPhotos
    );

  const [
    isUploading,
    setIsUploading,
  ] =
    useState(false);

  /*
   * COVER
   */

  const coverPhoto =
    useMemo(() => {
      return (
        photos.find(
          (photo) =>
            photo.is_cover
        ) ??
        photos[0] ??
        null
      );
    }, [photos]);

  /*
   * =========================================================
   * UPLOAD
   * =========================================================
   */

  const handleUpload =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const selectedFiles =
        Array.from(
          event.target.files ??
            []
        );

      if (
        selectedFiles.length ===
        0
      ) {
        return;
      }

      /*
       * VALIDATION
       */

      const invalidFile =
        selectedFiles.find(
          (file) =>
            !file.type.startsWith(
              "image/"
            )
        );

      if (invalidFile) {
        await Swal.fire({
          icon:
            "warning",

          title:
            "File tidak valid",

          text:
            "Semua file harus berupa gambar.",

          confirmButtonColor:
            "#1688b5",
        });

        event.target.value =
          "";

        return;
      }

      const oversized =
        selectedFiles.find(
          (file) =>
            file.size >
            8 *
              1024 *
              1024
        );

      if (oversized) {
        await Swal.fire({
          icon:
            "warning",

          title:
            "Foto terlalu besar",

          text:
            "Maksimal ukuran setiap foto adalah 8 MB.",

          confirmButtonColor:
            "#1688b5",
        });

        event.target.value =
          "";

        return;
      }

      setIsUploading(
        true
      );

      const supabase =
        createClient();

      const uploaded:
        MemoryPhoto[] =
        [];

      try {
        for (
          let index = 0;
          index <
          selectedFiles.length;
          index++
        ) {
          const file =
            selectedFiles[index];

          const extension =
            getExtension(
              file.name
            );

          const fileName =
            `${crypto.randomUUID()}.${extension}`;

          const storagePath =
            `${memory.couple_id}/${memory.id}/${fileName}`;

          /*
           * STORAGE UPLOAD
           */

          const {
            error:
              uploadError,
          } =
            await supabase.storage
              .from(
                "memory-photos"
              )
              .upload(
                storagePath,
                file,
                {
                  cacheControl:
                    "3600",

                  upsert:
                    false,

                  contentType:
                    file.type,
                }
              );

          if (
            uploadError
          ) {
            throw new Error(
              uploadError.message
            );
          }

          /*
           * First ever photo
           * becomes cover automatically.
           */

          const shouldBeCover =
            photos.length ===
              0 &&
            uploaded.length ===
              0;

          /*
           * DATABASE ROW
           */

          const {
            data:
              photoRow,
            error:
              databaseError,
          } =
            await supabase
              .from(
                "memory_photos"
              )
              .insert({
                memory_id:
                  memory.id,

                uploaded_by:
                  user.id,

                storage_path:
                  storagePath,

                caption:
                  null,

                is_cover:
                  shouldBeCover,

                sort_order:
                  photos.length +
                  uploaded.length,
              })
              .select()
              .single();

          if (
            databaseError
          ) {
            await supabase.storage
              .from(
                "memory-photos"
              )
              .remove([
                storagePath,
              ]);

            throw new Error(
              databaseError.message
            );
          }

          /*
           * SIGNED URL
           */

          const {
            data:
              signedData,
          } =
            await supabase.storage
              .from(
                "memory-photos"
              )
              .createSignedUrl(
                storagePath,
                60 * 60
              );

          uploaded.push({
            ...(photoRow as Omit<
              MemoryPhoto,
              "signed_url"
            >),

            signed_url:
              signedData?.signedUrl ??
              null,
          });
        }

        setPhotos(
          (current) => [
            ...current,
            ...uploaded,
          ]
        );

        await Swal.fire({
          icon:
            "success",

          title:
            selectedFiles.length >
            1
              ? `${selectedFiles.length} foto ditambahkan`
              : "Foto ditambahkan",

          timer:
            1200,

          showConfirmButton:
            false,
        });
      } catch (error) {
        await showError(
          "Upload gagal",
          error instanceof
            Error
            ? error.message
            : "Terjadi kesalahan saat upload."
        );
      } finally {
        setIsUploading(
          false
        );

        event.target.value =
          "";
      }
    };

  /*
   * =========================================================
   * SET COVER
   * =========================================================
   */

  const handleSetCover =
    async (
      photo:
        MemoryPhoto
    ) => {
      if (
        photo.is_cover
      ) {
        return;
      }

      const result =
        await Swal.fire({
          icon:
            "question",

          title:
            "Jadikan cover?",

          text:
            "Foto ini akan menjadi cover Memory.",

          showCancelButton:
            true,

          confirmButtonText:
            "Set as Cover",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#1688b5",
        });

      if (
        !result.isConfirmed
      ) {
        return;
      }

      const supabase =
        createClient();

      /*
       * Remove previous cover.
       */

      const {
        error:
          resetError,
      } =
        await supabase
          .from(
            "memory_photos"
          )
          .update({
            is_cover:
              false,
          })
          .eq(
            "memory_id",
            memory.id
          )
          .eq(
            "is_cover",
            true
          );

      if (
        resetError
      ) {
        await showError(
          "Cover gagal diubah",
          resetError.message
        );

        return;
      }

      /*
       * New cover.
       */

      const {
        error,
      } =
        await supabase
          .from(
            "memory_photos"
          )
          .update({
            is_cover:
              true,
          })
          .eq(
            "id",
            photo.id
          );

      if (error) {
        await showError(
          "Cover gagal diubah",
          error.message
        );

        return;
      }

      setPhotos(
        (current) =>
          current.map(
            (item) => ({
              ...item,

              is_cover:
                item.id ===
                photo.id,
            })
          )
      );

      await Swal.fire({
        icon:
          "success",

        title:
          "Cover diperbarui",

        timer:
          900,

        showConfirmButton:
          false,
      });
    };

  /*
   * =========================================================
   * EDIT CAPTION
   * =========================================================
   */

  const handleEditCaption =
    async (
      photo:
        MemoryPhoto
    ) => {
      const result =
        await Swal.fire({
          title:
            "Photo Caption",

          input:
            "text",

          inputValue:
            photo.caption ??
            "",

          inputPlaceholder:
            "Tulis caption...",

          showCancelButton:
            true,

          confirmButtonText:
            "Simpan",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#1688b5",
        });

      if (
        !result.isConfirmed
      ) {
        return;
      }

      const caption =
        String(
          result.value ??
            ""
        ).trim();

      const supabase =
        createClient();

      const {
        error,
      } =
        await supabase
          .from(
            "memory_photos"
          )
          .update({
            caption:
              caption ||
              null,
          })
          .eq(
            "id",
            photo.id
          );

      if (error) {
        await showError(
          "Caption gagal disimpan",
          error.message
        );

        return;
      }

      setPhotos(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              photo.id
                ? {
                    ...item,

                    caption:
                      caption ||
                      null,
                  }
                : item
          )
      );

      await Swal.fire({
        icon:
          "success",

        title:
          "Caption disimpan",

        timer:
          800,

        showConfirmButton:
          false,
      });
    };

  /*
   * =========================================================
   * DELETE PHOTO
   * =========================================================
   */

  const handleDeletePhoto =
    async (
      photo:
        MemoryPhoto
    ) => {
      const result =
        await Swal.fire({
          icon:
            "warning",

          title:
            "Hapus foto?",

          text:
            "Foto akan dihapus permanen.",

          showCancelButton:
            true,

          confirmButtonText:
            "Hapus",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#dc5f72",

          cancelButtonColor:
            "#1688b5",
        });

      if (
        !result.isConfirmed
      ) {
        return;
      }

      const supabase =
        createClient();

      /*
       * Delete database first.
       */

      const {
        error:
          databaseError,
      } =
        await supabase
          .from(
            "memory_photos"
          )
          .delete()
          .eq(
            "id",
            photo.id
          );

      if (
        databaseError
      ) {
        await showError(
          "Foto gagal dihapus",
          databaseError.message
        );

        return;
      }

      /*
       * Delete object.
       */

      await supabase.storage
        .from(
          "memory-photos"
        )
        .remove([
          photo.storage_path,
        ]);

      const remaining =
        photos.filter(
          (item) =>
            item.id !==
            photo.id
        );

      /*
       * If cover deleted,
       * assign first remaining photo.
       */

      if (
        photo.is_cover &&
        remaining.length >
          0
      ) {
        const nextCover =
          remaining[0];

        const {
          error:
            coverError,
        } =
          await supabase
            .from(
              "memory_photos"
            )
            .update({
              is_cover:
                true,
            })
            .eq(
              "id",
              nextCover.id
            );

        if (
          !coverError
        ) {
          nextCover.is_cover =
            true;
        }
      }

      setPhotos(
        [...remaining]
      );

      await Swal.fire({
        icon:
          "success",

        title:
          "Foto dihapus",

        timer:
          800,

        showConfirmButton:
          false,
      });
    };

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div
      className="
        min-h-[100svh]
        bg-[radial-gradient(circle_at_10%_0%,rgba(103,197,226,0.22),transparent_26%),radial-gradient(circle_at_90%_10%,rgba(244,219,184,0.32),transparent_28%),linear-gradient(145deg,#f5fbfe_0%,#fffdf8_48%,#f7efe5_100%)]
      "
    >
      <AppSidebar
        user={
          user
        }
      />

      <MobileBottomNav />

      <main
        className="
          min-h-[100svh]
          px-4
          pb-28
          pt-4
          sm:px-6
          sm:pt-6
          lg:ml-[290px]
          lg:px-7
          lg:pb-8
          xl:px-10
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1450px]
          "
        >
          {/* BACK */}

          <Link
            href="/memories"
            className="
              mb-5
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-ink-soft
              transition
              hover:text-ocean-700
            "
          >
            <ArrowLeft
              size={17}
            />

            Back to Memories
          </Link>

          {/* =====================================
              HERO
          ====================================== */}

          <section
            className="
              relative
              min-h-[380px]
              overflow-hidden
              rounded-[32px]
              bg-gradient-to-br
              from-ocean-900
              via-ocean-700
              to-ocean-500
              shadow-love-lg
              sm:min-h-[470px]
            "
          >
            {coverPhoto?.signed_url ? (
              <>
                <Image
                  src={
                    coverPhoto.signed_url
                  }
                  alt={
                    memory.title
                  }
                  fill
                  priority
                  unoptimized
                  className="
                    object-cover
                  "
                />

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-ocean-950/95
                    via-ocean-950/35
                    to-black/5
                  "
                />
              </>
            ) : (
              <>
                <div
                  className="
                    absolute
                    inset-0
                    bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,.15),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(158,223,240,.28),transparent_35%)]
                  "
                />

                <Images
                  size={200}
                  className="
                    absolute
                    -right-8
                    -top-10
                    text-white/[0.05]
                  "
                />
              </>
            )}

            {/* UPLOAD */}

            <label
              className="
                absolute
                right-4
                top-4
                z-20
                flex
                cursor-pointer
                items-center
                gap-2
                rounded-[15px]
                border
                border-white/20
                bg-black/20
                px-4
                py-2.5
                text-xs
                font-semibold
                text-white
                backdrop-blur-xl
                transition
                hover:bg-black/30
                sm:right-6
                sm:top-6
              "
            >
              <ImagePlus
                size={16}
              />

              {isUploading
                ? "Uploading..."
                : "Add Photos"}

              <input
                type="file"
                accept="image/*"
                multiple
                disabled={
                  isUploading
                }
                onChange={
                  handleUpload
                }
                className="hidden"
              />
            </label>

            {/* CONTENT */}

            <div
              className="
                absolute
                inset-x-0
                bottom-0
                z-10
                p-6
                text-white
                sm:p-8
                lg:p-10
              "
            >
              {memory.source_plan_id && (
                <span
                  className="
                    inline-flex
                    rounded-full
                    border
                    border-white/20
                    bg-white/10
                    px-3
                    py-1.5
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.15em]
                    backdrop-blur-xl
                  "
                >
                  From Planner
                </span>
              )}

              <h1
                className="
                  mt-3
                  max-w-4xl
                  font-display
                  text-4xl
                  font-semibold
                  sm:text-5xl
                  lg:text-6xl
                "
              >
                {memory.title}
              </h1>

              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  gap-2
                "
              >
                <HeroPill
                  icon={
                    CalendarDays
                  }
                >
                  {formatDate(
                    memory.memory_date
                  )}
                </HeroPill>

                {memory.memory_time && (
                  <HeroPill
                    icon={
                      Clock3
                    }
                  >
                    {formatTime(
                      memory.memory_time
                    )}
                  </HeroPill>
                )}

                {memory.location_name && (
                  <HeroPill
                    icon={
                      MapPin
                    }
                  >
                    {
                      memory.location_name
                    }
                  </HeroPill>
                )}
              </div>
            </div>
          </section>

          {/* =====================================
              CONTENT
          ====================================== */}

          <section
            className="
              mt-5
              grid
              gap-5
              xl:grid-cols-[0.72fr_1.28fr]
            "
          >
            {/* STORY */}

            <div
              className="
                space-y-5
              "
            >
              <article
                className="
                  glass-card
                  rounded-[28px]
                  p-6
                "
              >
                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.2em]
                    text-ocean-500
                  "
                >
                  Story
                </p>

                <h2
                  className="
                    mt-1
                    font-display
                    text-2xl
                    font-semibold
                    text-ocean-950
                  "
                >
                  About this memory
                </h2>

                <p
                  className="
                    mt-5
                    whitespace-pre-line
                    text-sm
                    leading-7
                    text-ink-soft
                  "
                >
                  {memory.story ||
                    "Belum ada cerita untuk memory ini."}
                </p>
              </article>

              {/* INFO */}

              <article
                className="
                  glass-card
                  rounded-[28px]
                  p-6
                "
              >
                <h2
                  className="
                    font-display
                    text-xl
                    font-semibold
                    text-ocean-950
                  "
                >
                  Memory Details
                </h2>

                <div
                  className="
                    mt-5
                    space-y-4
                  "
                >
                  <DetailRow
                    icon={
                      CalendarDays
                    }
                    label="Date"
                    value={formatDate(
                      memory.memory_date
                    )}
                  />

                  <DetailRow
                    icon={
                      Clock3
                    }
                    label="Time"
                    value={
                      memory.memory_time
                        ? formatTime(
                            memory.memory_time
                          )
                        : "Not specified"
                    }
                  />

                  <DetailRow
                    icon={
                      MapPin
                    }
                    label="Location"
                    value={
                      memory.location_name ||
                      "Not specified"
                    }
                  />
                </div>

                {memory.maps_url && (
                  <a
                    href={
                      memory.maps_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="
                      mt-6
                      flex
                      items-center
                      justify-center
                      gap-2
                      rounded-[15px]
                      bg-ocean-100
                      px-4
                      py-3
                      text-sm
                      font-semibold
                      text-ocean-700
                      transition
                      hover:bg-ocean-200
                    "
                  >
                    Open Google Maps

                    <ExternalLink
                      size={14}
                    />
                  </a>
                )}

                {memory.source_plan_id && (
                  <Link
                    href={`/planner/${memory.source_plan_id}`}
                    className="
                      mt-2
                      flex
                      items-center
                      justify-center
                      gap-2
                      rounded-[15px]
                      border
                      border-ocean-100
                      bg-white/70
                      px-4
                      py-3
                      text-sm
                      font-semibold
                      text-ocean-700
                    "
                  >
                    Original Plan

                    <ExternalLink
                      size={14}
                    />
                  </Link>
                )}
              </article>
            </div>

            {/* =====================================
                PHOTO GALLERY
            ====================================== */}

            <article
              className="
                glass-card
                rounded-[28px]
                p-5
                sm:p-6
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.2em]
                      text-ocean-500
                    "
                  >
                    Photos
                  </p>

                  <h2
                    className="
                      mt-1
                      font-display
                      text-2xl
                      font-semibold
                      text-ocean-950
                    "
                  >
                    Memory Gallery
                  </h2>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-ink-soft
                    "
                  >
                    {photos.length} photo
                    {photos.length ===
                    1
                      ? ""
                      : "s"}
                  </p>
                </div>

                <label
                  className="
                    flex
                    cursor-pointer
                    items-center
                    justify-center
                    gap-2
                    rounded-[15px]
                    bg-ocean-700
                    px-4
                    py-2.5
                    text-xs
                    font-semibold
                    text-white
                    transition
                    hover:bg-ocean-800
                  "
                >
                  <Camera
                    size={15}
                  />

                  Add Photos

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={
                      isUploading
                    }
                    onChange={
                      handleUpload
                    }
                    className="hidden"
                  />
                </label>
              </div>

              {photos.length >
              0 ? (
                <div
                  className="
                    mt-6
                    grid
                    grid-cols-2
                    gap-3
                    lg:grid-cols-3
                  "
                >
                  {photos.map(
                    (photo) => (
                      <PhotoCard
                        key={
                          photo.id
                        }
                        photo={
                          photo
                        }
                        onSetCover={() =>
                          handleSetCover(
                            photo
                          )
                        }
                        onEditCaption={() =>
                          handleEditCaption(
                            photo
                          )
                        }
                        onDelete={() =>
                          handleDeletePhoto(
                            photo
                          )
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <div
                  className="
                    mt-6
                    rounded-[24px]
                    border
                    border-dashed
                    border-ocean-200
                    px-5
                    py-16
                    text-center
                  "
                >
                  <Images
                    size={34}
                    className="
                      mx-auto
                      text-ocean-300
                    "
                  />

                  <p
                    className="
                      mt-4
                      font-semibold
                      text-ocean-950
                    "
                  >
                    Belum ada foto
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-ink-soft
                    "
                  >
                    Upload foto untuk
                    mengisi memory ini.
                  </p>
                </div>
              )}
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}

/*
 * =========================================================
 * PHOTO CARD
 * =========================================================
 */

function PhotoCard({
  photo,
  onSetCover,
  onEditCaption,
  onDelete,
}: {
  photo:
    MemoryPhoto;

  onSetCover:
    () => void;

  onEditCaption:
    () => void;

  onDelete:
    () => void;
}) {
  return (
    <div
      className="
        group
        relative
        aspect-[4/5]
        overflow-hidden
        rounded-[20px]
        bg-ocean-50
      "
    >
      {photo.signed_url ? (
        <Image
          src={
            photo.signed_url
          }
          alt={
            photo.caption ||
            "Memory photo"
          }
          fill
          unoptimized
          className="
            object-cover
            transition
            duration-500
            group-hover:scale-[1.03]
          "
        />
      ) : (
        <div
          className="
            flex
            h-full
            items-center
            justify-center
            text-ocean-300
          "
        >
          <Images
            size={30}
          />
        </div>
      )}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-t
          from-ocean-950/85
          via-transparent
          to-black/10
        "
      />

      {photo.is_cover && (
        <div
          className="
            absolute
            left-3
            top-3
            flex
            items-center
            gap-1.5
            rounded-full
            bg-white/90
            px-2.5
            py-1.5
            text-[9px]
            font-bold
            uppercase
            tracking-[0.08em]
            text-ocean-800
            backdrop-blur
          "
        >
          <Star
            size={11}
            fill="currentColor"
          />

          Cover
        </div>
      )}

      <div
        className="
          absolute
          inset-x-0
          bottom-0
          p-3
        "
      >
        {photo.caption && (
          <p
            className="
              mb-3
              line-clamp-2
              text-xs
              leading-5
              text-white/90
            "
          >
            {photo.caption}
          </p>
        )}

        <div
          className="
            flex
            gap-1.5
          "
        >
          {!photo.is_cover && (
            <button
              type="button"
              onClick={
                onSetCover
              }
              title="Set as cover"
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-[10px]
                bg-white/90
                text-ocean-700
                transition
                hover:bg-white
              "
            >
              <Star
                size={13}
              />
            </button>
          )}

          <button
            type="button"
            onClick={
              onEditCaption
            }
            title="Edit caption"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-[10px]
              bg-white/90
              text-ocean-700
            "
          >
            <Heart
              size={13}
            />
          </button>

          <button
            type="button"
            onClick={
              onDelete
            }
            title="Delete photo"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-[10px]
              bg-white/90
              text-heart
            "
          >
            <Trash2
              size={13}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * HERO PILL
 * =========================================================
 */

function HeroPill({
  icon: Icon,
  children,
}: {
  icon:
    React.ElementType;

  children:
    React.ReactNode;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-2
        rounded-full
        border
        border-white/20
        bg-black/15
        px-4
        py-2
        text-xs
        font-semibold
        backdrop-blur-xl
      "
    >
      <Icon
        size={14}
      />

      {children}
    </div>
  );
}

/*
 * =========================================================
 * DETAIL ROW
 * =========================================================
 */

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ElementType;

  label:
    string;

  value:
    string;
}) {
  return (
    <div
      className="
        flex
        items-start
        gap-3
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-[13px]
          bg-ocean-50
          text-ocean-600
        "
      >
        <Icon
          size={16}
        />
      </div>

      <div>
        <p
          className="
            text-[10px]
            uppercase
            tracking-[0.08em]
            text-ink-soft
          "
        >
          {label}
        </p>

        <p
          className="
            mt-1
            text-sm
            font-semibold
            text-ocean-950
          "
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * FORMATTERS
 * =========================================================
 */

function formatDate(
  value:
    string
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    new Date(
      `${value}T00:00:00`
    )
  );
}

function formatTime(
  value:
    string
) {
  return value.slice(
    0,
    5
  );
}

function getExtension(
  fileName:
    string
) {
  const extension =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      );

  return (
    extension ||
    "jpg"
  );
}

/*
 * =========================================================
 * ERROR
 * =========================================================
 */

async function showError(
  title:
    string,

  message:
    string
) {
  await Swal.fire({
    icon:
      "error",

    title,

    text:
      message,

    confirmButtonColor:
      "#1688b5",
  });
}