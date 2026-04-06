import { useState, useEffect, useRef } from 'react';
import trainingService from '../../services/trainingService';
import sportService from '../../services/sportService';
import toast from 'react-hot-toast';

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];

const DIFFICULTY_COLORS = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
};

function formatDuration(s) {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function isLocalVideo(url) {
    return url && url.startsWith('/uploads/videos/');
}

function isLocalThumbnail(url) {
    return url && (url.startsWith('/uploads/thumbnails/') || url.startsWith('/uploads/training/'));
}

function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
}

// ============================================
// VIDEO FORM MODAL
// ============================================
function VideoForm({ video, sports, onSave, onCancel }) {
    const isEdit = Boolean(video?.id);
    const [form, setForm] = useState({
        title: video?.title || '',
        description: video?.description || '',
        videoUrl: video?.videoUrl || '',
        thumbnailUrl: video?.thumbnailUrl || '',
        sportId: video?.sportId || '',
        difficultyLevel: video?.difficultyLevel || '',
        duration: video?.duration || '',
    });
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(video?.thumbnailUrl || null);
    const [uploadMode, setUploadMode] = useState(
        isEdit && isLocalVideo(video?.videoUrl) ? 'file' : 'url'
    );
    const [thumbMode, setThumbMode] = useState(
        isEdit && isLocalThumbnail(video?.thumbnailUrl) ? 'file' : 'url'
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);
    const thumbInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFile(file);
            // Auto-fill duration from file if possible
            const videoEl = document.createElement('video');
            videoEl.preload = 'metadata';
            videoEl.onloadedmetadata = () => {
                window.URL.revokeObjectURL(videoEl.src);
                if (!form.duration) {
                    setForm(prev => ({ ...prev, duration: Math.round(videoEl.duration) }));
                }
            };
            videoEl.src = URL.createObjectURL(file);
        }
    };

    const handleThumbChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveThumbnail = () => {
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setForm(prev => ({ ...prev, thumbnailUrl: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) {
            setError('Title is required.');
            return;
        }
        if (uploadMode === 'url' && !form.videoUrl.trim()) {
            setError('Please enter a video URL.');
            return;
        }
        if (uploadMode === 'file' && !videoFile && !isEdit) {
            setError('Please select a video file to upload.');
            return;
        }

        setSaving(true);
        setError('');
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('title', form.title.trim());
            if (form.description) formData.append('description', form.description);
            if (form.sportId) formData.append('sportId', form.sportId);
            if (form.difficultyLevel) formData.append('difficultyLevel', form.difficultyLevel);
            if (form.duration) formData.append('duration', form.duration);

            // Thumbnail Handling
            if (thumbMode === 'file' && thumbnailFile) {
                formData.append('thumbnail', thumbnailFile);
            } else if (thumbMode === 'url') {
                formData.append('thumbnailUrl', form.thumbnailUrl || '');
            } else if (thumbMode === 'file' && !thumbnailFile && !thumbnailPreview) {
                // If explicitly cleared
                formData.append('thumbnailUrl', '');
            }

            if (uploadMode === 'file' && videoFile) {
                formData.append('video', videoFile);
            } else {
                formData.append('videoUrl', form.videoUrl);
            }

            const config = {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(pct);
                },
            };

            if (isEdit) {
                await trainingService.operatorUpdateVideo(video.id, formData, config);
            } else {
                await trainingService.operatorCreateVideo(formData, config);
            }

            toast.success(isEdit ? 'Video updated!' : 'Video uploaded successfully!');
            onSave();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save video');
        } finally {
            setSaving(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isEdit ? 'Edit Training Video' : 'Upload Training Video'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {isEdit ? 'Update video details' : 'Share your training knowledge'}
                        </p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="e.g. Advanced Dribbling Techniques for Football"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm transition-shadow"
                            required
                        />
                    </div>

                    {/* Video source toggle */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Video Source *</label>
                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setUploadMode('file')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${uploadMode === 'file'
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Upload File
                            </button>
                            <button
                                type="button"
                                onClick={() => setUploadMode('url')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${uploadMode === 'url'
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                Video URL
                            </button>
                        </div>

                        {uploadMode === 'file' ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {videoFile ? (
                                    <div>
                                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                                            </svg>
                                        </div>
                                        <p className="font-medium text-gray-900 text-sm">{videoFile.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                                        </p>
                                        <p className="text-xs text-primary-600 mt-2">Click to change</p>
                                    </div>
                                ) : isEdit && isLocalVideo(video?.videoUrl) ? (
                                    <div>
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-600 font-medium">Current video file uploaded</p>
                                        <p className="text-xs text-gray-500 mt-1">Click to replace with a new file</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <p className="font-medium text-gray-700 text-sm">Click to select video file</p>
                                        <p className="text-xs text-gray-500 mt-1">MP4, WebM, OGG, MOV — Max 500MB</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <input
                                type="url"
                                name="videoUrl"
                                value={form.videoUrl}
                                onChange={handleChange}
                                placeholder="https://www.youtube.com/watch?v=... or direct .mp4 link"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            />
                        )}

                        {/* Upload progress */}
                        {saving && uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-600 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Thumbnail */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thumbnail (Photo or URL)</label>
                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setThumbMode('file')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${thumbMode === 'file'
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Upload Photo
                            </button>
                            <button
                                type="button"
                                onClick={() => setThumbMode('url')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${thumbMode === 'url'
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                Thumbnail URL
                            </button>
                        </div>

                        {thumbMode === 'file' ? (
                            <div className="space-y-3">
                                <div
                                    onClick={() => thumbInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all overflow-hidden"
                                >
                                    <input
                                        ref={thumbInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleThumbChange}
                                        className="hidden"
                                    />
                                    {thumbnailPreview ? (
                                        <div className="relative group mx-auto w-32 h-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                            <img
                                                src={thumbnailPreview}
                                                alt="Thumbnail preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <p className="text-[10px] text-white font-medium">Change Photo</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <p className="font-medium text-gray-700 text-xs">Click to select thumbnail photo</p>
                                            <p className="text-[10px] text-gray-500 mt-1">JPEG, PNG, WebP — Max 5MB</p>
                                        </div>
                                    )}
                                </div>
                                {(thumbnailFile || thumbnailPreview) && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveThumbnail}
                                        className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 mx-auto"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Remove Photo
                                    </button>
                                )}
                            </div>
                        ) : (
                            <input
                                type="url"
                                name="thumbnailUrl"
                                value={form.thumbnailUrl}
                                onChange={handleChange}
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            />
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Description <span className="font-normal text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Briefly describe what this video covers..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm resize-none"
                        />
                    </div>

                    {/* Sport & Difficulty */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Sport <span className="font-normal text-gray-400">(optional)</span>
                            </label>
                            <select
                                name="sportId"
                                value={form.sportId}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            >
                                <option value="">General / All Sports</option>
                                {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Difficulty <span className="font-normal text-gray-400">(optional)</span>
                            </label>
                            <select
                                name="difficultyLevel"
                                value={form.difficultyLevel}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            >
                                <option value="">Not specified</option>
                                {DIFFICULTY_LEVELS.map(d => (
                                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Duration (seconds) <span className="font-normal text-gray-400">(auto-filled for file uploads)</span>
                        </label>
                        <input
                            type="number"
                            name="duration"
                            value={form.duration}
                            onChange={handleChange}
                            placeholder="e.g. 360 for 6 minutes"
                            min="0"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    {uploadProgress > 0 && uploadProgress < 100 ? `${uploadProgress}%` : 'Saving...'}
                                </>
                            ) : (
                                isEdit ? 'Save Changes' : 'Upload Video'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================
// REQUEST ACCESS STATES
// ============================================
function RequestAccessBanner({ status, onRequest, requesting }) {
    if (status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-5">
                    <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Pending</h2>
                <p className="text-gray-500 max-w-md">
                    Your request to upload training videos is being reviewed by our admin team.
                    You'll receive a notification once it's approved.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-full px-5 py-2 text-sm font-medium">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Awaiting Admin Approval
                </div>
            </div>
        );
    }

    if (status === 'rejected') {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-5">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Rejected</h2>
                <p className="text-gray-500 max-w-md mb-6">
                    Your previous request to upload training videos was rejected.
                    You may submit a new request — our team will review it again.
                </p>
                <button
                    onClick={onRequest}
                    disabled={requesting}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold transition-colors disabled:opacity-60"
                >
                    {requesting ? 'Submitting...' : 'Request Access Again'}
                </button>
            </div>
        );
    }

    // status === 'none' (default)
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Training Videos</h2>
            <p className="text-gray-500 max-w-md mb-6">
                Share your Sports expertise with the BookMyGame community!
                Request access to upload training videos and help users improve their skills.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 max-w-sm text-left mb-6 text-sm text-gray-600 space-y-3">
                <p className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Upload MP4, WebM, MOV videos up to 500MB</span>
                </p>
                <p className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tag videos by sport and difficulty level</span>
                </p>
                <p className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Videos appear on the public Training page</span>
                </p>
                <p className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Track view counts on your videos</span>
                </p>
            </div>
            <button
                onClick={onRequest}
                disabled={requesting}
                className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60"
            >
                {requesting ? 'Submitting Request...' : 'Request Upload Access'}
            </button>
        </div>
    );
}

// ============================================
// MAIN PAGE
// ============================================
export default function OperatorTrainingVideos() {
    const [uploaderStatus, setUploaderStatus] = useState(null); // null = loading
    const [canUpload, setCanUpload] = useState(false);
    const [videos, setVideos] = useState([]);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [requesting, setRequesting] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUploaderStatus();
        fetchSports();
    }, []);

    const fetchUploaderStatus = async () => {
        try {
            const data = await trainingService.getMyUploaderStatus();
            if (data.success) {
                setUploaderStatus(data.data.videoUploaderRequestStatus);
                setCanUpload(data.data.canUploadVideos);
                if (data.data.canUploadVideos) {
                    fetchMyVideos();
                } else {
                    setLoading(false);
                }
            }
        } catch (err) {
            console.error('Failed to fetch uploader status:', err);
            setLoading(false);
        }
    };

    const fetchMyVideos = async () => {
        try {
            setLoading(true);
            const data = await trainingService.operatorGetMyVideos({ limit: 100 });
            if (data.success) setVideos(data.data);
        } catch (err) {
            console.error('Failed to fetch operator videos:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSports = async () => {
        try {
            const data = await sportService.getSports();
            if (data.success) setSports(data.data);
        } catch (err) {
            console.error('Failed to fetch sports:', err);
        }
    };

    const handleRequestAccess = async () => {
        setRequesting(true);
        try {
            await trainingService.operatorRequestUpload();
            toast.success('Request submitted! Admin will review shortly.');
            setUploaderStatus('pending');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setRequesting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await trainingService.operatorDeleteVideo(id);
            setVideos(prev => prev.filter(v => v.id !== id));
            setDeleteConfirm(null);
            toast.success('Video deleted successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete video');
        }
    };

    const handleSaved = () => {
        setShowForm(false);
        setEditingVideo(null);
        fetchMyVideos();
    };

    const filtered = videos.filter(v =>
        v.title.toLowerCase().includes(search.toLowerCase())
    );

    // ── Loading State ──────────────────────────────────────────────────────────
    if (uploaderStatus === null) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
        );
    }

    // ── Access Gated States ────────────────────────────────────────────────────
    if (!canUpload) {
        return (
            <div>
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Training Videos</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your training video content</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <RequestAccessBanner
                        status={uploaderStatus}
                        onRequest={handleRequestAccess}
                        requesting={requesting}
                    />
                </div>
            </div>
        );
    }

    // ── Full CRUD View (approved operators) ───────────────────────────────────
    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Training Videos</h1>
                    <p className="text-gray-500 text-sm mt-1">Upload and manage your training content</p>
                </div>
                <button
                    onClick={() => { setEditingVideo(null); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium text-sm shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload Video
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'My Videos', value: videos.length },
                    { label: 'Active', value: videos.filter(v => v.isActive).length },
                    { label: 'Total Views', value: videos.reduce((a, v) => a + (v.viewCount || 0), 0).toLocaleString() },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        <p className="text-sm text-gray-500 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-5 max-w-sm">
                <input
                    type="text"
                    placeholder="Search your videos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                            </svg>
                        </div>
                        <p className="font-medium text-gray-700 mb-1">
                            {search ? 'No matching videos' : 'No videos yet'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {search ? 'Try a different search term' : 'Click "Upload Video" to share your first training video'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Video</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sport</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Views</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(video => (
                                    <tr key={video.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="max-w-xs">
                                                <p className="font-medium text-gray-900 truncate">{video.title}</p>
                                                {video.description && (
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">{video.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm text-gray-700">{video.sport?.name || '—'}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {video.difficultyLevel ? (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[video.difficultyLevel] || ''}`}>
                                                    {video.difficultyLevel.charAt(0).toUpperCase() + video.difficultyLevel.slice(1)}
                                                </span>
                                            ) : <span className="text-gray-400 text-sm">—</span>}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-700">{formatDuration(video.duration)}</td>
                                        <td className="px-5 py-4 text-sm text-gray-700">{(video.viewCount || 0).toLocaleString()}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isLocalVideo(video.videoUrl) ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                                                {isLocalVideo(video.videoUrl) ? (
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                    </svg>
                                                )}
                                                {isLocalVideo(video.videoUrl) ? 'File' : 'URL'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditingVideo(video); setShowForm(true); }}
                                                    className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(video.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload/Edit Form Modal */}
            {showForm && (
                <VideoForm
                    video={editingVideo}
                    sports={sports}
                    onSave={handleSaved}
                    onCancel={() => { setShowForm(false); setEditingVideo(null); }}
                />
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-gray-900 text-center mb-1">Delete Video?</h3>
                        <p className="text-sm text-gray-600 text-center mb-5">
                            This will permanently delete the video and its file. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
