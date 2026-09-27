// src/components/memories/MemoryMapInner.tsx

"use client";

import {
  useEffect,
  useMemo,
} from "react";

import L from "leaflet";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import type {
  MemoryMapPoint,
} from "@/components/memories/MemoryMap";

/*
 * =========================================================
 * MARKER
 * =========================================================
 */

const memoryIcon =
  L.divIcon({
    className:
      "love4ever-memory-marker",

    html: `
      <div
        style="
          width:32px;
          height:32px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:50%;
          background:#062a3f;
          border:3px solid white;
          box-shadow:
            0 7px 22px
            rgba(6,42,63,.25);
        "
      >
        <div
          style="
            width:7px;
            height:7px;
            border-radius:50%;
            background:white;
          "
        ></div>
      </div>
    `,

    iconSize:
      [32, 32],

    iconAnchor:
      [16, 16],

    popupAnchor:
      [0, -17],
  });

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function MemoryMapInner({
  memories,
}: {
  memories:
    MemoryMapPoint[];
}) {
  const mappedMemories =
    useMemo(
      () =>
        memories.filter(
          (
            memory
          ): memory is MemoryMapPoint & {
            latitude: number;
            longitude: number;
          } =>
            typeof memory.latitude ===
              "number" &&
            typeof memory.longitude ===
              "number"
        ),
      [memories]
    );

  return (
    <div
      className="
        relative
        z-0
        h-[430px]
        overflow-hidden
        border-t
        border-ocean-100/70
        bg-ocean-50
        sm:h-[480px]
      "
    >
      <MapContainer
        center={[
          -2.5,
          118,
        ]}
        zoom={4}
        scrollWheelZoom={
          false
        }
        className="
          h-full
          w-full
        "
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMapToMemories
          memories={
            mappedMemories
          }
        />

        {mappedMemories.map(
          (memory) => (
            <Marker
              key={
                memory.id
              }
              position={[
                memory.latitude,
                memory.longitude,
              ]}
              icon={
                memoryIcon
              }
            >
              <Popup
                maxWidth={
                  290
                }
              >
                <div
                  className="
                    min-w-[210px]
                    py-1
                  "
                >
                  <p
                    className="
                      text-[10px]
                      text-ink-soft
                    "
                  >
                    {formatDate(
                      memory.memory_date
                    )}
                  </p>

                  <h3
                    className="
                      mt-1
                      font-display
                      text-lg
                      font-semibold
                      text-ocean-950
                    "
                  >
                    {
                      memory.title
                    }
                  </h3>

                  {memory.location_name && (
                    <p
                      className="
                        mt-2
                        text-xs
                        font-medium
                        text-ocean-700
                      "
                    >
                      {
                        memory.location_name
                      }
                    </p>
                  )}

                  {memory.story && (
                    <p
                      className="
                        mt-2
                        text-xs
                        leading-5
                        text-ink-soft
                      "
                    >
                      {truncate(
                        memory.story,
                        105
                      )}
                    </p>
                  )}

                  <div
                    className="
                      mt-3
                      flex
                      items-center
                      gap-4
                    "
                  >
                    <a
                      href={`/memories/${memory.id}`}
                      className="
                        text-xs
                        font-semibold
                        text-ocean-800
                      "
                    >
                      Open
                    </a>

                    {memory.maps_url && (
                      <a
                        href={
                          memory.maps_url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="
                          text-xs
                          font-medium
                          text-ocean-600
                        "
                      >
                        Maps ↗
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        )}
      </MapContainer>

      {mappedMemories.length ===
        0 && (
        <div
          className="
            pointer-events-none
            absolute
            inset-x-4
            bottom-4
            z-[500]
            mx-auto
            max-w-sm
            rounded-[16px]
            border
            border-white/70
            bg-white/90
            px-4
            py-3
            text-center
            shadow-[0_12px_35px_rgba(8,59,89,0.10)]
            backdrop-blur-xl
          "
        >
          <p
            className="
              text-xs
              font-medium
              text-ocean-950
            "
          >
            No pinned memories.
          </p>
        </div>
      )}
    </div>
  );
}

/*
 * =========================================================
 * FIT
 * =========================================================
 */

function FitMapToMemories({
  memories,
}: {
  memories:
    Array<
      MemoryMapPoint & {
        latitude: number;
        longitude: number;
      }
    >;
}) {
  const map =
    useMap();

  useEffect(() => {
    if (
      memories.length ===
      0
    ) {
      return;
    }

    if (
      memories.length ===
      1
    ) {
      map.setView(
        [
          memories[0]
            .latitude,

          memories[0]
            .longitude,
        ],
        14,
        {
          animate:
            true,
        }
      );

      return;
    }

    const bounds =
      L.latLngBounds(
        memories.map(
          (memory) => [
            memory.latitude,
            memory.longitude,
          ]
        )
      );

    map.fitBounds(
      bounds,
      {
        padding:
          [45, 45],

        maxZoom:
          14,

        animate:
          true,
      }
    );
  }, [
    map,
    memories,
  ]);

  return null;
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    new Date(
      `${value}T00:00:00`
    )
  );
}

function truncate(
  value: string,
  limit: number
) {
  if (
    value.length <=
    limit
  ) {
    return value;
  }

  return `${value.slice(
    0,
    limit
  )}…`;
}