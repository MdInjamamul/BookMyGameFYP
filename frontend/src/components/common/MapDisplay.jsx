import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * MapDisplay Component - Read-only map for showing a venue location
 * @param {number} latitude - Venue latitude
 * @param {number} longitude - Venue longitude
 * @param {string} venueName - Name of the venue for marker popup
 * @param {string} className - Additional CSS classes
 */
function MapDisplay({ latitude, longitude, venueName, className = '' }) {
    const [isClient, setIsClient] = useState(false);

    // Fix Leaflet default marker icon issue
    useEffect(() => {
        setIsClient(true);

        const L = require('leaflet');
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    const handleOpenInMaps = () => {
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        window.open(url, '_blank');
    };

    // Don't render map if no coordinates
    if (!latitude || !longitude) {
        return (
            <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ height: '200px' }}>
                <div className="text-center text-gray-500">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm">No location set</p>
                </div>
            </div>
        );
    }

    // Show loading state on server
    if (!isClient) {
        return (
            <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ height: '200px' }}>
                <p className="text-gray-500">Loading map...</p>
            </div>
        );
    }

    const position = [latitude, longitude];

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '200px' }}>
                <MapContainer
                    center={position}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position} />
                </MapContainer>
            </div>
            <button
                onClick={handleOpenInMaps}
                className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Open in Google Maps</span>
            </button>
        </div>
    );
}

export default MapDisplay;
