// src/components/ui/LogoutButton.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  LogOut,
} from "lucide-react";

import Swal from "sweetalert2";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router =
    useRouter();

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] =
    useState(false);

  const handleLogout =
    async () => {
      if (
        isLoggingOut
      ) {
        return;
      }

      const result =
        await Swal.fire({
          icon:
            "question",

          title:
            "Log out?",

          text:
            "You’ll need to sign in again to open your space.",

          showCancelButton:
            true,

          confirmButtonText:
            "Log out",

          cancelButtonText:
            "Cancel",

          confirmButtonColor:
            "#d85f72",

          cancelButtonColor:
            "#e8f8fc",

          reverseButtons:
            true,

          background:
            "#fffdf9",

          color:
            "#123d59",

          customClass: {
            popup:
              "love4ever-alert",
          },
        });

      if (
        !result.isConfirmed
      ) {
        return;
      }

      setIsLoggingOut(
        true
      );

      try {
        const supabase =
          createClient();

        const {
          error,
        } =
          await supabase.auth
            .signOut();

        if (error) {
          throw new Error(
            error.message
          );
        }

        router.replace(
          "/login"
        );

        router.refresh();
      } catch (error) {
        await Swal.fire({
          icon:
            "error",

          title:
            "Could not log out",

          text:
            error instanceof
              Error
              ? error.message
              : "Something went wrong.",

          confirmButtonText:
            "OK",

          confirmButtonColor:
            "#083b59",

          background:
            "#fffdf9",

          color:
            "#123d59",
        });
      } finally {
        setIsLoggingOut(
          false
        );
      }
    };

  return (
    <button
      type="button"
      onClick={() =>
        void handleLogout()
      }
      disabled={
        isLoggingOut
      }
      className="
        group
        flex
        h-[44px]
        w-full
        items-center
        gap-3
        rounded-[15px]
        px-3
        text-left
        text-[13px]
        font-medium
        text-ink-soft
        transition
        duration-200
        hover:bg-heart-soft/55
        hover:text-heart
        active:scale-[0.99]
        disabled:pointer-events-none
        disabled:opacity-45
      "
    >
      <span
        className="
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-[10px]
          text-ocean-500
          transition
          duration-200
          group-hover:bg-white/70
          group-hover:text-heart
        "
      >
        <LogOut
          size={16}
          strokeWidth={1.8}
        />
      </span>

      <span
        className="
          flex-1
        "
      >
        {isLoggingOut
          ? "Logging out..."
          : "Log out"}
      </span>
    </button>
  );
}