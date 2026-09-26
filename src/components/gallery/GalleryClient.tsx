// src/components/gallery/GalleryClient.tsx

"use client";

import Image from "next/image";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Camera,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Star,
  X,
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

type Visibility = "shared" | "private";

type GalleryTab =
  | "photos"
  | "albums"
  | "favorites"
  | "vault";

type UploadDestination = Visibility;

type CameraSide =
  | "user"
  | "environment";

type GalleryUser = {
  id: string;
  email: string;
  fullName: string;
  nickname: string;
  avatarUrl: string | null;
};

type GalleryAlbum = {
  id: string;
  couple_id: string;
  created_by: string;
  owner_id: string;
  name: string;
  description: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

type GalleryPhoto = {
  id: string;
  couple_id: string;

  album_id:
    | string
    | null;

  uploaded_by: string;
  owner_id: string;

  storage_bucket: string;
  storage_path: string;

  title:
    | string
    | null;

  caption:
    | string
    | null;

  visibility: Visibility;

  source_type:
    | "upload"
    | "memory";

  source_memory_photo_id:
    | string
    | null;

  is_favorite: boolean;

  created_at: string;
  updated_at: string;

  signed_url:
    | string
    | null;
};

type GalleryClientProps = {
  user: GalleryUser;
  coupleId: string;

  initialAlbums:
    GalleryAlbum[];

  initialPhotos:
    GalleryPhoto[];
};

type UploadGalleryFileOptions = {
  file: File;
  userId: string;
  coupleId: string;

  visibility:
    Visibility;

  albumId:
    string | null;

  title?:
    string | null;

  note?:
    string | null;
};

/*
 * =========================================================
 * MAIN
 * =========================================================
 */

export default function GalleryClient({
  user,
  coupleId,
  initialAlbums,
  initialPhotos,
}: GalleryClientProps) {
  const [albums, setAlbums] =
    useState<GalleryAlbum[]>(
      initialAlbums
    );

  const [photos, setPhotos] =
    useState<GalleryPhoto[]>(
      initialPhotos
    );

  const [activeTab, setActiveTab] =
    useState<GalleryTab>(
      "photos"
    );

  const [
    selectedAlbumId,
    setSelectedAlbumId,
  ] =
    useState<string | null>(
      null
    );

  const [
    activePhotoId,
    setActivePhotoId,
  ] =
    useState<string | null>(
      null
    );

  const [
    editingPhoto,
    setEditingPhoto,
  ] =
    useState<GalleryPhoto | null>(
      null
    );

  const [
    uploadOpen,
    setUploadOpen,
  ] =
    useState(false);

  const [
    albumOpen,
    setAlbumOpen,
  ] =
    useState(false);

  const [
    editingAlbum,
    setEditingAlbum,
  ] =
    useState<GalleryAlbum | null>(
      null
    );

  const [
    vaultUnlocked,
    setVaultUnlocked,
  ] =
    useState(false);

  /*
   * CAMERA
   */

  const [
    cameraOpen,
    setCameraOpen,
  ] =
    useState(false);

  const [
    cameraFile,
    setCameraFile,
  ] =
    useState<File | null>(
      null
    );

  /*
   * =========================================================
   * COLLECTIONS
   * =========================================================
   */

  const sharedPhotos =
    useMemo(
      () =>
        photos.filter(
          (photo) =>
            photo.visibility ===
            "shared"
        ),
      [photos]
    );

  const privatePhotos =
    useMemo(
      () =>
        photos.filter(
          (photo) =>
            photo.visibility ===
              "private" &&
            photo.owner_id ===
              user.id
        ),
      [
        photos,
        user.id,
      ]
    );

  const favoritePhotos =
    useMemo(
      () =>
        sharedPhotos.filter(
          (photo) =>
            photo.is_favorite
        ),
      [sharedPhotos]
    );

  /*
   * =========================================================
   * CURRENT ALBUM
   * =========================================================
   */

  const selectedAlbum =
    albums.find(
      (album) =>
        album.id ===
        selectedAlbumId
    ) ?? null;

  /*
   * =========================================================
   * DISPLAYED PHOTOS
   * =========================================================
   */

  const displayedPhotos =
    useMemo(() => {
      if (selectedAlbumId) {
        return photos.filter(
          (photo) =>
            photo.album_id ===
            selectedAlbumId
        );
      }

      if (
        activeTab ===
        "favorites"
      ) {
        return favoritePhotos;
      }

      if (
        activeTab ===
        "vault"
      ) {
        return privatePhotos;
      }

      return sharedPhotos;
    }, [
      activeTab,
      favoritePhotos,
      photos,
      privatePhotos,
      selectedAlbumId,
      sharedPhotos,
    ]);

  /*
   * =========================================================
   * ACTIVE PHOTO
   * =========================================================
   */

  const activePhotoIndex =
    displayedPhotos.findIndex(
      (photo) =>
        photo.id ===
        activePhotoId
    );

  const activePhoto =
    activePhotoIndex >= 0
      ? displayedPhotos[
          activePhotoIndex
        ]
      : null;

  /*
   * =========================================================
   * CAMERA DEFAULT DESTINATION
   * =========================================================
   */

  const cameraDefaultVisibility:
    Visibility =
    selectedAlbum
      ? selectedAlbum.visibility
      : activeTab === "vault"
        ? "private"
        : "shared";

  const cameraDefaultAlbumId =
    selectedAlbum?.id ??
    null;

  /*
   * =========================================================
   * LIGHTBOX NAVIGATION
   * =========================================================
   */

  const showPreviousPhoto =
    () => {
      if (
        displayedPhotos.length ===
        0
      ) {
        return;
      }

      const index =
        activePhotoIndex <= 0
          ? displayedPhotos.length -
            1
          : activePhotoIndex -
            1;

      setActivePhotoId(
        displayedPhotos[index].id
      );
    };

  const showNextPhoto =
    () => {
      if (
        displayedPhotos.length ===
        0
      ) {
        return;
      }

      const index =
        activePhotoIndex >=
        displayedPhotos.length - 1
          ? 0
          : activePhotoIndex + 1;

      setActivePhotoId(
        displayedPhotos[index].id
      );
    };

  /*
   * =========================================================
   * VAULT
   * =========================================================
   */

  const handleOpenVault =
    async () => {
      setSelectedAlbumId(
        null
      );

      if (vaultUnlocked) {
        setActiveTab(
          "vault"
        );

        return;
      }

      const result =
        await Swal.fire({
          title:
            "Private Vault",

          input:
            "password",

          inputPlaceholder:
            "Password akun",

          showCancelButton:
            true,

          confirmButtonText:
            "Unlock",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#0b4f71",

          inputAttributes: {
            autocomplete:
              "current-password",
          },

          inputValidator: (
            value
          ) => {
            if (!value) {
              return "Masukkan password.";
            }

            return undefined;
          },
        });

      if (
        !result.isConfirmed ||
        !result.value
      ) {
        return;
      }

      const supabase =
        createClient();

      const { error } =
        await supabase.auth
          .signInWithPassword({
            email:
              user.email,

            password:
              result.value,
          });

      if (error) {
        await Swal.fire({
          icon:
            "error",

          title:
            "Password salah",

          confirmButtonColor:
            "#1688b5",
        });

        return;
      }

      setVaultUnlocked(
        true
      );

      setActiveTab(
        "vault"
      );
    };

  /*
   * =========================================================
   * FAVORITE
   * =========================================================
   */

  const handleToggleFavorite =
    async (
      photo:
        GalleryPhoto
    ) => {
      const newValue =
        !photo.is_favorite;

      const supabase =
        createClient();

      /*
       * Optimistic UI
       */

      setPhotos(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              photo.id
                ? {
                    ...item,

                    is_favorite:
                      newValue,
                  }
                : item
          )
      );

      const { error } =
        await supabase
          .from(
            "gallery_photos"
          )
          .update({
            is_favorite:
              newValue,
          })
          .eq(
            "id",
            photo.id
          );

      if (error) {
        setPhotos(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                photo.id
                  ? photo
                  : item
            )
        );

        await showError(
          "Favorite gagal diperbarui",
          error.message
        );
      }
    };

  /*
   * =========================================================
   * EDIT PHOTO INFO
   * =========================================================
   */

  const handlePhotoInfoSaved =
    (
      updatedPhoto:
        GalleryPhoto
    ) => {
      setPhotos(
        (current) =>
          current.map(
            (photo) =>
              photo.id ===
              updatedPhoto.id
                ? updatedPhoto
                : photo
          )
      );

      setEditingPhoto(
        null
      );
    };

  /*
   * =========================================================
   * DELETE PHOTO
   * =========================================================
   */

  const handleDeletePhoto =
    async (
      photo:
        GalleryPhoto
    ) => {
      const result =
        await Swal.fire({
          icon:
            "warning",

          title:
            "Hapus foto?",

          text:
            photo.source_type ===
            "memory"
              ? "Foto akan dihapus dari Gallery. Foto asli di Memory tetap ada."
              : "Foto akan dihapus permanen.",

          showCancelButton:
            true,

          confirmButtonText:
            "Hapus",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#dc5f72",
        });

      if (
        !result.isConfirmed
      ) {
        return;
      }

      const supabase =
        createClient();

      const { error } =
        await supabase
          .from(
            "gallery_photos"
          )
          .delete()
          .eq(
            "id",
            photo.id
          );

      if (error) {
        await showError(
          "Foto gagal dihapus",
          error.message
        );

        return;
      }

      /*
       * Foto dari memory-photos tidak
       * boleh dihapus file aslinya.
       */

      if (
        photo.storage_bucket ===
        "gallery-media"
      ) {
        await supabase.storage
          .from(
            "gallery-media"
          )
          .remove([
            photo.storage_path,
          ]);
      }

      setPhotos(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              photo.id
          )
      );

      if (
        activePhotoId ===
        photo.id
      ) {
        setActivePhotoId(
          null
        );
      }
    };

  /*
   * =========================================================
   * MOVE PHOTO TO ALBUM
   * =========================================================
   */

  const handleMoveToAlbum =
    async (
      photo:
        GalleryPhoto
    ) => {
      const availableAlbums =
        albums.filter(
          (album) =>
            album.visibility ===
            photo.visibility
        );

      const inputOptions:
        Record<
          string,
          string
        > = {
        "": "No Album",
      };

      for (
        const album of availableAlbums
      ) {
        inputOptions[
          album.id
        ] =
          album.name;
      }

      const result =
        await Swal.fire({
          title:
            "Move to Album",

          input:
            "select",

          inputOptions,

          inputValue:
            photo.album_id ??
            "",

          showCancelButton:
            true,

          confirmButtonText:
            "Save",

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

      const newAlbumId =
        result.value ||
        null;

      const supabase =
        createClient();

      const { error } =
        await supabase
          .from(
            "gallery_photos"
          )
          .update({
            album_id:
              newAlbumId,
          })
          .eq(
            "id",
            photo.id
          );

      if (error) {
        await showError(
          "Album gagal diperbarui",
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

                    album_id:
                      newAlbumId,
                  }
                : item
          )
      );

      setActivePhotoId(
        null
      );
    };

  /*
   * =========================================================
   * OPEN ALBUM
   * =========================================================
   */

  const handleOpenAlbum =
    (
      album:
        GalleryAlbum
    ) => {
      if (
        album.visibility ===
          "private" &&
        !vaultUnlocked
      ) {
        return;
      }

      setSelectedAlbumId(
        album.id
      );
    };

  /*
   * =========================================================
   * DELETE ALBUM
   * =========================================================
   */

  const handleDeleteAlbum =
    async (
      album:
        GalleryAlbum
    ) => {
      const result =
        await Swal.fire({
          icon:
            "warning",

          title:
            "Hapus album?",

          text:
            "Foto di dalam album tidak ikut dihapus.",

          showCancelButton:
            true,

          confirmButtonText:
            "Hapus",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#dc5f72",
        });

      if (
        !result.isConfirmed
      ) {
        return;
      }

      const supabase =
        createClient();

      const { error } =
        await supabase
          .from(
            "gallery_albums"
          )
          .delete()
          .eq(
            "id",
            album.id
          );

      if (error) {
        await showError(
          "Album gagal dihapus",
          error.message
        );

        return;
      }

      setAlbums(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              album.id
          )
      );

      setPhotos(
        (current) =>
          current.map(
            (photo) =>
              photo.album_id ===
              album.id
                ? {
                    ...photo,

                    album_id:
                      null,
                  }
                : photo
          )
      );

      if (
        selectedAlbumId ===
        album.id
      ) {
        setSelectedAlbumId(
          null
        );
      }
    };

  /*
   * =========================================================
   * CAMERA CAPTURED
   * =========================================================
   */

  const handleCameraCaptured =
    (
      file:
        File
    ) => {
      setCameraOpen(
        false
      );

      setCameraFile(
        file
      );
    };

  /*
   * =========================================================
   * CAMERA PHOTO SAVED
   * =========================================================
   */

  const handleCameraPhotoSaved =
    (
      photo:
        GalleryPhoto
    ) => {
      setPhotos(
        (current) => [
          photo,
          ...current,
        ]
      );

      setCameraFile(
        null
      );

      /*
       * Kalau foto disimpan ke Vault,
       * pindah ke tab Vault hanya kalau
       * Vault memang sudah terbuka.
       */

      if (
        photo.visibility ===
          "private" &&
        vaultUnlocked
      ) {
        setSelectedAlbumId(
          null
        );

        setActiveTab(
          "vault"
        );
      }
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
        bg-[linear-gradient(145deg,#f5fbfe_0%,#fffdf8_55%,#f7efe5_100%)]
      "
    >
      <AppSidebar
        user={user}
      />

      <MobileBottomNav />

      <main
        className="
          min-h-[100svh]
          px-4
          pb-28
          pt-5
          sm:px-6
          lg:ml-[290px]
          lg:px-8
          lg:pb-8
          xl:px-10
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1500px]
          "
        >
          {/* HEADER */}

          <header
            className="
              flex
              items-end
              justify-between
              gap-4
            "
          >
            <div>
              {selectedAlbum && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedAlbumId(
                      null
                    )
                  }
                  className="
                    mb-3
                    text-sm
                    font-semibold
                    text-ink-soft
                    transition
                    hover:text-ocean-800
                  "
                >
                  ← Albums
                </button>
              )}

              <h1
                className="
                  font-display
                  text-4xl
                  font-semibold
                  text-ocean-950
                "
              >
                {selectedAlbum
                  ? selectedAlbum.name
                  : activeTab ===
                      "vault"
                    ? "Private Vault"
                    : "Gallery"}
              </h1>
            </div>

            {(activeTab ===
              "photos" ||
              activeTab ===
                "vault" ||
              selectedAlbum) && (
              <button
                type="button"
                onClick={() =>
                  setUploadOpen(
                    true
                  )
                }
                className="
                  rounded-full
                  bg-ocean-900
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-ocean-800
                "
              >
                + Add Photos
              </button>
            )}

            {activeTab ===
              "albums" &&
              !selectedAlbum && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAlbum(
                      null
                    );

                    setAlbumOpen(
                      true
                    );
                  }}
                  className="
                    rounded-full
                    bg-ocean-900
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-ocean-800
                  "
                >
                  + New Album
                </button>
              )}
          </header>

          {/* TABS */}

          {!selectedAlbum && (
            <nav
              className="
                mt-7
                flex
                gap-7
                overflow-x-auto
                border-b
                border-ocean-100
              "
            >
              <TabButton
                active={
                  activeTab ===
                  "photos"
                }
                onClick={() => {
                  setSelectedAlbumId(
                    null
                  );

                  setActiveTab(
                    "photos"
                  );
                }}
              >
                Photos
              </TabButton>

              <TabButton
                active={
                  activeTab ===
                  "albums"
                }
                onClick={() => {
                  setSelectedAlbumId(
                    null
                  );

                  setActiveTab(
                    "albums"
                  );
                }}
              >
                Albums
              </TabButton>

              <TabButton
                active={
                  activeTab ===
                  "favorites"
                }
                onClick={() => {
                  setSelectedAlbumId(
                    null
                  );

                  setActiveTab(
                    "favorites"
                  );
                }}
              >
                Favorites
              </TabButton>

              <TabButton
                active={
                  activeTab ===
                  "vault"
                }
                onClick={
                  handleOpenVault
                }
              >
                Vault
              </TabButton>
            </nav>
          )}

          {/* CONTENT */}

          {activeTab ===
            "vault" &&
          !vaultUnlocked &&
          !selectedAlbum ? (
            <VaultLocked
              onUnlock={
                handleOpenVault
              }
            />
          ) : activeTab ===
              "albums" &&
            !selectedAlbum ? (
            <AlbumsView
              albums={
                albums
              }
              photos={
                photos
              }
              userId={
                user.id
              }
              vaultUnlocked={
                vaultUnlocked
              }
              onOpen={
                handleOpenAlbum
              }
              onEdit={(
                album
              ) => {
                setEditingAlbum(
                  album
                );

                setAlbumOpen(
                  true
                );
              }}
              onDelete={
                handleDeleteAlbum
              }
            />
          ) : (
            <PhotoGrid
              photos={
                displayedPhotos
              }
              emptyLabel={
                activeTab ===
                "favorites"
                  ? "Belum ada foto favorit"
                  : activeTab ===
                      "vault"
                    ? "Vault masih kosong"
                    : selectedAlbum
                      ? "Album masih kosong"
                      : "Belum ada foto"
              }
              onOpen={(
                photo
              ) =>
                setActivePhotoId(
                  photo.id
                )
              }
            />
          )}
        </div>
      </main>

      {/* =====================================================
          FLOATING CAMERA BUTTON
          ===================================================== */}

      <button
        type="button"
        onClick={() =>
          setCameraOpen(
            true
          )
        }
        aria-label="Open camera"
        className="
          fixed
          bottom-24
          right-4
          z-[900]
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-ocean-900
          text-white
          shadow-[0_12px_35px_rgba(6,42,63,0.28)]
          transition
          hover:scale-105
          hover:bg-ocean-800
          active:scale-95
          sm:right-6
          lg:bottom-7
          lg:right-7
        "
      >
        <Camera
          size={22}
        />
      </button>

      {/* UPLOAD DEVICE */}

      {uploadOpen && (
        <UploadPhotosModal
          userId={
            user.id
          }
          coupleId={
            coupleId
          }
          albums={
            albums
          }
          defaultAlbumId={
            selectedAlbum?.id ??
            null
          }
          defaultVisibility={
            selectedAlbum
              ? selectedAlbum.visibility
              : activeTab ===
                  "vault"
                ? "private"
                : "shared"
          }
          onClose={() =>
            setUploadOpen(
              false
            )
          }
          onUploaded={(
            newPhotos
          ) => {
            setPhotos(
              (current) => [
                ...newPhotos,
                ...current,
              ]
            );

            setUploadOpen(
              false
            );
          }}
        />
      )}

      {/* CAMERA VIEW */}

      {cameraOpen && (
        <CameraCaptureModal
          onClose={() =>
            setCameraOpen(
              false
            )
          }
          onCapture={
            handleCameraCaptured
          }
        />
      )}

      {/* SAVE CAMERA PHOTO */}

      {cameraFile && (
        <CameraPhotoModal
          file={
            cameraFile
          }
          userId={
            user.id
          }
          coupleId={
            coupleId
          }
          albums={
            albums
          }
          defaultAlbumId={
            cameraDefaultAlbumId
          }
          defaultVisibility={
            cameraDefaultVisibility
          }
          vaultUnlocked={
            vaultUnlocked
          }
          onClose={() =>
            setCameraFile(
              null
            )
          }
          onSaved={
            handleCameraPhotoSaved
          }
        />
      )}

      {/* ALBUM MODAL */}

      {albumOpen && (
        <AlbumModal
          coupleId={
            coupleId
          }
          userId={
            user.id
          }
          editingAlbum={
            editingAlbum
          }
          vaultUnlocked={
            vaultUnlocked
          }
          onClose={() => {
            setAlbumOpen(
              false
            );

            setEditingAlbum(
              null
            );
          }}
          onSaved={(
            album
          ) => {
            setAlbums(
              (current) => {
                const exists =
                  current.some(
                    (item) =>
                      item.id ===
                      album.id
                  );

                if (exists) {
                  return current.map(
                    (item) =>
                      item.id ===
                      album.id
                        ? album
                        : item
                  );
                }

                return [
                  album,
                  ...current,
                ];
              }
            );

            setAlbumOpen(
              false
            );

            setEditingAlbum(
              null
            );
          }}
        />
      )}

      {/* PHOTO INFO */}

      {editingPhoto && (
        <PhotoInfoModal
          photo={
            editingPhoto
          }
          onClose={() =>
            setEditingPhoto(
              null
            )
          }
          onSaved={
            handlePhotoInfoSaved
          }
        />
      )}

      {/* LIGHTBOX */}

      {activePhoto && (
        <PhotoLightbox
          photo={
            activePhoto
          }
          index={
            activePhotoIndex
          }
          total={
            displayedPhotos.length
          }
          onClose={() =>
            setActivePhotoId(
              null
            )
          }
          onPrevious={
            showPreviousPhoto
          }
          onNext={
            showNextPhoto
          }
          onFavorite={() =>
            handleToggleFavorite(
              activePhoto
            )
          }
          onMove={() =>
            handleMoveToAlbum(
              activePhoto
            )
          }
          onEdit={() =>
            setEditingPhoto(
              activePhoto
            )
          }
          onDelete={() =>
            handleDeletePhoto(
              activePhoto
            )
          }
        />
      )}
    </div>
  );
}

