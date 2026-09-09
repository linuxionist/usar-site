import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

const DEFAULT_CENTER = [40.4168, -3.7038];
const DEFAULT_ZOOM = 6;

function decodeGeoJSON(geojson) {
  if (!geojson) return null;
  if (geojson.type === "FeatureCollection" && Array.isArray(geojson.features) && geojson.features.length) {
    return geojson;
  }
  return { type: "Feature", properties: {}, geometry: geojson };
}

function addGeoJSONToLayerGroup(geojson, layerGroup) {
  const featureCollection = decodeGeoJSON(geojson);
  if (!featureCollection) return false;
  L.geoJSON(featureCollection).eachLayer((layer) => layerGroup.addLayer(layer));
  return true;
}

export default function MapDrawField({ value, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const valueOnMountRef = useRef(value ?? null);
  const appliedRef = useRef("__none__");

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Create the map once and draw the value that was present at mount time.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    mapRef.current = map;

    const layerGroup = L.featureGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: true,
        polyline: false,
        rectangle: true,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: { featureGroup: layerGroup },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e) => {
      layerGroup.clearLayers();
      layerGroup.addLayer(e.layer);
      onChangeRef.current(layerGroup.toGeoJSON());
    });
    map.on(L.Draw.Event.EDITED, () => {
      onChangeRef.current(layerGroup.toGeoJSON());
    });
    map.on(L.Draw.Event.DELETED, () => {
      onChangeRef.current(null);
    });

    const stored = valueOnMountRef.current;
    if (stored) {
      addGeoJSONToLayerGroup(stored, layerGroup);
      const bounds = layerGroup.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
    }
    appliedRef.current = JSON.stringify(stored);

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Redraw when the parent-provided value changes later (user draws/edits).
  useEffect(() => {
    if (!layerGroupRef.current) return;
    const next = value ?? null;
    const key = JSON.stringify(next);
    if (key === appliedRef.current) return;
    appliedRef.current = key;
    layerGroupRef.current.clearLayers();
    if (next) {
      addGeoJSONToLayerGroup(next, layerGroupRef.current);
      const bounds = layerGroupRef.current.getBounds();
      if (bounds.isValid()) mapRef.current.fitBounds(bounds, { padding: [24, 24] });
    } else {
      mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }, [value]);

  return (
    <div style={{ width: "100%" }}>
      <div ref={containerRef} style={{ height: 340, borderRadius: 8, border: "1px solid var(--border, #334155)" }} />
      {value && (
        <p className="form-help" style={{ marginTop: 6 }}>
          Area saved. Use the toolbar to draw or edit the polygon/rectangle.
        </p>
      )}
    </div>
  );
}