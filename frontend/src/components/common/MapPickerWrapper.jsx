import { lazy, Suspense } from 'react';

// Lazy load the MapPicker to prevent SSR/initial render issues with Leaflet
const LazyMapPicker = lazy(() => import('./MapPicker'));

/**
 * MapPickerWrapper - Safely loads the MapPicker component
 * This wrapper handles the lazy loading and provides a fallback
 */
function MapPickerWrapper(props) {
    return (
        <Suspense
            fallback={
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                            Venue Location
                        </label>
                    </div>
                    <p className="text-xs text-gray-500">
                        Click on the map to set your venue's exact location
                    </p>
                    <div
                        className="rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center"
                        style={{ height: '300px' }}
                    >
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                            <p className="text-gray-500 text-sm">Loading map...</p>
                        </div>
                    </div>
                </div>
            }
        >
            <LazyMapPicker {...props} />
        </Suspense>
    );
}

export default MapPickerWrapper;
