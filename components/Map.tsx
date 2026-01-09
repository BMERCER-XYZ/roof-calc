'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, LayersControl, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with Webpack/Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  lat: number;
  lon: number;
  polygon?: [number, number][]; // [lat, lon]
  isDrawing: boolean;
  onPolygonComplete: (coords: [number, number][]) => void;
}

function MapUpdater({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 19);
  }, [lat, lon, map]);
  return null;
}

function DrawingLayer({ isDrawing, onPolygonChange }: { isDrawing: boolean, onPolygonChange: (coords: [number, number][]) => void }) {
  const [points, setPoints] = useState<[number, number][]>([]);

  useMapEvents({
    click(e) {
      if (!isDrawing) return;
      const newPoints = [...points, [e.latlng.lat, e.latlng.lng] as [number, number]];
      setPoints(newPoints);
      onPolygonChange(newPoints);
    },
  });

  // Reset points if drawing mode is toggled off (optional, or kept for persistence)
  useEffect(() => {
    if (!isDrawing) {
      setPoints([]);
    }
  }, [isDrawing]);

  return (
    <>
      {points.map((pos, idx) => (
        <Marker key={idx} position={pos} opacity={0.8}>
        </Marker>
      ))}
      {points.length > 0 && (
        <Polygon positions={points} pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.5 }} />
      )}
      {points.length > 0 && isDrawing && (
         <div className="leaflet-bottom leaflet-right">
            <div className="leaflet-control leaflet-bar bg-white p-2 m-4 shadow-md rounded cursor-default">
              <span className="text-sm font-bold">Points: {points.length}</span>
            </div>
         </div>
      )}
    </>
  );
}

export default function MapComponent({ lat, lon, polygon, isDrawing, onPolygonComplete }: MapProps) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={18}
      maxZoom={22}
      scrollWheelZoom={true}
      className="h-full w-full rounded-lg shadow-lg z-0"
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Satellite (Google)">
          <TileLayer
            attribution='&copy; Google Maps'
            url="http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            maxZoom={22}
            maxNativeZoom={20}
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Street Map (OSM)">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={22}
            maxNativeZoom={19}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <MapUpdater lat={lat} lon={lon} />
      
      {!isDrawing && (
        <Marker position={[lat, lon]}>
          <Popup>Target Address</Popup>
        </Marker>
      )}

      {/* Auto-detected Polygon */}
      {polygon && !isDrawing && (
        <Polygon
          positions={polygon}
          pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.4 }}
        />
      )}

      {/* Manual Drawing Layer */}
      <DrawingLayer isDrawing={isDrawing} onPolygonChange={onPolygonComplete} />
      
    </MapContainer>
  );
}