/*
 * =========================================================
 * TABS
 * =========================================================
 */

function TabButton({
  active,
  onClick,
  children,
}: {
  active:
    boolean;

  onClick:
    () => void;

  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        shrink-0
        border-b-2
        pb-3
        text-sm
        font-semibold
        transition
        ${
          active
            ? "border-ocean-900 text-ocean-950"
            : "border-transparent text-ink-soft hover:text-ocean-800"
        }
      `}
    >
      {children}
    </button>
  );
}

/*
 * =========================================================
 * PHOTO GRID
 * =========================================================
 */

function PhotoGrid({
  photos,
  emptyLabel,
  onOpen,
}: {
  photos:
    GalleryPhoto[];

  emptyLabel:
    string;

  onOpen:
    (
      photo:
        GalleryPhoto
    ) => void;
}) {
  if (
    photos.length ===
    0
  ) {
    return (
      <div
        className="
          py-24
          text-center
          text-sm
          text-ink-soft
        "
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <section
      className="
        mt-6
        columns-2
        gap-2
        sm:columns-3
        lg:columns-4
        2xl:columns-5
      "
    >
      {photos.map(
        (
          photo,
          index
        ) => (
          <button
            key={
              photo.id
            }
            type="button"
            onClick={() =>
              onOpen(
                photo
              )
            }
            className={`
              group
              relative
              mb-2
              block
              w-full
              break-inside-avoid
              overflow-hidden
              rounded-[14px]
              bg-ocean-50

              ${
                index % 7 ===
                0
                  ? "aspect-[4/5]"
                  : index % 5 ===
                      0
                    ? "aspect-square"
                    : "aspect-[3/4]"
              }
            `}
          >
            {photo.signed_url ? (
              <Image
                src={
                  photo.signed_url
                }
                alt={
                  photo.title ||
                  photo.caption ||
                  "Gallery photo"
                }
                fill
                unoptimized
                className="
                  object-cover
                  transition
                  duration-500
                  group-hover:scale-[1.02]
                "
              />
            ) : (
              <div
                className="
                  h-full
                  w-full
                  bg-ocean-100
                "
              />
            )}

            {photo.is_favorite && (
              <span
                className="
                  absolute
                  right-3
                  top-3
                  text-white
                  drop-shadow-md
                "
              >
                <Star
                  size={16}
                  fill="currentColor"
                />
              </span>
            )}

            {photo.source_type ===
              "memory" && (
              <span
                className="
                  absolute
                  bottom-3
                  left-3
                  rounded-full
                  bg-black/35
                  px-2.5
                  py-1
                  text-[9px]
                  font-semibold
                  text-white
                  backdrop-blur-md
                "
              >
                Memory
              </span>
            )}
          </button>
        )
      )}
    </section>
  );
}

/*
 * =========================================================
 * ALBUMS
 * =========================================================
 */

function AlbumsView({
  albums,
  photos,
  userId,
  vaultUnlocked,
  onOpen,
  onEdit,
  onDelete,
}: {
  albums:
    GalleryAlbum[];

  photos:
    GalleryPhoto[];

  userId:
    string;

  vaultUnlocked:
    boolean;

  onOpen:
    (
      album:
        GalleryAlbum
    ) => void;

  onEdit:
    (
      album:
        GalleryAlbum
    ) => void;

  onDelete:
    (
      album:
        GalleryAlbum
    ) => void;
}) {
  const visibleAlbums =
    albums.filter(
      (album) =>
        album.visibility ===
          "shared" ||
        (
          album.owner_id ===
            userId &&
          vaultUnlocked
        )
    );

  if (
    visibleAlbums.length ===
    0
  ) {
    return (
      <div
        className="
          py-24
          text-center
          text-sm
          text-ink-soft
        "
      >
        Belum ada album
      </div>
    );
  }

  return (
    <section
      className="
        mt-6
        grid
        gap-5
        sm:grid-cols-2
        xl:grid-cols-3
      "
    >
      {visibleAlbums.map(
        (album) => {
          const albumPhotos =
            photos.filter(
              (photo) =>
                photo.album_id ===
                album.id
            );

          const cover =
            albumPhotos[0] ??
            null;

          return (
            <article
              key={
                album.id
              }
              className="group"
            >
              <button
                type="button"
                onClick={() =>
                  onOpen(
                    album
                  )
                }
                className="
                  relative
                  block
                  aspect-[16/10]
                  w-full
                  overflow-hidden
                  rounded-[20px]
                  bg-ocean-100
                "
              >
                {cover?.signed_url ? (
                  <Image
                    src={
                      cover.signed_url
                    }
                    alt={
                      album.name
                    }
                    fill
                    unoptimized
                    className="
                      object-cover
                      transition
                      duration-500
                      group-hover:scale-[1.02]
                    "
                  />
                ) : (
                  <div
                    className="
                      flex
                      h-full
                      items-center
                      justify-center
                      bg-gradient-to-br
                      from-ocean-100
                      to-cream
                      text-sm
                      text-ink-soft
                    "
                  >
                    Empty
                  </div>
                )}

                {album.visibility ===
                  "private" && (
                  <span
                    className="
                      absolute
                      right-3
                      top-3
                      rounded-full
                      bg-black/35
                      px-2.5
                      py-1
                      text-[9px]
                      font-semibold
                      text-white
                      backdrop-blur-md
                    "
                  >
                    Private
                  </span>
                )}
              </button>

              <div
                className="
                  mt-3
                  flex
                  items-start
                  justify-between
                  gap-3
                  px-1
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    onOpen(
                      album
                    )
                  }
                  className="
                    min-w-0
                    text-left
                  "
                >
                  <h2
                    className="
                      truncate
                      font-semibold
                      text-ocean-950
                    "
                  >
                    {album.name}
                  </h2>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-ink-soft
                    "
                  >
                    {
                      albumPhotos.length
                    }{" "}
                    photos
                  </p>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const result =
                      await Swal.fire({
                        title:
                          album.name,

                        showCancelButton:
                          true,

                        showDenyButton:
                          true,

                        confirmButtonText:
                          "Edit",

                        denyButtonText:
                          "Delete",

                        cancelButtonText:
                          "Close",

                        confirmButtonColor:
                          "#1688b5",

                        denyButtonColor:
                          "#dc5f72",
                      });

                    if (
                      result.isConfirmed
                    ) {
                      onEdit(
                        album
                      );
                    }

                    if (
                      result.isDenied
                    ) {
                      onDelete(
                        album
                      );
                    }
                  }}
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    text-ink-soft
                    transition
                    hover:bg-ocean-50
                  "
                >
                  <MoreHorizontal
                    size={17}
                  />
                </button>
              </div>
            </article>
          );
        }
      )}
    </section>
  );
}

/*
 * =========================================================
 * VAULT
 * =========================================================
 */

function VaultLocked({
  onUnlock,
}: {
  onUnlock:
    () => void;
}) {
  return (
    <section
      className="
        flex
        min-h-[55vh]
        items-center
        justify-center
      "
    >
      <div
        className="
          text-center
        "
      >
        <LockKeyhole
          size={28}
          className="
            mx-auto
            text-ocean-700
          "
        />

        <h2
          className="
            mt-5
            font-display
            text-3xl
            font-semibold
            text-ocean-950
          "
        >
          Private Vault
        </h2>

        <button
          type="button"
          onClick={
            onUnlock
          }
          className="
            mt-6
            rounded-full
            bg-ocean-900
            px-6
            py-3
            text-sm
            font-semibold
            text-white
          "
        >
          Enter Vault
        </button>
      </div>
    </section>
  );
}

/*
 * =========================================================
 * DEVICE UPLOAD
 * =========================================================
 */

function UploadPhotosModal({
  userId,
  coupleId,
  albums,
  defaultAlbumId,
  defaultVisibility,
  onClose,
  onUploaded,
}: {
  userId:
    string;

  coupleId:
    string;

  albums:
    GalleryAlbum[];

  defaultAlbumId:
    string | null;

  defaultVisibility:
    UploadDestination;

  onClose:
    () => void;

  onUploaded:
    (
      photos:
        GalleryPhoto[]
    ) => void;
}) {
  const [files, setFiles] =
    useState<File[]>([]);

  const [
    visibility,
    setVisibility,
  ] =
    useState<UploadDestination>(
      defaultVisibility
    );

  const [
    albumId,
    setAlbumId,
  ] =
    useState(
      defaultAlbumId ??
      ""
    );

  const [
    isUploading,
    setIsUploading,
  ] =
    useState(false);

  const availableAlbums =
    albums.filter(
      (album) =>
        album.visibility ===
        visibility
    );

  /*
   * DEVICE FILES
   */

  const handleFiles =
    (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const selected =
        Array.from(
          event.target.files ??
            []
        );

      if (
        selected.length ===
        0
      ) {
        return;
      }

      setFiles(
        (current) => [
          ...current,
          ...selected,
        ]
      );

      event.target.value =
        "";
    };

  /*
   * REMOVE
   */

  const handleRemoveFile =
    (
      index:
        number
    ) => {
      setFiles(
        (current) =>
          current.filter(
            (
              _,
              currentIndex
            ) =>
              currentIndex !==
              index
          )
      );
    };

  /*
   * UPLOAD
   */

  const handleUpload =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        files.length ===
        0
      ) {
        await showWarning(
          "Belum ada foto",
          "Pilih foto terlebih dahulu."
        );

        return;
      }

      const invalid =
        files.find(
          (file) =>
            !file.type.startsWith(
              "image/"
            )
        );

      if (invalid) {
        await showWarning(
          "File tidak valid",
          "Semua file harus berupa gambar."
        );

        return;
      }

      const oversized =
        files.find(
          (file) =>
            file.size >
            8 *
              1024 *
              1024
        );

      if (oversized) {
        await showWarning(
          "Foto terlalu besar",
          "Maksimal 8 MB per foto."
        );

        return;
      }

      setIsUploading(
        true
      );

      const created:
        GalleryPhoto[] =
        [];

      try {
        for (
          const file of files
        ) {
          const photo =
            await uploadGalleryFile({
              file,

              userId,

              coupleId,

              visibility,

              albumId:
                albumId ||
                null,

              title:
                null,

              note:
                null,
            });

          created.push(
            photo
          );
        }

        onUploaded(
          created
        );
      } catch (error) {
        await showError(
          "Upload gagal",
          error instanceof
            Error
            ? error.message
            : "Terjadi kesalahan."
        );
      } finally {
        setIsUploading(
          false
        );
      }
    };

  return (
    <ModalShell
      onClose={
        onClose
      }
      locked={
        isUploading
      }
    >
      <form
        onSubmit={
          handleUpload
        }
      >
        <ModalHeader
          title="Add Photos"
          onClose={
            onClose
          }
        />

        <div
          className="
            p-5
            sm:p-6
          "
        >
          {/* DEVICE ONLY */}

          <label
            className="
              flex
              min-h-[150px]
              cursor-pointer
              flex-col
              items-center
              justify-center
              rounded-[20px]
              border
              border-dashed
              border-ocean-200
              bg-ocean-50/40
              px-5
              text-center
              transition
              hover:bg-ocean-50
            "
          >
            <Plus
              size={22}
              className="
                text-ocean-600
              "
            />

            <p
              className="
                mt-3
                text-sm
                font-semibold
                text-ocean-950
              "
            >
              Pilih Foto
            </p>

            <p
              className="
                mt-1
                text-[11px]
                text-ink-soft
              "
            >
              {files.length >
              0
                ? `${files.length} dipilih`
                : "Dari perangkat"}
            </p>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={
                handleFiles
              }
              className="hidden"
            />
          </label>

          {/* PREVIEW */}

          {files.length >
            0 && (
            <div
              className="
                mt-5
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    text-ocean-900
                  "
                >
                  {
                    files.length
                  }{" "}
                  foto
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setFiles(
                      []
                    )
                  }
                  className="
                    text-xs
                    text-ink-soft
                  "
                >
                  Clear
                </button>
              </div>

              <div
                className="
                  mt-3
                  grid
                  grid-cols-3
                  gap-2
                  sm:grid-cols-4
                "
              >
                {files.map(
                  (
                    file,
                    index
                  ) => (
                    <SelectedPhoto
                      key={`${file.name}-${file.lastModified}-${index}`}
                      file={
                        file
                      }
                      onRemove={() =>
                        handleRemoveFile(
                          index
                        )
                      }
                    />
                  )
                )}
              </div>
            </div>
          )}

          {/* DESTINATION */}

          <div
            className="
              mt-6
              grid
              gap-4
              sm:grid-cols-2
            "
          >
            <div>
              <label
                className="
                  mb-2
                  block
                  text-xs
                  font-semibold
                  text-ocean-900
                "
              >
                Location
              </label>

              <select
                value={
                  visibility
                }
                onChange={(
                  event
                ) => {
                  const next =
                    event.target
                      .value as UploadDestination;

                  setVisibility(
                    next
                  );

                  setAlbumId(
                    ""
                  );
                }}
                className="
                  love-input
                  w-full
                  rounded-[14px]
                  px-4
                  py-3
                  text-sm
                "
              >
                <option value="shared">
                  Gallery
                </option>

                <option value="private">
                  Private Vault
                </option>
              </select>
            </div>

            <div>
              <label
                className="
                  mb-2
                  block
                  text-xs
                  font-semibold
                  text-ocean-900
                "
              >
                Album
              </label>

              <select
                value={
                  albumId
                }
                onChange={(
                  event
                ) =>
                  setAlbumId(
                    event.target.value
                  )
                }
                className="
                  love-input
                  w-full
                  rounded-[14px]
                  px-4
                  py-3
                  text-sm
                "
              >
                <option value="">
                  No Album
                </option>

                {availableAlbums.map(
                  (album) => (
                    <option
                      key={
                        album.id
                      }
                      value={
                        album.id
                      }
                    >
                      {
                        album.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              isUploading ||
              files.length ===
                0
            }
            className="
              mt-6
              w-full
              rounded-[15px]
              bg-ocean-900
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-ocean-800
              disabled:opacity-40
            "
          >
            {isUploading
              ? "Uploading..."
              : `Upload${files.length > 0 ? ` ${files.length}` : ""}`}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/*
 * =========================================================
 * SELECTED PHOTO
 * =========================================================
 */

function SelectedPhoto({
  file,
  onRemove,
}: {
  file: File;

  onRemove:
    () => void;
}) {
  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState("");

  useEffect(() => {
    const url =
      URL.createObjectURL(
        file
      );

    setPreviewUrl(
      url
    );

    return () => {
      URL.revokeObjectURL(
        url
      );
    };
  }, [file]);

  return (
    <div
      className="
        relative
        aspect-square
        overflow-hidden
        rounded-[13px]
        bg-ocean-50
      "
    >
      {previewUrl && (
        <Image
          src={
            previewUrl
          }
          alt="Selected photo"
          fill
          unoptimized
          className="
            object-cover
          "
        />
      )}

      <button
        type="button"
        onClick={
          onRemove
        }
        className="
          absolute
          right-1.5
          top-1.5
          flex
          h-6
          w-6
          items-center
          justify-center
          rounded-full
          bg-black/55
          text-white
          backdrop-blur-md
        "
      >
        <X
          size={12}
        />
      </button>
    </div>
  );
}

/*
 * =========================================================
 * CAMERA
 * =========================================================
 */

function CameraCaptureModal({
  onClose,
  onCapture,
}: {
  onClose:
    () => void;

  onCapture:
    (
      file:
        File
    ) => void;
}) {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );

  const streamRef =
    useRef<MediaStream | null>(
      null
    );

  const [
    cameraSide,
    setCameraSide,
  ] =
    useState<CameraSide>(
      "environment"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    cameraError,
    setCameraError,
  ] =
    useState<string | null>(
      null
    );

  /*
   * STREAM
   */

  useEffect(() => {
    let cancelled =
      false;

    const stopStream =
      () => {
        streamRef.current
          ?.getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        streamRef.current =
          null;
      };

    const startCamera =
      async () => {
        stopStream();

        setLoading(
          true
        );

        setCameraError(
          null
        );

        try {
          if (
            !navigator.mediaDevices
              ?.getUserMedia
          ) {
            throw new Error(
              "Browser tidak mendukung kamera."
            );
          }

          let stream:
            MediaStream;

          try {
            stream =
              await navigator.mediaDevices.getUserMedia(
                {
                  audio:
                    false,

                  video: {
                    facingMode: {
                      exact:
                        cameraSide,
                    },

                    width: {
                      ideal:
                        1920,
                    },

                    height: {
                      ideal:
                        1080,
                    },
                  },
                }
              );
          } catch {
            stream =
              await navigator.mediaDevices.getUserMedia(
                {
                  audio:
                    false,

                  video: {
                    facingMode: {
                      ideal:
                        cameraSide,
                    },

                    width: {
                      ideal:
                        1920,
                    },

                    height: {
                      ideal:
                        1080,
                    },
                  },
                }
              );
          }

          if (cancelled) {
            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );

            return;
          }

          streamRef.current =
            stream;

          if (
            videoRef.current
          ) {
            videoRef.current.srcObject =
              stream;

            await videoRef.current.play();
          }
        } catch (error) {
          if (cancelled) {
            return;
          }

          console.error(
            "Camera error:",
            error
          );

          let message =
            "Kamera tidak dapat dibuka.";

          if (
            error instanceof
            DOMException
          ) {
            if (
              error.name ===
              "NotAllowedError"
            ) {
              message =
                "Izin kamera ditolak.";
            }

            if (
              error.name ===
              "NotFoundError"
            ) {
              message =
                "Kamera tidak ditemukan.";
            }

            if (
              error.name ===
              "NotReadableError"
            ) {
              message =
                "Kamera sedang digunakan aplikasi lain.";
            }
          }

          setCameraError(
            message
          );
        } finally {
          if (!cancelled) {
            setLoading(
              false
            );
          }
        }
      };

    void startCamera();

    return () => {
      cancelled =
        true;

      stopStream();
    };
  }, [cameraSide]);

  /*
   * STOP
   */

  const stopCamera =
    () => {
      streamRef.current
        ?.getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      streamRef.current =
        null;
    };

  /*
   * CAPTURE
   */

  const handleCapture =
    () => {
      const video =
        videoRef.current;

      const canvas =
        canvasRef.current;

      if (
        !video ||
        !canvas ||
        video.videoWidth ===
          0 ||
        video.videoHeight ===
          0
      ) {
        return;
      }

      canvas.width =
        video.videoWidth;

      canvas.height =
        video.videoHeight;

      const context =
        canvas.getContext(
          "2d"
        );

      if (!context) {
        return;
      }

      context.save();

      if (
        cameraSide ===
        "user"
      ) {
        context.translate(
          canvas.width,
          0
        );

        context.scale(
          -1,
          1
        );
      }

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      context.restore();

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return;
          }

          const file =
            new File(
              [blob],
              `camera-${Date.now()}.jpg`,
              {
                type:
                  "image/jpeg",

                lastModified:
                  Date.now(),
              }
            );

          stopCamera();

          onCapture(
            file
          );
        },
        "image/jpeg",
        0.92
      );
    };

  return (
    <div
      className="
        fixed
        inset-0
        z-[1700]
        flex
        items-center
        justify-center
        bg-black
        sm:bg-black/90
        sm:p-5
      "
    >
      <div
        className="
          relative
          flex
          h-[100svh]
          w-full
          max-w-[900px]
          flex-col
          overflow-hidden
          bg-black
          sm:h-[90svh]
          sm:rounded-[26px]
        "
      >
        {/* TOP */}

        <div
          className="
            absolute
            inset-x-0
            top-0
            z-30
            flex
            items-center
            justify-between
            bg-gradient-to-b
            from-black/70
            via-black/20
            to-transparent
            px-4
            pb-12
            pt-4
          "
        >
          <div
            className="
              flex
              rounded-full
              bg-black/35
              p-1
              backdrop-blur-xl
            "
          >
            <button
              type="button"
              onClick={() =>
                setCameraSide(
                  "user"
                )
              }
              className={`
                rounded-full
                px-4
                py-2
                text-xs
                font-semibold

                ${
                  cameraSide ===
                  "user"
                    ? "bg-white text-black"
                    : "text-white"
                }
              `}
            >
              Depan
            </button>

            <button
              type="button"
              onClick={() =>
                setCameraSide(
                  "environment"
                )
              }
              className={`
                rounded-full
                px-4
                py-2
                text-xs
                font-semibold

                ${
                  cameraSide ===
                  "environment"
                    ? "bg-white text-black"
                    : "text-white"
                }
              `}
            >
              Belakang
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-black/35
              text-white
              backdrop-blur-xl
            "
          >
            <X
              size={18}
            />
          </button>
        </div>

        {/* VIEW */}

        <div
          className="
            relative
            min-h-0
            flex-1
            overflow-hidden
            bg-black
          "
        >
          <video
            ref={
              videoRef
            }
            autoPlay
            muted
            playsInline
            className={`
              h-full
              w-full
              object-cover

              ${
                cameraSide ===
                "user"
                  ? "-scale-x-100"
                  : ""
              }
            `}
          />

          {loading && (
            <div
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                bg-black
                text-sm
                text-white/60
              "
            >
              Membuka kamera...
            </div>
          )}

          {cameraError && (
            <div
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                bg-black
                px-8
                text-center
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  Kamera tidak dapat dibuka
                </p>

                <p
                  className="
                    mt-2
                    text-xs
                    text-white/55
                  "
                >
                  {
                    cameraError
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SHUTTER */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-center
            bg-black
            py-7
          "
        >
          <button
            type="button"
            onClick={
              handleCapture
            }
            disabled={
              loading ||
              Boolean(
                cameraError
              )
            }
            className="
              flex
              h-[76px]
              w-[76px]
              items-center
              justify-center
              rounded-full
              border-[4px]
              border-white
              transition
              active:scale-95
              disabled:opacity-30
            "
          >
            <span
              className="
                h-[60px]
                w-[60px]
                rounded-full
                bg-white
              "
            />
          </button>
        </div>

        <canvas
          ref={
            canvasRef
          }
          className="hidden"
        />
      </div>
    </div>
  );
}

/*
 * =========================================================
 * CAMERA SAVE PHOTO
 * =========================================================
 */

function CameraPhotoModal({
  file,
  userId,
  coupleId,
  albums,
  defaultAlbumId,
  defaultVisibility,
  vaultUnlocked,
  onClose,
  onSaved,
}: {
  file: File;
  userId: string;
  coupleId: string;

  albums:
    GalleryAlbum[];

  defaultAlbumId:
    string | null;

  defaultVisibility:
    Visibility;

  vaultUnlocked:
    boolean;

  onClose:
    () => void;

  onSaved:
    (
      photo:
        GalleryPhoto
    ) => void;
}) {
  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState("");

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    note,
    setNote,
  ] =
    useState("");

  const [
    visibility,
    setVisibility,
  ] =
    useState<Visibility>(
      defaultVisibility
    );

  const [
    albumId,
    setAlbumId,
  ] =
    useState(
      defaultAlbumId ??
      ""
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  useEffect(() => {
    const url =
      URL.createObjectURL(
        file
      );

    setPreviewUrl(
      url
    );

    return () => {
      URL.revokeObjectURL(
        url
      );
    };
  }, [file]);

  const availableAlbums =
    albums.filter(
      (album) =>
        album.visibility ===
        visibility
    );

  const handleSave =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        visibility ===
          "private" &&
        !vaultUnlocked
      ) {
        await showWarning(
          "Vault terkunci",
          "Buka Private Vault terlebih dahulu jika ingin menyimpan foto ke Vault."
        );

        return;
      }

      setSaving(
        true
      );

      try {
        const photo =
          await uploadGalleryFile({
            file,
            userId,
            coupleId,

            visibility,

            albumId:
              albumId ||
              null,

            title:
              title.trim() ||
              null,

            note:
              note.trim() ||
              null,
          });

        onSaved(
          photo
        );
      } catch (error) {
        await showError(
          "Foto gagal disimpan",
          error instanceof
            Error
            ? error.message
            : "Terjadi kesalahan."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  return (
    <ModalShell
      onClose={
        onClose
      }
      locked={
        saving
      }
    >
      <form
        onSubmit={
          handleSave
        }
      >
        <ModalHeader
          title="New Photo"
          onClose={
            onClose
          }
        />

        <div
          className="
            p-5
            sm:p-6
          "
        >
          {/* PREVIEW */}

          <div
            className="
              relative
              mx-auto
              aspect-[4/3]
              w-full
              overflow-hidden
              rounded-[20px]
              bg-ocean-50
            "
          >
            {previewUrl && (
              <Image
                src={
                  previewUrl
                }
                alt="Camera photo"
                fill
                unoptimized
                className="
                  object-cover
                "
              />
            )}
          </div>

          {/* TITLE */}

          <div
            className="
              mt-5
            "
          >
            <label
              className="
                mb-2
                block
                text-xs
                font-semibold
                text-ocean-900
              "
            >
              Title
            </label>

            <input
              type="text"
              value={
                title
              }
              onChange={(
                event
              ) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="Optional"
              className="
                love-input
                w-full
                rounded-[14px]
                px-4
                py-3
                text-sm
              "
            />
          </div>

          {/* NOTE */}

          <div
            className="
              mt-4
            "
          >
            <label
              className="
                mb-2
                block
                text-xs
                font-semibold
                text-ocean-900
              "
            >
              Note
            </label>

            <textarea
              value={
                note
              }
              onChange={(
                event
              ) =>
                setNote(
                  event.target.value
                )
              }
              rows={3}
              placeholder="Optional"
              className="
                love-input
                w-full
                resize-none
                rounded-[14px]
                px-4
                py-3
                text-sm
              "
            />
          </div>

          {/* LOCATION */}

          <div
            className="
              mt-4
              grid
              gap-4
              sm:grid-cols-2
            "
          >
            <div>
              <label
                className="
                  mb-2
                  block
                  text-xs
                  font-semibold
                  text-ocean-900
                "
              >
                Location
              </label>

              <select
                value={
                  visibility
                }
                onChange={(
                  event
                ) => {
                  setVisibility(
                    event.target
                      .value as Visibility
                  );

                  setAlbumId(
                    ""
                  );
                }}
                className="
                  love-input
                  w-full
                  rounded-[14px]
                  px-4
                  py-3
                  text-sm
                "
              >
                <option value="shared">
                  Gallery
                </option>

                <option value="private">
                  Private Vault
                </option>
              </select>
            </div>

            <div>
              <label
                className="
                  mb-2
                  block
                  text-xs
                  font-semibold
                  text-ocean-900
                "
              >
                Album
              </label>

              <select
                value={
                  albumId
                }
                onChange={(
                  event
                ) =>
                  setAlbumId(
                    event.target.value
                  )
                }
                className="
                  love-input
                  w-full
                  rounded-[14px]
                  px-4
                  py-3
                  text-sm
                "
              >
                <option value="">
                  No Album
                </option>

                {availableAlbums.map(
                  (album) => (
                    <option
                      key={
                        album.id
                      }
                      value={
                        album.id
                      }
                    >
                      {
                        album.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              saving
            }
            className="
              mt-6
              w-full
              rounded-[15px]
              bg-ocean-900
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              disabled:opacity-50
            "
          >
            {saving
              ? "Saving..."
              : "Save Photo"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/*
 * =========================================================
 * EDIT PHOTO INFO
 * =========================================================
 */

function PhotoInfoModal({
  photo,
  onClose,
  onSaved,
}: {
  photo:
    GalleryPhoto;

  onClose:
    () => void;

  onSaved:
    (
      photo:
        GalleryPhoto
    ) => void;
}) {
  const [
    title,
    setTitle,
  ] =
    useState(
      photo.title ??
      ""
    );

  const [
    note,
    setNote,
  ] =
    useState(
      photo.caption ??
      ""
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setSaving(
        true
      );

      try {
        const supabase =
          createClient();

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "gallery_photos"
            )
            .update({
              title:
                title.trim() ||
                null,

              caption:
                note.trim() ||
                null,
            })
            .eq(
              "id",
              photo.id
            )
            .select()
            .single();

        if (error) {
          throw new Error(
            error.message
          );
        }

        onSaved({
          ...photo,
          ...data,

          signed_url:
            photo.signed_url,
        });
      } catch (error) {
        await showError(
          "Info foto gagal disimpan",
          error instanceof
            Error
            ? error.message
            : "Terjadi kesalahan."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  return (
    <ModalShell
      onClose={
        onClose
      }
      locked={
        saving
      }
    >
      <form
        onSubmit={
          handleSubmit
        }
      >
        <ModalHeader
          title="Edit Info"
          onClose={
            onClose
          }
        />

        <div
          className="
            p-5
            sm:p-6
          "
        >
          <div>
            <label
              className="
                mb-2
                block
                text-xs
                font-semibold
                text-ocean-900
              "
            >
              Title
            </label>

            <input
              type="text"
              value={
                title
              }
              onChange={(
                event
              ) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="Optional"
              className="
                love-input
                w-full
                rounded-[14px]
                px-4
                py-3
                text-sm
              "
            />
          </div>

          <div
            className="
              mt-4
            "
          >
            <label
              className="
                mb-2
                block
                text-xs
                font-semibold
                text-ocean-900
              "
            >
              Note
            </label>

            <textarea
              value={
                note
              }
              onChange={(
                event
              ) =>
                setNote(
                  event.target.value
                )
              }
              rows={5}
              placeholder="Optional"
              className="
                love-input
                w-full
                resize-none
                rounded-[14px]
                px-4
                py-3
                text-sm
              "
            />
          </div>

          <button
            type="submit"
            disabled={
              saving
            }
            className="
              mt-6
              w-full
              rounded-[15px]
              bg-ocean-900
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              disabled:opacity-50
            "
          >
            {saving
              ? "Saving..."
              : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/*
 * =========================================================
 * ALBUM MODAL
 * =========================================================
 */

function AlbumModal({
  coupleId,
  userId,
  editingAlbum,
  vaultUnlocked,
  onClose,
  onSaved,
}: {
  coupleId:
    string;

  userId:
    string;

  editingAlbum:
    GalleryAlbum | null;

  vaultUnlocked:
    boolean;

  onClose:
    () => void;

  onSaved:
    (
      album:
        GalleryAlbum
    ) => void;
}) {
  const [name, setName] =
    useState(
      editingAlbum?.name ??
      ""
    );

  const [
    description,
    setDescription,
  ] =
    useState(
      editingAlbum?.description ??
      ""
    );

  const [
    visibility,
    setVisibility,
  ] =
    useState<Visibility>(
      editingAlbum?.visibility ??
      "shared"
    );

  const [saving, setSaving] =
    useState(false);

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        !name.trim()
      ) {
        return;
      }

      if (
        visibility ===
          "private" &&
        !vaultUnlocked
      ) {
        await showWarning(
          "Vault terkunci",
          "Buka Vault terlebih dahulu untuk membuat album private."
        );

        return;
      }

      setSaving(
        true
      );

      const supabase =
        createClient();

      try {
        if (editingAlbum) {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "gallery_albums"
              )
              .update({
                name:
                  name.trim(),

                description:
                  description.trim() ||
                  null,

                visibility,
              })
              .eq(
                "id",
                editingAlbum.id
              )
              .select()
              .single();

          if (error) {
            throw new Error(
              error.message
            );
          }

          onSaved(
            data as GalleryAlbum
          );

          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "gallery_albums"
            )
            .insert({
              couple_id:
                coupleId,

              created_by:
                userId,

              owner_id:
                userId,

              name:
                name.trim(),

              description:
                description.trim() ||
                null,

              visibility,
            })
            .select()
            .single();

        if (error) {
          throw new Error(
            error.message
          );
        }

        onSaved(
          data as GalleryAlbum
        );
      } catch (error) {
        await showError(
          "Album gagal disimpan",
          error instanceof
            Error
            ? error.message
            : "Terjadi kesalahan."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  return (
    <ModalShell
      onClose={
        onClose
      }
      locked={
        saving
      }
    >
      <form
        onSubmit={
          handleSubmit
        }
      >
        <ModalHeader
          title={
            editingAlbum
              ? "Edit Album"
              : "New Album"
          }
          onClose={
            onClose
          }
        />

        <div
          className="
            space-y-5
            p-5
            sm:p-6
          "
        >
          <div>
            <label
              className="
                mb-2
                block
                text-xs
                font-semibold
                text-ocean-900
              "
            >
              Name
            </label>

            <input
              type="text"
              value={
                name
              }
              onChange={(
                event
              ) =>
                setName(
                  event.target.value
                )
              }
              className="
                love-input
                w-full
                rounded-[14px]
                px-4
                py-3
                text-sm
              "
            />
          </div>

          <div>
            <label
              className="
                mb-2
                block
                text-xs
                font-semibold
                text-ocean-900
              "
            >
              Description
            </label>

            <textarea
              value={
                description
              }
              onChange={(
                event
              ) =>
                setDescription(
                  event.target.value
                )
              }
              rows={3}
              className="
                love-input
                w-full
                resize-none
                rounded-[14px]
                px-4
                py-3
                text-sm
              "
            />
          </div>

          {!editingAlbum && (
            <div>
              <label
                className="
                  mb-2
                  block
                  text-xs
                  font-semibold
                  text-ocean-900
                "
              >
                Visibility
              </label>

              <select
                value={
                  visibility
                }
                onChange={(
                  event
                ) =>
                  setVisibility(
                    event.target
                      .value as Visibility
                  )
                }
                className="
                  love-input
                  w-full
                  rounded-[14px]
                  px-4
                  py-3
                  text-sm
                "
              >
                <option value="shared">
                  Shared
                </option>

                <option value="private">
                  Private
                </option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={
              saving ||
              !name.trim()
            }
            className="
              w-full
              rounded-[15px]
              bg-ocean-900
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              disabled:opacity-50
            "
          >
            {saving
              ? "Saving..."
              : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/*
 * =========================================================
 * LIGHTBOX
 * =========================================================
 */

function PhotoLightbox({
  photo,
  index,
  total,
  onClose,
  onPrevious,
  onNext,
  onFavorite,
  onMove,
  onEdit,
  onDelete,
}: {
  photo:
    GalleryPhoto;

  index:
    number;

  total:
    number;

  onClose:
    () => void;

  onPrevious:
    () => void;

  onNext:
    () => void;

  onFavorite:
    () => void;

  onMove:
    () => void;

  onEdit:
    () => void;

  onDelete:
    () => void;
}) {
  useEffect(() => {
    const handleKeyboard =
      (
        event:
          globalThis.KeyboardEvent
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          onClose();
        }

        if (
          event.key ===
          "ArrowLeft"
        ) {
          onPrevious();
        }

        if (
          event.key ===
          "ArrowRight"
        ) {
          onNext();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [
    onClose,
    onNext,
    onPrevious,
  ]);

  return (
    <div
      className="
        fixed
        inset-0
        z-[1500]
        flex
        items-center
        justify-center
        bg-black/90
        p-3
      "
    >
      {/* CLOSE */}

      <button
        type="button"
        onClick={
          onClose
        }
        className="
          absolute
          right-5
          top-5
          z-30
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          bg-white/10
          text-white
          backdrop-blur-md
        "
      >
        <X
          size={19}
        />
      </button>

      {/* COUNTER */}

      <div
        className="
          absolute
          left-5
          top-5
          z-30
          text-xs
          text-white/60
        "
      >
        {index + 1} /{" "}
        {total}
      </div>

      {/* NAV */}

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={
              onPrevious
            }
            className="
              absolute
              left-3
              top-1/2
              z-30
              flex
              h-11
              w-11
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              bg-black/30
              text-white
              backdrop-blur-md
              sm:left-6
            "
          >
            <ChevronLeft
              size={24}
            />
          </button>

          <button
            type="button"
            onClick={
              onNext
            }
            className="
              absolute
              right-3
              top-1/2
              z-30
              flex
              h-11
              w-11
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              bg-black/30
              text-white
              backdrop-blur-md
              sm:right-6
            "
          >
            <ChevronRight
              size={24}
            />
          </button>
        </>
      )}

      {/* IMAGE */}

      <div
        className="
          relative
          h-[72svh]
          w-full
          max-w-[1200px]
        "
      >
        {photo.signed_url && (
          <Image
            src={
              photo.signed_url
            }
            alt={
              photo.title ||
              photo.caption ||
              "Photo"
            }
            fill
            unoptimized
            priority
            className="
              object-contain
            "
          />
        )}
      </div>

      {/* TITLE / NOTE */}

      {(photo.title ||
        photo.caption) && (
        <div
          className="
            absolute
            bottom-[78px]
            left-1/2
            z-30
            w-[calc(100%-32px)]
            max-w-xl
            -translate-x-1/2
            rounded-[18px]
            bg-black/45
            px-5
            py-4
            text-white
            backdrop-blur-xl
          "
        >
          {photo.title && (
            <h2
              className="
                font-display
                text-xl
                font-semibold
              "
            >
              {photo.title}
            </h2>
          )}

          {photo.caption && (
            <p
              className="
                mt-1
                whitespace-pre-line
                text-xs
                leading-5
                text-white/70
              "
            >
              {photo.caption}
            </p>
          )}
        </div>
      )}

      {/* ACTIONS */}

      <div
        className="
          absolute
          bottom-5
          left-1/2
          z-30
          flex
          max-w-[calc(100%-24px)]
          -translate-x-1/2
          items-center
          gap-1
          overflow-x-auto
          rounded-full
          bg-black/45
          p-2
          backdrop-blur-xl
        "
      >
        <LightboxAction
          onClick={
            onFavorite
          }
        >
          {photo.is_favorite
            ? "Unfavorite"
            : "Favorite"}
        </LightboxAction>

        <LightboxAction
          onClick={
            onEdit
          }
        >
          Edit Info
        </LightboxAction>

        <LightboxAction
          onClick={
            onMove
          }
        >
          Album
        </LightboxAction>

        <LightboxAction
          onClick={
            onDelete
          }
          danger
        >
          Delete
        </LightboxAction>
      </div>
    </div>
  );
}

function LightboxAction({
  children,
  onClick,
  danger = false,
}: {
  children:
    React.ReactNode;

  onClick:
    () => void;

  danger?:
    boolean;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        whitespace-nowrap
        rounded-full
        px-4
        py-2
        text-xs
        font-semibold
        transition
        hover:bg-white/10

        ${
          danger
            ? "text-red-300"
            : "text-white"
        }
      `}
    >
      {children}
    </button>
  );
}

