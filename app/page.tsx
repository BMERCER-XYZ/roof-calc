'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { geocodeAddress, getBuildingFootprint, GeoLocation, BuildingData } from '@/lib/osm';
import { Search, MapPin, Home, AlertCircle, Edit3, Check, X } from 'lucide-react';
import * as turf from '@turf/turf';

// Dynamically import Map to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading Map...</div>,
});

export default function HomePage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [buildingData, setBuildingData] = useState<BuildingData | null>(null);
  
  // Manual Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [manualPolygon, setManualPolygon] = useState<[number, number][]>([]);
  const [manualArea, setManualArea] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError(null);
    setLocation(null);
    setBuildingData(null);
    setIsDrawing(false);
    setManualPolygon([]);
    setManualArea(null);

    try {
      // Step 1: Geocode
      const geoResult = await geocodeAddress(address);
      if (!geoResult) {
        setError('Address not found. Please try being more specific.');
        setLoading(false);
        return;
      }

      setLocation(geoResult);

      // Step 2: Get Footprint
      const footprint = await getBuildingFootprint(geoResult.lat, geoResult.lon);
      
      if (footprint) {
        setBuildingData(footprint);
      } else {
        // If no building tag found, suggest manual drawing
        setError('No building data found automatically. Please use the "Draw Roof" button to manually outline the roof on the satellite map.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePolygonUpdate = (coords: [number, number][]) => {
    setManualPolygon(coords);
    if (coords.length > 2) {
      // Calculate area
      // Convert [lat, lon] to [lon, lat] for Turf
      const turfCoords = coords.map(p => [p[1], p[0]]);
      // Close the loop
      turfCoords.push(turfCoords[0]);
      
      const polygon = turf.polygon([turfCoords]);
      const area = turf.area(polygon);
      setManualArea(Math.round(area * 100) / 100);
    } else {
      setManualArea(0);
    }
  };

  const toggleDrawing = () => {
    setIsDrawing(!isDrawing);
    if (!isDrawing) {
        setManualPolygon([]);
        setManualArea(null);
        setBuildingData(null); // Clear auto data if we start drawing
        setError(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl flex items-center justify-center gap-3">
            <Home className="h-12 w-12 text-blue-600" />
            Roof Area Estimator
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Enter an address to instantly estimate the roof surface area.
          </p>
        </div>

        {/* Search Input */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                placeholder="e.g. 10 Downing Street, London"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Notice</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Area */}
        {location && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
              
              {/* Map Column */}
              <div className="col-span-2 relative h-full bg-gray-100">
                <MapWithNoSSR 
                  lat={location.lat} 
                  lon={location.lon} 
                  polygon={buildingData?.polygon} 
                  isDrawing={isDrawing}
                  onPolygonComplete={handlePolygonUpdate}
                />
                
                {/* Map Controls Overlay */}
                <div className="absolute top-4 left-16 z-[400] bg-white rounded-md shadow-md">
                   <button
                     onClick={toggleDrawing}
                     className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${isDrawing ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                   >
                     {isDrawing ? (
                       <>
                         <X className="w-4 h-4 mr-2" />
                         Stop Drawing / Clear
                       </>
                     ) : (
                       <>
                         <Edit3 className="w-4 h-4 mr-2" />
                         {buildingData ? 'Edit / Redraw' : 'Draw Roof Manually'}
                       </>
                     )}
                   </button>
                </div>
                {isDrawing && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[400] bg-black bg-opacity-75 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg pointer-events-none">
                    Click map to add points to outline the roof
                  </div>
                )}
              </div>

              {/* Info Column */}
              <div className="col-span-1 p-6 flex flex-col justify-center space-y-6 border-l border-gray-100 bg-white">
                <div>
                  <h3 className="text-lg font-semibold text-gray-500 uppercase tracking-wide">Location</h3>
                  <p className="mt-1 text-gray-900 font-medium text-sm leading-relaxed">
                    {location.display_name}
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-500 uppercase tracking-wide">Estimated Roof Area</h3>
                  {manualArea !== null ? (
                    <div className="mt-2 animate-in fade-in slide-in-from-bottom-4">
                        <span className="text-5xl font-bold text-orange-600">{manualArea}</span>
                        <span className="text-xl text-gray-500 ml-2">m²</span>
                        <p className="mt-2 text-sm text-gray-400">
                           (Manually Drawn)
                        </p>
                    </div>
                  ) : buildingData ? (
                    <div className="mt-2">
                      <span className="text-5xl font-bold text-blue-600">{buildingData.areaSqMeters}</span>
                      <span className="text-xl text-gray-500 ml-2">m²</span>
                      <p className="mt-2 text-sm text-gray-400">
                        * Based on 2D footprint. Pitch factor not included.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <span className="text-gray-400 italic">
                        {isDrawing ? "Start clicking on the map..." : "No data available."}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mt-auto">
                   <p className="text-sm text-blue-800">
                     <strong>Tip:</strong> 
                     {isDrawing 
                       ? " Switch to 'Satellite' view (top right icon) to see the roof clearly." 
                       : " If the automatic result is wrong or missing, click 'Draw Roof Manually' to calculate it yourself."}
                   </p>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}