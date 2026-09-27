// src/components/notes/NotesClient.tsx

"use client";

import {
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  useMemo,
  useState,
} from "react";

import {
  Check,
  MoreHorizontal,
  Pin,
  Plus,
  Search,
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
  swatch: string;
}[] = [
  {
    value: "blue",
    label: "Blue",
    swatch:
      "bg-[#cbeef7]",
  },
  {
    value: "cream",
    label: "Cream",
    swatch:
      "bg-[#f3e3c7]",
  },
  {
    value: "pink",
    label: "Pink",
    swatch:
      "bg-[#f8cfd7]",
  },
  {
    value: "green",
    label: "Green",
    swatch:
      "bg-[#cbead6]",
  },
  {
    value: "lavender",
    label: "Lavender",
    swatch:
      "bg-[#ded7ff]",
  },
];

/*
 * =========================================================
 * STYLES
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

export default function NotesClient({
  user,
  coupleId,
  initialNotes,
}: NotesClientProps) {
  const [
    notes,
    setNotes,
  ] =
    useState<NoteItem[]>(
      sortNotes(
        initialNotes
      )
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
    useState("all");

  const [
    formOpen,
    setFormOpen,
  ] =
    useState(false);

  const [
    editingNote,
    setEditingNote,
  ] =
    useState<
      NoteItem | null
    >(null);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    form,
    setForm,
  ] =
    useState<NoteFormState>(
      createEmptyForm()
    );

  /*
   * =========================================================
   * FILTER
   * =========================================================
   */

  const filteredNotes =
    useMemo(() => {
      const keyword =
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
              !keyword ||
              note.title
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              (
                note.content ??
                ""
              )
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              note.checklistItems.some(
                (item) =>
                  item.title
                    .toLowerCase()
                    .includes(
                      keyword
                    )
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
   * CREATE
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
   * EDIT
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
        await showWarning(
          "Title required",
          "Add a title first."
        );

        return;
      }

      setIsSaving(
        true
      );

      try {
        const supabase =
          createClient();

        /*
         * UPDATE
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
            throw new Error(
              error.message
            );
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

          await showSuccess(
            "Note updated"
          );

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
          throw new Error(
            error.message
          );
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

        await showSuccess(
          "Note added"
        );
      } catch (error) {
        await showError(
          editingNote
            ? "Note could not be updated"
            : "Note could not be created",

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

      const supabase =
        createClient();

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
        /*
         * Rollback.
         */

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
          "Pin could not be updated",
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
          title:
            "Delete note?",

          text:
            note.title,

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
          .from("notes")
          .delete()
          .eq(
            "id",
            note.id
          );

      if (error) {
        await showError(
          "Note could not be deleted",
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

      await showSuccess(
        "Note deleted"
      );
    };

  /*
   * =========================================================
   * NOTE OPTIONS
   * =========================================================
   */

  const handleNoteOptions =
    async (
      note:
        NoteItem
    ) => {
      const result =
        await Swal.fire({
          title:
            note.title,

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
          note
        );
      }

      if (
        result.isDenied
      ) {
        await handleDeleteNote(
          note
        );
      }
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
            "New Checklist Item",

          input:
            "text",

          inputPlaceholder:
            "What needs to be done?",

          showCancelButton:
            true,

          confirmButtonText:
            "Add",

          cancelButtonText:
            "Cancel",

          confirmButtonColor:
            "#083b59",

          background:
            "#fffdf9",

          color:
            "#123d59",

          inputValidator:
            (value) => {
              if (
                !value.trim()
              ) {
                return "Checklist cannot be empty.";
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
          "Checklist could not be added",
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

      /*
       * Optimistic.
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
         * Rollback.
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
          "Checklist could not be updated",
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
            "Save",

          cancelButtonText:
            "Cancel",

          confirmButtonColor:
            "#083b59",

          background:
            "#fffdf9",

          color:
            "#123d59",

          inputValidator:
            (value) => {
              if (
                !value.trim()
              ) {
                return "Checklist cannot be empty.";
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
          "Checklist could not be updated",
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
          "Checklist could not be deleted",
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
          lg:pb-14
          lg:pt-9
          xl:px-10
        "
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
                Notes
              </h1>

              <p
                className="
                  mt-3
                  text-xs
                  text-ink-soft
                "
              >
                {notes.length}{" "}
                {notes.length ===
                1
                  ? "note"
                  : "notes"}

                <span
                  className="
                    mx-2
                    text-ocean-200
                  "
                >
                  ·
                </span>

                {pinnedCount} pinned

                <span
                  className="
                    mx-2
                    text-ocean-200
                  "
                >
                  ·
                </span>

                {completedChecklist}/
                {checklistCount} tasks
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

              Add Note
            </button>
          </header>

          {/* =================================================
              SEARCH
          ================================================= */}

          <section
            className="
              mt-8
              grid
              gap-3
              border-b
              border-ocean-100/80
              pb-5
              lg:grid-cols-[minmax(0,1fr)_210px]
            "
          >
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
                placeholder="Search notes"
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

            <select
              value={
                categoryFilter
              }
              onChange={(
                event
              ) =>
                setCategoryFilter(
                  event.target
                    .value
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
                All Categories
              </option>

              {categories.map(
                (category) => (
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
          </section>

          {/* =================================================
              NOTES
          ================================================= */}

          {filteredNotes.length >
          0 ? (
            <section
              className="
                mt-6
                grid
                items-start
                gap-4
                md:grid-cols-2
                2xl:grid-cols-3
              "
            >
              {filteredNotes.map(
                (note) => (
                  <NoteCard
                    key={
                      note.id
                    }
                    note={
                      note
                    }
                    onTogglePin={() =>
                      void handleTogglePin(
                        note
                      )
                    }
                    onOptions={() =>
                      void handleNoteOptions(
                        note
                      )
                    }
                    onAddChecklist={() =>
                      void handleAddChecklist(
                        note
                      )
                    }
                    onToggleChecklist={(
                      checklist
                    ) =>
                      void handleToggleChecklist(
                        note,
                        checklist
                      )
                    }
                    onEditChecklist={(
                      checklist
                    ) =>
                      void handleEditChecklist(
                        note,
                        checklist
                      )
                    }
                    onDeleteChecklist={(
                      checklist
                    ) =>
                      void handleDeleteChecklist(
                        note,
                        checklist
                      )
                    }
                  />
                )
              )}
            </section>
          ) : (
            <EmptyNotes
              filtered={
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
        </div>
      </main>

      {/* =====================================================
          FORM
      ====================================================== */}

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
  onTogglePin,
  onOptions,
  onAddChecklist,
  onToggleChecklist,
  onEditChecklist,
  onDeleteChecklist,
}: {
  note:
    NoteItem;

  onTogglePin:
    () => void;

  onOptions:
    () => void;

  onAddChecklist:
    () => void;

  onToggleChecklist: (
    checklist:
      ChecklistItem
  ) => void;

  onEditChecklist: (
    checklist:
      ChecklistItem
  ) => void;

  onDeleteChecklist: (
    checklist:
      ChecklistItem
  ) => void;
}) {
  const completed =
    note.checklistItems.filter(
      (item) =>
        item.is_completed
    ).length;

  const total =
    note.checklistItems.length;

  const progress =
    total > 0
      ? Math.round(
          (
            completed /
            total
          ) * 100
        )
      : 0;

  return (
    <article
      className={`
        group
        relative
        overflow-hidden
        rounded-[26px]
        border
        shadow-[0_12px_35px_rgba(8,59,89,0.045)]
        transition
        duration-300
        hover:-translate-y-0.5
        hover:shadow-[0_18px_45px_rgba(8,59,89,0.075)]
        ${getNoteColorClasses(
          note.color
        )}
      `}
    >
      {/* ACCENT */}

      <div
        className={`
          h-[4px]
          w-full
          ${getNoteAccentClass(
            note.color
          )}
        `}
      />

      <div
        className="
          p-5
          sm:p-6
        "
      >
        {/* HEADER */}

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
              flex-1
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-[10px]
                font-medium
                text-ink-soft/70
              "
            >
              <span>
                {note.category}
              </span>

              {note.is_pinned && (
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
                      text-ocean-700
                    "
                  >
                    Pinned
                  </span>
                </>
              )}
            </div>

            <h2
              className="
                mt-3
                break-words
                font-display
                text-[25px]
                font-semibold
                leading-[1.12]
                tracking-[-0.025em]
                text-ocean-950
              "
            >
              {note.title}
            </h2>
          </div>

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
                onTogglePin
              }
              aria-label={
                note.is_pinned
                  ? "Unpin note"
                  : "Pin note"
              }
              className={`
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                transition

                ${
                  note.is_pinned
                    ? "bg-ocean-950 text-white"
                    : "text-ink-soft/55 hover:bg-white/70 hover:text-ocean-900"
                }
              `}
            >
              <Pin
                size={14}
                fill={
                  note.is_pinned
                    ? "currentColor"
                    : "none"
                }
              />
            </button>

            <button
              type="button"
              onClick={
                onOptions
              }
              aria-label="Note options"
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                text-ink-soft/55
                transition
                hover:bg-white/70
                hover:text-ocean-900
              "
            >
              <MoreHorizontal
                size={16}
              />
            </button>
          </div>
        </div>

        {/* CONTENT */}

        {note.content && (
          <p
            className="
              mt-5
              line-clamp-6
              whitespace-pre-line
              text-sm
              leading-7
              text-ink-soft
            "
          >
            {note.content}
          </p>
        )}

        {/* CHECKLIST */}

        <div
          className={`
            ${
              note.content
                ? "mt-6"
                : "mt-5"
            }

            border-t
            border-ocean-950/[0.07]
            pt-5
          `}
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >
            <div>
              <p
                className="
                  text-xs
                  font-semibold
                  text-ocean-950
                "
              >
                Checklist
              </p>

              {total > 0 && (
                <p
                  className="
                    mt-1
                    text-[10px]
                    text-ink-soft/65
                  "
                >
                  {completed}/{total} completed
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={
                onAddChecklist
              }
              className="
                text-xs
                font-semibold
                text-ocean-700
                transition
                hover:text-ocean-950
              "
            >
              + Add
            </button>
          </div>

          {total > 0 && (
            <>
              <div
                className="
                  mt-4
                  space-y-1
                "
              >
                {note.checklistItems
                  .slice()
                  .sort(
                    (
                      a,
                      b
                    ) =>
                      a.sort_order -
                      b.sort_order
                  )
                  .map(
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
                    h-[4px]
                    overflow-hidden
                    rounded-full
                    bg-white/65
                  "
                >
                  <div
                    className="
                      h-full
                      rounded-full
                      bg-ocean-800
                      transition-[width]
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
          )}
        </div>

        {/* FOOTER */}

        <div
          className="
            mt-5
            border-t
            border-ocean-950/[0.07]
            pt-4
          "
        >
          <p
            className="
              text-[9px]
              text-ink-soft/55
            "
          >
            Updated{" "}
            {formatUpdatedAt(
              note.updated_at
            )}
          </p>
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
  const handleOptions =
    async () => {
      const result =
        await Swal.fire({
          title:
            checklist.title,

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
        onEdit();
      }

      if (
        result.isDenied
      ) {
        onDelete();
      }
    };

  return (
    <div
      className="
        group/item
        flex
        min-h-[36px]
        items-center
        gap-2.5
      "
    >
      <button
        type="button"
        onClick={
          onToggle
        }
        aria-label={
          checklist.is_completed
            ? "Mark incomplete"
            : "Mark complete"
        }
        className={`
          flex
          h-[22px]
          w-[22px]
          shrink-0
          items-center
          justify-center
          rounded-[7px]
          border
          transition

          ${
            checklist.is_completed
              ? "border-ocean-900 bg-ocean-900 text-white"
              : "border-ocean-200 bg-white/75 text-transparent hover:border-ocean-500"
          }
        `}
      >
        <Check
          size={12}
          strokeWidth={2.2}
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
          leading-5
          transition

          ${
            checklist.is_completed
              ? "text-ink-soft/60 line-through"
              : "font-medium text-ocean-950"
          }
        `}
      >
        {checklist.title}
      </button>

      <button
        type="button"
        onClick={() =>
          void handleOptions()
        }
        aria-label="Checklist options"
        className="
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-full
          text-ink-soft/45
          opacity-60
          transition
          hover:bg-white/70
          hover:text-ocean-900
          sm:opacity-0
          sm:group-hover/item:opacity-100
        "
      >
        <MoreHorizontal
          size={13}
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
    Dispatch<
      SetStateAction<
        NoteFormState
      >
    >;

  editing:
    boolean;

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
          max-w-[720px]
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
            {editing
              ? "Edit Note"
              : "New Note"}
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
            {/* TITLE */}

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
                autoFocus
                placeholder="Note title"
                className="
                  w-full
                  border-0
                  bg-transparent
                  px-0
                  py-1
                  font-display
                  text-[31px]
                  font-semibold
                  leading-tight
                  tracking-[-0.035em]
                  text-ocean-950
                  outline-none
                  placeholder:text-ocean-200
                "
              />
            </FormField>

            {/* CONTENT */}

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
                        event.target
                          .value,
                    })
                  )
                }
                rows={9}
                placeholder="Write something..."
                className={`
                  ${inputClass}
                  resize-none
                  leading-7
                `}
              />
            </FormField>

            {/* CATEGORY */}

            <FormField
              label="Category"
            >
              <div
                className="
                  flex
                  flex-wrap
                  gap-2
                "
              >
                {categories.map(
                  (category) => {
                    const active =
                      form.category ===
                      category;

                    return (
                      <button
                        key={
                          category
                        }
                        type="button"
                        onClick={() =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,

                              category,
                            })
                          )
                        }
                        className={`
                          rounded-full
                          border
                          px-3.5
                          py-2
                          text-xs
                          font-medium
                          transition

                          ${
                            active
                              ? "border-ocean-950 bg-ocean-950 text-white"
                              : "border-ocean-100 bg-white text-ink-soft hover:border-ocean-200 hover:text-ocean-900"
                          }
                        `}
                      >
                        {category}
                      </button>
                    );
                  }
                )}
              </div>
            </FormField>

            {/* COLOR */}

            <FormField
              label="Color"
            >
              <div
                className="
                  flex
                  flex-wrap
                  gap-3
                "
              >
                {colorOptions.map(
                  (option) => {
                    const active =
                      form.color ===
                      option.value;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        title={
                          option.label
                        }
                        aria-label={
                          option.label
                        }
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
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          rounded-full
                          border
                          border-white
                          shadow-[0_4px_12px_rgba(8,59,89,0.08)]
                          ring-offset-2
                          transition
                          ${option.swatch}

                          ${
                            active
                              ? "scale-105 ring-2 ring-ocean-700"
                              : "hover:scale-105"
                          }
                        `}
                      >
                        {active && (
                          <Check
                            size={14}
                            strokeWidth={2.2}
                            className="
                              text-ocean-950
                            "
                          />
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </FormField>

            {/* PREVIEW STRIP */}

            <div
              className={`
                rounded-[18px]
                border
                px-4
                py-4
                ${getNoteColorClasses(
                  form.color
                )}
              `}
            >
              <p
                className="
                  text-[9px]
                  font-medium
                  text-ink-soft/60
                "
              >
                {form.category}
              </p>

              <p
                className="
                  mt-1
                  truncate
                  font-display
                  text-lg
                  font-semibold
                  text-ocean-950
                "
              >
                {form.title.trim() ||
                  "Untitled"}
              </p>
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

function EmptyNotes({
  filtered,
  onCreate,
  onClear,
}: {
  filtered:
    boolean;

  onCreate:
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
          ? "No notes found."
          : "No notes yet."}
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
            onCreate
          }
          className={`
            ${primaryButtonClass}
            mt-6
          `}
        >
          Add Note
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
  const classes:
    Record<
      NoteColor,
      string
    > = {
    blue:
      "border-[#cdeaf3] bg-[#f0fafd]",

    cream:
      "border-[#eadfcf] bg-[#fffaf1]",

    pink:
      "border-[#f3d8dd] bg-[#fff5f6]",

    green:
      "border-[#d5eadc] bg-[#f3fbf5]",

    lavender:
      "border-[#e2ddf3] bg-[#f8f6ff]",
  };

  return classes[
    color
  ];
}

function getNoteAccentClass(
  color:
    NoteColor
) {
  const classes:
    Record<
      NoteColor,
      string
    > = {
    blue:
      "bg-[#8ed6ef]",

    cream:
      "bg-[#dec59d]",

    pink:
      "bg-[#ef9aaa]",

    green:
      "bg-[#97c9aa]",

    lavender:
      "bg-[#b4a7df]",
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
      timeZone:
        "Asia/Jakarta",

      day:
        "numeric",

      month:
        "short",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hourCycle:
        "h23",
    }
  ).format(
    new Date(
      value
    )
  );
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