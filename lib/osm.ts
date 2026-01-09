import axios from 'axios';
import * as turf from '@turf/turf';

// Nominatim API for geocoding
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Overpass API for geometry
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export interface GeoLocation {
  lat: number;
  lon: number;
  display_name: string;
}

export interface BuildingData {
  polygon: [number, number][]; // Array of [lat, lon]
  areaSqMeters: number;
}

export async function geocodeAddress(address: string): Promise<GeoLocation | null> {
  try {
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: address,
        format: 'json',
        limit: 1,
      },
      headers: {
        'User-Agent': 'RoofEstimatorApp/1.0', // Required by OSM
      },
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name,
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

export async function getBuildingFootprint(lat: number, lon: number): Promise<BuildingData | null> {
  // Query to find buildings around the point (within 15 meters)
  const query = `
    [out:json];
    (
      way(around:15,${lat},${lon})["building"];
      relation(around:15,${lat},${lon})["building"];
    );
    (._;>;);
    out body;
  `;

  try {
    const response = await axios.get(OVERPASS_URL, {
      params: { data: query },
    });

    const elements = response.data.elements;
    if (!elements || elements.length === 0) return null;

    // Helper to find node by ID
    const getNode = (id: number) => elements.find((e: any) => e.type === 'node' && e.id === id);

    // Find the first way (simplest building polygon)
    // Relations are harder (multipolygons), skipping for MVP unless needed, focusing on simple 'way'
    const way = elements.find((e: any) => e.type === 'way' && e.tags && e.tags.building);

    if (!way) return null;

    // Map nodes to coordinates
    const polygonCoords: [number, number][] = way.nodes
      .map((nodeId: number) => {
        const node = getNode(nodeId);
        return node ? [node.lat, node.lon] : null;
      })
      .filter((n: any) => n !== null) as [number, number][];

    if (polygonCoords.length < 3) return null;

    // Calculate Area using Turf.js
    // Turf expects [lon, lat] (GeoJSON format), but Leaflet uses [lat, lon].
    // We convert for Turf, calculate, then return Leaflet format for display.
    const turfCoords = polygonCoords.map(p => [p[1], p[0]]); // [lon, lat]
    // Ensure loop is closed for Turf
    if (turfCoords[0][0] !== turfCoords[turfCoords.length - 1][0] || 
        turfCoords[0][1] !== turfCoords[turfCoords.length - 1][1]) {
      turfCoords.push(turfCoords[0]);
    }
    
    const polygon = turf.polygon([turfCoords]);
    const area = turf.area(polygon); // returns square meters

    return {
      polygon: polygonCoords, // [lat, lon] for Leaflet
      areaSqMeters: Math.round(area * 100) / 100,
    };

  } catch (error) {
    console.error('Error fetching building footprint:', error);
    return null;
  }
}
