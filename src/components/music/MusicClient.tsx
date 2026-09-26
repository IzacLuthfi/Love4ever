// src/components/music/MusicClient.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

import {
  type ChangeEvent,
  type ElementType,
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  Disc3,
  ExternalLink,
  FileAudio,
  Heart,
  Link2,
  Music2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
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

type MusicSource =
  | "upload"
  | "spotify"
  | "youtube"
  | "other";

type MusicTrack = {
  id: string;

  couple_id: string;

  added_by: string;

  title: string;

  artist: string;

  album:
    | string
    | null;

  source_type:
    MusicSource;

  external_url:
    | string
    | null;

  audio_path:
    | string
    | null;

  cover_path:
    | string
    | null;

  is_favorite:
    boolean;

  created_at: string;

  updated_at: string;

  audio_url:
    | string
    | null;

  cover_url:
    | string
    | null;
};

type MusicUser = {
  id: string;

  email: string;

  fullName: string;

  nickname: string;

  avatarUrl:
    | string
    | null;
};

type MusicClientProps = {
  user: MusicUser;

  coupleId: string;

  initialTracks:
    MusicTrack[];
};

type MusicFormState = {
  title: string;

  artist: string;

  album: string;

  sourceType:
    MusicSource;

  externalUrl: string;
};

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function MusicClient({
  user,
  coupleId,
  initialTracks,
}: MusicClientProps) {
  const [
    tracks,
    setTracks,
  ] =
    useState<
      MusicTrack[]
    >(
      initialTracks
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    sourceFilter,
    setSourceFilter,
  ] =
    useState<
      "all" | MusicSource
    >(
      "all"
    );

  const [
    onlyFavorites,
    setOnlyFavorites,
  ] =
    useState(false);

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    editingTrack,
    setEditingTrack,
  ] =
    useState<
      MusicTrack | null
    >(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<
      MusicFormState
    >(
      createEmptyForm()
    );

  const [
    audioFile,
    setAudioFile,
  ] =
    useState<
      File | null
    >(
      null
    );

  const [
    coverFile,
    setCoverFile,
  ] =
    useState<
      File | null
    >(
      null
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  /*
   * =========================================================
   * FILTER
   * =========================================================
   */

  const filteredTracks =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return sortTracks(
        tracks.filter(
          (track) => {
            const matchesSearch =
              !keyword ||
              track.title
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              track.artist
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              (
                track.album ??
                ""
              )
                .toLowerCase()
                .includes(
                  keyword
                );

            const matchesSource =
              sourceFilter ===
                "all" ||
              track.source_type ===
                sourceFilter;

            const matchesFavorite =
              !onlyFavorites ||
              track.is_favorite;

            return (
              matchesSearch &&
              matchesSource &&
              matchesFavorite
            );
          }
        )
      );
    }, [
      tracks,
      search,
      sourceFilter,
      onlyFavorites,
    ]);

  /*
   * =========================================================
   * STATS
   * =========================================================
   */

  const favoriteCount =
    tracks.filter(
      (track) =>
        track.is_favorite
    ).length;

  const uploadedCount =
    tracks.filter(
      (track) =>
        Boolean(
          track.audio_path
        )
    ).length;

  /*
   * =========================================================
   * OPEN CREATE
   * =========================================================
   */

  const handleOpenCreate =
    () => {
      setEditingTrack(
        null
      );

      setForm(
        createEmptyForm()
      );

      setAudioFile(
        null
      );

      setCoverFile(
        null
      );

      setModalOpen(
        true
      );
    };

  /*
   * =========================================================
   * OPEN EDIT
   * =========================================================
   */

  const handleOpenEdit =
    (
      track:
        MusicTrack
    ) => {
      setEditingTrack(
        track
      );

      setForm({
        title:
          track.title,

        artist:
          track.artist,

        album:
          track.album ??
          "",

        sourceType:
          track.source_type,

        externalUrl:
          track.external_url ??
          "",
      });

      setAudioFile(
        null
      );

      setCoverFile(
        null
      );

      setModalOpen(
        true
      );
    };

  /*
   * =========================================================
   * CLOSE
   * =========================================================
   */

  const handleClose =
    () => {
      if (
        isSaving
      ) {
        return;
      }

      setModalOpen(
        false
      );

      setEditingTrack(
        null
      );

      setAudioFile(
        null
      );

      setCoverFile(
        null
      );
    };

  /*
   * =========================================================
   * SAVE
   * =========================================================
   */

  const handleSave =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const title =
        form.title.trim();

      const artist =
        form.artist.trim();

      const externalUrl =
        form.externalUrl.trim();

      if (!title) {
        await showWarning(
          "Judul belum diisi",
          "Judul lagu wajib diisi."
        );

        return;
      }

      if (
        externalUrl &&
        !isValidUrl(
          externalUrl
        )
      ) {
        await showWarning(
          "Link tidak valid",
          "Masukkan URL Spotify, YouTube, atau link lain yang valid."
        );

        return;
      }

      if (
        audioFile &&
        !audioFile.type.startsWith(
          "audio/"
        )
      ) {
        await showWarning(
          "File audio tidak valid",
          "Pilih file audio yang valid."
        );

        return;
      }

      if (
        audioFile &&
        audioFile.size >
          25 *
            1024 *
            1024
      ) {
        await showWarning(
          "File terlalu besar",
          "Maksimal file audio 25 MB."
        );

        return;
      }

      if (
        coverFile &&
        !coverFile.type.startsWith(
          "image/"
        )
      ) {
        await showWarning(
          "Cover tidak valid",
          "Cover harus berupa gambar."
        );

        return;
      }

      if (
        coverFile &&
        coverFile.size >
          8 *
            1024 *
            1024
      ) {
        await showWarning(
          "Cover terlalu besar",
          "Maksimal ukuran cover 8 MB."
        );

        return;
      }

      setIsSaving(
        true
      );

      try {
        if (
          editingTrack
        ) {
          await updateTrack({
            editingTrack,

            form,

            audioFile,

            coverFile,

            setTracks,
          });
        } else {
          await createTrack({
            coupleId,

            userId:
              user.id,

            form,

            audioFile,

            coverFile,

            setTracks,
          });
        }

        setModalOpen(
          false
        );

        setEditingTrack(
          null
        );

        setAudioFile(
          null
        );

        setCoverFile(
          null
        );

        await Swal.fire({
          icon:
            "success",

          title:
            editingTrack
              ? "Track diperbarui"
              : "Track ditambahkan",

          timer:
            1000,

          showConfirmButton:
            false,
        });
      } catch (error) {
        await showError(
          "Gagal menyimpan track",
          error instanceof
            Error
            ? error.message
            : "Terjadi kesalahan."
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };

  /*
   * =========================================================
   * FAVORITE
   * =========================================================
   */

  const handleToggleFavorite =
    async (
      track:
        MusicTrack
    ) => {
      const value =
        !track.is_favorite;

      setTracks(
        (current) =>
          sortTracks(
            current.map(
              (item) =>
                item.id ===
                track.id
                  ? {
                      ...item,

                      is_favorite:
                        value,
                    }
                  : item
            )
          )
      );

      const supabase =
        createClient();

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "music_tracks"
          )
          .update({
            is_favorite:
              value,
          })
          .eq(
            "id",
            track.id
          )
          .select()
          .single();

      if (error) {
        setTracks(
          (current) =>
            sortTracks(
              current.map(
                (item) =>
                  item.id ===
                  track.id
                    ? track
                    : item
              )
            )
        );

        await showError(
          "Favorite gagal diperbarui",
          error.message
        );

        return;
      }

      setTracks(
        (current) =>
          sortTracks(
            current.map(
              (item) =>
                item.id ===
                track.id
                  ? {
                      ...item,
                      ...data,
                    }
                  : item
            )
          )
      );
    };

  /*
   * =========================================================
   * DELETE
   * =========================================================
   */

  const handleDelete =
    async (
      track:
        MusicTrack
    ) => {
      const result =
        await Swal.fire({
          icon:
            "warning",

          title:
            "Hapus track?",

          text:
            `"${track.title}" akan dihapus dari playlist.`,

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

      const {
        error,
      } =
        await supabase
          .from(
            "music_tracks"
          )
          .delete()
          .eq(
            "id",
            track.id
          );

      if (error) {
        await showError(
          "Track gagal dihapus",
          error.message
        );

        return;
      }

      /*
       * Database sudah berhasil dihapus.
       * Storage cleanup dijalankan sesudahnya.
       */

      if (
        track.audio_path
      ) {
        await supabase.storage
          .from(
            "music-audio"
          )
          .remove([
            track.audio_path,
          ]);
      }

      if (
        track.cover_path
      ) {
        await supabase.storage
          .from(
            "music-covers"
          )
          .remove([
            track.cover_path,
          ]);
      }

      setTracks(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              track.id
          )
      );

      await Swal.fire({
        icon:
          "success",

        title:
          "Track dihapus",

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
        user={user}
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
            max-w-[1500px]
          "
        >
          {/* HEADER */}

          <header
            className="
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div>
              <Link
                href="/dashboard"
                className="
                  mb-3
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
                <ChevronLeft
                  size={17}
                />

                Dashboard
              </Link>

              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.23em]
                  text-ocean-500
                "
              >
                Shared Playlist
              </p>

              <h1
                className="
                  mt-1
                  font-display
                  text-3xl
                  font-semibold
                  text-ocean-950
                  sm:text-4xl
                "
              >
                Music
              </h1>

              <p
                className="
                  mt-2
                  max-w-xl
                  text-sm
                  leading-6
                  text-ink-soft
                "
              >
                Simpan lagu, playlist link,
                dan audio yang ingin kalian
                dengarkan bersama.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleOpenCreate
              }
              className="
                love-button
                flex
                items-center
                justify-center
                gap-2
                rounded-[15px]
                px-5
                py-3.5
                text-sm
                font-semibold
              "
            >
              <Plus
                size={18}
              />

              Add Track
            </button>
          </header>

          {/* STATS */}

          <section
            className="
              mt-7
              grid
              gap-3
              sm:grid-cols-3
            "
          >
            <SummaryCard
              icon={
                Music2
              }
              value={
                tracks.length
              }
              label="Total Tracks"
            />

            <SummaryCard
              icon={
                Star
              }
              value={
                favoriteCount
              }
              label="Favorites"
            />

            <SummaryCard
              icon={
                FileAudio
              }
              value={
                uploadedCount
              }
              label="Uploaded Audio"
            />
          </section>

          {/* FILTER */}

          <section
            className="
              glass-card
              mt-5
              rounded-[25px]
              p-4
              sm:p-5
            "
          >
            <div
              className="
                grid
                gap-3
                xl:grid-cols-[1fr_230px_auto]
              "
            >
              <div
                className="
                  relative
                "
              >
                <Search
                  size={17}
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-ink-soft
                  "
                />

                <input
                  type="search"
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search title, artist, album..."
                  className="
                    love-input
                    w-full
                    rounded-[15px]
                    py-3
                    pl-11
                    pr-4
                    text-sm
                  "
                />
              </div>

              <select
                value={
                  sourceFilter
                }
                onChange={(
                  event
                ) =>
                  setSourceFilter(
                    event.target.value as
                      | "all"
                      | MusicSource
                  )
                }
                className="
                  love-input
                  rounded-[15px]
                  px-4
                  py-3
                  text-sm
                  text-ocean-900
                "
              >
                <option value="all">
                  All Sources
                </option>

                <option value="upload">
                  Uploaded Audio
                </option>

                <option value="spotify">
                  Spotify
                </option>

                <option value="youtube">
                  YouTube
                </option>

                <option value="other">
                  Other
                </option>
              </select>

              <button
                type="button"
                onClick={() =>
                  setOnlyFavorites(
                    (current) =>
                      !current
                  )
                }
                className={`
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-[15px]
                  border
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  transition
                  ${
                    onlyFavorites
                      ? "border-ocean-700 bg-ocean-700 text-white"
                      : "border-ocean-100 bg-white/70 text-ocean-700 hover:bg-white"
                  }
                `}
              >
                <Star
                  size={15}
                  fill={
                    onlyFavorites
                      ? "currentColor"
                      : "none"
                  }
                />

                Favorites
              </button>
            </div>
          </section>

          {/* TRACKS */}

          <section
            className="
              mt-6
            "
          >
            {filteredTracks.length >
            0 ? (
              <div
                className="
                  grid
                  gap-4
                  xl:grid-cols-2
                "
              >
                {filteredTracks.map(
                  (
                    track
                  ) => (
                    <TrackCard
                      key={
                        track.id
                      }
                      track={
                        track
                      }
                      onEdit={() =>
                        handleOpenEdit(
                          track
                        )
                      }
                      onFavorite={() =>
                        handleToggleFavorite(
                          track
                        )
                      }
                      onDelete={() =>
                        handleDelete(
                          track
                        )
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <EmptyMusic
                filtered={
                  Boolean(
                    search.trim()
                  ) ||
                  sourceFilter !==
                    "all" ||
                  onlyFavorites
                }
                onAdd={
                  handleOpenCreate
                }
                onClear={() => {
                  setSearch("");

                  setSourceFilter(
                    "all"
                  );

                  setOnlyFavorites(
                    false
                  );
                }}
              />
            )}
          </section>
        </div>
      </main>

      {modalOpen && (
        <MusicFormModal
          form={
            form
          }
          setForm={
            setForm
          }
          editingTrack={
            editingTrack
          }
          audioFile={
            audioFile
          }
          coverFile={
            coverFile
          }
          setAudioFile={
            setAudioFile
          }
          setCoverFile={
            setCoverFile
          }
          isSaving={
            isSaving
          }
          onClose={
            handleClose
          }
          onSubmit={
            handleSave
          }
        />
      )}
    </div>
  );
}

/*
 * =========================================================
 * TRACK CARD
 * =========================================================
 */

function TrackCard({
  track,
  onEdit,
  onFavorite,
  onDelete,
}: {
  track:
    MusicTrack;

  onEdit:
    () => void;

  onFavorite:
    () => void;

  onDelete:
    () => void;
}) {
  return (
    <article
      className="
        glass-card
        overflow-hidden
        rounded-[28px]
      "
    >
      <div
        className="
          grid
          sm:grid-cols-[190px_1fr]
        "
      >
        {/* COVER */}

        <div
          className="
            relative
            aspect-square
            overflow-hidden
            bg-gradient-to-br
            from-ocean-900
            via-ocean-700
            to-ocean-400
            sm:aspect-auto
            sm:min-h-[260px]
          "
        >
          {track.cover_url ? (
            <>
              <Image
                src={
                  track.cover_url
                }
                alt={
                  track.title
                }
                fill
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
                  from-ocean-950/70
                  via-transparent
                  to-transparent
                "
              />
            </>
          ) : (
            <>
              <Disc3
                size={140}
                className="
                  absolute
                  left-1/2
                  top-1/2
                  -translate-x-1/2
                  -translate-y-1/2
                  text-white/[0.10]
                "
              />

              <Music2
                size={36}
                className="
                  absolute
                  left-1/2
                  top-1/2
                  -translate-x-1/2
                  -translate-y-1/2
                  text-white/80
                "
              />
            </>
          )}

          <SourceBadge
            source={
              track.source_type
            }
          />
        </div>

        {/* CONTENT */}

        <div
          className="
            flex
            min-w-0
            flex-col
            p-5
            sm:p-6
          "
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-4
            "
          >
            <div
              className="
                min-w-0
              "
            >
              <h2
                className="
                  truncate
                  font-display
                  text-2xl
                  font-semibold
                  text-ocean-950
                "
              >
                {track.title}
              </h2>

              <p
                className="
                  mt-1
                  truncate
                  text-sm
                  font-semibold
                  text-ocean-600
                "
              >
                {track.artist ||
                  "Unknown Artist"}
              </p>

              {track.album && (
                <p
                  className="
                    mt-1
                    truncate
                    text-xs
                    text-ink-soft
                  "
                >
                  {
                    track.album
                  }
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={
                onFavorite
              }
              aria-label="Toggle favorite"
              className={`
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-[13px]
                transition
                ${
                  track.is_favorite
                    ? "bg-heart-soft text-heart"
                    : "bg-ocean-50 text-ocean-400 hover:bg-ocean-100"
                }
              `}
            >
              <Heart
                size={17}
                fill={
                  track.is_favorite
                    ? "currentColor"
                    : "none"
                }
              />
            </button>
          </div>

          {/* PLAYER */}

          {track.audio_url && (
            <div
              className="
                mt-5
                rounded-[16px]
                border
                border-ocean-100
                bg-ocean-50/55
                p-3
              "
            >
              <audio
                controls
                preload="metadata"
                src={
                  track.audio_url
                }
                className="
                  h-10
                  w-full
                "
              >
                Browser tidak mendukung audio player.
              </audio>
            </div>
          )}

          {/* ACTIONS */}

          <div
            className="
              mt-auto
              flex
              flex-wrap
              gap-2
              pt-5
            "
          >
            {track.external_url && (
              <a
                href={
                  track.external_url
                }
                target="_blank"
                rel="noreferrer"
                className="
                  flex
                  items-center
                  gap-2
                  rounded-[13px]
                  bg-ocean-700
                  px-3.5
                  py-2.5
                  text-xs
                  font-semibold
                  text-white
                  transition
                  hover:bg-ocean-800
                "
              >
                <ExternalLink
                  size={13}
                />

                Open Link
              </a>
            )}

            <button
              type="button"
              onClick={
                onEdit
              }
              className="
                flex
                items-center
                gap-2
                rounded-[13px]
                border
                border-ocean-100
                bg-white/70
                px-3.5
                py-2.5
                text-xs
                font-semibold
                text-ocean-700
                transition
                hover:bg-white
              "
            >
              <Pencil
                size={13}
              />

              Edit
            </button>

            <button
              type="button"
              onClick={
                onDelete
              }
              className="
                flex
                items-center
                gap-2
                rounded-[13px]
                border
                border-heart-soft
                bg-white/70
                px-3.5
                py-2.5
                text-xs
                font-semibold
                text-heart
                transition
                hover:bg-heart-soft
              "
            >
              <Trash2
                size={13}
              />

              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * SOURCE BADGE
 * =========================================================
 */

function SourceBadge({
  source,
}: {
  source:
    MusicSource;
}) {
  const label: Record<
    MusicSource,
    string
  > = {
    upload:
      "Uploaded",

    spotify:
      "Spotify",

    youtube:
      "YouTube",

    other:
      "External",
  };

  return (
    <span
      className="
        absolute
        left-4
        top-4
        rounded-full
        border
        border-white/20
        bg-black/20
        px-3
        py-1.5
        text-[9px]
        font-bold
        uppercase
        tracking-[0.1em]
        text-white
        backdrop-blur-xl
      "
    >
      {label[source]}
    </span>
  );
}

/*
 * =========================================================
 * FORM MODAL
 * =========================================================
 */

function MusicFormModal({
  form,
  setForm,
  editingTrack,
  audioFile,
  coverFile,
  setAudioFile,
  setCoverFile,
  isSaving,
  onClose,
  onSubmit,
}: {
  form:
    MusicFormState;

  setForm:
    React.Dispatch<
      React.SetStateAction<
        MusicFormState
      >
    >;

  editingTrack:
    MusicTrack | null;

  audioFile:
    File | null;

  coverFile:
    File | null;

  setAudioFile:
    React.Dispatch<
      React.SetStateAction<
        File | null
      >
    >;

  setCoverFile:
    React.Dispatch<
      React.SetStateAction<
        File | null
      >
    >;

  isSaving:
    boolean;

  onClose:
    () => void;

  onSubmit:
    (
      event:
        FormEvent<HTMLFormElement>
    ) => void;
}) {
  return (
    <div
      className="
        fixed
        inset-0
        z-[1200]
        flex
        items-center
        justify-center
        bg-ocean-950/35
        p-3
        backdrop-blur-sm
        sm:p-5
      "
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          max-h-[94svh]
          w-full
          max-w-[720px]
          overflow-y-auto
          rounded-[28px]
          border
          border-white/80
          bg-[#fbfdfe]
          shadow-[0_30px_100px_rgba(6,42,63,0.25)]
        "
      >
        <div
          className="
            sticky
            top-0
            z-20
            flex
            items-center
            justify-between
            border-b
            border-ocean-100
            bg-[#fbfdfe]/95
            px-5
            py-4
            backdrop-blur-xl
            sm:px-6
          "
        >
          <div>
            <p
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.2em]
                text-ocean-500
              "
            >
              Shared Playlist
            </p>

            <h2
              className="
                mt-0.5
                font-display
                text-2xl
                font-semibold
                text-ocean-950
              "
            >
              {editingTrack
                ? "Edit Track"
                : "Add Track"}
            </h2>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              isSaving
            }
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-[13px]
              bg-ocean-50
              text-ink-soft
            "
          >
            <X
              size={18}
            />
          </button>
        </div>

        <form
          onSubmit={
            onSubmit
          }
          className="
            p-5
            sm:p-6
          "
        >
          <div
            className="
              grid
              gap-5
            "
          >
            <FormField
              label="Title"
              required
            >
              <input
                type="text"
                value={
                  form.title
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,

                      title:
                        event.target.value,
                    })
                  )
                }
                placeholder="Judul lagu"
                className="
                  love-input
                  w-full
                  rounded-[15px]
                  px-4
                  py-3
                  text-sm
                "
              />
            </FormField>

            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              <FormField
                label="Artist"
              >
                <input
                  type="text"
                  value={
                    form.artist
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        artist:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Artist"
                  className="
                    love-input
                    w-full
                    rounded-[15px]
                    px-4
                    py-3
                    text-sm
                  "
                />
              </FormField>

              <FormField
                label="Album"
              >
                <input
                  type="text"
                  value={
                    form.album
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        album:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Album"
                  className="
                    love-input
                    w-full
                    rounded-[15px]
                    px-4
                    py-3
                    text-sm
                  "
                />
              </FormField>
            </div>

            <FormField
              label="Source"
            >
              <select
                value={
                  form.sourceType
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,

                      sourceType:
                        event.target.value as
                          MusicSource,
                    })
                  )
                }
                className="
                  love-input
                  w-full
                  rounded-[15px]
                  px-4
                  py-3
                  text-sm
                  text-ocean-900
                "
              >
                <option value="upload">
                  Upload
                </option>

                <option value="spotify">
                  Spotify
                </option>

                <option value="youtube">
                  YouTube
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </FormField>

            <FormField
              label="External Link"
            >
              <input
                type="url"
                value={
                  form.externalUrl
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,

                      externalUrl:
                        event.target.value,
                    })
                  )
                }
                placeholder="https://..."
                className="
                  love-input
                  w-full
                  rounded-[15px]
                  px-4
                  py-3
                  text-sm
                "
              />
            </FormField>

            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              <UploadField
                label="Audio File"
                icon={
                  FileAudio
                }
                accept="audio/*"
                file={
                  audioFile
                }
                existing={
                  Boolean(
                    editingTrack?.audio_path
                  )
                }
                onChange={
                  setAudioFile
                }
              />

              <UploadField
                label="Cover Image"
                icon={
                  Upload
                }
                accept="image/*"
                file={
                  coverFile
                }
                existing={
                  Boolean(
                    editingTrack?.cover_path
                  )
                }
                onChange={
                  setCoverFile
                }
              />
            </div>
          </div>

          <div
            className="
              mt-7
              flex
              flex-col-reverse
              gap-2
              sm:flex-row
              sm:justify-end
            "
          >
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                isSaving
              }
              className="
                rounded-[15px]
                border
                border-ocean-100
                bg-white
                px-5
                py-3
                text-sm
                font-semibold
                text-ink-soft
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSaving
              }
              className="
                love-button
                flex
                items-center
                justify-center
                gap-2
                rounded-[15px]
                px-5
                py-3
                text-sm
                font-semibold
                disabled:opacity-60
              "
            >
              {isSaving
                ? "Saving..."
                : editingTrack
                  ? "Save Changes"
                  : "Add Track"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * UPLOAD FIELD
 * =========================================================
 */

function UploadField({
  label,
  icon: Icon,
  accept,
  file,
  existing,
  onChange,
}: {
  label:
    string;

  icon:
    ElementType;

  accept:
    string;

  file:
    File | null;

  existing:
    boolean;

  onChange:
    (
      file:
        File | null
    ) => void;
}) {
  const handleChange =
    (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      onChange(
        event.target.files?.[0] ??
          null
      );
    };

  return (
    <div>
      <p
        className="
          mb-2
          text-xs
          font-bold
          text-ocean-800
        "
      >
        {label}
      </p>

      <label
        className="
          flex
          min-h-[110px]
          cursor-pointer
          flex-col
          items-center
          justify-center
          rounded-[18px]
          border
          border-dashed
          border-ocean-200
          bg-ocean-50/50
          px-4
          py-4
          text-center
          transition
          hover:bg-ocean-50
        "
      >
        <Icon
          size={21}
          className="
            text-ocean-500
          "
        />

        <p
          className="
            mt-2
            max-w-full
            truncate
            text-xs
            font-semibold
            text-ocean-800
          "
        >
          {file
            ? file.name
            : existing
              ? "Current file saved — choose to replace"
              : "Choose file"}
        </p>

        <input
          type="file"
          accept={
            accept
          }
          onChange={
            handleChange
          }
          className="hidden"
        />
      </label>
    </div>
  );
}

/*
 * =========================================================
 * CREATE TRACK
 * =========================================================
 */

async function createTrack({
  coupleId,
  userId,
  form,
  audioFile,
  coverFile,
  setTracks,
}: {
  coupleId:
    string;

  userId:
    string;

  form:
    MusicFormState;

  audioFile:
    File | null;

  coverFile:
    File | null;

  setTracks:
    React.Dispatch<
      React.SetStateAction<
        MusicTrack[]
      >
    >;
}) {
  const supabase =
    createClient();

  const {
    data: inserted,
    error: insertError,
  } =
    await supabase
      .from(
        "music_tracks"
      )
      .insert({
        couple_id:
          coupleId,

        added_by:
          userId,

        title:
          form.title.trim(),

        artist:
          form.artist.trim(),

        album:
          form.album.trim() ||
          null,

        source_type:
          form.sourceType,

        external_url:
          form.externalUrl.trim() ||
          null,

        is_favorite:
          false,
      })
      .select()
      .single();

  if (insertError) {
    throw new Error(
      insertError.message
    );
  }

  const trackId =
    inserted.id;

  let audioPath:
    | string
    | null = null;

  let coverPath:
    | string
    | null = null;

  try {
    if (audioFile) {
      audioPath =
        `${coupleId}/${trackId}/audio-${crypto.randomUUID()}.${getExtension(
          audioFile.name,
          "mp3"
        )}`;

      const {
        error,
      } =
        await supabase.storage
          .from(
            "music-audio"
          )
          .upload(
            audioPath,
            audioFile,
            {
              contentType:
                audioFile.type,

              upsert:
                false,
            }
          );

      if (error) {
        throw new Error(
          error.message
        );
      }
    }

    if (coverFile) {
      coverPath =
        `${coupleId}/${trackId}/cover-${crypto.randomUUID()}.${getExtension(
          coverFile.name,
          "jpg"
        )}`;

      const {
        error,
      } =
        await supabase.storage
          .from(
            "music-covers"
          )
          .upload(
            coverPath,
            coverFile,
            {
              contentType:
                coverFile.type,

              upsert:
                false,
            }
          );

      if (error) {
        throw new Error(
          error.message
        );
      }
    }

    const {
      data: updated,
      error: updateError,
    } =
      await supabase
        .from(
          "music_tracks"
        )
        .update({
          audio_path:
            audioPath,

          cover_path:
            coverPath,
        })
        .eq(
          "id",
          trackId
        )
        .select()
        .single();

    if (updateError) {
      throw new Error(
        updateError.message
      );
    }

    const urls =
      await createTrackSignedUrls(
        updated.audio_path,
        updated.cover_path
      );

    const track:
      MusicTrack = {
      ...updated,

      audio_url:
        urls.audioUrl,

      cover_url:
        urls.coverUrl,
    };

    setTracks(
      (current) =>
        sortTracks([
          track,
          ...current,
        ])
    );
  } catch (error) {
    if (audioPath) {
      await supabase.storage
        .from(
          "music-audio"
        )
        .remove([
          audioPath,
        ]);
    }

    if (coverPath) {
      await supabase.storage
        .from(
          "music-covers"
        )
        .remove([
          coverPath,
        ]);
    }

    await supabase
      .from(
        "music_tracks"
      )
      .delete()
      .eq(
        "id",
        trackId
      );

    throw error;
  }
}

/*
 * =========================================================
 * UPDATE TRACK
 * =========================================================
 */

async function updateTrack({
  editingTrack,
  form,
  audioFile,
  coverFile,
  setTracks,
}: {
  editingTrack:
    MusicTrack;

  form:
    MusicFormState;

  audioFile:
    File | null;

  coverFile:
    File | null;

  setTracks:
    React.Dispatch<
      React.SetStateAction<
        MusicTrack[]
      >
    >;
}) {
  const supabase =
    createClient();

  let newAudioPath =
    editingTrack.audio_path;

  let newCoverPath =
    editingTrack.cover_path;

  let uploadedAudioPath:
    | string
    | null = null;

  let uploadedCoverPath:
    | string
    | null = null;

  try {
    if (audioFile) {
      uploadedAudioPath =
        `${editingTrack.couple_id}/${editingTrack.id}/audio-${crypto.randomUUID()}.${getExtension(
          audioFile.name,
          "mp3"
        )}`;

      const {
        error,
      } =
        await supabase.storage
          .from(
            "music-audio"
          )
          .upload(
            uploadedAudioPath,
            audioFile,
            {
              contentType:
                audioFile.type,

              upsert:
                false,
            }
          );

      if (error) {
        throw new Error(
          error.message
        );
      }

      newAudioPath =
        uploadedAudioPath;
    }

    if (coverFile) {
      uploadedCoverPath =
        `${editingTrack.couple_id}/${editingTrack.id}/cover-${crypto.randomUUID()}.${getExtension(
          coverFile.name,
          "jpg"
        )}`;

      const {
        error,
      } =
        await supabase.storage
          .from(
            "music-covers"
          )
          .upload(
            uploadedCoverPath,
            coverFile,
            {
              contentType:
                coverFile.type,

              upsert:
                false,
            }
          );

      if (error) {
        throw new Error(
          error.message
        );
      }

      newCoverPath =
        uploadedCoverPath;
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "music_tracks"
        )
        .update({
          title:
            form.title.trim(),

          artist:
            form.artist.trim(),

          album:
            form.album.trim() ||
            null,

          source_type:
            form.sourceType,

          external_url:
            form.externalUrl.trim() ||
            null,

          audio_path:
            newAudioPath,

          cover_path:
            newCoverPath,
        })
        .eq(
          "id",
          editingTrack.id
        )
        .select()
        .single();

    if (error) {
      throw new Error(
        error.message
      );
    }

    /*
     * Hapus file lama setelah DB berhasil.
     */

    if (
      audioFile &&
      editingTrack.audio_path &&
      editingTrack.audio_path !==
        newAudioPath
    ) {
      await supabase.storage
        .from(
          "music-audio"
        )
        .remove([
          editingTrack.audio_path,
        ]);
    }

    if (
      coverFile &&
      editingTrack.cover_path &&
      editingTrack.cover_path !==
        newCoverPath
    ) {
      await supabase.storage
        .from(
          "music-covers"
        )
        .remove([
          editingTrack.cover_path,
        ]);
    }

    const urls =
      await createTrackSignedUrls(
        data.audio_path,
        data.cover_path
      );

    const updatedTrack:
      MusicTrack = {
      ...data,

      audio_url:
        urls.audioUrl,

      cover_url:
        urls.coverUrl,
    };

    setTracks(
      (current) =>
        sortTracks(
          current.map(
            (track) =>
              track.id ===
              editingTrack.id
                ? updatedTrack
                : track
          )
        )
    );
  } catch (error) {
    if (uploadedAudioPath) {
      await supabase.storage
        .from(
          "music-audio"
        )
        .remove([
          uploadedAudioPath,
        ]);
    }

    if (uploadedCoverPath) {
      await supabase.storage
        .from(
          "music-covers"
        )
        .remove([
          uploadedCoverPath,
        ]);
    }

    throw error;
  }
}

/*
 * =========================================================
 * SIGNED URLS
 * =========================================================
 */

async function createTrackSignedUrls(
  audioPath:
    | string
    | null,

  coverPath:
    | string
    | null
) {
  const supabase =
    createClient();

  let audioUrl:
    | string
    | null = null;

  let coverUrl:
    | string
    | null = null;

  if (audioPath) {
    const {
      data,
    } =
      await supabase.storage
        .from(
          "music-audio"
        )
        .createSignedUrl(
          audioPath,
          60 * 60
        );

    audioUrl =
      data?.signedUrl ??
      null;
  }

  if (coverPath) {
    const {
      data,
    } =
      await supabase.storage
        .from(
          "music-covers"
        )
        .createSignedUrl(
          coverPath,
          60 * 60
        );

    coverUrl =
      data?.signedUrl ??
      null;
  }

  return {
    audioUrl,
    coverUrl,
  };
}

/*
 * =========================================================
 * SUMMARY
 * =========================================================
 */

function SummaryCard({
  icon: Icon,
  value,
  label,
}: {
  icon:
    ElementType;

  value:
    number;

  label:
    string;
}) {
  return (
    <div
      className="
        glass-card
        flex
        items-center
        gap-4
        rounded-[24px]
        p-4
        sm:p-5
      "
    >
      <div
        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-[15px]
          bg-ocean-100
          text-ocean-700
        "
      >
        <Icon
          size={19}
        />
      </div>

      <div>
        <p
          className="
            font-display
            text-2xl
            font-semibold
            leading-none
            text-ocean-950
          "
        >
          {value}
        </p>

        <p
          className="
            mt-1.5
            text-[11px]
            text-ink-soft
          "
        >
          {label}
        </p>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * FORM FIELD
 * =========================================================
 */

function FormField({
  label,
  required = false,
  children,
}: {
  label:
    string;

  required?:
    boolean;

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
          font-bold
          text-ocean-800
        "
      >
        {label}

        {required && (
          <span
            className="
              ml-1
              text-heart
            "
          >
            *
          </span>
        )}
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

function EmptyMusic({
  filtered,
  onAdd,
  onClear,
}: {
  filtered:
    boolean;

  onAdd:
    () => void;

  onClear:
    () => void;
}) {
  return (
    <div
      className="
        glass-card
        rounded-[30px]
        px-6
        py-16
        text-center
      "
    >
      <div
        className="
          mx-auto
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-[22px]
          bg-ocean-100
          text-ocean-600
        "
      >
        <Music2
          size={28}
        />
      </div>

      <h2
        className="
          mt-5
          font-display
          text-3xl
          font-semibold
          text-ocean-950
        "
      >
        {filtered
          ? "Track tidak ditemukan"
          : "Belum ada track"}
      </h2>

      <p
        className="
          mx-auto
          mt-2
          max-w-md
          text-sm
          leading-7
          text-ink-soft
        "
      >
        {filtered
          ? "Coba ubah search atau filter."
          : "Tambahkan lagu pertama ke shared playlist."}
      </p>

      {filtered ? (
        <button
          type="button"
          onClick={
            onClear
          }
          className="
            mt-6
            rounded-[15px]
            border
            border-ocean-100
            bg-white
            px-5
            py-3
            text-sm
            font-semibold
            text-ocean-700
          "
        >
          Clear Filters
        </button>
      ) : (
        <button
          type="button"
          onClick={
            onAdd
          }
          className="
            love-button
            mt-6
            inline-flex
            items-center
            gap-2
            rounded-[15px]
            px-5
            py-3
            text-sm
            font-semibold
          "
        >
          <Plus
            size={16}
          />

          Add Track
        </button>
      )}
    </div>
  );
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function createEmptyForm():
  MusicFormState {
  return {
    title:
      "",

    artist:
      "",

    album:
      "",

    sourceType:
      "other",

    externalUrl:
      "",
  };
}

function sortTracks(
  tracks:
    MusicTrack[]
) {
  return [
    ...tracks,
  ].sort(
    (
      a,
      b
    ) => {
      if (
        a.is_favorite !==
        b.is_favorite
      ) {
        return a.is_favorite
          ? -1
          : 1;
      }

      return (
        new Date(
          b.created_at
        ).getTime() -
        new Date(
          a.created_at
        ).getTime()
      );
    }
  );
}

function getExtension(
  fileName:
    string,

  fallback:
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
    fallback
  );
}

function isValidUrl(
  value:
    string
) {
  try {
    const url =
      new URL(
        value
      );

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
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