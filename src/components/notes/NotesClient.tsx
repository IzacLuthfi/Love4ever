// src/components/notes/NotesClient.tsx

"use client";

import Link from "next/link";

import {
  type ElementType,
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";

import {
  Check,
  CheckCircle2,
  ChevronLeft,
  Circle,
  ListChecks,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Save,
  Search,
  StickyNote,
  Tag,
  Trash2,
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

type NoteColor =
  | "blue"
  | "cream"
  | "pink"
  | "green"
  | "lavender";

type ChecklistItem = {
  id: string;

  note_id: string;

  title: string;

  is_completed: boolean;

  sort_order: number;

  created_at: string;
};

type NoteItem = {
  id: string;

  couple_id: string;

  created_by: string;

  title: string;

  content:
    | string
    | null;

  category: string;

  color: NoteColor;

  is_pinned: boolean;

  created_at: string;

  updated_at: string;

  checklistItems:
    ChecklistItem[];
};

type NotesUser = {
  id: string;

  email: string;

  fullName: string;

  nickname: string;

  avatarUrl:
    | string
    | null;
};

type NotesClientProps = {
  user: NotesUser;

  coupleId: string;

  initialNotes:
    NoteItem[];
};

type NoteFormState = {
  title: string;

  content: string;

  category: string;

  color: NoteColor;
};

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const categories = [
  "Personal",
  "Important",
  "Ideas",
  "Wishlist",
  "Reminder",
  "Other",
];

const colorOptions: {
  value: NoteColor;
  label: string;
  className: string;
}[] = [
  {
    value:
      "blue",
    label:
      "Blue",
    className:
      "bg-[#dff5fc] border-[#b7e6f5]",
  },
  {
    value:
      "cream",
    label:
      "Cream",
    className:
      "bg-[#fff6e7] border-[#f0dfc5]",
  },
  {
    value:
      "pink",
    label:
      "Pink",
    className:
      "bg-[#fdecef] border-[#f8cfd7]",
  },
  {
    value:
      "green",
    label:
      "Green",
    className:
      "bg-[#e9f8ef] border-[#cbead6]",
  },
  {
    value:
      "lavender",
    label:
      "Lavender",
    className:
      "bg-[#f0edff] border-[#ded7ff]",
  },
];

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function NotesClient({
  user,
  coupleId,
  initialNotes,
}: NotesClientProps) {
  const [
    notes,
    setNotes,
  ] =
    useState<
      NoteItem[]
    >(
      initialNotes
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
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
    editingNote,
    setEditingNote,
  ] =
    useState<
      NoteItem | null
    >(
      null
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(
      false
    );

  const [
    form,
    setForm,
  ] =
    useState<
      NoteFormState
    >(
      createEmptyForm()
    );

  /*
   * =========================================================
   * FILTER
   * =========================================================
   */

  const filteredNotes =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return sortNotes(
        notes.filter(
          (note) => {
            const matchesCategory =
              categoryFilter ===
                "all" ||
              note.category ===
                categoryFilter;

            const matchesSearch =
              !normalizedSearch ||
              note.title
                .toLowerCase()
                .includes(
                  normalizedSearch
                ) ||
              (
                note.content ??
                ""
              )
                .toLowerCase()
                .includes(
                  normalizedSearch
                );

            return (
              matchesCategory &&
              matchesSearch
            );
          }
        )
      );
    }, [
      notes,
      search,
      categoryFilter,
    ]);

  /*
   * =========================================================
   * STATS
   * =========================================================
   */

  const pinnedCount =
    notes.filter(
      (note) =>
        note.is_pinned
    ).length;

  const checklistCount =
    notes.reduce(
      (
        total,
        note
      ) =>
        total +
        note.checklistItems.length,
      0
    );

  const completedChecklist =
    notes.reduce(
      (
        total,
        note
      ) =>
        total +
        note.checklistItems.filter(
          (item) =>
            item.is_completed
        ).length,
      0
    );

  /*
   * =========================================================
   * OPEN CREATE
   * =========================================================
   */

  const handleOpenCreate =
    () => {
      setEditingNote(
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
      note:
        NoteItem
    ) => {
      setEditingNote(
        note
      );

      setForm({
        title:
          note.title,

        content:
          note.content ??
          "",

        category:
          note.category,

        color:
          note.color,
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

      setEditingNote(
        null
      );
    };

  /*
   * =========================================================
   * SAVE NOTE
   * =========================================================
   */

  const handleSaveNote =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const title =
        form.title.trim();

      if (!title) {
        await Swal.fire({
          icon:
            "warning",

          title:
            "Judul belum diisi",

          text:
            "Judul note wajib diisi.",

          confirmButtonColor:
            "#1688b5",
        });

        return;
      }

      setIsSaving(
        true
      );

      try {
        const supabase =
          createClient();

        /*
         * =====================================
         * UPDATE
         * =====================================
         */

        if (
          editingNote
        ) {
          const {
            data,
            error,
          } =
            await supabase
              .from("notes")
              .update({
                title,

                content:
                  form.content.trim() ||
                  null,

                category:
                  form.category,

                color:
                  form.color,
              })
              .eq(
                "id",
                editingNote.id
              )
              .select()
              .single();

          if (error) {
            await showError(
              "Note gagal diperbarui",
              error.message
            );

            return;
          }

          setNotes(
            (current) =>
              sortNotes(
                current.map(
                  (note) =>
                    note.id ===
                    editingNote.id
                      ? {
                          ...data,

                          checklistItems:
                            editingNote.checklistItems,
                        } as NoteItem
                      : note
                )
              )
          );

          setFormOpen(
            false
          );

          setEditingNote(
            null
          );

          await Swal.fire({
            icon:
              "success",

            title:
              "Note diperbarui",

            timer:
              900,

            showConfirmButton:
              false,
          });

          return;
        }

        /*
         * =====================================
         * CREATE
         * =====================================
         */

        const {
          data,
          error,
        } =
          await supabase
            .from("notes")
            .insert({
              couple_id:
                coupleId,

              created_by:
                user.id,

              title,

              content:
                form.content.trim() ||
                null,

              category:
                form.category,

              color:
                form.color,

              is_pinned:
                false,
            })
            .select()
            .single();

        if (error) {
          await showError(
            "Note gagal dibuat",
            error.message
          );

          return;
        }

        const newNote:
          NoteItem = {
          ...(data as Omit<
            NoteItem,
            "checklistItems"
          >),

          checklistItems:
            [],
        };

        setNotes(
          (current) =>
            sortNotes([
              newNote,
              ...current,
            ])
        );

        setFormOpen(
          false
        );

        await Swal.fire({
          icon:
            "success",

          title:
            "Note ditambahkan",

          timer:
            900,

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
   * PIN
   * =========================================================
   */

  const handleTogglePin =
    async (
      note:
        NoteItem
    ) => {
      const newValue =
        !note.is_pinned;

      const supabase =
        createClient();

      /*
       * Optimistic UI.
       */

      setNotes(
        (current) =>
          sortNotes(
            current.map(
              (item) =>
                item.id ===
                note.id
                  ? {
                      ...item,

                      is_pinned:
                        newValue,
                    }
                  : item
            )
          )
      );

      const {
        data,
        error,
      } =
        await supabase
          .from("notes")
          .update({
            is_pinned:
              newValue,
          })
          .eq(
            "id",
            note.id
          )
          .select()
          .single();

      if (error) {
        setNotes(
          (current) =>
            sortNotes(
              current.map(
                (item) =>
                  item.id ===
                  note.id
                    ? note
                    : item
              )
            )
        );

        await showError(
          "Pin gagal diperbarui",
          error.message
        );

        return;
      }

      setNotes(
        (current) =>
          sortNotes(
            current.map(
              (item) =>
                item.id ===
                note.id
                  ? {
                      ...data,

                      checklistItems:
                        item.checklistItems,
                    } as NoteItem
                  : item
            )
          )
      );
    };

  /*
   * =========================================================
   * DELETE NOTE
   * =========================================================
   */

  const handleDeleteNote =
    async (
      note:
        NoteItem
    ) => {
      const result =
        await Swal.fire({
          icon:
            "warning",

          title:
            "Hapus note?",

          text:
            `"${note.title}" dan checklist di dalamnya akan dihapus.`,

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
          .from("notes")
          .delete()
          .eq(
            "id",
            note.id
          );

      if (error) {
        await showError(
          "Note gagal dihapus",
          error.message
        );

        return;
      }

      setNotes(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              note.id
          )
      );

      await Swal.fire({
        icon:
          "success",

        title:
          "Note dihapus",

        timer:
          800,

        showConfirmButton:
          false,
      });
    };

  /*
   * =========================================================
   * ADD CHECKLIST
   * =========================================================
   */

  const handleAddChecklist =
    async (
      note:
        NoteItem
    ) => {
      const result =
        await Swal.fire({
          title:
            "Add Checklist",

          input:
            "text",

          inputPlaceholder:
            "Contoh: Beli tiket",

          showCancelButton:
            true,

          confirmButtonText:
            "Tambah",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#1688b5",

          inputValidator:
            (value) => {
              if (
                !value.trim()
              ) {
                return "Checklist tidak boleh kosong.";
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

      const nextOrder =
        note.checklistItems.length >
        0
          ? Math.max(
              ...note.checklistItems.map(
                (item) =>
                  item.sort_order
              )
            ) + 1
          : 0;

      const supabase =
        createClient();

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "note_checklist_items"
          )
          .insert({
            note_id:
              note.id,

            title:
              result.value.trim(),

            is_completed:
              false,

            sort_order:
              nextOrder,
          })
          .select()
          .single();

      if (error) {
        await showError(
          "Checklist gagal ditambahkan",
          error.message
        );

        return;
      }

      setNotes(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              note.id
                ? {
                    ...item,

                    checklistItems: [
                      ...item.checklistItems,
                      data as ChecklistItem,
                    ],
                  }
                : item
          )
      );
    };

  /*
   * =========================================================
   * TOGGLE CHECKLIST
   * =========================================================
   */

  const handleToggleChecklist =
    async (
      note:
        NoteItem,

      checklist:
        ChecklistItem
    ) => {
      const newValue =
        !checklist.is_completed;

      setNotes(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              note.id
                ? {
                    ...item,

                    checklistItems:
                      item.checklistItems.map(
                        (task) =>
                          task.id ===
                          checklist.id
                            ? {
                                ...task,

                                is_completed:
                                  newValue,
                              }
                            : task
                      ),
                  }
                : item
          )
      );

      const supabase =
        createClient();

      const {
        error,
      } =
        await supabase
          .from(
            "note_checklist_items"
          )
          .update({
            is_completed:
              newValue,
          })
          .eq(
            "id",
            checklist.id
          );

      if (error) {
        /*
         * rollback
         */

        setNotes(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                note.id
                  ? {
                      ...item,

                      checklistItems:
                        item.checklistItems.map(
                          (task) =>
                            task.id ===
                            checklist.id
                              ? checklist
                              : task
                        ),
                    }
                  : item
            )
        );

        await showError(
          "Checklist gagal diperbarui",
          error.message
        );
      }
    };

  /*
   * =========================================================
   * EDIT CHECKLIST
   * =========================================================
   */

  const handleEditChecklist =
    async (
      note:
        NoteItem,

      checklist:
        ChecklistItem
    ) => {
      const result =
        await Swal.fire({
          title:
            "Edit Checklist",

          input:
            "text",

          inputValue:
            checklist.title,

          showCancelButton:
            true,

          confirmButtonText:
            "Simpan",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#1688b5",

          inputValidator:
            (value) => {
              if (
                !value.trim()
              ) {
                return "Checklist tidak boleh kosong.";
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

      const title =
        result.value.trim();

      const supabase =
        createClient();

      const {
        error,
      } =
        await supabase
          .from(
            "note_checklist_items"
          )
          .update({
            title,
          })
          .eq(
            "id",
            checklist.id
          );

      if (error) {
        await showError(
          "Checklist gagal diperbarui",
          error.message
        );

        return;
      }

      setNotes(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              note.id
                ? {
                    ...item,

                    checklistItems:
                      item.checklistItems.map(
                        (task) =>
                          task.id ===
                          checklist.id
                            ? {
                                ...task,

                                title,
                              }
                            : task
                      ),
                  }
                : item
          )
      );
    };

  /*
   * =========================================================
   * DELETE CHECKLIST
   * =========================================================
   */

  const handleDeleteChecklist =
    async (
      note:
        NoteItem,

      checklist:
        ChecklistItem
    ) => {
      const supabase =
        createClient();

      const {
        error,
      } =
        await supabase
          .from(
            "note_checklist_items"
          )
          .delete()
          .eq(
            "id",
            checklist.id
          );

      if (error) {
        await showError(
          "Checklist gagal dihapus",
          error.message
        );

        return;
      }

      setNotes(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              note.id
                ? {
                    ...item,

                    checklistItems:
                      item.checklistItems.filter(
                        (task) =>
                          task.id !==
                          checklist.id
                      ),
                  }
                : item
          )
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
                Shared Notes
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
                Notes
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
                Catatan bersama untuk reminder,
                wishlist, ide, dan hal-hal yang
                perlu disimpan.
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

              Add Note
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
                StickyNote
              }
              value={
                notes.length
              }
              label="Total Notes"
            />

            <SummaryCard
              icon={
                Pin
              }
              value={
                pinnedCount
              }
              label="Pinned Notes"
            />

            <SummaryCard
              icon={
                CheckCircle2
              }
              value={
                checklistCount >
                0
                  ? `${completedChecklist}/${checklistCount}`
                  : "0"
              }
              label="Checklist Done"
            />
          </section>

          {/* SEARCH + FILTER */}

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
                lg:grid-cols-[1fr_260px]
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
                  placeholder="Search notes..."
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
                  categoryFilter
                }
                onChange={(
                  event
                ) =>
                  setCategoryFilter(
                    event.target.value
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
                <option value="all">
                  All Categories
                </option>

                {categories.map(
                  (
                    category
                  ) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {category}
                    </option>
                  )
                )}
              </select>
            </div>
          </section>

          {/* NOTE GRID */}

          <section
            className="
              mt-6
            "
          >
            {filteredNotes.length >
            0 ? (
              <div
                className="
                  grid
                  items-start
                  gap-4
                  md:grid-cols-2
                  2xl:grid-cols-3
                "
              >
                {filteredNotes.map(
                  (
                    note
                  ) => (
                    <NoteCard
                      key={
                        note.id
                      }
                      note={
                        note
                      }
                      onEdit={() =>
                        handleOpenEdit(
                          note
                        )
                      }
                      onDelete={() =>
                        handleDeleteNote(
                          note
                        )
                      }
                      onTogglePin={() =>
                        handleTogglePin(
                          note
                        )
                      }
                      onAddChecklist={() =>
                        handleAddChecklist(
                          note
                        )
                      }
                      onToggleChecklist={(
                        checklist
                      ) =>
                        handleToggleChecklist(
                          note,
                          checklist
                        )
                      }
                      onEditChecklist={(
                        checklist
                      ) =>
                        handleEditChecklist(
                          note,
                          checklist
                        )
                      }
                      onDeleteChecklist={(
                        checklist
                      ) =>
                        handleDeleteChecklist(
                          note,
                          checklist
                        )
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <EmptyNotes
                hasFilters={
                  Boolean(
                    search.trim()
                  ) ||
                  categoryFilter !==
                    "all"
                }
                onCreate={
                  handleOpenCreate
                }
                onClear={() => {
                  setSearch("");

                  setCategoryFilter(
                    "all"
                  );
                }}
              />
            )}
          </section>
        </div>
      </main>

      {formOpen && (
        <NoteFormModal
          form={
            form
          }
          setForm={
            setForm
          }
          editing={
            Boolean(
              editingNote
            )
          }
          isSaving={
            isSaving
          }
          onClose={
            handleCloseForm
          }
          onSubmit={
            handleSaveNote
          }
        />
      )}
    </div>
  );
}

/*
 * =========================================================
 * NOTE CARD
 * =========================================================
 */

function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onAddChecklist,
  onToggleChecklist,
  onEditChecklist,
  onDeleteChecklist,
}: {
  note:
    NoteItem;

  onEdit:
    () => void;

  onDelete:
    () => void;

  onTogglePin:
    () => void;

  onAddChecklist:
    () => void;

  onToggleChecklist:
    (
      checklist:
        ChecklistItem
    ) => void;

  onEditChecklist:
    (
      checklist:
        ChecklistItem
    ) => void;

  onDeleteChecklist:
    (
      checklist:
        ChecklistItem
    ) => void;
}) {
  const completed =
    note.checklistItems.filter(
      (item) =>
        item.is_completed
    ).length;

  const progress =
    note.checklistItems.length >
    0
      ? Math.round(
          (
            completed /
            note.checklistItems.length
          ) *
            100
        )
      : 0;

  return (
    <article
      className={`
        relative
        overflow-hidden
        rounded-[26px]
        border
        p-5
        shadow-[0_12px_35px_rgba(17,76,104,0.07)]
        transition
        hover:-translate-y-0.5
        hover:shadow-[0_18px_45px_rgba(17,76,104,0.10)]
        ${getNoteColorClasses(
          note.color
        )}
      `}
    >
      {/* HEADER */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-3
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
              items-center
              gap-2
            "
          >
            <span
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-white/70
                px-2.5
                py-1.5
                text-[9px]
                font-bold
                uppercase
                tracking-[0.1em]
                text-ocean-700
              "
            >
              <Tag
                size={10}
              />

              {
                note.category
              }
            </span>

            {note.is_pinned && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1
                  rounded-full
                  bg-ocean-700
                  px-2.5
                  py-1.5
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-white
                "
              >
                <Pin
                  size={10}
                  fill="currentColor"
                />

                Pinned
              </span>
            )}
          </div>

          <h2
            className="
              mt-4
              break-words
              font-display
              text-2xl
              font-semibold
              text-ocean-950
            "
          >
            {note.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={
            onTogglePin
          }
          aria-label={
            note.is_pinned
              ? "Unpin note"
              : "Pin note"
          }
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-[12px]
            bg-white/70
            text-ocean-600
            transition
            hover:bg-white
            hover:text-ocean-800
          "
        >
          {note.is_pinned ? (
            <PinOff
              size={15}
            />
          ) : (
            <Pin
              size={15}
            />
          )}
        </button>
      </div>

      {/* CONTENT */}

      {note.content ? (
        <p
          className="
            mt-4
            whitespace-pre-line
            text-sm
            leading-7
            text-ink-soft
          "
        >
          {note.content}
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
          No additional text.
        </p>
      )}

      {/* CHECKLIST */}

      <div
        className="
          mt-5
          rounded-[18px]
          bg-white/55
          p-3.5
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <ListChecks
              size={16}
              className="
                text-ocean-600
              "
            />

            <p
              className="
                text-xs
                font-bold
                text-ocean-900
              "
            >
              Checklist
            </p>
          </div>

          <button
            type="button"
            onClick={
              onAddChecklist
            }
            className="
              flex
              items-center
              gap-1
              rounded-[10px]
              px-2
              py-1.5
              text-[10px]
              font-bold
              text-ocean-600
              transition
              hover:bg-ocean-50
            "
          >
            <Plus
              size={12}
            />

            Add
          </button>
        </div>

        {note.checklistItems.length >
        0 ? (
          <>
            <div
              className="
                mt-3
                space-y-1.5
              "
            >
              {note.checklistItems.map(
                (
                  checklist
                ) => (
                  <ChecklistRow
                    key={
                      checklist.id
                    }
                    checklist={
                      checklist
                    }
                    onToggle={() =>
                      onToggleChecklist(
                        checklist
                      )
                    }
                    onEdit={() =>
                      onEditChecklist(
                        checklist
                      )
                    }
                    onDelete={() =>
                      onDeleteChecklist(
                        checklist
                      )
                    }
                  />
                )
              )}
            </div>

            <div
              className="
                mt-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  text-[10px]
                  font-semibold
                  text-ink-soft
                "
              >
                <span>
                  {completed}/
                  {
                    note.checklistItems.length
                  } completed
                </span>

                <span>
                  {progress}%
                </span>
              </div>

              <div
                className="
                  mt-2
                  h-1.5
                  overflow-hidden
                  rounded-full
                  bg-white
                "
              >
                <div
                  className="
                    h-full
                    rounded-full
                    bg-ocean-600
                    transition-all
                    duration-300
                  "
                  style={{
                    width:
                      `${progress}%`,
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <p
            className="
              mt-3
              text-[11px]
              text-ink-soft/70
            "
          >
            No checklist items.
          </p>
        )}
      </div>

      {/* FOOTER */}

      <div
        className="
          mt-5
          flex
          items-center
          justify-between
          gap-3
          border-t
          border-white/70
          pt-4
        "
      >
        <p
          className="
            text-[10px]
            text-ink-soft
          "
        >
          Updated{" "}
          {formatUpdatedAt(
            note.updated_at
          )}
        </p>

        <div
          className="
            flex
            gap-1
          "
        >
          <button
            type="button"
            onClick={
              onEdit
            }
            aria-label="Edit note"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-[10px]
              bg-white/65
              text-ocean-600
              transition
              hover:bg-white
            "
          >
            <Pencil
              size={14}
            />
          </button>

          <button
            type="button"
            onClick={
              onDelete
            }
            aria-label="Delete note"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-[10px]
              bg-white/65
              text-heart
              transition
              hover:bg-white
            "
          >
            <Trash2
              size={14}
            />
          </button>
        </div>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * CHECKLIST ROW
 * =========================================================
 */

function ChecklistRow({
  checklist,
  onToggle,
  onEdit,
  onDelete,
}: {
  checklist:
    ChecklistItem;

  onToggle:
    () => void;

  onEdit:
    () => void;

  onDelete:
    () => void;
}) {
  return (
    <div
      className="
        group
        flex
        items-center
        gap-2
        rounded-[11px]
        px-1
        py-1.5
      "
    >
      <button
        type="button"
        onClick={
          onToggle
        }
        className={`
          flex
          h-6
          w-6
          shrink-0
          items-center
          justify-center
          rounded-[8px]
          border
          transition
          ${
            checklist.is_completed
              ? "border-ocean-600 bg-ocean-600 text-white"
              : "border-ocean-200 bg-white text-transparent hover:border-ocean-500"
          }
        `}
      >
        <Check
          size={13}
        />
      </button>

      <button
        type="button"
        onClick={
          onEdit
        }
        className={`
          min-w-0
          flex-1
          text-left
          text-xs
          font-medium
          ${
            checklist.is_completed
              ? "text-ink-soft line-through"
              : "text-ocean-950"
          }
        `}
      >
        {
          checklist.title
        }
      </button>

      <button
        type="button"
        onClick={
          onDelete
        }
        aria-label="Delete checklist item"
        className="
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-[9px]
          text-heart
          opacity-50
          transition
          hover:bg-heart-soft
          hover:opacity-100
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
 * FORM MODAL
 * =========================================================
 */

function NoteFormModal({
  form,
  setForm,
  editing,
  isSaving,
  onClose,
  onSubmit,
}: {
  form:
    NoteFormState;

  setForm:
    React.Dispatch<
      React.SetStateAction<
        NoteFormState
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
          max-w-[680px]
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
              Shared Note
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
                ? "Edit Note"
                : "Add Note"}
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
                placeholder="Contoh: Things to remember"
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
              label="Content"
            >
              <textarea
                value={
                  form.content
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,

                      content:
                        event.target.value,
                    })
                  )
                }
                rows={6}
                placeholder="Write something..."
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

            <FormField
              label="Category"
            >
              <select
                value={
                  form.category
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,

                      category:
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
                  text-ocean-900
                "
              >
                {categories.map(
                  (
                    category
                  ) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {
                        category
                      }
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField
              label="Card Color"
            >
              <div
                className="
                  grid
                  grid-cols-2
                  gap-2
                  sm:grid-cols-5
                "
              >
                {colorOptions.map(
                  (
                    option
                  ) => (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      onClick={() =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,

                            color:
                              option.value,
                          })
                        )
                      }
                      className={`
                        relative
                        rounded-[15px]
                        border
                        p-3
                        text-xs
                        font-semibold
                        transition
                        ${option.className}
                        ${
                          form.color ===
                          option.value
                            ? "ring-2 ring-ocean-600 ring-offset-2"
                            : "hover:-translate-y-0.5"
                        }
                      `}
                    >
                      {
                        option.label
                      }

                      {form.color ===
                        option.value && (
                        <Check
                          size={13}
                          className="
                            absolute
                            right-2
                            top-2
                            text-ocean-700
                          "
                        />
                      )}
                    </button>
                  )
                )}
              </div>
            </FormField>
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
                  : "Save Note"}
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
  children,
}: {
  label: string;

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
    number | string;

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
 * EMPTY
 * =========================================================
 */

function EmptyNotes({
  hasFilters,
  onCreate,
  onClear,
}: {
  hasFilters:
    boolean;

  onCreate:
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
        <StickyNote
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
        {hasFilters
          ? "No notes found"
          : "Belum ada note"}
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
        {hasFilters
          ? "Tidak ada note yang cocok dengan pencarian atau filter."
          : "Tambahkan note pertama untuk mulai menyimpan catatan bersama."}
      </p>

      {hasFilters ? (
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
            onCreate
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

          Add Note
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
  NoteFormState {
  return {
    title:
      "",

    content:
      "",

    category:
      "Personal",

    color:
      "blue",
  };
}

function sortNotes(
  notes:
    NoteItem[]
) {
  return [
    ...notes,
  ].sort(
    (
      a,
      b
    ) => {
      if (
        a.is_pinned !==
        b.is_pinned
      ) {
        return a.is_pinned
          ? -1
          : 1;
      }

      return (
        new Date(
          b.updated_at
        ).getTime() -
        new Date(
          a.updated_at
        ).getTime()
      );
    }
  );
}

function getNoteColorClasses(
  color:
    NoteColor
) {
  const classes: Record<
    NoteColor,
    string
  > = {
    blue:
      "border-[#b7e6f5] bg-[#e7f8fd]",

    cream:
      "border-[#f0dfc5] bg-[#fff8ea]",

    pink:
      "border-[#f8cfd7] bg-[#fff0f2]",

    green:
      "border-[#cbead6] bg-[#eefaf2]",

    lavender:
      "border-[#ded7ff] bg-[#f4f1ff]",
  };

  return classes[
    color
  ];
}

function formatUpdatedAt(
  value:
    string
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "numeric",

      month:
        "short",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    new Date(
      value
    )
  );
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