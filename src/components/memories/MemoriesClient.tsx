// src/components/memories/MemoriesClient.tsx

"use client";

import Link from "next/link";
import Image from "next/image";

import {
  type Dispatch,
  type ElementType,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  Clock3,
  ExternalLink,
  Heart,
  MapPin,
  MapPinned,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MemoryLocationPicker from "@/components/memories/MemoryLocationPicker";
import MemoryMap from "@/components/memories/MemoryMap";

import { createClient } from "@/lib/supabase/client";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type MemoryItem = {
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

  cover_url:
    | string
    | null;

  photo_count:
    number;
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

type MemoriesClientProps = {
  user: MemoryUser;

  coupleId: string;

  initialMemories:
    MemoryItem[];
};

type MemoryFormState = {
  title: string;

  story: string;

  memoryDate: string;

  memoryTime: string;

  locationName: string;

  mapsUrl: string;

  latitude:
    | number
    | null;

  longitude:
    | number
    | null;
};

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function MemoriesClient({
  user,
  coupleId,
  initialMemories,
}: MemoriesClientProps) {
  const [
    memories,
    setMemories,
  ] =
    useState<
      MemoryItem[]
    >(
      initialMemories
    );

  const [
    selectedYear,
    setSelectedYear,
  ] =
    useState(
      "all"
    );

  const [
    formOpen,
    setFormOpen,
  ] =
    useState(
      false
    );

  const [
    editingMemory,
    setEditingMemory,
  ] =
    useState<
      MemoryItem | null
    >(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<
      MemoryFormState
    >(
      createEmptyForm()
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(
      false
    );

  /*
   * =========================================================
   * YEARS
   * =========================================================
   */

  const availableYears =
    useMemo(() => {
      const years =
        new Set(
          memories.map(
            (memory) =>
              getYear(
                memory.memory_date
              )
          )
        );

      return Array.from(
        years
      ).sort(
        (a, b) =>
          Number(b) -
          Number(a)
      );
    }, [memories]);

  /*
   * =========================================================
   * FILTER
   * =========================================================
   */

  const filteredMemories =
    useMemo(() => {
      if (
        selectedYear ===
        "all"
      ) {
        return memories;
      }

      return memories.filter(
        (memory) =>
          getYear(
            memory.memory_date
          ) ===
          selectedYear
      );
    }, [
      memories,
      selectedYear,
    ]);

  /*
   * =========================================================
   * SUMMARY
   * =========================================================
   */

  const currentYear =
    String(
      new Date().getFullYear()
    );

  const thisYearCount =
    memories.filter(
      (memory) =>
        getYear(
          memory.memory_date
        ) ===
        currentYear
    ).length;

  const locationCount =
    useMemo(() => {
      const locations =
        memories
          .map(
            (memory) =>
              memory.location_name
                ?.trim()
                .toLowerCase()
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(
                value
              )
          );

      return new Set(
        locations
      ).size;
    }, [memories]);

  const mappedCount =
    filteredMemories.filter(
      (memory) =>
        memory.latitude !==
          null &&
        memory.longitude !==
          null
    ).length;

  /*
   * =========================================================
   * OPEN CREATE
   * =========================================================
   */

  const handleOpenCreate =
    () => {
      setEditingMemory(
        null
      );

      setForm(
        createEmptyForm()
      );

      setFormOpen(
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
      memory:
        MemoryItem
    ) => {
      setEditingMemory(
        memory
      );

      setForm({
        title:
          memory.title,

        story:
          memory.story ??
          "",

        memoryDate:
          memory.memory_date,

        memoryTime:
          normalizeTime(
            memory.memory_time
          ),

        locationName:
          memory.location_name ??
          "",

        mapsUrl:
          memory.maps_url ??
          "",

        latitude:
          memory.latitude,

        longitude:
          memory.longitude,
      });

      setFormOpen(
        true
      );
    };

  /*
   * =========================================================
   * CLOSE FORM
   * =========================================================
   */

  const handleCloseForm =
    () => {
      if (
        isSaving
      ) {
        return;
      }

      setFormOpen(
        false
      );

      setEditingMemory(
        null
      );
    };

  /*
   * =========================================================
   * SAVE CREATE / UPDATE
   * =========================================================
   */

  const handleSaveMemory =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const title =
        form.title.trim();

      if (!title) {
        await showWarning(
          "Judul belum diisi",
          "Judul memory wajib diisi."
        );

        return;
      }

      if (
        !form.memoryDate
      ) {
        await showWarning(
          "Tanggal belum diisi",
          "Tanggal memory wajib diisi."
        );

        return;
      }

      const mapsUrl =
        form.mapsUrl.trim();

      if (
        mapsUrl &&
        !isValidUrl(
          mapsUrl
        )
      ) {
        await showWarning(
          "Link tidak valid",
          "Link Google Maps harus berupa URL yang valid."
        );

        return;
      }

      if (
        (
          form.latitude ===
            null
        ) !==
        (
          form.longitude ===
            null
        )
      ) {
        await showWarning(
          "Lokasi belum lengkap",
          "Silakan pilih kembali titik lokasi pada map."
        );

        return;
      }

      setIsSaving(
        true
      );

      try {
        const supabase =
          createClient();

        const payload = {
          title,

          story:
            form.story.trim() ||
            null,

          memory_date:
            form.memoryDate,

          memory_time:
            form.memoryTime ||
            null,

          location_name:
            form.locationName.trim() ||
            null,

          maps_url:
            mapsUrl ||
            null,

          latitude:
            form.latitude,

          longitude:
            form.longitude,
        };

        /*
         * UPDATE
         */

        if (
          editingMemory
        ) {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "memories"
              )
              .update(
                payload
              )
              .eq(
                "id",
                editingMemory.id
              )
              .select()
              .single();

          if (error) {
            await showError(
              "Memory gagal diperbarui",
              error.message
            );

            return;
          }

          setMemories(
            (current) =>
              sortMemories(
                current.map(
                  (item) =>
                    item.id ===
editingMemory.id
  ? {
      ...data,

      cover_url:
        editingMemory.cover_url,

      photo_count:
        editingMemory.photo_count,
    }
  : item
                )
              )
          );

          setFormOpen(
            false
          );

          setEditingMemory(
            null
          );

          await Swal.fire({
            icon:
              "success",

            title:
              "Memory diperbarui",

            timer:
              1000,

            showConfirmButton:
              false,
          });

          return;
        }

        /*
         * CREATE
         */

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "memories"
            )
            .insert({
              couple_id:
                coupleId,

              created_by:
                user.id,

              source_plan_id:
                null,

              ...payload,
            })
            .select()
            .single();

        if (error) {
          await showError(
            "Memory gagal dibuat",
            error.message
          );

          return;
        }

        const newMemory:
  MemoryItem = {
  ...data,

  cover_url:
    null,

  photo_count:
    0,
};

        setMemories(
          (current) =>
            sortMemories([
              newMemory,
              ...current,
            ])
        );

        if (
          selectedYear !==
            "all" &&
          getYear(
            newMemory.memory_date
          ) !==
            selectedYear
        ) {
          setSelectedYear(
            "all"
          );
        }

        setFormOpen(
          false
        );

        await Swal.fire({
          icon:
            "success",

          title:
            "Memory ditambahkan",

          timer:
            1100,

          showConfirmButton:
            false,
        });
      } finally {
        setIsSaving(
          false
        );
      }
    };

  /*
   * =========================================================
   * DELETE
   * =========================================================
   */

  const handleDelete =
    async (
      memory:
        MemoryItem
    ) => {
      const result =
        await Swal.fire({
          icon:
            "warning",

          title:
            "Hapus memory?",

          text:
            `"${memory.title}" akan dihapus.`,

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
            "memories"
          )
          .delete()
          .eq(
            "id",
            memory.id
          );

      if (error) {
        await showError(
          "Memory gagal dihapus",
          error.message
        );

        return;
      }

      setMemories(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              memory.id
          )
      );

      await Swal.fire({
        icon:
          "success",

        title:
          "Memory dihapus",

        timer:
          900,

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
                Memories
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
                Our Memories
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
                Simpan cerita, tanggal,
                dan tempat yang pernah
                kalian kunjungi.
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
                rounded-[16px]
                px-5
                py-3.5
                text-sm
                font-semibold
              "
            >
              <Plus
                size={18}
              />

              Add Memory
            </button>
          </header>

          {/* SUMMARY */}

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
                Heart
              }
              value={
                memories.length
              }
              label="Total Memories"
            />

            <SummaryCard
              icon={
                CalendarDays
              }
              value={
                thisYearCount
              }
              label={`Memories in ${currentYear}`}
            />

            <SummaryCard
              icon={
                MapPin
              }
              value={
                locationCount
              }
              label="Places Visited"
            />
          </section>

          {/* MEMORY MAP */}

          <section
            className="
              mt-5
              overflow-hidden
              rounded-[30px]
              border
              border-white/80
              bg-white/65
              p-4
              shadow-[0_20px_60px_rgba(17,76,104,0.08)]
              backdrop-blur-xl
              sm:p-5
            "
          >
            <div
              className="
                mb-4
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-[14px]
                    bg-ocean-100
                    text-ocean-700
                  "
                >
                  <MapPinned
                    size={19}
                  />
                </div>

                <div>
                  <h2
                    className="
                      font-display
                      text-xl
                      font-semibold
                      text-ocean-950
                    "
                  >
                    Memory Map
                  </h2>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      text-ink-soft
                    "
                  >
                    {mappedCount} memory
                    memiliki pin lokasi
                  </p>
                </div>
              </div>

              <span
                className="
                  w-fit
                  rounded-full
                  bg-ocean-50
                  px-4
                  py-2
                  text-xs
                  font-semibold
                  text-ocean-700
                "
              >
                {selectedYear ===
                "all"
                  ? "All Years"
                  : selectedYear}
              </span>
            </div>

            <MemoryMap
              memories={
                filteredMemories
              }
            />
          </section>

          {/* FILTER */}

          <section
            className="
              mt-6
              flex
              gap-2
              overflow-x-auto
              pb-1
            "
          >
            <YearFilterButton
              active={
                selectedYear ===
                "all"
              }
              onClick={() =>
                setSelectedYear(
                  "all"
                )
              }
            >
              All
            </YearFilterButton>

            {availableYears.map(
              (year) => (
                <YearFilterButton
                  key={
                    year
                  }
                  active={
                    selectedYear ===
                    year
                  }
                  onClick={() =>
                    setSelectedYear(
                      year
                    )
                  }
                >
                  {year}
                </YearFilterButton>
              )
            )}
          </section>

          {/* TIMELINE */}

          <section
            className="
              mt-7
            "
          >
            {filteredMemories.length >
            0 ? (
              <div
                className="
                  relative
                  space-y-5
                  md:pl-10
                "
              >
                <div
                  className="
                    absolute
                    bottom-8
                    left-[15px]
                    top-8
                    hidden
                    w-px
                    bg-gradient-to-b
                    from-ocean-300
                    via-ocean-200
                    to-transparent
                    md:block
                  "
                />

                {filteredMemories.map(
                  (
                    memory
                  ) => (
                    <MemoryTimelineItem
                      key={
                        memory.id
                      }
                      memory={
                        memory
                      }
                      onEdit={() =>
                        handleOpenEdit(
                          memory
                        )
                      }
                      onDelete={() =>
                        handleDelete(
                          memory
                        )
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <EmptyMemories
                onCreate={
                  handleOpenCreate
                }
                filtered={
                  selectedYear !==
                  "all"
                }
              />
            )}
          </section>
        </div>
      </main>

      {/* FORM MODAL */}

      {formOpen && (
        <MemoryFormModal
          form={
            form
          }
          setForm={
            setForm
          }
          editing={
            Boolean(
              editingMemory
            )
          }
          isSaving={
            isSaving
          }
          onClose={
            handleCloseForm
          }
          onSubmit={
            handleSaveMemory
          }
        />
      )}
    </div>
  );
}

/*
 * =========================================================
 * MEMORY FORM MODAL
 * =========================================================
 */

function MemoryFormModal({
  form,
  setForm,
  editing,
  isSaving,
  onClose,
  onSubmit,
}: {
  form:
    MemoryFormState;

  setForm:
    Dispatch<
      SetStateAction<
        MemoryFormState
      >
    >;

  editing:
    boolean;

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
  const [
    showMap,
    setShowMap,
  ] =
    useState(
      form.latitude !==
        null &&
      form.longitude !==
        null
    );

  const handleMapsBlur =
    () => {
      if (
        form.latitude !==
          null ||
        form.longitude !==
          null ||
        !form.mapsUrl.trim()
      ) {
        return;
      }

      const coordinates =
        extractCoordinatesFromMapsUrl(
          form.mapsUrl.trim()
        );

      if (
        !coordinates
      ) {
        return;
      }

      setForm(
        (current) => ({
          ...current,

          latitude:
            coordinates.latitude,

          longitude:
            coordinates.longitude,
        })
      );
    };

  return (
    <div
      className="
        fixed
        inset-0
        z-[1000]
        flex
        items-center
        justify-center
        bg-ocean-950/35
        p-3
        backdrop-blur-sm
        sm:p-5
      "
      onMouseDown={
        (
          event
        ) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onClose();
          }
        }
      }
    >
      <div
        className="
          max-h-[94svh]
          w-full
          max-w-[760px]
          overflow-y-auto
          rounded-[28px]
          border
          border-white/80
          bg-[#fbfdfe]
          shadow-[0_30px_100px_rgba(6,42,63,0.25)]
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
              Memory
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
              {editing
                ? "Edit Memory"
                : "Add Memory"}
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
              transition
              hover:bg-ocean-100
              hover:text-ocean-800
              disabled:opacity-50
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
            {/* TITLE */}

            <FormField
              label="Judul"
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
                placeholder="Contoh: Sunset di pantai"
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

            {/* STORY */}

            <FormField
              label="Cerita"
            >
              <textarea
                value={
                  form.story
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,

                      story:
                        event.target.value,
                    })
                  )
                }
                placeholder="Ceritakan sedikit tentang hari itu..."
                rows={4}
                className="
                  love-input
                  w-full
                  resize-none
                  rounded-[15px]
                  px-4
                  py-3
                  text-sm
                "
              />
            </FormField>

            {/* DATE TIME */}

            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              <FormField
                label="Tanggal"
                required
              >
                <input
                  type="date"
                  value={
                    form.memoryDate
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        memoryDate:
                          event.target.value,
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
                  "
                />
              </FormField>

              <FormField
                label="Jam"
              >
                <input
                  type="time"
                  value={
                    form.memoryTime
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        memoryTime:
                          event.target.value,
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
                  "
                />
              </FormField>
            </div>

            {/* LOCATION NAME */}

            <FormField
              label="Nama Lokasi"
            >
              <input
                type="text"
                value={
                  form.locationName
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,

                      locationName:
                        event.target.value,
                    })
                  )
                }
                placeholder="Contoh: Pantai Marina"
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

            {/* GOOGLE MAPS */}

            <FormField
              label="Google Maps Link"
              description="Opsional. URL Maps yang mengandung koordinat juga akan dicoba dibaca otomatis."
            >
              <input
                type="url"
                value={
                  form.mapsUrl
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,

                      mapsUrl:
                        event.target.value,
                    })
                  )
                }
                onBlur={
                  handleMapsBlur
                }
                placeholder="https://maps.google.com/..."
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

            {/* LOCATION PICKER */}

            <div
              className="
                rounded-[22px]
                border
                border-ocean-100
                bg-ocean-50/40
                p-4
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-3
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-sm
                      font-bold
                      text-ocean-950
                    "
                  >
                    Pin Location
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-ink-soft
                    "
                  >
                    Pilih titik lokasi
                    langsung dari peta.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowMap(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    rounded-[14px]
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
                  <MapPinned
                    size={16}
                  />

                  {showMap
                    ? "Hide Map"
                    : form.latitude !==
                          null
                      ? "Change Location"
                      : "Choose Location"}
                </button>
              </div>

              {form.latitude !==
                null &&
                form.longitude !==
                  null &&
                !showMap && (
                  <div
                    className="
                      mt-3
                      flex
                      items-center
                      gap-2
                      rounded-[14px]
                      bg-white
                      px-3
                      py-2.5
                      text-xs
                      font-semibold
                      text-ocean-700
                    "
                  >
                    <MapPin
                      size={14}
                    />

                    {form.latitude.toFixed(
                      6
                    )}
                    ,{" "}
                    {form.longitude.toFixed(
                      6
                    )}
                  </div>
                )}

              {showMap && (
                <div
                  className="
                    mt-4
                  "
                >
                  <MemoryLocationPicker
                    latitude={
                      form.latitude
                    }
                    longitude={
                      form.longitude
                    }
                    onChange={(
                      latitude,
                      longitude
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          latitude,

                          longitude,
                        })
                      )
                    }
                    onClear={() =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          latitude:
                            null,

                          longitude:
                            null,
                        })
                      )
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* BUTTON */}

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
                transition
                hover:bg-ocean-50
                disabled:opacity-50
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
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <Save
                size={16}
              />

              {isSaving
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Save Memory"}
            </button>
          </div>
        </form>
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
  description,
  children,
}: {
  label:
    string;

  required?:
    boolean;

  description?:
    string;

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

      {description && (
        <p
          className="
            mt-1.5
            text-[10px]
            leading-5
            text-ink-soft
          "
        >
          {description}
        </p>
      )}
    </div>
  );
}

