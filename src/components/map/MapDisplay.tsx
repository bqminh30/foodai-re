'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Location } from '@/types';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const ZoomControl = dynamic(
  () => import('react-leaflet').then((mod) => mod.ZoomControl),
  { ssr: false }
);

const LeafletCSS = () => {
  useEffect(() => {
    const loadCSS = async () => {
      await import('leaflet/dist/leaflet.css');
      await import('leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css');
    };
    
    loadCSS();
  }, []);
  
  return null;
};

// Default location (Milestone No. 0 in Ha Giang if no location provided)
const DEFAULT_LOCATION = {
  latitude: 22.8274122,
  longitude: 104.9841144
};

interface MapDisplayProps {
  location: Location | null;
}

export function MapDisplay({ location }: MapDisplayProps) {
  const t = useTranslations('map');
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  
  useEffect(() => {
    setMapReady(true);
  }, []);
  
  const displayLocation = location || DEFAULT_LOCATION;
  const zoomLevel = location ? 12 : 5;
  const circleRadius = 2000;

  return (
    <div className="w-full h-64 rounded-md overflow-hidden border">
      <LeafletCSS />
      {location ? (
        <div ref={mapRef} className="w-full h-full relative" style={{ zIndex: 0 }}>
          {mapReady && (
            <MapContainer 
              center={[displayLocation.latitude, displayLocation.longitude]} 
              zoom={zoomLevel} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={true}
              fadeAnimation={true}
              markerZoomAnimation={true}
              worldCopyJump={true}
              minZoom={2}
              maxZoom={18}
              preferCanvas={true}
              key={`${displayLocation.latitude}-${displayLocation.longitude}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                tileSize={256}
                zoomOffset={0}
                updateWhenIdle={false}
                updateWhenZooming={true}
                keepBuffer={2}
              />
              <ZoomControl position="bottomright" />
              
              {/* Circle for approximate area */}
              {location && (
                <Circle 
                  center={[location.latitude, location.longitude]}
                  radius={circleRadius}
                  pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.3, color: '#2563eb', weight: 1 }}
                >
                  <Popup>
                    {t('approximate_location')}
                  </Popup>
                </Circle>
              )}
              
              {/* Marker pin for exact coordinates */}
              {location && (
                <Marker 
                  position={[location.latitude, location.longitude]}
                >
                  <Popup>
                    {t('exact_location')}
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">{t('no_location')}</p>
        </div>
      )}
    </div>
  );
}