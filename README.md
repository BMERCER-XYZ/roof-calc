# Roof Area Estimator

A Next.js application that estimates the roof area of a property using OpenStreetMap data.

## Features

- **Address Search**: Instantly find properties using Nominatim geocoding.
- **Visual Map**: Interactive map (Leaflet) zooming into the specific property.
- **Roof Highlighting**: Automatically draws the building footprint if available in OSM.
- **Area Calculation**: Estimates the square meters of the footprint.

## How to Run

1.  Navigate to the project directory:
    ```bash
    cd roof-estimator
    ```

2.  Install dependencies (if not already done):
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Map**: React Leaflet (OpenStreetMap)
- **Data**: Nominatim API & Overpass API
- **Math**: Turf.js