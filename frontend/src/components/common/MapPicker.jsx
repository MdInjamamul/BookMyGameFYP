import { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

/**
 * MapPicker Component - Click on map to set location
 * Uses dynamic imports to prevent Leaflet SSR issues
 */
function MapPicker({ latitude, longitude, onChange, className = '' }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [leafletModules, setLeafletModules] = useState(null);
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    // Default to Kathmandu, Nepal if no coordinates provided
    const defaultCenter = [27.7172, 85.3240];
    const position = latitude && longitude ? [latitude, longitude] : null;
    const center = position || defaultCenter;

    // Dynamically load Leaflet
    useEffect(() => {
        const loadLeaflet = async () => {
            try {
                const L = await import('leaflet');

                // Fix marker icons
                delete L.default.Icon.Default.prototype._getIconUrl;
                L.default.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                });

                setLeafletModules(L.default);
                setIsLoaded(true);
            } catch (error) {
                console.error('Failed to load Leaflet:', error);
            }
        };

        loadLeaflet();

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Initialize map after Leaflet is loaded
    useEffect(() => {
        if (!isLoaded || !leafletModules || !mapContainerRef.current) return;
        if (mapInstanceRef.current) return; // Already initialized

        const L = leafletModules;

        // Create map
        const map = L.map(mapContainerRef.current).setView(center, position ? 15 : 12);
        mapInstanceRef.current = map;

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add click handler
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;

            // Update or create marker
            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                markerRef.current = L.marker([lat, lng]).addTo(map);
            }

            // Callback
            if (onChange) {
                onChange(lat, lng);
            }
        });

        // Add initial marker if position exists
        if (position) {
            markerRef.current = L.marker(position).addTo(map);
        }

    }, [isLoaded, leafletModules]);

    // Update marker when position changes externally
    useEffect(() => {
        if (!mapInstanceRef.current || !leafletModules) return;

        const L = leafletModules;

        if (position) {
            if (markerRef.current) {
                markerRef.current.setLatLng(position);
            } else {
                markerRef.current = L.marker(position).addTo(mapInstanceRef.current);
            }
            mapInstanceRef.current.setView(position, 15);
        } else if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }
    }, [latitude, longitude, leafletModules]);

    const handleUseMyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude: lat, longitude: lng } = pos.coords;
                    if (onChange) {
                        onChange(lat, lng);
                    }
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView([lat, lng], 15);
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    alert('Unable to get your location. Please click on the map to set your venue location.');
                },
                { enableHighAccuracy: true }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    };

    const handleClear = () => {
        if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }
        if (onChange) {
            onChange(null, null);
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Venue Location
                </label>
                <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Use My Location</span>
                </button>
            </div>

            <p className="text-xs text-gray-500 -mt-1">
                Click on the map to set your venue's exact location
            </p>

            <div
                ref={mapContainerRef}
                className="rounded-lg overflow-hidden border border-gray-300"
                style={{ height: '300px', backgroundColor: '#f3f4f6' }}
            >
                {!isLoaded && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                            <p className="text-gray-500 text-sm">Loading map...</p>
                        </div>
                    </div>
                )}
            </div>

            {position && (
                <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                    <span>
                        📍 Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
                    </span>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-red-500 hover:text-red-700"
                    >
                        Clear
                    </button>
                </div>
            )}
        </div>
    );
}

export default MapPicker;
