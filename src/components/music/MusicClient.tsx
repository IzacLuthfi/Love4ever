// src/components/music/MusicClient.tsx

"use client";

import Image from "next/image";

import {
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ExternalLink,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  Search,
  Star,
  Upload,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

import { createClient } from "@/lib/supabase/client";
import {
  IMAGE_ACCEPT,
  normalizeImageFile,
} from "@/utils/image";
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

  externalUrl:
    string;
};

type MusicFilter =
  | "all"
  | MusicSource;

/*
 * =========================================================
 * STYLE
 * =========================================================
 */

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
  placeholder:text-ink-soft/45
  focus:border-ocean-300
  focus:bg-white
  focus:ring-4
  focus:ring-ocean-100/45
`;

const primaryButtonClass = `
  inline-flex
  items-center
  justify-center
  gap-2
  rounded-[13px]
  bg-ocean-950
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
    useState<MusicTrack[]>(
      sortTracks(
        initialTracks
      )
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
    useState<MusicFilter>(
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
    >(null);

  const [
    form,
    setForm,
  ] =
    useState<MusicFormState>(
      createEmptyForm()
    );

  const [
    audioFile,
    setAudioFile,
  ] =
    useState<
      File | null
    >(null);

  const [
    coverFile,
    setCoverFile,
  ] =
    useState<
      File | null
    >(null);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  /*
   * =========================================================
   * PLAYER
   * =========================================================
   */

  const [
    activeTrackId,
    setActiveTrackId,
  ] =
    useState<
      string | null
    >(null);

  const [
    isPlaying,
    setIsPlaying,
  ] =
    useState(false);

  const [
    currentTime,
    setCurrentTime,
  ] =
    useState(0);

  const [
    duration,
    setDuration,
  ] =
    useState(0);

  const audioRef =
    useRef<HTMLAudioElement | null>(
      null
    );

  const activeTrack =
    tracks.find(
      (track) =>
        track.id ===
        activeTrackId
    ) ?? null;

  /*
   * =========================================================
   * ACTIVE AUDIO SOURCE
   * =========================================================
   */

  useEffect(() => {
    const audio =
      audioRef.current;

    if (
      !audio ||
      !activeTrack?.audio_url
    ) {
      return;
    }

    audio.pause();

    audio.src =
      activeTrack.audio_url;

    audio.load();

    setCurrentTime(
      0
    );

    setDuration(
      0
    );

    if (
      isPlaying
    ) {
      void audio
        .play()
        .catch(() => {
          setIsPlaying(
            false
          );
        });
    }
  }, [
    activeTrack?.audio_url,
    activeTrack?.id,
  ]);

  /*
   * =========================================================
   * UNMOUNT
   * =========================================================
   */

  useEffect(() => {
    return () => {
      const audio =
        audioRef.current;

      if (audio) {
        audio.pause();
      }
    };
  }, []);

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
   * CREATE
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
   * EDIT
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
   * CLOSE FORM
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

      const externalUrl =
        form.externalUrl.trim();

      if (!title) {
        await showWarning(
          "Title required",
          "Add a title first."
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
          "Invalid link",
          "Enter a valid Spotify, YouTube, or external URL."
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
          "Invalid audio",
          "Choose a valid audio file."
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
          "Audio too large",
          "Maximum audio size is 25 MB."
        );

        return;
      }

      let preparedCoverFile =
  coverFile;

if (
  coverFile
) {
  try {
    preparedCoverFile =
      await normalizeImageFile(
        coverFile,
        {
          maxSizeMB:
            8,

          heicQuality:
            0.88,
        }
      );
  } catch (error) {
    await showError(
      "Cover could not be used",

      error instanceof Error
        ? error.message
        : "Invalid cover image."
    );

    return;
  }
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

  coverFile:
    preparedCoverFile,

  setTracks,
});
        } else {
          await createTrack({
  coupleId,

  userId:
    user.id,

  form,
  audioFile,

  coverFile:
    preparedCoverFile,

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

        await showSuccess(
          editingTrack
            ? "Track updated"
            : "Track added"
        );
      } catch (error) {
        await showError(
          "Track could not be saved",

          error instanceof
            Error
            ? error.message
            : "Something went wrong."
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

      /*
       * Optimistic update.
       */

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
          "Favorite could not be updated",
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
          title:
            "Delete track?",

          text:
            track.title,

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
          "Track could not be deleted",
          error.message
        );

        return;
      }

      /*
       * DB is deleted first.
       * Storage cleanup follows.
       */

      if (
        track.audio_path
      ) {
        const {
          error:
            audioCleanupError,
        } =
          await supabase.storage
            .from(
              "music-audio"
            )
            .remove([
              track.audio_path,
            ]);

        if (
          audioCleanupError
        ) {
          console.error(
            "Audio cleanup:",
            audioCleanupError
          );
        }
      }

      if (
        track.cover_path
      ) {
        const {
          error:
            coverCleanupError,
        } =
          await supabase.storage
            .from(
              "music-covers"
            )
            .remove([
              track.cover_path,
            ]);

        if (
          coverCleanupError
        ) {
          console.error(
            "Cover cleanup:",
            coverCleanupError
          );
        }
      }

      setTracks(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              track.id
          )
      );

      if (
        activeTrackId ===
        track.id
      ) {
        handleClosePlayer();
      }

      await showSuccess(
        "Track deleted"
      );
    };

  /*
   * =========================================================
   * OPTIONS
   * =========================================================
   */

  const handleTrackOptions =
    async (
      track:
        MusicTrack
    ) => {
      const result =
        await Swal.fire({
          title:
            track.title,

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
        });

      if (
        result.isConfirmed
      ) {
        handleOpenEdit(
          track
        );
      }

      if (
        result.isDenied
      ) {
        await handleDelete(
          track
        );
      }
    };

  /*
   * =========================================================
   * PLAY
   * =========================================================
   */

  const handlePlayTrack =
    async (
      track:
        MusicTrack
    ) => {
      if (
        !track.audio_url
      ) {
        return;
      }

      const audio =
        audioRef.current;

      if (!audio) {
        return;
      }

      /*
       * Same track = pause / resume.
       */

      if (
        activeTrackId ===
        track.id
      ) {
        if (
          audio.paused
        ) {
          try {
            await audio.play();

            setIsPlaying(
              true
            );
          } catch {
            setIsPlaying(
              false
            );
          }
        } else {
          audio.pause();

          setIsPlaying(
            false
          );
        }

        return;
      }

      /*
       * New track.
       */

      setActiveTrackId(
        track.id
      );

      setIsPlaying(
        true
      );
    };

  /*
   * =========================================================
   * PLAYER TOGGLE
   * =========================================================
   */

  const handlePlayerToggle =
    async () => {
      const audio =
        audioRef.current;

      if (
        !audio ||
        !activeTrack
      ) {
        return;
      }

      if (
        audio.paused
      ) {
        try {
          await audio.play();

          setIsPlaying(
            true
          );
        } catch {
          setIsPlaying(
            false
          );
        }

        return;
      }

      audio.pause();

      setIsPlaying(
        false
      );
    };

  /*
   * =========================================================
   * SEEK
   * =========================================================
   */

  const handleSeek =
    (
      value:
        number
    ) => {
      const audio =
        audioRef.current;

      if (!audio) {
        return;
      }

      audio.currentTime =
        value;

      setCurrentTime(
        value
      );
    };

  /*
   * =========================================================
   * CLOSE PLAYER
   * =========================================================
   */

  const handleClosePlayer =
    () => {
      const audio =
        audioRef.current;

      if (audio) {
        audio.pause();

        audio.removeAttribute(
          "src"
        );

        audio.load();
      }

      setActiveTrackId(
        null
      );

      setIsPlaying(
        false
      );

      setCurrentTime(
        0
      );

      setDuration(
        0
      );
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
        bg-[linear-gradient(145deg,#f5fbfd_0%,#fffdf9_52%,#f8f2e9_100%)]
      "
    >
      <AppSidebar
        user={user}
      />

      <MobileBottomNav />

      {/* REAL AUDIO */}

      <audio
        ref={
          audioRef
        }
        preload="metadata"
        onLoadedMetadata={(
          event
        ) => {
          const value =
            event.currentTarget
              .duration;

          setDuration(
            Number.isFinite(
              value
            )
              ? value
              : 0
          );
        }}
        onTimeUpdate={(
          event
        ) => {
          setCurrentTime(
            event.currentTarget
              .currentTime
          );
        }}
        onPlay={() =>
          setIsPlaying(
            true
          )
        }
        onPause={() =>
          setIsPlaying(
            false
          )
        }
        onEnded={() => {
          setIsPlaying(
            false
          );

          setCurrentTime(
            0
          );
        }}
      />

      <main
        className={`
          min-h-[100svh]
          px-4
          pt-6
          sm:px-6
          lg:ml-[290px]
          lg:px-8
          lg:pt-9
          xl:px-10

          ${
            activeTrack
              ? "pb-48 lg:pb-36"
              : "pb-28 lg:pb-14"
          }
        `}
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1440px]
          "
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <header
            className="
              flex
              items-end
              justify-between
              gap-5
            "
          >
            <div>
              <h1
                className="
                  font-display
                  text-[34px]
                  font-semibold
                  leading-none
                  tracking-[-0.035em]
                  text-ocean-950
                  sm:text-[40px]
                "
              >
                Music
              </h1>

              <p
                className="
                  mt-3
                  text-xs
                  text-ink-soft
                "
              >
                {tracks.length}{" "}
                {tracks.length ===
                1
                  ? "track"
                  : "tracks"}

                <span
                  className="
                    mx-2
                    text-ocean-200
                  "
                >
                  ·
                </span>

                {favoriteCount}{" "}
                favorites

                <span
                  className="
                    mx-2
                    text-ocean-200
                  "
                >
                  ·
                </span>

                {uploadedCount}{" "}
                uploaded
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleOpenCreate
              }
              className={
                primaryButtonClass
              }
            >
              <Plus
                size={15}
              />

              Add Track
            </button>
          </header>

          {/* =================================================
              FILTER
          ================================================= */}

          <section
            className="
              mt-8
              grid
              gap-3
              border-b
              border-ocean-100/80
              pb-5
              lg:grid-cols-[minmax(0,1fr)_190px_auto]
            "
          >
            {/* SEARCH */}

            <div
              className="
                relative
              "
            >
              <Search
                size={16}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-ink-soft/55
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
                    event.target
                      .value
                  )
                }
                placeholder="Search music"
                className="
                  w-full
                  rounded-[14px]
                  border
                  border-ocean-100
                  bg-white/75
                  py-3
                  pl-11
                  pr-4
                  text-sm
                  text-ocean-950
                  outline-none
                  transition
                  placeholder:text-ink-soft/45
                  focus:border-ocean-200
                  focus:bg-white
                "
              />
            </div>

            {/* SOURCE */}

            <select
              value={
                sourceFilter
              }
              onChange={(
                event
              ) =>
                setSourceFilter(
                  event.target
                    .value as MusicFilter
                )
              }
              className="
                rounded-[14px]
                border
                border-ocean-100
                bg-white/75
                px-4
                py-3
                text-sm
                text-ocean-900
                outline-none
                transition
                focus:border-ocean-200
                focus:bg-white
              "
            >
              <option value="all">
                All Sources
              </option>

              <option value="upload">
                Uploaded
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

            {/* FAVORITE */}

            <button
              type="button"
              onClick={() =>
                setOnlyFavorites(
                  (current) =>
                    !current
                )
              }
              className={`
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-[14px]
                border
                px-4
                py-3
                text-sm
                font-medium
                transition

                ${
                  onlyFavorites
                    ? "border-ocean-950 bg-ocean-950 text-white"
                    : "border-ocean-100 bg-white/75 text-ink-soft hover:bg-white hover:text-ocean-900"
                }
              `}
            >
              <Star
                size={14}
                fill={
                  onlyFavorites
                    ? "currentColor"
                    : "none"
                }
              />

              Favorites
            </button>
          </section>

          {/* =================================================
              LIBRARY
          ================================================= */}

          {filteredTracks.length >
          0 ? (
            <section
              className="
                mt-6
                overflow-hidden
                rounded-[28px]
                border
                border-ocean-100/70
                bg-white/78
                shadow-[0_14px_45px_rgba(8,59,89,0.035)]
                backdrop-blur-xl
              "
            >
              {filteredTracks.map(
                (
                  track,
                  index
                ) => (
                  <TrackRow
                    key={
                      track.id
                    }
                    track={
                      track
                    }
                    active={
                      activeTrackId ===
                      track.id
                    }
                    playing={
                      activeTrackId ===
                        track.id &&
                      isPlaying
                    }
                    last={
                      index ===
                      filteredTracks.length -
                        1
                    }
                    onPlay={() =>
                      void handlePlayTrack(
                        track
                      )
                    }
                    onFavorite={() =>
                      void handleToggleFavorite(
                        track
                      )
                    }
                    onOptions={() =>
                      void handleTrackOptions(
                        track
                      )
                    }
                  />
                )
              )}
            </section>
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
        </div>
      </main>

      {/* =====================================================
          PLAYER
      ====================================================== */}

      {activeTrack &&
        activeTrack.audio_url && (
        <NowPlaying
          track={
            activeTrack
          }
          playing={
            isPlaying
          }
          currentTime={
            currentTime
          }
          duration={
            duration
          }
          onToggle={() =>
            void handlePlayerToggle()
          }
          onSeek={
            handleSeek
          }
          onFavorite={() =>
            void handleToggleFavorite(
              activeTrack
            )
          }
          onClose={
            handleClosePlayer
          }
        />
      )}

      {/* =====================================================
          FORM
      ====================================================== */}

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
 * TRACK ROW
 * =========================================================
 */

function TrackRow({
  track,
  active,
  playing,
  last,
  onPlay,
  onFavorite,
  onOptions,
}: {
  track:
    MusicTrack;

  active:
    boolean;

  playing:
    boolean;

  last:
    boolean;

  onPlay:
    () => void;

  onFavorite:
    () => void;

  onOptions:
    () => void;
}) {
  return (
    <article
      className={`
        group
        grid
        grid-cols-[58px_minmax(0,1fr)_auto]
        items-center
        gap-3
        px-3
        py-3
        transition
        duration-200
        sm:grid-cols-[68px_minmax(0,1fr)_120px_auto]
        sm:gap-4
        sm:px-5

        ${
          !last
            ? "border-b border-ocean-100/65"
            : ""
        }

        ${
          active
            ? "bg-ocean-50/65"
            : "hover:bg-white/75"
        }
      `}
    >
      {/* COVER */}

      <div
        className="
          relative
          h-[58px]
          w-[58px]
          overflow-hidden
          rounded-[13px]
          bg-ocean-950
          sm:h-[68px]
          sm:w-[68px]
        "
      >
        {track.cover_url ? (
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
        ) : (
          <div
            className="
              flex
              h-full
              w-full
              items-center
              justify-center
              bg-[linear-gradient(145deg,#062a3f,#1688b5)]
              text-white/65
            "
          >
            <Music2
              size={19}
              strokeWidth={1.7}
            />
          </div>
        )}

        {track.audio_url && (
          <button
            type="button"
            onClick={
              onPlay
            }
            aria-label={
              playing
                ? "Pause"
                : "Play"
            }
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              bg-ocean-950/35
              text-white
              opacity-0
              backdrop-blur-[1px]
              transition
              duration-200
              group-hover:opacity-100
              focus:opacity-100
            "
          >
            {playing ? (
              <Pause
                size={18}
                fill="currentColor"
              />
            ) : (
              <Play
                size={18}
                fill="currentColor"
              />
            )}
          </button>
        )}
      </div>

      {/* INFO */}

      <div
        className="
          min-w-0
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <h2
            className={`
              truncate
              text-sm
              font-semibold

              ${
                active
                  ? "text-ocean-700"
                  : "text-ocean-950"
              }
            `}
          >
            {track.title}
          </h2>

          {track.is_favorite && (
            <Star
              size={11}
              fill="currentColor"
              className="
                shrink-0
                text-heart
              "
            />
          )}
        </div>

        <p
          className="
            mt-1
            truncate
            text-xs
            text-ink-soft
          "
        >
          {track.artist ||
            "Unknown Artist"}

          {track.album && (
            <>
              <span
                className="
                  mx-1.5
                  text-ocean-200
                "
              >
                ·
              </span>

              {track.album}
            </>
          )}
        </p>

        <p
          className="
            mt-1
            text-[9px]
            font-medium
            text-ink-soft/55
          "
        >
          {getSourceLabel(
            track.source_type
          )}
        </p>
      </div>

      {/* SOURCE - DESKTOP */}

      <div
        className="
          hidden
          min-w-0
          sm:block
        "
      >
        <p
          className="
            truncate
            text-xs
            text-ink-soft
          "
        >
          {track.audio_url
            ? "Audio"
            : track.external_url
              ? "External"
              : "Saved"}
        </p>
      </div>

      {/* ACTIONS */}

      <div
        className="
          flex
          items-center
          justify-end
          gap-1
        "
      >
        <button
          type="button"
          onClick={
            onFavorite
          }
          aria-label="Toggle favorite"
          className={`
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            transition

            ${
              track.is_favorite
                ? "text-heart hover:bg-heart-soft"
                : "text-ink-soft/55 hover:bg-ocean-50 hover:text-ocean-900"
            }
          `}
        >
          <Star
            size={15}
            fill={
              track.is_favorite
                ? "currentColor"
                : "none"
            }
          />
        </button>

        {track.audio_url && (
          <button
            type="button"
            onClick={
              onPlay
            }
            aria-label={
              playing
                ? "Pause"
                : "Play"
            }
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-ocean-950
              text-white
              transition
              hover:bg-ocean-800
            "
          >
            {playing ? (
              <Pause
                size={14}
                fill="currentColor"
              />
            ) : (
              <Play
                size={14}
                fill="currentColor"
              />
            )}
          </button>
        )}

        {track.external_url && (
          <a
            href={
              track.external_url
            }
            target="_blank"
            rel="noreferrer"
            aria-label="Open external link"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              text-ink-soft/60
              transition
              hover:bg-ocean-50
              hover:text-ocean-900
            "
          >
            <ExternalLink
              size={14}
            />
          </a>
        )}

        <button
          type="button"
          onClick={
            onOptions
          }
          aria-label="Track options"
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            text-ink-soft/60
            transition
            hover:bg-ocean-50
            hover:text-ocean-900
          "
        >
          <MoreHorizontal
            size={16}
          />
        </button>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * NOW PLAYING
 * =========================================================
 */

function NowPlaying({
  track,
  playing,
  currentTime,
  duration,
  onToggle,
  onSeek,
  onFavorite,
  onClose,
}: {
  track:
    MusicTrack;

  playing:
    boolean;

  currentTime:
    number;

  duration:
    number;

  onToggle:
    () => void;

  onSeek: (
    value:
      number
  ) => void;

  onFavorite:
    () => void;

  onClose:
    () => void;
}) {
  return (
    <div
      className="
        fixed
        bottom-[92px]
        left-3
        right-3
        z-[900]
        lg:bottom-5
        lg:left-[308px]
        lg:right-5
      "
    >
      <div
        className="
          mx-auto
          max-w-[1100px]
          overflow-hidden
          rounded-[24px]
          border
          border-white/15
          bg-ocean-950/95
          text-white
          shadow-[0_22px_65px_rgba(6,42,63,0.24)]
          backdrop-blur-[24px]
        "
      >
        {/* PROGRESS */}

        <input
          type="range"
          min={0}
          max={
            duration > 0
              ? duration
              : 0
          }
          step={0.1}
          value={
            Math.min(
              currentTime,
              duration || 0
            )
          }
          onChange={(
            event
          ) =>
            onSeek(
              Number(
                event.target
                  .value
              )
            )
          }
          className="
            block
            h-[3px]
            w-full
            cursor-pointer
            accent-sky
          "
        />

        <div
          className="
            flex
            items-center
            gap-3
            px-4
            py-3.5
            sm:gap-4
            sm:px-5
          "
        >
          {/* COVER */}

          <div
            className="
              relative
              h-12
              w-12
              shrink-0
              overflow-hidden
              rounded-[11px]
              bg-ocean-800
              sm:h-14
              sm:w-14
            "
          >
            {track.cover_url ? (
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
            ) : (
              <div
                className="
                  flex
                  h-full
                  w-full
                  items-center
                  justify-center
                  text-white/55
                "
              >
                <Music2
                  size={17}
                />
              </div>
            )}
          </div>

          {/* INFO */}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <p
              className="
                truncate
                text-sm
                font-semibold
                text-white
              "
            >
              {track.title}
            </p>

            <div
              className="
                mt-1
                flex
                items-center
                gap-2
              "
            >
              <p
                className="
                  truncate
                  text-[10px]
                  text-white/45
                "
              >
                {track.artist ||
                  "Unknown Artist"}
              </p>

              <span
                className="
                  hidden
                  text-[9px]
                  text-white/25
                  sm:inline
                "
              >
                {formatSeconds(
                  currentTime
                )}{" "}
                /{" "}
                {formatSeconds(
                  duration
                )}
              </span>
            </div>
          </div>

          {/* FAVORITE */}

          <button
            type="button"
            onClick={
              onFavorite
            }
            aria-label="Favorite"
            className={`
              hidden
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              transition
              sm:flex

              ${
                track.is_favorite
                  ? "text-heart"
                  : "text-white/45 hover:text-white"
              }
            `}
          >
            <Star
              size={15}
              fill={
                track.is_favorite
                  ? "currentColor"
                  : "none"
              }
            />
          </button>

          {/* PLAY */}

          <button
            type="button"
            onClick={
              onToggle
            }
            aria-label={
              playing
                ? "Pause"
                : "Play"
            }
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white
              text-ocean-950
              transition
              hover:scale-[1.03]
              active:scale-[0.97]
            "
          >
            {playing ? (
              <Pause
                size={16}
                fill="currentColor"
              />
            ) : (
              <Play
                size={16}
                fill="currentColor"
              />
            )}
          </button>

          {/* EXTERNAL */}

          {track.external_url && (
            <a
              href={
                track.external_url
              }
              target="_blank"
              rel="noreferrer"
              aria-label="Open source"
              className="
                hidden
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                text-white/45
                transition
                hover:bg-white/10
                hover:text-white
                sm:flex
              "
            >
              <ExternalLink
                size={14}
              />
            </a>
          )}

          {/* CLOSE */}

          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close player"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              text-white/40
              transition
              hover:bg-white/10
              hover:text-white
            "
          >
            <X
              size={15}
            />
          </button>
        </div>
      </div>
    </div>
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
    Dispatch<
      SetStateAction<
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
    Dispatch<
      SetStateAction<
        File | null
      >
    >;

  setCoverFile:
    Dispatch<
      SetStateAction<
        File | null
      >
    >;

  isSaving:
    boolean;

  onClose:
    () => void;

  onSubmit: (
    event:
      FormEvent<HTMLFormElement>
  ) => void;
}) {
  return (
    <div
      className="
        fixed
        inset-0
        z-[1500]
        flex
        items-center
        justify-center
        bg-ocean-950/45
        p-3
        backdrop-blur-[6px]
        sm:p-5
      "
      onMouseDown={(
        event
      ) => {
        if (
          !isSaving &&
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
          max-w-[700px]
          overflow-y-auto
          rounded-[28px]
          border
          border-white/60
          bg-[#fffdf9]
          shadow-[0_30px_100px_rgba(6,42,63,0.24)]
        "
      >
        {/* HEADER */}

        <div
          className="
            sticky
            top-0
            z-20
            flex
            items-center
            justify-between
            border-b
            border-ocean-100/80
            bg-[#fffdf9]/95
            px-5
            py-4
            backdrop-blur-xl
            sm:px-6
          "
        >
          <h2
            className="
              font-display
              text-[25px]
              font-semibold
              tracking-[-0.025em]
              text-ocean-950
            "
          >
            {editingTrack
              ? "Edit Track"
              : "New Track"}
          </h2>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              isSaving
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
              disabled:opacity-40
            "
          >
            <X
              size={16}
            />
          </button>
        </div>

        {/* FORM */}

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
                        event.target
                          .value,
                    })
                  )
                }
                className={
                  inputClass
                }
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
                          event.target
                            .value,
                      })
                    )
                  }
                  className={
                    inputClass
                  }
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
                          event.target
                            .value,
                      })
                    )
                  }
                  className={
                    inputClass
                  }
                />
              </FormField>
            </div>

            <div
              className="
                grid
                gap-4
                sm:grid-cols-[180px_1fr]
              "
            >
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
                          event.target
                            .value as MusicSource,
                      })
                    )
                  }
                  className={
                    inputClass
                  }
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
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="https://..."
                  className={
                    inputClass
                  }
                />
              </FormField>
            </div>

            {/* FILES */}

            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              <UploadField
                label="Audio"
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
  label="Cover"
  accept={
    IMAGE_ACCEPT
  }
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

          {/* ACTIONS */}

          <div
            className="
              mt-7
              flex
              justify-end
              gap-2
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
                rounded-[13px]
                border
                border-ocean-100
                bg-white
                px-5
                py-2.5
                text-sm
                font-semibold
                text-ink-soft
                transition
                hover:bg-ocean-50
                disabled:opacity-40
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSaving
              }
              className={
                primaryButtonClass
              }
            >
              {isSaving
                ? "Saving..."
                : "Save"}
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
  accept,
  file,
  existing,
  onChange,
}: {
  label:
    string;

  accept:
    string;

  file:
    File | null;

  existing:
    boolean;

  onChange: (
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
        event.target
          .files?.[0] ??
          null
      );
    };

  return (
    <div>
      <p
        className="
          mb-2
          text-xs
          font-medium
          text-ocean-900
        "
      >
        {label}
      </p>

      <label
        className="
          flex
          min-h-[112px]
          cursor-pointer
          flex-col
          items-center
          justify-center
          rounded-[18px]
          border
          border-dashed
          border-ocean-200
          bg-ocean-50/35
          px-4
          py-4
          text-center
          transition
          hover:border-ocean-300
          hover:bg-ocean-50
        "
      >
        <Upload
          size={18}
          strokeWidth={1.7}
          className="
            text-ocean-600
          "
        />

        <p
          className="
            mt-3
            max-w-full
            truncate
            text-xs
            font-medium
            text-ocean-900
          "
        >
          {file
            ? file.name
            : existing
              ? "Replace file"
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
    Dispatch<
      SetStateAction<
        MusicTrack[]
      >
    >;
}) {
  const supabase =
    createClient();

  const {
    data:
      inserted,

    error:
      insertError,
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

  if (
    insertError
  ) {
    throw new Error(
      insertError.message
    );
  }

  const trackId =
    inserted.id;

  let audioPath:
    | string
    | null =
    null;

  let coverPath:
    | string
    | null =
    null;

  try {
    /*
     * AUDIO
     */

    if (
      audioFile
    ) {
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

    /*
     * COVER
     */

    if (
      coverFile
    ) {
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

    /*
     * SAVE PATHS
     */

    const {
      data:
        updated,

      error:
        updateError,
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

    if (
      updateError
    ) {
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
    /*
     * ROLLBACK STORAGE
     */

    if (
      audioPath
    ) {
      await supabase.storage
        .from(
          "music-audio"
        )
        .remove([
          audioPath,
        ]);
    }

    if (
      coverPath
    ) {
      await supabase.storage
        .from(
          "music-covers"
        )
        .remove([
          coverPath,
        ]);
    }

    /*
     * ROLLBACK ROW
     */

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
    Dispatch<
      SetStateAction<
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
    | null =
    null;

  let uploadedCoverPath:
    | string
    | null =
    null;

  try {
    /*
     * REPLACE AUDIO
     */

    if (
      audioFile
    ) {
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

    /*
     * REPLACE COVER
     */

    if (
      coverFile
    ) {
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

    /*
     * UPDATE DATABASE
     */

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
     * OLD FILE CLEANUP
     */

    if (
      audioFile &&
      editingTrack.audio_path &&
      editingTrack.audio_path !==
        newAudioPath
    ) {
      const {
        error:
          removeAudioError,
      } =
        await supabase.storage
          .from(
            "music-audio"
          )
          .remove([
            editingTrack.audio_path,
          ]);

      if (
        removeAudioError
      ) {
        console.error(
          "Old audio cleanup:",
          removeAudioError
        );
      }
    }

    if (
      coverFile &&
      editingTrack.cover_path &&
      editingTrack.cover_path !==
        newCoverPath
    ) {
      const {
        error:
          removeCoverError,
      } =
        await supabase.storage
          .from(
            "music-covers"
          )
          .remove([
            editingTrack.cover_path,
          ]);

      if (
        removeCoverError
      ) {
        console.error(
          "Old cover cleanup:",
          removeCoverError
        );
      }
    }

    /*
     * NEW SIGNED URL
     */

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
    /*
     * REMOVE NEW FILES IF DB UPDATE FAILED
     */

    if (
      uploadedAudioPath
    ) {
      await supabase.storage
        .from(
          "music-audio"
        )
        .remove([
          uploadedAudioPath,
        ]);
    }

    if (
      uploadedCoverPath
    ) {
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
    | null =
    null;

  let coverUrl:
    | string
    | null =
    null;

  if (
    audioPath
  ) {
    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          "music-audio"
        )
        .createSignedUrl(
          audioPath,
          60 * 60
        );

    if (error) {
      console.error(
        "Audio signed URL:",
        error
      );
    }

    audioUrl =
      data?.signedUrl ??
      null;
  }

  if (
    coverPath
  ) {
    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          "music-covers"
        )
        .createSignedUrl(
          coverPath,
          60 * 60
        );

    if (error) {
      console.error(
        "Cover signed URL:",
        error
      );
    }

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
          font-medium
          text-ocean-900
        "
      >
        {label}

        {required
          ? " *"
          : ""}
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
    <section
      className="
        flex
        min-h-[430px]
        flex-col
        items-center
        justify-center
        text-center
      "
    >
      <h2
        className="
          font-display
          text-[30px]
          font-semibold
          tracking-[-0.03em]
          text-ocean-950
        "
      >
        {filtered
          ? "No tracks found."
          : "No music yet."}
      </h2>

      {filtered ? (
        <button
          type="button"
          onClick={
            onClear
          }
          className="
            mt-6
            text-sm
            font-semibold
            text-ocean-700
            transition
            hover:text-ocean-950
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
          className={`
            ${primaryButtonClass}
            mt-6
          `}
        >
          Add Track
        </button>
      )}
    </section>
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
      /*
       * Favorites first.
       */

      if (
        a.is_favorite !==
        b.is_favorite
      ) {
        return a.is_favorite
          ? -1
          : 1;
      }

      /*
       * Newest next.
       */

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

function getSourceLabel(
  source:
    MusicSource
) {
  const labels:
    Record<
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

  return labels[
    source
  ];
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

function formatSeconds(
  value:
    number
) {
  if (
    !Number.isFinite(
      value
    ) ||
    value < 0
  ) {
    return "0:00";
  }

  const minutes =
    Math.floor(
      value / 60
    );

  const seconds =
    Math.floor(
      value % 60
    );

  return `${minutes}:${String(
    seconds
  ).padStart(
    2,
    "0"
  )}`;
}

/*
 * =========================================================
 * ALERTS
 * =========================================================
 */

async function showSuccess(
  title:
    string
) {
  await Swal.fire({
    icon:
      "success",

    title,

    timer:
      900,

    showConfirmButton:
      false,

    background:
      "#fffdf9",

    color:
      "#123d59",
  });
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