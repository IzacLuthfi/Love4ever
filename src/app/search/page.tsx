// src/app/search/page.tsx

import { redirect } from "next/navigation";

import GlobalSearchClient from "@/components/search/GlobalSearchClient";
import { createClient } from "@/lib/supabase/server";

export default async function SearchPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      full_name,
      nickname,
      avatar_url
    `)
    .eq("id", user.id)
    .maybeSingle();

  const { data: membership } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f4] px-5">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl font-semibold text-ocean-950">
            Couple belum terhubung
          </h1>

          <p className="mt-3 text-sm text-ink-soft">
            Search tersedia setelah akun terhubung ke couple.
          </p>
        </div>
      </main>
    );
  }

  return (
    <GlobalSearchClient
      user={{
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name || "Love",
        nickname:
          profile?.nickname ||
          profile?.full_name ||
          "Love",
        avatarUrl: profile?.avatar_url ?? null,
      }}
      coupleId={membership.couple_id}
    />
  );
}
