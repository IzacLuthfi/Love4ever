// src/components/memories/MemoryLocationPicker.tsx

"use client";

import dynamic from "next/dynamic";

import {
  MapPin,
  RotateCcw,
} from "lucide-react";

type MemoryLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;

  onChange: (
    latitude: number,
    longitude: number
  ) => void;

  onClear: () => void;
};

const MemoryLocationPickerMap =
  dynamic(
    () =>
      import(
        "@/components/memories/MemoryLocationPickerMap"
      ),
    {
      ssr: false,

      loading: () => (
        <div
          className="
            flex
            h-[320px]
            items-center
            justify-center
            rounded-[20px]
            bg-ocean-50
            text-sm
            font-semibold
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
    latitude !== null &&
    longitude !== null;

  return (
    <div
      className="
        overflow-hidden
        rounded-[22px]
        border
        border-ocean-100
        bg-white
      "
    >
      {/* HEADER */}

      <div
        className="
          flex
          flex-col
          gap-3
          border-b
          border-ocean-100
          px-4
          py-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-[13px]
              bg-ocean-100
              text-ocean-700
            "
          >
            <MapPin
              size={18}
            />
          </div>

          <div>
            <p
              className="
                text-sm
                font-bold
                text-ocean-950
              "
            >
              Choose Location
            </p>

            <p
              className="
                mt-0.5
                text-[11px]
                text-ink-soft
              "
            >
              Klik titik pada peta.
            </p>
          </div>
        </div>

        {hasLocation && (
          <button
            type="button"
            onClick={
              onClear
            }
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-[13px]
              border
              border-ocean-100
              bg-white
              px-3
              py-2
              text-xs
              font-semibold
              text-ink-soft
              transition
              hover:bg-ocean-50
              hover:text-ocean-700
            "
          >
            <RotateCcw
              size={14}
            />

            Clear Pin
          </button>
        )}
      </div>

      {/* MAP */}

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

      {/* COORDINATE */}

      <div
        className="
          grid
          gap-2
          border-t
          border-ocean-100
          bg-ocean-50/60
          p-3
          sm:grid-cols-2
        "
      >
        <CoordinateCard
          label="Latitude"
          value={
            latitude
          }
        />

        <CoordinateCard
          label="Longitude"
          value={
            longitude
          }
        />
      </div>
    </div>
  );
}

function CoordinateCard({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div
      className="
        rounded-[13px]
        bg-white
        px-3
        py-2.5
      "
    >
      <p
        className="
          text-[9px]
          font-bold
          uppercase
          tracking-[0.12em]
          text-ink-soft/60
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          truncate
          text-xs
          font-semibold
          text-ocean-800
        "
      >
        {value !== null
          ? value.toFixed(6)
          : "Not selected"}
      </p>
    </div>
  );
}