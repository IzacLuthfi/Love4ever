// src/components/layout/AppSidebar.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

import { usePathname } from "next/navigation";

import type {
  ElementType,
} from "react";

import {
  CalendarDays,
  ChevronRight,
  Home,
  Images,
  History,
  MapPinned,
  MessageCircleHeart,
  Music2,
  NotebookPen,
  Search,
  Settings,
} from "lucide-react";

import LogoutButton from "@/components/ui/LogoutButton";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type SidebarUser = {
  fullName: string;

  nickname: string;

  email: string;

  avatarUrl:
    | string
    | null;
};

type AppSidebarProps = {
  user: SidebarUser;
};

type NavigationItem = {
  label: string;

  href: string;

  icon: ElementType;
};

/*
 * =========================================================
 * NAVIGATION
 * =========================================================
 */

const navigation:
  NavigationItem[] = [
  {
    label:
      "Home",

    href:
      "/dashboard",

    icon:
      Home,
  },
  {
  label: "Search",
  href: "/search",
  icon: Search,
},
  {
    label:
      "Gallery",

    href:
      "/gallery",

    icon:
      Images,
  },
  {
    label:
      "Planner",

    href:
      "/planner",

    icon:
      CalendarDays,
  },
  {
    label:
      "Memories",

    href:
      "/memories",

    icon:
      MapPinned,
  },
  {
  label: "Timeline",
  href: "/timeline",
  icon: History,
},
  {
    label:
      "Messages",

    href:
      "/messages",

    icon:
      MessageCircleHeart,
  },
  {
    label:
      "Notes",

    href:
      "/notes",

    icon:
      NotebookPen,
  },
  {
    label:
      "Music",

    href:
      "/music",

    icon:
      Music2,
  },
];

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function AppSidebar({
  user,
}: AppSidebarProps) {
  const pathname =
    usePathname();

  /*
   * =========================================================
   * ACTIVE ROUTE
   * =========================================================
   */

  const isActive = (
    href: string
  ) => {
    if (
      href ===
      "/dashboard"
    ) {
      return (
        pathname ===
        "/dashboard"
      );
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  };

  /*
   * =========================================================
   * USER
   * =========================================================
   */

  const displayName =
    user.nickname?.trim() ||
    user.fullName?.trim() ||
    "Profile";

  const initials =
    getInitials(
      displayName
    );

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <aside
      className="
        fixed
        bottom-[18px]
        left-[18px]
        top-[18px]
        z-40
        hidden
        w-[268px]
        flex-col
        overflow-hidden
        rounded-[30px]
        border
        border-white/75
        bg-white/78
        shadow-[0_24px_70px_rgba(8,59,89,0.08)]
        backdrop-blur-[30px]
        lg:flex
      "
    >
      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -right-28
          -top-32
          h-64
          w-64
          rounded-full
          bg-ocean-100/30
          blur-[85px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-36
          -left-28
          h-64
          w-64
          rounded-full
          bg-cream-deep/20
          blur-[95px]
        "
      />

      {/* =====================================================
          ACCOUNT
      ====================================================== */}

      <div
        className="
          relative
          z-10
          px-4
          pb-3
          pt-4
        "
      >
        <Link
          href="/profile"
          className="
            group
            flex
            items-center
            gap-3.5
            rounded-[20px]
            border
            border-ocean-100/55
            bg-white/52
            px-3
            py-3
            transition
            duration-200
            hover:border-ocean-100
            hover:bg-white/82
            hover:shadow-[0_8px_25px_rgba(8,59,89,0.045)]
          "
        >
          {/* AVATAR */}

          <div
            className="
              relative
              h-11
              w-11
              shrink-0
            "
          >
            {user.avatarUrl ? (
              <Image
                src={
                  user.avatarUrl
                }
                alt={
                  displayName
                }
                fill
                unoptimized
                className="
                  rounded-[14px]
                  object-cover
                  ring-1
                  ring-ocean-100
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
                  rounded-[14px]
                  bg-ocean-950
                  font-display
                  text-[15px]
                  font-semibold
                  text-white
                "
              >
                {initials}
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
                text-[13px]
                font-semibold
                text-ocean-950
              "
            >
              {displayName}
            </p>

            {user.fullName &&
              user.fullName !==
                displayName && (
                <p
                  className="
                    mt-0.5
                    truncate
                    text-[10px]
                    text-ink-soft
                  "
                >
                  {
                    user.fullName
                  }
                </p>
              )}
          </div>

          <ChevronRight
            size={15}
            strokeWidth={1.8}
            className="
              shrink-0
              text-ocean-300
              transition
              duration-200
              group-hover:translate-x-0.5
              group-hover:text-ocean-600
            "
          />
        </Link>
      </div>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <div
        className="
          relative
          z-10
          flex-1
          overflow-y-auto
          px-4
          py-3
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        <nav
          className="
            space-y-1
          "
        >
          {navigation.map(
            (item) => {
              const Icon =
                item.icon;

              const active =
                isActive(
                  item.href
                );

              return (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={`
                    group
                    relative
                    flex
                    h-[46px]
                    items-center
                    gap-3
                    rounded-[15px]
                    px-3
                    text-[13px]
                    font-medium
                    transition
                    duration-200

                    ${
                      active
                        ? "bg-ocean-950/[0.065] text-ocean-950"
                        : "text-ink-soft hover:bg-white/65 hover:text-ocean-900"
                    }
                  `}
                >
                  {/* ACTIVE LINE */}

                  <span
                    className={`
                      absolute
                      left-0
                      h-5
                      w-[3px]
                      rounded-full
                      bg-ocean-800
                      transition
                      duration-200

                      ${
                        active
                          ? "scale-y-100 opacity-100"
                          : "scale-y-50 opacity-0"
                      }
                    `}
                  />

                  {/* ICON */}

                  <span
                    className={`
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-[10px]
                      transition
                      duration-200

                      ${
                        active
                          ? "bg-ocean-950 text-white shadow-[0_5px_14px_rgba(6,42,63,0.14)]"
                          : "text-ocean-500 group-hover:text-ocean-800"
                      }
                    `}
                  >
                    <Icon
                      size={16}
                      strokeWidth={
                        active
                          ? 2
                          : 1.8
                      }
                    />
                  </span>

                  <span>
                    {item.label}
                  </span>
                </Link>
              );
            }
          )}
        </nav>
      </div>

      {/* =====================================================
          ACCOUNT ACTIONS
      ====================================================== */}

      <div
        className="
          relative
          z-10
          px-4
          pb-4
          pt-3
        "
      >
        {/* SEPARATOR */}

        <div
          className="
            mb-3
            h-px
            bg-ocean-100/70
          "
        />

        <div
          className="
            space-y-1
          "
        >
          {/* SETTINGS */}

          <Link
            href="/settings"
            aria-current={
              isActive(
                "/settings"
              )
                ? "page"
                : undefined
            }
            className={`
              group
              relative
              flex
              h-[44px]
              items-center
              gap-3
              rounded-[15px]
              px-3
              text-[13px]
              font-medium
              transition
              duration-200

              ${
                isActive(
                  "/settings"
                )
                  ? "bg-ocean-950/[0.065] text-ocean-950"
                  : "text-ink-soft hover:bg-white/65 hover:text-ocean-900"
              }
            `}
          >
            {/* ACTIVE LINE */}

            <span
              className={`
                absolute
                left-0
                h-5
                w-[3px]
                rounded-full
                bg-ocean-800
                transition

                ${
                  isActive(
                    "/settings"
                  )
                    ? "scale-y-100 opacity-100"
                    : "scale-y-50 opacity-0"
                }
              `}
            />

            {/* ICON */}

            <span
              className={`
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-[10px]
                transition

                ${
                  isActive(
                    "/settings"
                  )
                    ? "bg-ocean-950 text-white shadow-[0_5px_14px_rgba(6,42,63,0.14)]"
                    : "text-ocean-500 group-hover:text-ocean-800"
                }
              `}
            >
              <Settings
                size={16}
                strokeWidth={1.8}
              />
            </span>

            <span>
              Settings
            </span>
          </Link>

          {/* LOGOUT */}

          <LogoutButton />
        </div>

        {/* SMALL ACCOUNT FOOTER */}

        <div
          className="
            mt-3
            px-3
          "
        >
          <p
            className="
              text-[9px]
              font-medium
              tracking-[0.02em]
              text-ink-soft/35
            "
          >
            Love4ever · Private Space
          </p>
        </div>
      </div>
    </aside>
  );
}

/*
 * =========================================================
 * INITIALS
 * =========================================================
 */

function getInitials(
  value: string
) {
  if (
    !value.trim()
  ) {
    return "?";
  }

  return value
    .trim()
    .split(
      /\s+/
    )
    .slice(
      0,
      2
    )
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase()
    )
    .join("");
}