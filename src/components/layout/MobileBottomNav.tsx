// src/components/layout/MobileBottomNav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type {
  ElementType,
} from "react";

import {
  CalendarDays,
  Home,
  Images,
  MapPinned,
  UserRound,
} from "lucide-react";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

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

const navigation: NavigationItem[] = [
  {
    label: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Gallery",
    href: "/gallery",
    icon: Images,
  },
  {
    label: "Planner",
    href: "/planner",
    icon: CalendarDays,
  },
  {
    label: "Memories",
    href: "/memories",
    icon: MapPinned,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
];

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function MobileBottomNav() {
  const pathname =
    usePathname();

  const isActive = (
    href: string
  ) => {
    if (
      href === "/dashboard"
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

  return (
    <nav
      className="
        fixed
        bottom-3
        left-1/2
        z-[950]
        flex
        w-[calc(100%-24px)]
        max-w-[500px]
        -translate-x-1/2
        items-center
        justify-between
        rounded-[24px]
        border
        border-white/75
        bg-white/82
        px-2
        py-2
        shadow-[0_18px_55px_rgba(8,59,89,0.16)]
        backdrop-blur-[26px]
        lg:hidden
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
              className="
                group
                flex
                min-w-[56px]
                flex-1
                flex-col
                items-center
                justify-center
                gap-1.5
                rounded-[18px]
                py-1.5
              "
            >
              {/* ICON */}

              <span
                className={`
                  flex
                  h-9
                  min-w-9
                  items-center
                  justify-center
                  rounded-[12px]
                  transition
                  duration-200

                  ${
                    active
                      ? "bg-ocean-950 px-3 text-white shadow-[0_7px_18px_rgba(6,42,63,0.18)]"
                      : "text-ink-soft group-hover:bg-ocean-50 group-hover:text-ocean-800"
                  }
                `}
              >
                <Icon
                  size={18}
                  strokeWidth={
                    active
                      ? 2
                      : 1.8
                  }
                />
              </span>

              {/* LABEL */}

              <span
                className={`
                  text-[9px]
                  leading-none
                  transition
                  duration-200

                  ${
                    active
                      ? "font-semibold text-ocean-950"
                      : "font-medium text-ink-soft"
                  }
                `}
              >
                {item.label}
              </span>
            </Link>
          );
        }
      )}
    </nav>
  );
}