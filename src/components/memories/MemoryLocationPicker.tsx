// src/components/memories/MemoryLocationPicker.tsx

"use client";

import dynamic from "next/dynamic";

type MemoryLocationPickerProps = {
  latitude:
    number | null;

  longitude:
    number | null;

  onChange: (
    latitude: number,
    longitude: number
  ) => void;

  onClear:
    () => void;
};

const MemoryLocationPickerMap =
  dynamic(
    () =>
      import(
        "@/components/memories/MemoryLocationPickerMap"
      ),
    {
      ssr:
        false,

      loading: () => (
        <div
          className="
            flex
            h-[330px]
            items-center
            justify-center
            bg-ocean-50
            text-xs
            text-ink-soft
          "
        >
          Loading map...
        </div>
      ),
    }
  );

export default function MemoryLocationPicker({
  latitude,
  longitude,
  onChange,
  onClear,
}: MemoryLocationPickerProps) {
  const hasLocation =
    latitude !==
      null &&
    longitude !==
      null;

  return (
    <div
      className="
        overflow-hidden
        border-t
        border-ocean-100/80
        bg-white
      "
    >
      <MemoryLocationPickerMap
        latitude={
          latitude
        }
        longitude={
          longitude
        }
        onChange={
          onChange
        }
      />

      <div
        className="
          flex
          min-h-[48px]
          items-center
          justify-between
          gap-4
          border-t
          border-ocean-100/80
          bg-white
          px-4
          py-3
        "
      >
        <p
          className="
            truncate
            text-[10px]
            text-ink-soft
          "
        >
          {hasLocation
            ? `${latitude.toFixed(
                6
              )}, ${longitude.toFixed(
                6
              )}`
            : "Tap the map to place a pin"}
        </p>

        {hasLocation && (
          <button
            type="button"
            onClick={
              onClear
            }
            className="
              shrink-0
              text-xs
              font-semibold
              text-ocean-700
              transition
              hover:text-ocean-950
            "
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}