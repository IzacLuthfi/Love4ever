// src/components/gallery/GalleryClient.tsx

"use client";

import Image from "next/image";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
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

import CameraCaptureModal from "@/components/gallery/CameraCaptureModal";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

import { createClient } from "@/lib/supabase/client";

import {
  IMAGE_ACCEPT,
  normalizeImageFile,
  normalizeImageFiles,
} from "@/utils/image";

import type {
  GalleryAlbum,
  GalleryClientProps,
  GalleryPhoto,
  GalleryTab,
  UploadDestination,
  UploadGalleryFileOptions,
  Visibility,
} from "@/types/gallery";

/*
 * =========================================================
 * STYLE
 * =========================================================
 */

const primaryButtonClass = `
  inline-flex
  items-center
  justify-center
  rounded-[13px]
  bg-ocean-900
  px-5
  py-2.5
  text-sm
  font-semibold
  text-white
  shadow-[0_8px_22px_rgba(6,42,63,0.12)]
  transition
  duration-200
  hover:bg-ocean-800
  active:scale-[0.98]
  disabled:pointer-events-none
  disabled:opacity-45
`;

const inputClass = `
  w-full
  rounded-[13px]
  border
  border-ocean-100
  bg-white/75
  px-4
  py-3
  text-sm
  text-ocean-950
  outline-none
  transition
  placeholder:text-ink-soft/55
  focus:border-ocean-300
  focus:bg-white
  focus:ring-4
  focus:ring-ocean-100/50
`;

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
    useState<GalleryAlbum[]>(initialAlbums);

  const [photos, setPhotos] =
    useState<GalleryPhoto[]>(initialPhotos);

  const [activeTab, setActiveTab] =
    useState<GalleryTab>("photos");

  const [selectedAlbumId, setSelectedAlbumId] =
    useState<string | null>(null);

  const [activePhotoId, setActivePhotoId] =
    useState<string | null>(null);

  const [editingPhoto, setEditingPhoto] =
    useState<GalleryPhoto | null>(null);

  const [uploadOpen, setUploadOpen] =
    useState(false);

  const [albumOpen, setAlbumOpen] =
    useState(false);

  const [editingAlbum, setEditingAlbum] =
    useState<GalleryAlbum | null>(null);

  const [vaultUnlocked, setVaultUnlocked] =
    useState(false);

  const [cameraOpen, setCameraOpen] =
    useState(false);

  const [cameraFile, setCameraFile] =
    useState<File | null>(null);

  /*
   * =========================================================
   * COLLECTIONS
   * =========================================================
   */

  const sharedPhotos = useMemo(
    () =>
      photos.filter(
        (photo) =>
          photo.visibility === "shared"
      ),
    [photos]
  );

  const privatePhotos = useMemo(
    () =>
      photos.filter(
        (photo) =>
          photo.visibility === "private" &&
          photo.owner_id === user.id
      ),
    [photos, user.id]
  );

  const favoritePhotos = useMemo(
    () =>
      sharedPhotos.filter(
        (photo) =>
          photo.is_favorite
      ),
    [sharedPhotos]
  );

  const selectedAlbum =
    albums.find(
      (album) =>
        album.id === selectedAlbumId
    ) ?? null;

  /*
   * =========================================================
   * DISPLAYED PHOTOS
   * =========================================================
   */

  const displayedPhotos = useMemo(() => {
    if (selectedAlbumId) {
      return photos.filter(
        (photo) =>
          photo.album_id ===
          selectedAlbumId
      );
    }

    if (activeTab === "favorites") {
      return favoritePhotos;
    }

    if (activeTab === "vault") {
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
        photo.id === activePhotoId
    );

  const activePhoto =
    activePhotoIndex >= 0
      ? displayedPhotos[activePhotoIndex]
      : null;

  /*
   * =========================================================
   * DESTINATION
   * =========================================================
   */

  const cameraDefaultVisibility: Visibility =
    selectedAlbum
      ? selectedAlbum.visibility
      : activeTab === "vault"
        ? "private"
        : "shared";

  const cameraDefaultAlbumId =
    selectedAlbum?.id ?? null;

  const showPhotoActions =
    activeTab !== "albums" ||
    Boolean(selectedAlbum);

  /*
   * =========================================================
   * LIGHTBOX
   * =========================================================
   */

  const showPreviousPhoto = () => {
    if (
      displayedPhotos.length === 0
    ) {
      return;
    }

    const index =
      activePhotoIndex <= 0
        ? displayedPhotos.length - 1
        : activePhotoIndex - 1;

    setActivePhotoId(
      displayedPhotos[index].id
    );
  };

  const showNextPhoto = () => {
    if (
      displayedPhotos.length === 0
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
          title: "Private Vault",

          input:
            "password",

          inputPlaceholder:
            "Password",

          showCancelButton:
            true,

          confirmButtonText:
            "Unlock",

          cancelButtonText:
            "Cancel",

          confirmButtonColor:
            "#083b59",

          background:
            "#fffdf9",

          color:
            "#123d59",

          inputAttributes: {
            autocomplete:
              "current-password",
          },

          inputValidator:
            (value) => {
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
        await supabase.auth.signInWithPassword(
          {
            email:
              user.email,

            password:
              result.value,
          }
        );

      if (error) {
        await Swal.fire({
          icon: "error",

          title:
            "Password salah",

          confirmButtonColor:
            "#083b59",

          background:
            "#fffdf9",

          color:
            "#123d59",
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
          "Gagal memperbarui favorite",
          error.message
        );
      }
    };

  /*
   * =========================================================
   * PHOTO INFO
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
          title:
            "Delete photo?",

          text:
            photo.source_type ===
            "memory"
              ? "The original Memory photo stays."
              : undefined,

          showCancelButton:
            true,

          confirmButtonText:
            "Delete",

          cancelButtonText:
            "Cancel",

          confirmButtonColor:
            "#d85f72",

          background:
            "#fffdf9",

          color:
            "#123d59",
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
          "Photo could not be deleted",
          error.message
        );

        return;
      }

      if (
        photo.storage_bucket ===
        "gallery-media"
      ) {
        const {
          error:
            storageError,
        } =
          await supabase.storage
            .from(
              "gallery-media"
            )
            .remove([
              photo.storage_path,
            ]);

        if (
          storageError
        ) {
          console.error(
            "Gallery storage cleanup:",
            storageError
          );
        }
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
   * MOVE TO ALBUM
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

      const inputOptions: Record<
        string,
        string
      > = {
        "": "No Album",
      };

      for (
        const album of
        availableAlbums
      ) {
        inputOptions[
          album.id
        ] =
          album.name;
      }

      const result =
        await Swal.fire({
          title: "Album",

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
            "Cancel",

          confirmButtonColor:
            "#083b59",

          background:
            "#fffdf9",

          color:
            "#123d59",
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
          "Album could not be updated",
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
   * ALBUM
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

  const handleDeleteAlbum =
    async (
      album:
        GalleryAlbum
    ) => {
      const result =
        await Swal.fire({
          title:
            "Delete album?",

          text:
            "Photos will stay in Gallery.",

          showCancelButton:
            true,

          confirmButtonText:
            "Delete",

          cancelButtonText:
            "Cancel",

          confirmButtonColor:
            "#d85f72",

          background:
            "#fffdf9",

          color:
            "#123d59",
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
          "Album could not be deleted",
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
   * CAMERA
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
   * PAGE TITLE
   * =========================================================
   */

  const pageTitle =
    selectedAlbum
      ? selectedAlbum.name
      : activeTab ===
          "vault"
        ? "Private Vault"
        : "Gallery";

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div
      className="
        min-h-[100svh]
        bg-[linear-gradient(145deg,#f5fbfd_0%,#fffdf9_52%,#f8f2e9_100%)]
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
          pt-6
          sm:px-6
          lg:ml-[290px]
          lg:px-8
          lg:pb-12
          lg:pt-9
          xl:px-10
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1460px]
          "
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <header
            className="
              flex
              min-h-[54px]
              items-end
              justify-between
              gap-5
            "
          >
            <div
              className="
                min-w-0
              "
            >
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
                    text-xs
                    font-medium
                    text-ink-soft
                    transition
                    hover:text-ocean-900
                  "
                >
                  ← Albums
                </button>
              )}

              <h1
                className="
                  truncate
                  font-display
                  text-[34px]
                  font-semibold
                  leading-none
                  tracking-[-0.035em]
                  text-ocean-950
                  sm:text-[40px]
                "
              >
                {pageTitle}
              </h1>
            </div>

            {showPhotoActions && (
              <button
                type="button"
                onClick={() =>
                  setUploadOpen(
                    true
                  )
                }
                className={
                  primaryButtonClass
                }
              >
                Add Photos
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
                  className={
                    primaryButtonClass
                  }
                >
                  New Album
                </button>
              )}
          </header>

          {/* =================================================
              TABS
          ================================================= */}

          {!selectedAlbum && (
            <nav
              className="
                mt-8
                flex
                gap-7
                overflow-x-auto
                border-b
                border-ocean-100/80
                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
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

          {/* =================================================
              CONTENT
          ================================================= */}

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
              albums={albums}
              photos={photos}
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
                  ? "No favorites yet."
                  : activeTab ===
                      "vault"
                    ? "Vault is empty."
                    : selectedAlbum
                      ? "Album is empty."
                      : "No photos yet."
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
          CAMERA FAB
      ====================================================== */}

      {showPhotoActions && (
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
            bg-ocean-950
            text-white
            shadow-[0_14px_35px_rgba(6,42,63,0.23)]
            ring-1
            ring-white/20
            transition
            duration-200
            hover:-translate-y-0.5
            hover:bg-ocean-800
            active:translate-y-0
            active:scale-95
            sm:right-6
            lg:bottom-8
            lg:right-8
          "
        >
          <Camera
            size={20}
            strokeWidth={1.9}
          />
        </button>
      )}

      {/* =====================================================
          UPLOAD
      ====================================================== */}

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
          vaultUnlocked={
            vaultUnlocked
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

      {/* =====================================================
          CAMERA
      ====================================================== */}

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

      {/* =====================================================
          CAMERA RESULT
      ====================================================== */}

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

      {/* =====================================================
          ALBUM
      ====================================================== */}

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

                if (
                  exists
                ) {
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

      {/* =====================================================
          EDIT PHOTO
      ====================================================== */}

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

      {/* =====================================================
          LIGHTBOX
      ====================================================== */}

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
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        relative
        shrink-0
        pb-3.5
        text-sm
        font-medium
        transition
        duration-200

        ${
          active
            ? "text-ocean-950"
            : "text-ink-soft hover:text-ocean-800"
        }

        after:absolute
        after:bottom-0
        after:left-0
        after:h-[2px]
        after:w-full
        after:origin-left
        after:rounded-full
        after:bg-ocean-900
        after:transition-transform
        after:duration-200

        ${
          active
            ? "after:scale-x-100"
            : "after:scale-x-0"
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
  photos: GalleryPhoto[];
  emptyLabel: string;
  onOpen: (
    photo:
      GalleryPhoto
  ) => void;
}) {
  if (
    photos.length === 0
  ) {
    return (
      <EmptyState>
        {emptyLabel}
      </EmptyState>
    );
  }

  return (
    <section
      className="
        mt-6
        grid
        grid-cols-2
        gap-2.5
        sm:grid-cols-3
        sm:gap-3
        xl:grid-cols-4
        2xl:grid-cols-5
      "
    >
      {photos.map(
        (photo) => (
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
            className="
              group
              relative
              aspect-[4/5]
              overflow-hidden
              rounded-[17px]
              bg-ocean-50
              text-left
              shadow-[0_8px_30px_rgba(8,59,89,0.035)]
              ring-1
              ring-ocean-100/60
              transition
              duration-300
              hover:-translate-y-0.5
              hover:shadow-[0_16px_40px_rgba(8,59,89,0.08)]
            "
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
                  duration-700
                  ease-out
                  group-hover:scale-[1.025]
                "
              />
            ) : (
              <div
                className="
                  h-full
                  w-full
                  bg-[linear-gradient(145deg,#dff5fc,#f7efe3)]
                "
              />
            )}

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-t
                from-ocean-950/55
                via-transparent
                to-transparent
                opacity-0
                transition
                duration-300
                group-hover:opacity-100
              "
            />

            {(photo.title ||
              photo.source_type ===
                "memory") && (
              <div
                className="
                  absolute
                  inset-x-0
                  bottom-0
                  translate-y-2
                  px-4
                  pb-4
                  opacity-0
                  transition
                  duration-300
                  group-hover:translate-y-0
                  group-hover:opacity-100
                "
              >
                {photo.title && (
                  <p
                    className="
                      line-clamp-1
                      text-sm
                      font-medium
                      text-white
                    "
                  >
                    {photo.title}
                  </p>
                )}

                {photo.source_type ===
                  "memory" && (
                  <p
                    className="
                      mt-1
                      text-[10px]
                      text-white/55
                    "
                  >
                    Memory
                  </p>
                )}
              </div>
            )}

            {photo.is_favorite && (
              <span
                className="
                  absolute
                  right-3
                  top-3
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  bg-black/25
                  text-white
                  backdrop-blur-md
                "
              >
                <Star
                  size={14}
                  fill="currentColor"
                  strokeWidth={1.5}
                />
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
  albums: GalleryAlbum[];
  photos: GalleryPhoto[];
  userId: string;
  vaultUnlocked: boolean;
  onOpen: (
    album:
      GalleryAlbum
  ) => void;
  onEdit: (
    album:
      GalleryAlbum
  ) => void;
  onDelete: (
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
      <EmptyState>
        No albums yet.
      </EmptyState>
    );
  }

  return (
    <section
      className="
        mt-7
        grid
        gap-x-5
        gap-y-8
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
              className="
                group
                min-w-0
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
                  relative
                  block
                  aspect-[16/10]
                  w-full
                  overflow-hidden
                  rounded-[22px]
                  bg-ocean-50
                  shadow-[0_12px_35px_rgba(8,59,89,0.045)]
                  ring-1
                  ring-ocean-100/60
                  transition
                  duration-300
                  group-hover:-translate-y-0.5
                  group-hover:shadow-[0_18px_45px_rgba(8,59,89,0.08)]
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
                      duration-700
                      ease-out
                      group-hover:scale-[1.02]
                    "
                  />
                ) : (
                  <div
                    className="
                      h-full
                      w-full
                      bg-[linear-gradient(145deg,#dff5fc_0%,#f7efe3_100%)]
                    "
                  />
                )}

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-ocean-950/25
                    via-transparent
                    to-transparent
                  "
                />

                {album.visibility ===
                  "private" && (
                  <span
                    className="
                      absolute
                      right-3
                      top-3
                      rounded-full
                      bg-black/25
                      px-3
                      py-1.5
                      text-[10px]
                      font-medium
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
                  mt-3.5
                  flex
                  items-start
                  justify-between
                  gap-4
                  px-0.5
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
                    flex-1
                    text-left
                  "
                >
                  <h2
                    className="
                      truncate
                      font-display
                      text-[20px]
                      font-semibold
                      tracking-[-0.02em]
                      text-ocean-950
                    "
                  >
                    {album.name}
                  </h2>

                  <div
                    className="
                      mt-1
                      flex
                      items-center
                      gap-2
                      text-xs
                      text-ink-soft
                    "
                  >
                    <span>
                      {
                        albumPhotos.length
                      }{" "}
                      {albumPhotos.length ===
                      1
                        ? "photo"
                        : "photos"}
                    </span>

                    {album.description && (
                      <>
                        <span
                          className="
                            h-[3px]
                            w-[3px]
                            rounded-full
                            bg-ocean-300
                          "
                        />

                        <span
                          className="
                            line-clamp-1
                          "
                        >
                          {
                            album.description
                          }
                        </span>
                      </>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  aria-label="Album options"
                  onClick={async () => {
                    const result =
                      await Swal.fire(
                        {
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
                            "#083b59",

                          denyButtonColor:
                            "#d85f72",

                          background:
                            "#fffdf9",

                          color:
                            "#123d59",
                        }
                      );

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
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    text-ink-soft
                    transition
                    hover:bg-white
                    hover:text-ocean-900
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
        min-h-[58vh]
        items-center
        justify-center
      "
    >
      <div
        className="
          text-center
        "
      >
        <div
          className="
            mx-auto
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            border
            border-ocean-100
            bg-white/70
            text-ocean-800
            shadow-[0_10px_30px_rgba(8,59,89,0.05)]
          "
        >
          <LockKeyhole
            size={19}
            strokeWidth={1.7}
          />
        </div>

        <h2
          className="
            mt-5
            font-display
            text-[28px]
            font-semibold
            tracking-[-0.025em]
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
          className={`
            ${primaryButtonClass}
            mt-6
          `}
        >
          Unlock
        </button>
      </div>
    </section>
  );
}

/*
 * =========================================================
 * UPLOAD
 * =========================================================
 */

function UploadPhotosModal({
  userId,
  coupleId,
  albums,
  defaultAlbumId,
  defaultVisibility,
  vaultUnlocked,
  onClose,
  onUploaded,
}: {
  userId: string;
  coupleId: string;
  albums: GalleryAlbum[];
  defaultAlbumId:
    string | null;
  defaultVisibility:
    UploadDestination;
  vaultUnlocked:
    boolean;
  onClose:
    () => void;
  onUploaded: (
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

  const [
    isPreparingFiles,
    setIsPreparingFiles,
  ] =
    useState(false);

  const availableAlbums =
    albums.filter(
      (album) =>
        album.visibility ===
        visibility
    );

  const handleFiles =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const input =
        event.currentTarget;

      const selected =
        Array.from(
          input.files ??
          []
        );

      /*
       * Clear immediately so the same file can be
       * selected again after an error/removal.
       */
      input.value =
        "";

      if (
        selected.length === 0
      ) {
        return;
      }

      setIsPreparingFiles(
        true
      );

      try {
        /*
         * HEIC / HEIF is converted to JPEG here.
         * Other supported image formats pass through.
         *
         * Normalizing before setFiles also means the
         * preview grid receives browser-displayable files.
         */
        const normalized =
          await normalizeImageFiles(
            selected,
            {
              maxSizeMB:
                8,

              heicQuality:
                0.88,
            }
          );

        setFiles(
          (current) => [
            ...current,
            ...normalized,
          ]
        );
      } catch (error) {
        await showError(
          "Photo could not be added",

          error instanceof
            Error
            ? error.message
            : "One of the selected photos is invalid."
        );
      } finally {
        setIsPreparingFiles(
          false
        );
      }
    };

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

  const handleUpload =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        files.length === 0
      ) {
        return;
      }

      if (
        visibility ===
          "private" &&
        !vaultUnlocked
      ) {
        await showWarning(
          "Vault locked",
          "Unlock the Vault first."
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
          const file of
          files
        ) {
          const photo =
            await uploadGalleryFile(
              {
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
              }
            );

          created.push(
            photo
          );
        }

        onUploaded(
          created
        );
      } catch (error) {
        await showError(
          "Upload failed",

          error instanceof
            Error
            ? error.message
            : "Something went wrong."
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
        isUploading ||
        isPreparingFiles
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
          <label
            className="
              flex
              min-h-[165px]
              cursor-pointer
              flex-col
              items-center
              justify-center
              rounded-[20px]
              border
              border-dashed
              border-ocean-200
              bg-ocean-50/45
              px-6
              text-center
              transition
              hover:border-ocean-300
              hover:bg-ocean-50
            "
          >
            <Plus
              size={20}
              strokeWidth={1.8}
              className="
                text-ocean-700
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
              {isPreparingFiles
                ? "Preparing photos..."
                : "Select photos"}
            </p>

            <p
              className="
                mt-1
                text-[11px]
                text-ink-soft
              "
            >
              {isPreparingFiles
                ? "HEIC / HEIF photos are converted automatically."
                : files.length > 0
                  ? `${files.length} selected`
                  : "JPG, PNG, WebP, HEIC, and HEIF · max 8 MB each"}
            </p>

            <input
              type="file"
              multiple
              accept={
                IMAGE_ACCEPT
              }
              disabled={
                isUploading ||
                isPreparingFiles
              }
              onChange={
                handleFiles
              }
              className="hidden"
            />
          </label>

          {files.length > 0 && (
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
                    text-ink-soft
                  "
                >
                  {
                    files.length
                  }{" "}
                  photos
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
                    font-medium
                    text-ocean-700
                    transition
                    hover:text-ocean-950
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

          <div
            className="
              mt-6
              grid
              gap-4
              sm:grid-cols-2
            "
          >
            <Field
              label="Save to"
            >
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
                className={
                  inputClass
                }
              >
                <option value="shared">
                  Gallery
                </option>

                <option
                  value="private"
                  disabled={
                    !vaultUnlocked
                  }
                >
                  Private Vault
                </option>
              </select>
            </Field>

            <Field
              label="Album"
            >
              <select
                value={
                  albumId
                }
                onChange={(
                  event
                ) =>
                  setAlbumId(
                    event.target
                      .value
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  No Album
                </option>

                {availableAlbums.map(
                  (
                    album
                  ) => (
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
            </Field>
          </div>

          <button
            type="submit"
            disabled={
              isUploading ||
              isPreparingFiles ||
              files.length ===
                0
            }
            className={`
              ${primaryButtonClass}
              mt-6
              w-full
            `}
          >
            {isPreparingFiles
              ? "Preparing..."
              : isUploading
                ? "Uploading..."
                : "Upload"}
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
        aria-label="Remove photo"
        className="
          absolute
          right-1.5
          top-1.5
          flex
          h-7
          w-7
          items-center
          justify-center
          rounded-full
          bg-black/40
          text-white
          backdrop-blur-md
          transition
          hover:bg-black/60
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
 * CAMERA PHOTO
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
  albums: GalleryAlbum[];
  defaultAlbumId:
    string | null;
  defaultVisibility:
    Visibility;
  vaultUnlocked:
    boolean;
  onClose:
    () => void;
  onSaved: (
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
          "Vault locked",
          "Unlock the Vault first."
        );

        return;
      }

      setSaving(
        true
      );

      try {
        const photo =
          await uploadGalleryFile(
            {
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
            }
          );

        onSaved(
          photo
        );
      } catch (error) {
        await showError(
          "Photo could not be saved",

          error instanceof
            Error
            ? error.message
            : "Something went wrong."
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
          <div
            className="
              relative
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

          <div
            className="
              mt-6
              space-y-4
            "
          >
            <Field
              label="Title"
            >
              <input
                type="text"
                value={
                  title
                }
                onChange={(
                  event
                ) =>
                  setTitle(
                    event.target
                      .value
                  )
                }
                placeholder="Optional"
                className={
                  inputClass
                }
              />
            </Field>

            <Field
              label="Note"
            >
              <textarea
                value={
                  note
                }
                onChange={(
                  event
                ) =>
                  setNote(
                    event.target
                      .value
                  )
                }
                rows={3}
                placeholder="Optional"
                className={`
                  ${inputClass}
                  resize-none
                `}
              />
            </Field>

            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              <Field
                label="Save to"
              >
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
                  className={
                    inputClass
                  }
                >
                  <option value="shared">
                    Gallery
                  </option>

                  <option
                    value="private"
                    disabled={
                      !vaultUnlocked
                    }
                  >
                    Private Vault
                  </option>
                </select>
              </Field>

              <Field
                label="Album"
              >
                <select
                  value={
                    albumId
                  }
                  onChange={(
                    event
                  ) =>
                    setAlbumId(
                      event.target
                        .value
                    )
                  }
                  className={
                    inputClass
                  }
                >
                  <option value="">
                    No Album
                  </option>

                  {availableAlbums.map(
                    (
                      album
                    ) => (
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
              </Field>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              saving
            }
            className={`
              ${primaryButtonClass}
              mt-6
              w-full
            `}
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
 * PHOTO INFO
 * =========================================================
 */

function PhotoInfoModal({
  photo,
  onClose,
  onSaved,
}: {
  photo: GalleryPhoto;
  onClose:
    () => void;
  onSaved: (
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
          "Info could not be saved",

          error instanceof
            Error
            ? error.message
            : "Something went wrong."
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
            space-y-4
            p-5
            sm:p-6
          "
        >
          <Field
            label="Title"
          >
            <input
              type="text"
              value={
                title
              }
              onChange={(
                event
              ) =>
                setTitle(
                  event.target
                    .value
                )
              }
              placeholder="Optional"
              className={
                inputClass
              }
            />
          </Field>

          <Field
            label="Note"
          >
            <textarea
              value={
                note
              }
              onChange={(
                event
              ) =>
                setNote(
                  event.target
                    .value
                )
              }
              rows={5}
              placeholder="Optional"
              className={`
                ${inputClass}
                resize-none
              `}
            />
          </Field>

          <button
            type="submit"
            disabled={
              saving
            }
            className={`
              ${primaryButtonClass}
              mt-2
              w-full
            `}
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
  coupleId: string;
  userId: string;
  editingAlbum:
    GalleryAlbum | null;
  vaultUnlocked:
    boolean;
  onClose:
    () => void;
  onSaved: (
    album:
      GalleryAlbum
  ) => void;
}) {
  const [
    name,
    setName,
  ] =
    useState(
      editingAlbum?.name ??
      ""
    );

  const [
    description,
    setDescription,
  ] =
    useState(
      editingAlbum
        ?.description ??
      ""
    );

  const [
    visibility,
    setVisibility,
  ] =
    useState<Visibility>(
      editingAlbum
        ?.visibility ??
        "shared"
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
          "Vault locked",
          "Unlock the Vault first."
        );

        return;
      }

      setSaving(
        true
      );

      const supabase =
        createClient();

      try {
        if (
          editingAlbum
        ) {
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
          "Album could not be saved",

          error instanceof
            Error
            ? error.message
            : "Something went wrong."
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
            space-y-4
            p-5
            sm:p-6
          "
        >
          <Field
            label="Name"
          >
            <input
              type="text"
              value={
                name
              }
              onChange={(
                event
              ) =>
                setName(
                  event.target
                    .value
                )
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field
            label="Description"
          >
            <textarea
              value={
                description
              }
              onChange={(
                event
              ) =>
                setDescription(
                  event.target
                    .value
                )
              }
              rows={3}
              className={`
                ${inputClass}
                resize-none
              `}
            />
          </Field>

          {!editingAlbum && (
            <Field
              label="Visibility"
            >
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
                className={
                  inputClass
                }
              >
                <option value="shared">
                  Shared
                </option>

                <option
                  value="private"
                  disabled={
                    !vaultUnlocked
                  }
                >
                  Private
                </option>
              </select>
            </Field>
          )}

          <button
            type="submit"
            disabled={
              saving ||
              !name.trim()
            }
            className={`
              ${primaryButtonClass}
              mt-2
              w-full
            `}
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
  photo: GalleryPhoto;
  index: number;
  total: number;
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
        bg-[#04141f]/95
        backdrop-blur-sm
      "
    >
      <div
        className="
          grid
          h-[100svh]
          grid-rows-[minmax(0,1fr)_auto]
          lg:grid-cols-[minmax(0,1fr)_360px]
          lg:grid-rows-1
        "
      >
        {/* IMAGE */}

        <div
          className="
            relative
            min-h-0
            overflow-hidden
          "
        >
          <div
            className="
              absolute
              left-5
              top-5
              z-30
              rounded-full
              bg-black/20
              px-3
              py-1.5
              text-[11px]
              text-white/60
              backdrop-blur-md
            "
          >
            {index + 1} /{" "}
            {total}
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close photo"
            className="
              absolute
              right-5
              top-5
              z-40
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-black/25
              text-white
              backdrop-blur-md
              transition
              hover:bg-black/40
            "
          >
            <X
              size={18}
            />
          </button>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={
                  onPrevious
                }
                aria-label="Previous photo"
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
                  bg-black/25
                  text-white
                  backdrop-blur-md
                  transition
                  hover:bg-black/40
                  sm:left-6
                "
              >
                <ChevronLeft
                  size={22}
                />
              </button>

              <button
                type="button"
                onClick={
                  onNext
                }
                aria-label="Next photo"
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
                  bg-black/25
                  text-white
                  backdrop-blur-md
                  transition
                  hover:bg-black/40
                  sm:right-6
                  lg:right-6
                "
              >
                <ChevronRight
                  size={22}
                />
              </button>
            </>
          )}

          <div
            className="
              absolute
              inset-4
              sm:inset-8
              lg:inset-10
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
        </div>

        {/* INFO */}

        <aside
          className="
            max-h-[40svh]
            overflow-y-auto
            border-t
            border-white/10
            bg-[#071a27]
            px-6
            py-5
            text-white
            lg:max-h-none
            lg:border-l
            lg:border-t-0
            lg:px-7
            lg:py-8
          "
        >
          <div
            className="
              flex
              h-full
              flex-col
            "
          >
            <div>
              {photo.title ? (
                <h2
                  className="
                    font-display
                    text-2xl
                    font-semibold
                    leading-tight
                    tracking-[-0.025em]
                    text-white
                  "
                >
                  {photo.title}
                </h2>
              ) : (
                <p
                  className="
                    text-xs
                    font-medium
                    text-white/40
                  "
                >
                  Photo
                </p>
              )}

              {photo.caption && (
                <p
                  className="
                    mt-4
                    whitespace-pre-line
                    text-sm
                    leading-6
                    text-white/55
                  "
                >
                  {
                    photo.caption
                  }
                </p>
              )}

              {photo.source_type ===
                "memory" && (
                <p
                  className="
                    mt-5
                    text-[11px]
                    text-white/35
                  "
                >
                  From Memory
                </p>
              )}
            </div>

            <div
              className="
                mt-6
                border-t
                border-white/10
                pt-5
                lg:mt-auto
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  gap-2
                "
              >
                <LightboxAction
                  onClick={
                    onFavorite
                  }
                  active={
                    photo.is_favorite
                  }
                >
                  {photo.is_favorite
                    ? "Favorited"
                    : "Favorite"}
                </LightboxAction>

                <LightboxAction
                  onClick={
                    onEdit
                  }
                >
                  Edit
                </LightboxAction>

                <LightboxAction
                  onClick={
                    onMove
                  }
                >
                  Album
                </LightboxAction>
              </div>

              <button
                type="button"
                onClick={
                  onDelete
                }
                className="
                  mt-5
                  text-xs
                  font-medium
                  text-red-300
                  transition
                  hover:text-red-200
                "
              >
                Delete
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * LIGHTBOX ACTION
 * =========================================================
 */

function LightboxAction({
  children,
  onClick,
  active = false,
}: {
  children: ReactNode;
  onClick:
    () => void;
  active?:
    boolean;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        rounded-full
        border
        px-4
        py-2
        text-xs
        font-medium
        transition

        ${
          active
            ? "border-white/30 bg-white text-ocean-950"
            : "border-white/15 text-white/75 hover:border-white/25 hover:bg-white/10 hover:text-white"
        }
      `}
    >
      {children}
    </button>
  );
}

/*
 * =========================================================
 * MODAL
 * =========================================================
 */

function ModalShell({
  children,
  onClose,
  locked = false,
}: {
  children: ReactNode;
  onClose:
    () => void;
  locked?:
    boolean;
}) {
  useEffect(() => {
    if (
      locked
    ) {
      return;
    }

    const handleKey =
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
      };

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKey
      );
    };
  }, [
    locked,
    onClose,
  ]);

  return (
    <div
      className="
        fixed
        inset-0
        z-[1600]
        flex
        items-center
        justify-center
        bg-ocean-950/45
        p-4
        backdrop-blur-[6px]
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
          rounded-[28px]
          border
          border-white/60
          bg-[#fffdf9]
          shadow-[0_30px_100px_rgba(6,42,63,0.24)]
        "
      >
        {children}
      </div>
    </div>
  );
}

/*
 * =========================================================
 * MODAL HEADER
 * =========================================================
 */

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
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
        border-ocean-100/80
        px-5
        py-4
        sm:px-6
      "
    >
      <h2
        className="
          font-display
          text-[24px]
          font-semibold
          tracking-[-0.025em]
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
        aria-label="Close"
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          text-ink-soft
          transition
          hover:bg-ocean-50
          hover:text-ocean-950
        "
      >
        <X
          size={16}
        />
      </button>
    </div>
  );
}

/*
 * =========================================================
 * FIELD
 * =========================================================
 */

function Field({
  label,
  children,
}: {
  label: string;
  children:
    ReactNode;
}) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-xs
          font-medium
          text-ocean-900
        "
      >
        {label}
      </label>

      {children}
    </div>
  );
}

/*
 * =========================================================
 * EMPTY
 * =========================================================
 */

function EmptyState({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div
      className="
        flex
        min-h-[48vh]
        items-center
        justify-center
        text-sm
        text-ink-soft
      "
    >
      {children}
    </div>
  );
}

/*
 * =========================================================
 * UPLOAD
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

  /*
   * Final normalization guard.
   *
   * UploadPhotosModal already normalizes selected files so
   * HEIC previews work immediately, but keeping this guard
   * here makes every caller (including camera/future flows)
   * use one image policy.
   */
  const normalizedFile =
    await normalizeImageFile(
      file,
      {
        maxSizeMB:
          8,

        heicQuality:
          0.88,
      }
    );

  const supabase =
    createClient();

  const photoId =
    crypto.randomUUID();

  const extension =
    getExtension(
      normalizedFile.name
    );

  const storagePath =
    visibility ===
    "private"
      ? `private/${userId}/${photoId}/photo-${Date.now()}.${extension}`
      : `shared/${coupleId}/${photoId}/photo-${Date.now()}.${extension}`;

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
        normalizedFile,
        {
          upsert:
            false,

          contentType:
            normalizedFile.type ||
            "image/jpeg",

          cacheControl:
            "3600",
        }
      );

  if (
    uploadError
  ) {
    throw new Error(
      uploadError.message
    );
  }

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

  if (
    databaseError
  ) {
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

  if (
    signedError
  ) {
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
      signedData
        ?.signedUrl ??
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
      "#083b59",

    background:
      "#fffdf9",

    color:
      "#123d59",
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
      "#083b59",

    background:
      "#fffdf9",

    color:
      "#123d59",
  });
}