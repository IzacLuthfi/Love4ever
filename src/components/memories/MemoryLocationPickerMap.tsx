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
  latitude: number | null;
  longitude: number | null;

  onChange: (
    latitude: number,
    longitude: number
  ) => void;
};

const DEFAULT_CENTER:
  [number, number] = [
    -2.5489,
    118.0149,
  ];

const pickerIcon =
  L.divIcon({
    className:
      "love4ever-location-picker",

    html: `
      <div
        style="
          width:40px;
          height:40px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:15px 15px 15px 4px;
          transform:rotate(-45deg);
          background:linear-gradient(
            135deg,
            #0b4f71,
            #2ca6cf
          );
          border:3px solid white;
          box-shadow:
            0 9px 25px
            rgba(11,79,113,.30);
        "
      >
        <div
          style="
            transform:rotate(45deg);
            color:white;
            font-size:18px;
            line-height:1;
          "
        >
          ♥
        </div>
      </div>
    `,

    iconSize:
      [40, 40],

    iconAnchor:
      [20, 40],
  });

export default function MemoryLocationPickerMap({
  latitude,
  longitude,
  onChange,
}: MemoryLocationPickerMapProps) {
  const hasLocation =
    latitude !== null &&
    longitude !== null;

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
        h-[320px]
        w-full
        overflow-hidden
        bg-ocean-50
        sm:h-[360px]
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
 * CLICK HANDLER
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
 * MAP POSITION SYNC
 * =========================================================
 */

function MapPositionSync({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map =
    useMap();

  useEffect(() => {
    if (
      latitude === null ||
      longitude === null
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
        animate: true,
        duration: 0.8,
      }
    );
  }, [
    latitude,
    longitude,
    map,
  ]);

  return null;
}