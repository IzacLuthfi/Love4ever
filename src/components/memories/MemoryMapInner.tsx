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
 * CUSTOM MARKER
 * =========================================================
 */

const memoryIcon =
  L.divIcon({
    className:
      "love4ever-memory-marker",

    html: `
      <div
        style="
          width:38px;
          height:38px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:14px 14px 14px 4px;
          transform:rotate(-45deg);
          background:linear-gradient(
            135deg,
            #0b4f71,
            #2ca6cf
          );
          border:3px solid white;
          box-shadow:
            0 8px 22px
            rgba(11,79,113,.28);
        "
      >
        <div
          style="
            transform:rotate(45deg);
            color:white;
            font-size:17px;
            line-height:1;
          "
        >
          ♥
        </div>
      </div>
    `,

    iconSize:
      [38, 38],

    iconAnchor:
      [19, 38],

    popupAnchor:
      [0, -36],
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
        h-[420px]
        overflow-hidden
        rounded-[24px]
        border
        border-white/80
        bg-ocean-50
        shadow-sm
        sm:h-[470px]
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
                  280
                }
              >
                <div
                  style={{
                    minWidth:
                      210,
                  }}
                >
                  <p
                    style={{
                      margin:
                        0,

                      fontSize:
                        11,

                      fontWeight:
                        700,

                      letterSpacing:
                        "0.08em",

                      textTransform:
                        "uppercase",

                      color:
                        "#648196",
                    }}
                  >
                    {formatDate(
                      memory.memory_date
                    )}
                  </p>

                  <h3
                    style={{
                      margin:
                        "6px 0 0",

                      color:
                        "#062a3f",

                      fontSize:
                        18,

                      fontWeight:
                        700,
                    }}
                  >
                    {
                      memory.title
                    }
                  </h3>

                  {memory.location_name && (
                    <p
                      style={{
                        margin:
                          "7px 0 0",

                        color:
                          "#1688b5",

                        fontSize:
                          12,

                        fontWeight:
                          600,
                      }}
                    >
                      📍{" "}
                      {
                        memory.location_name
                      }
                    </p>
                  )}

                  {memory.story && (
                    <p
                      style={{
                        margin:
                          "9px 0 0",

                        color:
                          "#648196",

                        fontSize:
                          12,

                        lineHeight:
                          1.6,
                      }}
                    >
                      {truncate(
                        memory.story,
                        120
                      )}
                    </p>
                  )}

                  {memory.maps_url && (
                    <a
                      href={
                        memory.maps_url
                      }
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display:
                          "inline-block",

                        marginTop:
                          12,

                        color:
                          "#116b91",

                        fontSize:
                          12,

                        fontWeight:
                          700,

                        textDecoration:
                          "none",
                      }}
                    >
                      Open Maps ↗
                    </a>
                  )}
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
            rounded-[18px]
            border
            border-white/80
            bg-white/90
            px-5
            py-4
            text-center
            shadow-lg
            backdrop-blur-xl
          "
        >
          <p
            className="
              text-sm
              font-bold
              text-ocean-950
            "
          >
            Belum ada memory
            dengan pin lokasi
          </p>

          <p
            className="
              mt-1
              text-xs
              leading-5
              text-ink-soft
            "
          >
            Edit atau tambah
            memory lalu isi
            koordinat lokasinya.
          </p>
        </div>
      )}
    </div>
  );
}

/*
 * =========================================================
 * AUTO MAP POSITION
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
  )}...`;
}