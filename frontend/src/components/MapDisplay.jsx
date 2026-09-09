import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function decodeGeoJSON(geojson) {
  if (!geojson) return null;
  if (geojson.type === "FeatureCollection" && Array.isArray(geojson.features) && geojson.features.length) {
    return geojson;
  }
  return { type: "Feature", properties: {}, geometry: geojson };
}

export default function MapDisplay({ geoJSON, height = 260 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { attributionControl: false }).setView([40.4168, -3.7038], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    mapRef.current = map;

    const feature = decodeGeoJSON(geoJSON);
    if (feature) {
      const layer = L.geoJSON(feature, {
        style: { color: "#b91c1c", weight: 2, fillColor: "#b91c1c", fillOpacity: 0.15 },
      }).addTo(map);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [28, 28] });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geoJSON]);

  return <div ref={containerRef} style={{ width: "100%", height, borderRadius: 8 }} aria-hidden="true" />;
}