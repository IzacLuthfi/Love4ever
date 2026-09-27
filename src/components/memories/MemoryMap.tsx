// src/components/memories/MemoryMap.tsx

"use client";

import dynamic from "next/dynamic";

export type MemoryMapPoint = {
  id: string;

  title: string;

  story:
    | string
    | null;

  memory_date:
    string;

  location_name:
    | string
    | null;

  maps_url:
    | string
    | null;

  latitude:
    | number
    | null;

  longitude:
    | number
    | null;
};

type MemoryMapProps = {
  memories:
    MemoryMapPoint[];
};

const MemoryMapInner =
  dynamic(
    () =>
      import(
        "@/components/memories/MemoryMapInner"
      ),
    {
      ssr:
        false,

      loading: () => (
        <div
          className="
            flex
            h-[430px]
            items-center
            justify-center
            bg-ocean-50
            text-xs
            text-ink-soft
            sm:h-[480px]
          "
        >
          Loading map...
        </div>
      ),
    }
  );

export default function MemoryMap({
  memories,
}: MemoryMapProps) {
  return (
    <MemoryMapInner
      memories={
        memories
      }
    />
  );
}