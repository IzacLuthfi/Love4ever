// src/components/ui/LogoutButton.tsx

"use client";

import { useRouter } from "next/navigation";
import {
  LogOut,
} from "lucide-react";
import Swal from "sweetalert2";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router =
    useRouter();

  const handleLogout =
    async () => {
      const result =
        await Swal.fire({
          icon: "question",
          title: "Logout?",
          text:
            "Kamu yakin ingin keluar dari Love4ever?",
          showCancelButton: true,
          confirmButtonText:
            "Logout",
          cancelButtonText:
            "Batal",
          confirmButtonColor:
            "#1688b5",
        });

      if (!result.isConfirmed) {
        return;
      }

      const supabase =
        createClient();

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        await Swal.fire({
          icon: "error",
          title:
            "Logout gagal",
          text:
            error.message,
          confirmButtonColor:
            "#1688b5",
        });

        return;
      }

      router.replace(
        "/login"
      );

      router.refresh();
    };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="
        flex
        w-full
        items-center
        justify-center
        gap-2
        rounded-2xl
        border
        border-ocean-200
        bg-white/70
        px-5
        py-3.5
        font-semibold
        text-ocean-800
        transition
        hover:bg-white
      "
    >
      <LogOut size={18} />

      Logout
    </button>
  );
}