/*
 * =========================================================
 * TIMELINE ITEM
 * =========================================================
 */

function MemoryTimelineItem({
  memory,
  onEdit,
  onDelete,
}: {
  memory:
    MemoryItem;

  onEdit:
    () => void;

  onDelete:
    () => void;
}) {
  const hasPin =
    memory.latitude !==
      null &&
    memory.longitude !==
      null;

  return (
    <article
      className="
        relative
      "
    >
      {/* TIMELINE DOT */}

      <div
        className="
          absolute
          -left-[32px]
          top-8
          z-10
          hidden
          h-[15px]
          w-[15px]
          rounded-full
          border-[4px]
          border-white
          bg-ocean-600
          shadow-md
          md:block
        "
      />

      <div
        className="
          glass-card
          overflow-hidden
          rounded-[28px]
        "
      >
        <div
          className="
            grid
            lg:grid-cols-[260px_1fr]
          "
        >
          {/* =====================================
              VISUAL SIDE
          ====================================== */}

          <div
            className="
              relative
              min-h-[220px]
              overflow-hidden
              bg-gradient-to-br
              from-ocean-800
              via-ocean-700
              to-ocean-500
              text-white
              lg:min-h-[300px]
            "
          >
            {memory.cover_url ? (
              <>
                <Image
                  src={
                    memory.cover_url
                  }
                  alt={
                    memory.title
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
                    from-ocean-950/90
                    via-ocean-950/20
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
                    bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,.14),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(158,223,240,.22),transparent_36%)]
                  "
                />

                <Heart
                  size={120}
                  fill="currentColor"
                  className="
                    absolute
                    -right-5
                    -top-6
                    text-white/[0.05]
                  "
                />
              </>
            )}

            {/* PHOTO COUNT */}

            {memory.photo_count >
              0 && (
              <div
                className="
                  absolute
                  right-4
                  top-4
                  z-10
                  rounded-full
                  border
                  border-white/20
                  bg-black/25
                  px-3
                  py-1.5
                  text-[10px]
                  font-semibold
                  text-white
                  backdrop-blur-xl
                "
              >
                {memory.photo_count}{" "}
                {memory.photo_count ===
                1
                  ? "photo"
                  : "photos"}
              </div>
            )}

            {/* DATE */}

            <div
              className="
                absolute
                inset-x-0
                bottom-0
                z-10
                p-5
                sm:p-6
              "
            >
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-white/60
                "
              >
                {formatMonth(
                  memory.memory_date
                )}
              </p>

              <div
                className="
                  mt-1
                  flex
                  items-end
                  gap-2
                "
              >
                <p
                  className="
                    font-display
                    text-5xl
                    font-semibold
                    leading-none
                  "
                >
                  {formatDay(
                    memory.memory_date
                  )}
                </p>

                <p
                  className="
                    pb-1
                    text-sm
                    font-medium
                    text-white/70
                  "
                >
                  {getYear(
                    memory.memory_date
                  )}
                </p>
              </div>

              {memory.memory_time && (
                <div
                  className="
                    mt-4
                    flex
                    items-center
                    gap-2
                    text-xs
                    text-white/65
                  "
                >
                  <Clock3
                    size={14}
                  />

                  {formatTime(
                    memory.memory_time
                  )}
                </div>
              )}
            </div>
          </div>

          {/* =====================================
              CONTENT
          ====================================== */}

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
                <div
                  className="
                    flex
                    flex-wrap
                    gap-2
                  "
                >
                  {memory.source_plan_id && (
                    <span
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        bg-ocean-100
                        px-3
                        py-1.5
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.12em]
                        text-ocean-700
                      "
                    >
                      <Sparkles
                        size={11}
                      />

                      From Planner
                    </span>
                  )}

                  {hasPin && (
                    <span
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        bg-emerald-50
                        px-3
                        py-1.5
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.12em]
                        text-emerald-700
                      "
                    >
                      <MapPin
                        size={11}
                      />

                      Mapped
                    </span>
                  )}

                  {memory.photo_count >
                    0 && (
                    <span
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        bg-white
                        px-3
                        py-1.5
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.12em]
                        text-ocean-700
                        shadow-sm
                      "
                    >
                      {memory.photo_count}{" "}
                      {memory.photo_count ===
                      1
                        ? "Photo"
                        : "Photos"}
                    </span>
                  )}
                </div>

                <h2
                  className="
                    mt-3
                    font-display
                    text-2xl
                    font-semibold
                    text-ocean-950
                    sm:text-3xl
                  "
                >
                  {memory.title}
                </h2>
              </div>

              {/* ACTION */}

              <div
                className="
                  flex
                  shrink-0
                  gap-1
                "
              >
                <button
                  type="button"
                  onClick={
                    onEdit
                  }
                  aria-label="Edit memory"
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-[12px]
                    bg-ocean-50
                    text-ocean-600
                    transition
                    hover:bg-ocean-100
                  "
                >
                  <Pencil
                    size={15}
                  />
                </button>

                <button
                  type="button"
                  onClick={
                    onDelete
                  }
                  aria-label="Delete memory"
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-[12px]
                    bg-heart-soft
                    text-heart
                    transition
                    hover:opacity-80
                  "
                >
                  <Trash2
                    size={15}
                  />
                </button>
              </div>
            </div>

            {/* STORY */}

            {memory.story ? (
              <p
                className="
                  mt-4
                  line-clamp-4
                  whitespace-pre-line
                  text-sm
                  leading-7
                  text-ink-soft
                "
              >
                {memory.story}
              </p>
            ) : (
              <p
                className="
                  mt-4
                  text-sm
                  italic
                  text-ink-soft/60
                "
              >
                Belum ada cerita
                untuk memory ini.
              </p>
            )}

            {/* =====================================
                FOOTER
            ====================================== */}

            <div
              className="
                mt-auto
                pt-5
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                  border-t
                  border-ocean-100
                  pt-5
                "
              >
                {memory.location_name && (
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-full
                      bg-ocean-50
                      px-3
                      py-2
                      text-xs
                      font-semibold
                      text-ocean-700
                    "
                  >
                    <MapPin
                      size={13}
                    />

                    {
                      memory.location_name
                    }
                  </div>
                )}

                {memory.maps_url && (
                  <a
                    href={
                      memory.maps_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-ocean-100
                      bg-white/70
                      px-3
                      py-2
                      text-xs
                      font-semibold
                      text-ocean-700
                      transition
                      hover:bg-white
                    "
                  >
                    Open Maps

                    <ExternalLink
                      size={12}
                    />
                  </a>
                )}

                {memory.source_plan_id && (
                  <Link
                    href={`/planner/${memory.source_plan_id}`}
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-ocean-100
                      bg-white/70
                      px-3
                      py-2
                      text-xs
                      font-semibold
                      text-ocean-700
                      transition
                      hover:bg-white
                    "
                  >
                    Original Plan

                    <ExternalLink
                      size={12}
                    />
                  </Link>
                )}
              </div>

              <Link
                href={`/memories/${memory.id}`}
                className="
                  mt-4
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-[15px]
                  bg-ocean-700
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-ocean-800
                "
              >
                View Memory

                <ExternalLink
                  size={14}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * SUMMARY CARD
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
 * YEAR FILTER
 * =========================================================
 */

function YearFilterButton({
  active,
  onClick,
  children,
}: {
  active:
    boolean;

  onClick:
    () => void;

  children:
    ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        shrink-0
        rounded-full
        px-5
        py-2.5
        text-sm
        font-semibold
        transition
        ${
          active
            ? "bg-ocean-700 text-white shadow-md"
            : "border border-ocean-100 bg-white/65 text-ink-soft hover:bg-white"
        }
      `}
    >
      {children}
    </button>
  );
}

/*
 * =========================================================
 * EMPTY
 * =========================================================
 */

function EmptyMemories({
  onCreate,
  filtered,
}: {
  onCreate:
    () => void;

  filtered:
    boolean;
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
      <Heart
        size={31}
        className="
          mx-auto
          text-ocean-400
        "
      />

      <h2
        className="
          mt-4
          font-display
          text-3xl
          font-semibold
          text-ocean-950
        "
      >
        {filtered
          ? "Tidak ada memory di tahun ini"
          : "Belum ada memory"}
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
          ? "Pilih tahun lain untuk melihat memories."
          : "Tambahkan memory pertama kalian."}
      </p>

      {!filtered && (
        <button
          type="button"
          onClick={
            onCreate
          }
          className="
            love-button
            mt-6
            inline-flex
            items-center
            gap-2
            rounded-[16px]
            px-5
            py-3
            text-sm
            font-semibold
          "
        >
          <Plus
            size={17}
          />

          Add Memory
        </button>
      )}
    </div>
  );
}

/*
 * =========================================================
 * EMPTY FORM
 * =========================================================
 */

function createEmptyForm():
  MemoryFormState {
  return {
    title:
      "",

    story:
      "",

    memoryDate:
      getTodayInputValue(),

    memoryTime:
      "",

    locationName:
      "",

    mapsUrl:
      "",

    latitude:
      null,

    longitude:
      null,
  };
}

/*
 * =========================================================
 * GOOGLE MAPS COORDINATE PARSER
 * =========================================================
 */

function extractCoordinatesFromMapsUrl(
  value:
    string
): {
  latitude:
    number;

  longitude:
    number;
} | null {
  let decoded =
    value;

  try {
    decoded =
      decodeURIComponent(
        value
      );
  } catch {
    decoded =
      value;
  }

  const atMatch =
    decoded.match(
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,|$)/
    );

  if (
    atMatch
  ) {
    return {
      latitude:
        Number(
          atMatch[1]
        ),

      longitude:
        Number(
          atMatch[2]
        ),
    };
  }

  const queryMatch =
    decoded.match(
      /[?&](?:q|query|ll|center)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i
    );

  if (
    queryMatch
  ) {
    return {
      latitude:
        Number(
          queryMatch[1]
        ),

      longitude:
        Number(
          queryMatch[2]
        ),
    };
  }

  const dataMatch =
    decoded.match(
      /!3d(-?\d+(?:\.\d+)?).*?!4d(-?\d+(?:\.\d+)?)/i
    );

  if (
    dataMatch
  ) {
    return {
      latitude:
        Number(
          dataMatch[1]
        ),

      longitude:
        Number(
          dataMatch[2]
        ),
    };
  }

  return null;
}

/*
 * =========================================================
 * SORT
 * =========================================================
 */

function sortMemories(
  memories:
    MemoryItem[]
) {
  return [
    ...memories,
  ].sort(
    (
      a,
      b
    ) => {
      const first =
        new Date(
          `${a.memory_date}T${a.memory_time || "00:00"}`
        ).getTime();

      const second =
        new Date(
          `${b.memory_date}T${b.memory_time || "00:00"}`
        ).getTime();

      return (
        second -
        first
      );
    }
  );
}

/*
 * =========================================================
 * DATE
 * =========================================================
 */

function getTodayInputValue() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function formatDay(
  value:
    string
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",
    }
  ).format(
    new Date(
      `${value}T00:00:00`
    )
  );
}

function formatMonth(
  value:
    string
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      month:
        "long",
    }
  ).format(
    new Date(
      `${value}T00:00:00`
    )
  );
}

function getYear(
  value:
    string
) {
  return value.slice(
    0,
    4
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

function normalizeTime(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "";
  }

  return value.slice(
    0,
    5
  );
}

/*
 * =========================================================
 * URL
 * =========================================================
 */

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
        "https:" ||
      url.protocol ===
        "http:"
    );
  } catch {
    return false;
  }
}

/*
 * =========================================================
 * ALERT
 * =========================================================
 */

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

    confirmButtonText:
      "Oke",

    confirmButtonColor:
      "#1688b5",
  });
}