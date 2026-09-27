// src/components/layout/MobileBottomNav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  type ElementType,
  useEffect,
  useRef,
} from "react";

import {
  CalendarDays,
  History,
  Home,
  Images,
  MapPinned,
  MessageCircleHeart,
  Music2,
  NotebookPen,
  Search,
  Settings,
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
    label: "Search",
    href: "/search",
    icon: Search,
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
    label: "Timeline",
    href: "/timeline",
    icon: History,
  },

  {
    label: "Messages",
    href: "/messages",
    icon: MessageCircleHeart,
  },

  {
    label: "Notes",
    href: "/notes",
    icon: NotebookPen,
  },

  {
    label: "Music",
    href: "/music",
    icon: Music2,
  },

  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },

  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
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

  const scrollContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /*
   * =========================================================
   * ACTIVE ROUTE
   * =========================================================
   */

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

  /*
   * =========================================================
   * KEEP ACTIVE ITEM VISIBLE
   * =========================================================
   */

  useEffect(() => {
    const container =
      scrollContainerRef.current;

    if (!container) {
      return;
    }

    const activeItem =
      container.querySelector<HTMLElement>(
        '[data-active="true"]'
      );

    if (!activeItem) {
      return;
    }

    /*
     * Auto, bukan smooth.
     *
     * Supaya tidak menambah behavior navigation/scroll
     * yang sedang kita debug.
     */
    activeItem.scrollIntoView({
      behavior: "auto",
      block: "nearest",
      inline: "center",
    });
  }, [pathname]);

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <nav
      aria-label="Mobile navigation"
      style={{
        bottom:
          "max(10px, env(safe-area-inset-bottom))",
      }}
      className="
        fixed
        left-1/2
        z-[950]
        w-[calc(100%-16px)]
        max-w-[620px]
        -translate-x-1/2
        overflow-hidden
        rounded-[25px]
        border
        border-white/75
        bg-white/85
        shadow-[0_18px_55px_rgba(8,59,89,0.16)]
        backdrop-blur-[26px]
        lg:hidden
      "
    >
      <div
        ref={
          scrollContainerRef
        }
        className="
          flex
          w-full
          items-center
          gap-1
          overflow-x-auto
          overscroll-x-contain
          px-2
          py-2
          scroll-smooth
          snap-x
          snap-proximity
          touch-pan-x

          [scrollbar-width:none]
          [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
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
                data-active={
                  active
                    ? "true"
                    : "false"
                }
                className="
                  group
                  flex
                  w-[68px]
                  shrink-0
                  snap-center
                  flex-col
                  items-center
                  justify-center
                  gap-1.5
                  rounded-[18px]
                  px-1
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
                        ? `
                          bg-ocean-950
                          px-3
                          text-white
                          shadow-[0_7px_18px_rgba(6,42,63,0.18)]
                        `
                        : `
                          text-ink-soft
                          group-hover:bg-ocean-50
                          group-hover:text-ocean-800
                        `
                    }
                  `}
                >
                  <Icon
                    size={
                      18
                    }
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
                    max-w-full
                    truncate
                    text-[9px]
                    leading-none
                    transition
                    duration-200

                    ${
                      active
                        ? `
                          font-semibold
                          text-ocean-950
                        `
                        : `
                          font-medium
                          text-ink-soft
                        `
                    }
                  `}
                >
                  {
                    item.label
                  }
                </span>
              </Link>
            );
          }
        )}
      </div>
    </nav>
  );
}