/*
 * =========================================================
 * MODAL SHELL
 * =========================================================
 */

function ModalShell({
  children,
  onClose,
  locked = false,
}: {
  children:
    React.ReactNode;

  onClose:
    () => void;

  locked?:
    boolean;
}) {
  return (
    <div
      className="
        fixed
        inset-0
        z-[1600]
        flex
        items-center
        justify-center
        bg-ocean-950/35
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(
        event
      ) => {
        if (
          !locked &&
          event.target ===
            event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          max-h-[92svh]
          w-full
          max-w-[620px]
          overflow-y-auto
          rounded-[26px]
          bg-[#fffdf9]
          shadow-2xl
        "
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  onClose,
}: {
  title:
    string;

  onClose:
    () => void;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        border-b
        border-ocean-100
        px-5
        py-4
        sm:px-6
      "
    >
      <h2
        className="
          font-display
          text-2xl
          font-semibold
          text-ocean-950
        "
      >
        {title}
      </h2>

      <button
        type="button"
        onClick={
          onClose
        }
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          text-ink-soft
          hover:bg-ocean-50
        "
      >
        <X
          size={17}
        />
      </button>
    </div>
  );
}

/*
 * =========================================================
 * STORAGE UPLOAD HELPER
 * =========================================================
 */

async function uploadGalleryFile({
  file,
  userId,
  coupleId,
  visibility,
  albumId,
  title = null,
  note = null,
}: UploadGalleryFileOptions): Promise<GalleryPhoto> {
  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "File harus berupa gambar."
    );
  }

  if (
    file.size >
    8 *
      1024 *
      1024
  ) {
    throw new Error(
      "Maksimal ukuran foto 8 MB."
    );
  }

  const supabase =
    createClient();

  const photoId =
    crypto.randomUUID();

  const extension =
    getExtension(
      file.name
    );

  const storagePath =
    visibility ===
    "private"
      ? `private/${userId}/${photoId}/photo-${Date.now()}.${extension}`
      : `shared/${coupleId}/${photoId}/photo-${Date.now()}.${extension}`;

  /*
   * STORAGE
   */

  const {
    error:
      uploadError,
  } =
    await supabase.storage
      .from(
        "gallery-media"
      )
      .upload(
        storagePath,
        file,
        {
          upsert:
            false,

          contentType:
            file.type,

          cacheControl:
            "3600",
        }
      );

  if (uploadError) {
    throw new Error(
      uploadError.message
    );
  }

  /*
   * DATABASE
   */

  const {
    data,
    error:
      databaseError,
  } =
    await supabase
      .from(
        "gallery_photos"
      )
      .insert({
        id:
          photoId,

        couple_id:
          coupleId,

        album_id:
          albumId,

        uploaded_by:
          userId,

        owner_id:
          userId,

        storage_bucket:
          "gallery-media",

        storage_path:
          storagePath,

        title,

        caption:
          note,

        visibility,

        source_type:
          "upload",

        source_memory_photo_id:
          null,

        is_favorite:
          false,
      })
      .select()
      .single();

  if (databaseError) {
    await supabase.storage
      .from(
        "gallery-media"
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
    error:
      signedError,
  } =
    await supabase.storage
      .from(
        "gallery-media"
      )
      .createSignedUrl(
        storagePath,
        60 * 60
      );

  if (signedError) {
    console.error(
      "Signed URL error:",
      signedError
    );
  }

  return {
    ...(data as Omit<
      GalleryPhoto,
      "signed_url"
    >),

    signed_url:
      signedData?.signedUrl ??
      null,
  };
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

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

async function showWarning(
  title:
    string,

  message:
    string
) {
  await Swal.fire({
    icon:
      "warning",

    title,

    text:
      message,

    confirmButtonColor:
      "#1688b5",
  });
}

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