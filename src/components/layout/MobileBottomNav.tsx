// src/components/layout/MobileBottomNav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  Images,
  MapPinned,
  UserRound,
} from "lucide-react";

const navigation = [
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
    label: "Map",
    href: "/memories",
    icon: MapPinned,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="
        fixed
        bottom-3
        left-1/2
        z-50
        flex
        w-[calc(100%-24px)]
        max-w-[520px]
        -translate-x-1/2
        items-center
        justify-around
        rounded-[24px]
        border
        border-white/80
        bg-white/85
        px-2
        py-2
        shadow-[0_15px_50px_rgba(15,80,112,0.18)]
        backdrop-blur-2xl
        lg:hidden
      "
    >
      {navigation.map((item) => {
        const Icon = item.icon;

        const active =
          pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex
              min-w-[58px]
              flex-col
              items-center
              justify-center
              gap-1
              rounded-[17px]
              px-2
              py-2
              text-[10px]
              font-semibold
              transition
              ${
                active
                  ? "bg-ocean-700 text-white shadow-md"
                  : "text-ink-soft"
              }
            `}
          >
            <Icon size={19} />

            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}