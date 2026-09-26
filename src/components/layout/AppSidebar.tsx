// src/components/layout/AppSidebar.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CalendarDays,
  ChevronRight,
  Home,
  Images,
  MapPinned,
  MessageCircleHeart,
  Music2,
  NotebookPen,
  Settings,
} from "lucide-react";

type SidebarUser = {
  fullName: string;
  nickname: string;
  email: string;
  avatarUrl: string | null;
};

type AppSidebarProps = {
  user: SidebarUser;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const mainNavigation: NavigationItem[] = [
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
];

const connectionNavigation: NavigationItem[] = [
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
];

export default function AppSidebar({
  user,
}: AppSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  return (
    <aside
      className="
        fixed
        bottom-4
        left-4
        top-4
        z-40
        hidden
        w-[268px]
        flex-col
        overflow-hidden
        rounded-[30px]
        border
        border-white/80
        bg-white/80
        shadow-[0_20px_70px_rgba(17,76,104,0.10)]
        backdrop-blur-[28px]
        lg:flex
      "
    >
      {/* BACKGROUND DECORATION */}

      <div
        className="
          pointer-events-none
          absolute
          -right-24
          -top-24
          h-56
          w-56
          rounded-full
          bg-ocean-200/25
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-28
          -left-24
          h-56
          w-56
          rounded-full
          bg-cream-deep/20
          blur-3xl
        "
      />

      {/* BRAND */}

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
          href="/dashboard"
          className="
            group
            flex
            items-center
            gap-3
            rounded-[20px]
            px-2
            py-2
          "
        >
          <div
            className="
              relative
              shrink-0
            "
          >
            <div
              className="
                absolute
                inset-1
                rounded-2xl
                bg-ocean-300/25
                blur-md
              "
            />

            <Image
              src="/icons/love4ever-logo.png"
              alt="Love4ever"
              width={48}
              height={48}
              priority
              className="
                relative
                h-12
                w-12
                rounded-[16px]
                border
                border-white
                object-cover
                shadow-[0_8px_20px_rgba(17,107,145,0.14)]
              "
            />
          </div>

          <div className="min-w-0">
            <h1
              className="
                font-display
                text-[21px]
                font-semibold
                leading-none
                tracking-[-0.02em]
                text-ocean-950
              "
            >
              Love4ever
            </h1>

            <p
              className="
                mt-2
                text-[9px]
                font-bold
                uppercase
                tracking-[0.22em]
                text-ocean-500
              "
            >
              Izac & Lian
            </p>
          </div>
        </Link>
      </div>

      {/* DIVIDER */}

      <div
        className="
          mx-6
          h-px
          bg-gradient-to-r
          from-transparent
          via-ocean-100
          to-transparent
        "
      />

      {/* NAVIGATION */}

      <div
        className="
          relative
          z-10
          flex-1
          overflow-y-auto
          px-4
          pb-4
          pt-5
        "
      >
        <NavigationSection
          title="Our Space"
          navigation={mainNavigation}
          isActive={isActive}
        />

        <div className="mt-7">
          <NavigationSection
            title="Connection"
            navigation={connectionNavigation}
            isActive={isActive}
          />
        </div>
      </div>

      {/* BOTTOM */}

      <div
        className="
          relative
          z-10
          border-t
          border-ocean-100/70
          p-3
        "
      >
        {/* PROFILE */}

        <Link
          href="/profile"
          className={`
            group
            flex
            items-center
            gap-3
            rounded-[18px]
            px-3
            py-2.5
            transition-all
            duration-200
            ${
              isActive("/profile")
                ? "bg-ocean-50"
                : "hover:bg-ocean-50/80"
            }
          `}
        >
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.nickname}
              width={40}
              height={40}
              className="
                h-10
                w-10
                shrink-0
                rounded-[14px]
                object-cover
                shadow-sm
              "
            />
          ) : (
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-[14px]
                bg-gradient-to-br
                from-ocean-100
                to-sky-soft
                font-display
                text-base
                font-bold
                text-ocean-700
              "
            >
              {user.nickname
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <p
              className="
                truncate
                text-sm
                font-bold
                text-ocean-950
              "
            >
              {user.nickname}
            </p>

            <p
              className="
                mt-0.5
                text-[10px]
                font-medium
                text-ink-soft
              "
            >
              Profile
            </p>
          </div>

          <ChevronRight
            size={16}
            className="
              shrink-0
              text-ocean-300
              transition-all
              duration-200
              group-hover:translate-x-0.5
              group-hover:text-ocean-600
            "
          />
        </Link>

        {/* SETTINGS */}

        <Link
          href="/settings"
          className={`
            mt-1
            flex
            items-center
            gap-3
            rounded-[17px]
            px-3
            py-2.5
            text-[13px]
            font-semibold
            transition-all
            duration-200
            ${
              isActive("/settings")
                ? "bg-ocean-700 text-white shadow-[0_10px_25px_rgba(17,107,145,0.18)]"
                : "text-ink-soft hover:bg-ocean-50 hover:text-ocean-800"
            }
          `}
        >
          <div
            className={`
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-[11px]
              ${
                isActive("/settings")
                  ? "bg-white/15"
                  : "bg-ocean-50"
              }
            `}
          >
            <Settings
              size={16}
            />
          </div>

          <span>
            Settings
          </span>
        </Link>
      </div>
    </aside>
  );
}

/*
 * ============================================
 * NAVIGATION SECTION
 * ============================================
 */

function NavigationSection({
  title,
  navigation,
  isActive,
}: {
  title: string;
  navigation: NavigationItem[];
  isActive: (
    href: string
  ) => boolean;
}) {
  return (
    <div>
      <p
        className="
          mb-2
          px-3
          text-[9px]
          font-bold
          uppercase
          tracking-[0.24em]
          text-ink-soft/50
        "
      >
        {title}
      </p>

      <nav className="space-y-1">
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
                key={item.href}
                href={item.href}
                className={`
                  group
                  relative
                  flex
                  items-center
                  gap-3
                  overflow-hidden
                  rounded-[17px]
                  px-3
                  py-[10px]
                  text-[13px]
                  font-semibold
                  transition-all
                  duration-200
                  ${
                    active
                      ? "bg-ocean-700 text-white shadow-[0_10px_28px_rgba(17,107,145,0.16)]"
                      : "text-ink-soft hover:bg-ocean-50/80 hover:text-ocean-800"
                  }
                `}
              >
                {active && (
                  <span
                    className="
                      absolute
                      bottom-3
                      left-0
                      top-3
                      w-[3px]
                      rounded-r-full
                      bg-white/90
                    "
                  />
                )}

                <div
                  className={`
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-[11px]
                    transition-all
                    duration-200
                    ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-ocean-50 text-ocean-600 group-hover:bg-ocean-100"
                    }
                  `}
                >
                  <Icon
                    size={16}
                    strokeWidth={
                      active
                        ? 2.3
                        : 2
                    }
                  />
                </div>

                <span>
                  {item.label}
                </span>

                {active && (
                  <span
                    className="
                      ml-auto
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-white/80
                    "
                  />
                )}
              </Link>
            );
          }
        )}
      </nav>
    </div>
  );
}