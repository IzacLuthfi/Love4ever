// src/app/notes/page.tsx

import { redirect } from "next/navigation";

import NotesClient from "@/components/notes/NotesClient";
import { createClient } from "@/lib/supabase/server";

export default async function NotesPage() {
  const supabase =
    await createClient();

  /*
   * =========================================================
   * AUTH
   * =========================================================
   */

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /*
   * =========================================================
   * PROFILE
   * =========================================================
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
      .maybeSingle();

  /*
   * =========================================================
   * COUPLE
   * =========================================================
   */

  const {
    data: membership,
  } =
    await supabase
      .from("couple_members")
      .select("couple_id")
      .eq(
        "user_id",
        user.id
      )
      .limit(1)
      .maybeSingle();

  if (!membership) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-cloud
          px-5
        "
      >
        <div
          className="
            glass-card
            max-w-md
            rounded-[30px]
            p-8
            text-center
          "
        >
          <h1
            className="
              font-display
              text-3xl
              font-semibold
              text-ocean-950
            "
          >
            Couple belum terhubung
          </h1>

          <p
            className="
              mt-3
              text-sm
              leading-7
              text-ink-soft
            "
          >
            Akun ini belum terdaftar sebagai anggota
            workspace Love4ever.
          </p>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * NOTES
   * =========================================================
   */

  const {
    data: notes,
    error: notesError,
  } =
    await supabase
      .from("notes")
      .select(
        `
        id,
        couple_id,
        created_by,
        title,
        content,
        category,
        color,
        is_pinned,
        created_at,
        updated_at
        `
      )
      .eq(
        "couple_id",
        membership.couple_id
      )
      .order(
        "is_pinned",
        {
          ascending: false,
        }
      )
      .order(
        "updated_at",
        {
          ascending: false,
        }
      );

  if (notesError) {
    console.error(
      "Notes query error:",
      notesError
    );
  }

  const safeNotes =
    notes ?? [];

  /*
   * =========================================================
   * CHECKLIST ITEMS
   * =========================================================
   */

  const noteIds =
    safeNotes.map(
      (note) =>
        note.id
    );

  let checklistItems: {
    id: string;
    note_id: string;
    title: string;
    is_completed: boolean;
    sort_order: number;
    created_at: string;
  }[] = [];

  if (
    noteIds.length >
    0
  ) {
    const {
      data: items,
      error: itemsError,
    } =
      await supabase
        .from(
          "note_checklist_items"
        )
        .select(
          `
          id,
          note_id,
          title,
          is_completed,
          sort_order,
          created_at
          `
        )
        .in(
          "note_id",
          noteIds
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

    if (itemsError) {
      console.error(
        "Note checklist query error:",
        itemsError
      );
    }

    checklistItems =
      items ?? [];
  }

  const notesWithItems =
    safeNotes.map(
      (note) => ({
        ...note,

        checklistItems:
          checklistItems.filter(
            (item) =>
              item.note_id ===
              note.id
          ),
      })
    );

  return (
    <NotesClient
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
      coupleId={
        membership.couple_id
      }
      initialNotes={
        notesWithItems
      }
    />
  );
}