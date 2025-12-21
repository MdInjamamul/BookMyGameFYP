import { useState, useRef } from 'react';

/**
 * ImageUploader Component
 * Drag-and-drop image uploader with preview
 * 
 * @param {function} onUpload - Callback when images are ready to upload
 * @param {Array} existingImages - Already uploaded images (for edit mode)
 * @param {function} onDeleteExisting - Callback to delete existing image
 * @param {number} maxFiles - Maximum number of files allowed (default: 10)
 */
function ImageUploader({ onUpload, existingImages = [], onDeleteExisting, maxFiles = 10 }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [primaryIndex, setPrimaryIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    };

    const handleFiles = (files) => {
        // Filter only images
        const imageFiles = files.filter(file =>
            ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
        );

        // Check max files limit
        const totalFiles = selectedFiles.length + imageFiles.length;
        if (totalFiles > maxFiles) {
            alert(`You can only upload up to ${maxFiles} images at a time`);
            return;
        }

        // Create preview URLs
        const newFiles = imageFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
        }));

        setSelectedFiles(prev => [...prev, ...newFiles]);
    };

    const handleRemoveFile = (index) => {
        setSelectedFiles(prev => {
            const newFiles = [...prev];
            URL.revokeObjectURL(newFiles[index].preview);
            newFiles.splice(index, 1);
            return newFiles;
        });

        // Adjust primary index if needed
        if (primaryIndex >= index && primaryIndex > 0) {
            setPrimaryIndex(prev => prev - 1);
        }
    };

    const handleSetPrimary = (index) => {
        setPrimaryIndex(index);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            alert('Please select at least one image');
            return;
        }

        setIsUploading(true);
        try {
            await onUpload(selectedFiles.map(f => f.file), primaryIndex);
            // Clear selection after successful upload
            selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
            setSelectedFiles([]);
            setPrimaryIndex(0);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Existing Images */}
            {existingImages.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {existingImages.map((image) => (
                            <div
                                key={image.id}
                                className={`relative rounded-lg overflow-hidden border-2 ${image.isPrimary ? 'border-primary-500' : 'border-gray-200'
                                    }`}
                            >
                                <img
                                    src={image.imageUrl.startsWith('http')
                                        ? image.imageUrl
                                        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${image.imageUrl}`}
                                    alt="Venue"
                                    className="w-full h-32 object-cover"
                                />
                                {image.isPrimary && (
                                    <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                                        Primary
                                    </span>
                                )}
                                {onDeleteExisting && (
                                    <button
                                        type="button"
                                        onClick={() => onDeleteExisting(image.id)}
                                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600 mb-1">
                    <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                    JPEG, PNG, or WebP (max 5MB each, up to {maxFiles} files)
                </p>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Selected Images ({selectedFiles.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedFiles.map((file, index) => (
                            <div
                                key={index}
                                className={`relative rounded-lg overflow-hidden border-2 ${primaryIndex === index ? 'border-primary-500' : 'border-gray-200'
                                    }`}
                            >
                                <img
                                    src={file.preview}
                                    alt={file.name}
                                    className="w-full h-32 object-cover"
                                />

                                {/* Primary badge */}
                                {primaryIndex === index && (
                                    <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                                        Primary
                                    </span>
                                )}

                                {/* Actions */}
                                <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetPrimary(index);
                                        }}
                                        className={`text-xs px-2 py-1 rounded ${primaryIndex === index
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-white/90 text-gray-700 hover:bg-white'
                                            }`}
                                    >
                                        {primaryIndex === index ? '★ Primary' : 'Set Primary'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveFile(index);
                                        }}
                                        className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Upload Button */}
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="mt-4 w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        {isUploading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span>Upload {selectedFiles.length} Image{selectedFiles.length > 1 ? 's' : ''}</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

export default ImageUploader;
