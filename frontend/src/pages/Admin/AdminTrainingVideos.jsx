import { useState, useEffect } from 'react';
import trainingService from '../../services/trainingService';
import sportService from '../../services/sportService';
import toast from 'react-hot-toast';

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];

function isLocalVideo(url) {
    return url && url.startsWith('/uploads/videos/');
}

function isLocalThumbnail(url) {
    return url && (url.startsWith('/uploads/thumbnails/') || url.startsWith('/uploads/training/'));
}

// ============================================
// VIDEO FORM (Admin)
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
        isActive: video?.isActive !== undefined ? video.isActive : true,
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
            setError('Please select a video file.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('title', form.title.trim());
            if (form.description) formData.append('description', form.description);
            if (form.sportId) formData.append('sportId', form.sportId);
            if (form.difficultyLevel) formData.append('difficultyLevel', form.difficultyLevel);
            if (form.duration) formData.append('duration', form.duration);
            formData.append('isActive', form.isActive);

            // Thumbnail Handling
            if (thumbMode === 'file' && thumbnailFile) {
                formData.append('thumbnail', thumbnailFile);
            } else if (thumbMode === 'url') {
                formData.append('thumbnailUrl', form.thumbnailUrl || '');
            } else if (thumbMode === 'file' && !thumbnailFile && !thumbnailPreview) {
                formData.append('thumbnailUrl', '');
            }

            if (uploadMode === 'file' && videoFile) {
                formData.append('video', videoFile);
            } else {
                formData.append('videoUrl', form.videoUrl);
            }

            if (isEdit) {
                await trainingService.adminUpdateVideo(video.id, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await trainingService.adminCreateVideo(formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            toast.success(isEdit ? 'Video updated!' : 'Video added!');
            onSave();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save video');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEdit ? 'Edit Training Video' : 'Add Training Video'}
                    </h2>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="e.g. Basic Football Dribbling Techniques"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            required
                        />
                    </div>

                    {/* Video source toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Video Source *</label>
                        <div className="flex gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('file')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${uploadMode === 'file' ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Upload File
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('url')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${uploadMode === 'url' ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    Video URL
                                </button>
                        </div>
                        {uploadMode === 'file' ? (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                <input
                                    type="file"
                                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                                    onChange={(e) => setVideoFile(e.target.files[0] || null)}
                                    className="w-full text-sm text-gray-600"
                                />
                                {isEdit && isLocalVideo(video?.videoUrl) && !videoFile && (
                                    <p className="text-xs text-gray-500 mt-1">Current: local file. Select a new file to replace it.</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">MP4, WebM, MOV — Max 500MB</p>
                            </div>
                        ) : (
                            <input
                                type="url"
                                name="videoUrl"
                                value={form.videoUrl}
                                onChange={handleChange}
                                placeholder="YouTube URL or direct .mp4 link"
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            />
                        )}
                    </div>

                    {/* Thumbnail */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Thumbnail (Photo or URL)</label>
                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setThumbMode('file')}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-2 ${thumbMode === 'file' ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Upload Photo
                            </button>
                            <button
                                type="button"
                                onClick={() => setThumbMode('url')}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-2 ${thumbMode === 'url' ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                URL
                            </button>
                        </div>

                        {thumbMode === 'file' ? (
                            <div className="space-y-2">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleThumbChange}
                                        className="w-full text-xs text-gray-600"
                                    />
                                    {thumbnailPreview && (
                                        <div className="mt-2 w-32 h-20 mx-auto rounded-lg overflow-hidden border border-gray-200">
                                            <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                {(thumbnailFile || thumbnailPreview) && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveThumbnail}
                                        className="text-[10px] text-red-600 hover:text-red-700 font-medium flex items-center gap-1 mx-auto"
                                    >
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            />
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Brief description..."
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm resize-none"
                        />
                    </div>

                    {/* Sport & Difficulty */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sport <span className="text-gray-400">(optional)</span></label>
                            <select
                                name="sportId"
                                value={form.sportId}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            >
                                <option value="">General / All Sports</option>
                                {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty <span className="text-gray-400">(optional)</span></label>
                            <select
                                name="difficultyLevel"
                                value={form.difficultyLevel}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            >
                                <option value="">Not specified</option>
                                {DIFFICULTY_LEVELS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (seconds) <span className="text-gray-400">(optional)</span></label>
                        <input
                            type="number"
                            name="duration"
                            value={form.duration}
                            onChange={handleChange}
                            placeholder="e.g. 360 for a 6-minute video"
                            min="0"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="isActive"
                            id="isActive"
                            checked={form.isActive}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary-600 rounded border-gray-300"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (visible to users)</label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm disabled:opacity-60"
                        >
                            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Video'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================
// UPLOADER REQUESTS TAB
// ============================================
function UploaderRequestsTab() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await trainingService.adminGetUploaderRequests();
            if (data.success) setRequests(data.data);
        } catch (err) {
            console.error('Failed to fetch video uploader requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id, name) => {
        setProcessing(id + '-approve');
        try {
            await trainingService.adminApproveUploader(id);
            toast.success(`${name} approved to upload videos`);
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to approve request');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (id, name) => {
        setProcessing(id + '-reject');
        try {
            await trainingService.adminRejectUploader(id);
            toast.success(`Request from ${name} rejected`);
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject request');
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm">
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                        </svg>
                    </div>
                    <p className="font-medium text-gray-700 mb-1">No Pending Requests</p>
                    <p className="text-sm text-gray-500">There are no video upload access requests at this time.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Operator</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Venues</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Videos Uploaded</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member Since</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-4">
                                    <div>
                                        <p className="font-medium text-gray-900">{req.fullName}</p>
                                        <p className="text-xs text-gray-500">{req.email}</p>
                                        {req.phone && <p className="text-xs text-gray-400">{req.phone}</p>}
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-sm text-gray-700">
                                    {req._count?.ownedVenues || 0} venues
                                </td>
                                <td className="px-5 py-4 text-sm text-gray-700">
                                    {req._count?.uploadedVideos || 0} videos
                                </td>
                                <td className="px-5 py-4 text-sm text-gray-500">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleApprove(req.id, req.fullName)}
                                            disabled={processing !== null}
                                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            {processing === req.id + '-approve' ? '...' : '✓ Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleReject(req.id, req.fullName)}
                                            disabled={processing !== null}
                                            className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                        >
                                            {processing === req.id + '-reject' ? '...' : '✕ Reject'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============================================
// MAIN ADMIN PAGE
// ============================================
export default function AdminTrainingVideos() {
    const [activeTab, setActiveTab] = useState('videos');
    const [videos, setVideos] = useState([]);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [search, setSearch] = useState('');
    const [pendingRequestCount, setPendingRequestCount] = useState(0);

    useEffect(() => {
        fetchVideos();
        fetchSports();
        fetchPendingCount();
    }, []);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const data = await trainingService.adminGetAllVideos({ limit: 100 });
            if (data.success) setVideos(data.data);
        } catch (err) {
            console.error('Failed to fetch videos:', err);
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

    const fetchPendingCount = async () => {
        try {
            const data = await trainingService.adminGetUploaderRequests();
            if (data.success) setPendingRequestCount(data.data.length);
        } catch (_) { /* silently ignore */ }
    };

    const handleDelete = async (id) => {
        try {
            await trainingService.adminDeleteVideo(id);
            setVideos(prev => prev.filter(v => v.id !== id));
            setDeleteConfirm(null);
            toast.success('Video deleted');
        } catch (err) {
            toast.error('Failed to delete video');
        }
    };

    const handleSaved = () => {
        setShowForm(false);
        setEditingVideo(null);
        fetchVideos();
    };

    const filtered = videos.filter(v =>
        v.title.toLowerCase().includes(search.toLowerCase())
    );

    const formatDuration = (s) => {
        if (!s) return '—';
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Training Videos</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage all training content and uploader access</p>
                </div>
                {activeTab === 'videos' && (
                    <button
                        onClick={() => { setEditingVideo(null); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Video
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('videos')}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'videos'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                    Videos ({videos.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all relative flex items-center gap-2 ${activeTab === 'requests'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Uploader Requests
                    {pendingRequestCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full font-bold">
                            {pendingRequestCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Videos Tab */}
            {activeTab === 'videos' && (
                <>
                    {/* Search */}
                    <div className="relative mb-5 max-w-sm">
                        <input
                            type="text"
                            placeholder="Search videos..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: 'Total Videos', value: videos.length },
                            { label: 'Active', value: videos.filter(v => v.isActive).length },
                            { label: 'Total Views', value: videos.reduce((a, v) => a + (v.viewCount || 0), 0).toLocaleString() },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-2xl font-bold text-gray-900">{value}</p>
                                <p className="text-sm text-gray-500 mt-1">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                                    {search ? 'Try a different search term' : 'Click "Add Video" to get started'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Video</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploader</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sport</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Views</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
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
                                                    <span className="text-sm text-gray-700">
                                                        {video.uploader?.fullName || <span className="text-gray-400 italic">Admin</span>}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-sm text-gray-700">{video.sport?.name || '—'}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {video.difficultyLevel ? (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${video.difficultyLevel === 'beginner' ? 'bg-green-100 text-green-700'
                                                            : video.difficultyLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-red-100 text-red-700'}`}>
                                                            {video.difficultyLevel.charAt(0).toUpperCase() + video.difficultyLevel.slice(1)}
                                                        </span>
                                                    ) : <span className="text-gray-400 text-sm">—</span>}
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-700">{formatDuration(video.duration)}</td>
                                                <td className="px-5 py-4 text-sm text-gray-700">{(video.viewCount || 0).toLocaleString()}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${video.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {video.isActive ? 'Active' : 'Inactive'}
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
                </>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && <UploaderRequestsTab />}

            {/* Add/Edit Modal */}
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
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-bold text-gray-900 mb-2">Delete Video?</h3>
                        <p className="text-sm text-gray-600 mb-5">This action cannot be undone. The video file (if local) will also be deleted.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
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
