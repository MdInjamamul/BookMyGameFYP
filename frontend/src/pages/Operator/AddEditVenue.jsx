import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import MapPicker from '../../components/common/MapPicker';
import ImageUploader from '../../components/common/ImageUploader';

function AddEditVenue() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditMode);
    const [errors, setErrors] = useState({});
    const [sports, setSports] = useState([]);
    const [stagedImages, setStagedImages] = useState([]); // For create mode: files to upload after venue creation
    const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        latitude: '',
        longitude: '',
        pricePerHour: '',
        contactPhone: '',
        contactEmail: '',
        amenities: [],
        selectedSport: '', // Single sport selection
        operatingHours: [
            { dayOfWeek: 0, isClosed: true, openingTime: '', closingTime: '' },
            { dayOfWeek: 1, isClosed: false, openingTime: '06:00', closingTime: '22:00' },
            { dayOfWeek: 2, isClosed: false, openingTime: '06:00', closingTime: '22:00' },
            { dayOfWeek: 3, isClosed: false, openingTime: '06:00', closingTime: '22:00' },
            { dayOfWeek: 4, isClosed: false, openingTime: '06:00', closingTime: '22:00' },
            { dayOfWeek: 5, isClosed: false, openingTime: '06:00', closingTime: '22:00' },
            { dayOfWeek: 6, isClosed: false, openingTime: '07:00', closingTime: '20:00' },
        ],
        images: [],
    });

    const amenitiesList = [
        'Parking', 'Changing Rooms', 'Showers', 'Cafeteria', 'First Aid',
        'Equipment Rental', 'WiFi', 'Floodlights', 'Seating Area', 'Lockers',
        'Water Dispenser', 'Air Conditioning', 'CCTV', 'Security'
    ];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchSports();
        if (isEditMode) {
            fetchVenue();
        }
    }, [id]);

    const fetchSports = async () => {
        try {
            const response = await api.get('/sports');
            if (response.data.success) {
                setSports(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching sports:', err);
        }
    };

    const fetchVenue = async () => {
        try {
            setIsFetching(true);
            const response = await api.get(`/venues/operator/my-venues/${id}`);
            if (response.data.success) {
                const venue = response.data.data;
                setFormData({
                    name: venue.name || '',
                    description: venue.description || '',
                    address: venue.address || '',
                    city: venue.city || '',
                    state: venue.state || '',
                    postalCode: venue.postalCode || '',
                    latitude: venue.latitude || '',
                    longitude: venue.longitude || '',
                    pricePerHour: venue.pricePerHour || '',
                    contactPhone: venue.contactPhone || '',
                    contactEmail: venue.contactEmail || '',
                    amenities: venue.amenities || [],
                    selectedSport: venue.sportId || '', // Single sport
                    operatingHours: venue.operatingHours?.length > 0
                        ? venue.operatingHours.map(h => ({
                            dayOfWeek: h.dayOfWeek,
                            isClosed: h.isClosed,
                            openingTime: h.openingTime ? new Date(h.openingTime).toTimeString().slice(0, 5) : '',
                            closingTime: h.closingTime ? new Date(h.closingTime).toTimeString().slice(0, 5) : '',
                        }))
                        : formData.operatingHours,
                    images: venue.images || [],
                });
            }
        } catch (err) {
            console.error('Error fetching venue:', err);
            alert('Failed to load venue details');
            navigate('/operator/venues');
        } finally {
            setIsFetching(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleAmenityToggle = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleSportChange = (e) => {
        setFormData(prev => ({
            ...prev,
            selectedSport: e.target.value
        }));
    };

    const handleOperatingHourChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            operatingHours: prev.operatingHours.map((hour, i) =>
                i === index ? { ...hour, [field]: value } : hour
            )
        }));
    };

    const validateStep = (stepNum) => {
        const newErrors = {};

        if (stepNum === 1) {
            if (!formData.name.trim()) newErrors.name = 'Venue name is required';
            if (!formData.pricePerHour) newErrors.pricePerHour = 'Price per hour is required';
        }

        if (stepNum === 2) {
            if (!formData.address.trim()) newErrors.address = 'Address is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, 5));
        }
    };

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // STRICT CHECK: Only allow submission on Step 5 (final step)
        // This prevents any accidental form submission during step transitions
        if (step !== 5) {
            console.log('Prevented premature submission on step:', step);
            return;
        }

        if (!validateStep(step)) return;

        try {
            setIsLoading(true);
            const payload = {
                name: formData.name,
                description: formData.description,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                postalCode: formData.postalCode,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                pricePerHour: parseFloat(formData.pricePerHour),
                contactPhone: formData.contactPhone,
                contactEmail: formData.contactEmail,
                amenities: formData.amenities,
                sportId: formData.selectedSport, // Single sport
                operatingHours: formData.operatingHours.filter(h => !h.isClosed || h.dayOfWeek === 0),
            };

            if (isEditMode) {
                await api.put(`/venues/operator/my-venues/${id}`, payload);
                // Update operating hours separately
                await api.put(`/venues/operator/my-venues/${id}/hours`, {
                    operatingHours: formData.operatingHours,
                });
                alert('Venue updated successfully!');
            } else {
                // Create the venue first
                const response = await api.post('/venues/operator/my-venues', payload);
                const newVenueId = response.data.data.id;

                // Upload staged images if any
                if (stagedImages.length > 0) {
                    const formDataUpload = new FormData();
                    stagedImages.forEach(file => {
                        formDataUpload.append('images', file);
                    });
                    formDataUpload.append('primaryIndex', String(primaryImageIndex));

                    try {
                        await api.post(
                            `/venues/operator/my-venues/${newVenueId}/images`,
                            formDataUpload
                        );
                        console.log('Images uploaded successfully');
                    } catch (imgErr) {
                        console.error('Image upload failed:', imgErr.response?.data || imgErr.message);
                        alert('Venue created but image upload failed. You can add images later.');
                    }
                }

                alert('Venue created successfully! It will be reviewed by admin.');
            }

            navigate('/operator/venues');
        } catch (err) {
            console.error('Error saving venue:', err);
            alert(err.response?.data?.message || 'Failed to save venue');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Venue' : 'Add New Venue'}
                </h1>
                <p className="text-gray-600 mt-1">
                    {isEditMode ? 'Update your venue details' : 'Create a new sports venue listing'}
                </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {['Basic Info', 'Location', 'Schedule', 'Amenities', 'Images'].map((label, index) => (
                        <div key={index} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${step > index + 1
                                    ? 'bg-green-500 text-white'
                                    : step === index + 1
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}
                            >
                                {step > index + 1 ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <span className={`ml-2 hidden sm:block text-sm ${step === index + 1 ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                                {label}
                            </span>
                            {index < 4 && (
                                <div className={`w-12 lg:w-16 h-1 mx-1 ${step > index + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                onKeyDown={(e) => {
                    // Prevent Enter key from submitting form on ANY step except the final one
                    if (e.key === 'Enter' && step !== 5) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
                className="bg-white rounded-xl shadow-sm p-6 lg:p-8"
            >
                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Venue Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="e.g., Prime Sports Arena"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Describe your venue, facilities, and what makes it special..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price per Hour (Rs.) *
                                </label>
                                <input
                                    type="number"
                                    name="pricePerHour"
                                    value={formData.pricePerHour}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.pricePerHour ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="1500"
                                    min="0"
                                />
                                {errors.pricePerHour && <p className="mt-1 text-sm text-red-500">{errors.pricePerHour}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sport Type *
                                </label>
                                <select
                                    name="selectedSport"
                                    value={formData.selectedSport}
                                    onChange={handleSportChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.selectedSport ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Select a sport</option>
                                    {sports.map((sport) => (
                                        <option key={sport.id} value={sport.id}>
                                            {sport.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.selectedSport && <p className="mt-1 text-sm text-red-500">{errors.selectedSport}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Location */}
                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Street Address *
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="Street address"
                            />
                            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Kathmandu"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Bagmati"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                                <input
                                    type="text"
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="44600"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                                <input
                                    type="tel"
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="9841234567"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                                <input
                                    type="email"
                                    name="contactEmail"
                                    value={formData.contactEmail}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="contact@venue.com"
                                />
                            </div>
                        </div>

                        {/* Map Picker for Location */}
                        <MapPicker
                            latitude={formData.latitude ? parseFloat(formData.latitude) : null}
                            longitude={formData.longitude ? parseFloat(formData.longitude) : null}
                            onChange={(lat, lng) => {
                                setFormData(prev => ({
                                    ...prev,
                                    latitude: lat || '',
                                    longitude: lng || ''
                                }));
                            }}
                        />
                    </div>
                )}

                {/* Step 3: Schedule */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h2>
                        <p className="text-sm text-gray-500 mb-4">Set your venue's operating hours for each day of the week.</p>

                        <div className="space-y-4">
                            {formData.operatingHours.map((hour, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="w-28 font-medium text-gray-700">
                                        {dayNames[hour.dayOfWeek]}
                                    </div>

                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hour.isClosed}
                                            onChange={(e) => handleOperatingHourChange(index, 'isClosed', e.target.checked)}
                                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-600">Closed</span>
                                    </label>

                                    {!hour.isClosed && (
                                        <>
                                            <input
                                                type="time"
                                                value={hour.openingTime}
                                                onChange={(e) => handleOperatingHourChange(index, 'openingTime', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                            <span className="text-gray-500">to</span>
                                            <input
                                                type="time"
                                                value={hour.closingTime}
                                                onChange={(e) => handleOperatingHourChange(index, 'closingTime', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 4: Amenities */}
                {step === 4 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities & Features</h2>
                        <p className="text-sm text-gray-500 mb-4">Select all amenities available at your venue.</p>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {amenitiesList.map((amenity) => (
                                <button
                                    key={amenity}
                                    type="button"
                                    onClick={() => handleAmenityToggle(amenity)}
                                    className={`p-3 rounded-lg text-sm font-medium transition-all ${formData.amenities.includes(amenity)
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {amenity}
                                </button>
                            ))}
                        </div>

                        {formData.amenities.length > 0 && (
                            <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                                <p className="text-sm font-medium text-primary-800">Selected Amenities:</p>
                                <p className="text-sm text-primary-600 mt-1">{formData.amenities.join(', ')}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 5: Images */}
                {step === 5 && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Venue Images</h2>
                            <p className="text-sm text-gray-500">
                                Upload photos to showcase your venue. High-quality images help attract more bookings.
                            </p>
                        </div>

                        {!isEditMode && (
                            <div className="bg-gray-50 rounded-xl p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Venue Images</h3>
                                        <p className="text-sm text-gray-500">Add photos to showcase your venue (optional)</p>
                                    </div>
                                </div>

                                {/* File Input */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files);
                                            setStagedImages(prev => [...prev, ...files]);
                                        }}
                                        className="hidden"
                                        id="staged-image-input"
                                    />
                                    <label htmlFor="staged-image-input" className="cursor-pointer">
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-gray-600 font-medium">Click to select images</p>
                                        <p className="text-sm text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB each</p>
                                    </label>
                                </div>

                                {/* Preview Staged Images */}
                                {stagedImages.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Selected Images ({stagedImages.length}) - Click to set as primary
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {stagedImages.map((file, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => setPrimaryImageIndex(index)}
                                                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${primaryImageIndex === index ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'}`}
                                                >
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {primaryImageIndex === index && (
                                                        <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                                                            Primary
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setStagedImages(prev => prev.filter((_, i) => i !== index));
                                                            if (primaryImageIndex >= stagedImages.length - 1) {
                                                                setPrimaryImageIndex(Math.max(0, stagedImages.length - 2));
                                                            }
                                                        }}
                                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {isEditMode && (
                            <>
                                {/* General Venue Images */}
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">General Venue Images</h3>
                                            <p className="text-sm text-gray-500">Main photos showing your venue (entrance, facilities, etc.)</p>
                                        </div>
                                    </div>
                                    <ImageUploader
                                        existingImages={formData.images || []}
                                        onUpload={async (files, primaryIndex) => {
                                            const formDataUpload = new FormData();
                                            files.forEach(file => {
                                                formDataUpload.append('images', file);
                                            });
                                            formDataUpload.append('primaryIndex', primaryIndex);

                                            try {
                                                const response = await api.post(
                                                    `/venues/operator/my-venues/${id}/images`,
                                                    formDataUpload,
                                                    { headers: { 'Content-Type': 'multipart/form-data' } }
                                                );
                                                alert(response.data.message);
                                                // Refresh venue data
                                                const venueResp = await api.get(`/venues/operator/my-venues/${id}`);
                                                if (venueResp.data.success) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        images: venueResp.data.data.images || []
                                                    }));
                                                }
                                            } catch (err) {
                                                console.error('Image upload error:', err);
                                                alert(err.response?.data?.message || 'Failed to upload images');
                                                throw err;
                                            }
                                        }}
                                        onDeleteExisting={async (imageId) => {
                                            if (!window.confirm('Delete this image?')) return;
                                            try {
                                                await api.delete(`/venues/operator/my-venues/${id}/images/${imageId}`);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    images: prev.images.filter(img => img.id !== imageId)
                                                }));
                                            } catch (err) {
                                                alert(err.response?.data?.message || 'Failed to delete image');
                                            }
                                        }}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            step === 1 ? navigate('/operator/venues') : handleBack();
                        }}
                        className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {step !== 5 ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleNext();
                            }}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>{isEditMode ? 'Update Venue' : 'Create Venue'}</span>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default AddEditVenue;
