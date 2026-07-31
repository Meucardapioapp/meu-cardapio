"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
};

function ClickMap({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export default function MapaLocalizacao({
  latitude,
  longitude,
  onChange,
}: Props) {
  const posicao: LatLngExpression =
    latitude && longitude
      ? [latitude, longitude]
      : [-14.235004, -51.92528];

  return (
    <MapContainer
      center={posicao}
      zoom={5}
      style={{
        height: "450px",
        width: "100%",
        borderRadius: "20px",
      }}
    >
      <TileLayer
        attribution="OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickMap onChange={onChange} />

      {latitude && longitude && (
        <Marker position={[latitude, longitude]} />
      )}
    </MapContainer>
  );
}