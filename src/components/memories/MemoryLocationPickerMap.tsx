// src/components/memories/MemoryLocationPickerMap.tsx

"use client";

import {
  useEffect,
} from "react";

import L from "leaflet";

import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

type MemoryLocationPickerMapProps = {
  latitude:
    number | null;

  longitude:
    number | null;

  onChange: (
    latitude: number,
    longitude: number
  ) => void;
};

/*
 * =========================================================
 * DEFAULT
 * =========================================================
 */

const DEFAULT_CENTER:
  [number, number] = [
    -2.5489,
    118.0149,
  ];

/*
 * =========================================================
 * MARKER
 * =========================================================
 */

const pickerIcon =
  L.divIcon({
    className:
      "love4ever-location-picker",

    html: `
      <div
        style="
          width:34px;
          height:34px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:50%;
          background:#062a3f;
          border:3px solid white;
          box-shadow:
            0 8px 24px
            rgba(6,42,63,.28);
        "
      >
        <div
          style="
            width:8px;
            height:8px;
            border-radius:50%;
            background:white;
          "
        ></div>
      </div>
    `,

    iconSize:
      [34, 34],

    iconAnchor:
      [17, 17],
  });

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function MemoryLocationPickerMap({
  latitude,
  longitude,
  onChange,
}: MemoryLocationPickerMapProps) {
  const hasLocation =
    latitude !==
      null &&
    longitude !==
      null;

  const center:
    [number, number] =
    hasLocation
      ? [
          latitude,
          longitude,
        ]
      : DEFAULT_CENTER;

  return (
    <div
      className="
        h-[330px]
        w-full
        overflow-hidden
        bg-ocean-50
        sm:h-[370px]
      "
    >
      <MapContainer
        center={
          center
        }
        zoom={
          hasLocation
            ? 15
            : 5
        }
        scrollWheelZoom
        className="
          h-full
          w-full
        "
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          onChange={
            onChange
          }
        />

        <MapPositionSync
          latitude={
            latitude
          }
          longitude={
            longitude
          }
        />

        {hasLocation && (
          <Marker
            position={[
              latitude,
              longitude,
            ]}
            icon={
              pickerIcon
            }
          />
        )}
      </MapContainer>
    </div>
  );
}

/*
 * =========================================================
 * CLICK
 * =========================================================
 */

function MapClickHandler({
  onChange,
}: {
  onChange: (
    latitude: number,
    longitude: number
  ) => void;
}) {
  useMapEvents({
    click(event) {
      onChange(
        event.latlng.lat,
        event.latlng.lng
      );
    },
  });

  return null;
}

/*
 * =========================================================
 * POSITION
 * =========================================================
 */

function MapPositionSync({
  latitude,
  longitude,
}: {
  latitude:
    number | null;

  longitude:
    number | null;
}) {
  const map =
    useMap();

  useEffect(() => {
    if (
      latitude ===
        null ||
      longitude ===
        null
    ) {
      return;
    }

    map.flyTo(
      [
        latitude,
        longitude,
      ],
      15,
      {
        animate:
          true,

        duration:
          0.65,
      }
    );
  }, [
    latitude,
    longitude,
    map,
  ]);

  return null;
}