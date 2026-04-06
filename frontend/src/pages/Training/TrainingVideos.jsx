import { useState, useEffect } from 'react';
import trainingService from '../../services/trainingService';
import sportService from '../../services/sportService';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const DIFFICULTY_LEVELS = ['all', 'beginner', 'intermediate', 'advanced'];
const DIFFICULTY_COLORS = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
};

function formatDuration(seconds) {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
}

function VideoCard({ video, onClick }) {
    const ytId = getYouTubeId(video.videoUrl);
    const thumbnail = video.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);
    const sportName = video.sport?.name || 'General';

    return (
        <div
            onClick={() => onClick(video)}
            className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer group hover:-translate-y-1 hover:shadow-md transition-all"
        >
            {/* Thumbnail */}
            <div className="relative h-44 bg-gray-200 overflow-hidden">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                )}
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-7 h-7 text-primary-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
                {/* Duration badge */}
                {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-0.5 rounded-md font-mono">
                        {formatDuration(video.duration)}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        {sportName}
                    </span>
                    {video.difficultyLevel && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[video.difficultyLevel] || ''}`}>
                            {video.difficultyLevel.charAt(0).toUpperCase() + video.difficultyLevel.slice(1)}
                        </span>
                    )}
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">
                    {video.title}
                </h3>
                {video.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{video.description}</p>
                )}
                <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{(video.viewCount || 0).toLocaleString()} views</span>
                </div>
            </div>
        </div>
    );
}

function VideoModal({ video, onClose }) {
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    if (!video) return null;

    const ytId = getYouTubeId(video.videoUrl);

    const renderPlayer = () => {
        if (ytId) {
            return (
                <iframe
                    className="w-full aspect-video"
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            );
        }
        return (
            <video
                className="w-full aspect-video"
                controls
                autoPlay
                src={video.videoUrl}
            >
                Your browser does not support the video tag.
            </video>
        );
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {renderPlayer()}
                <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">{video.title}</h2>
                            <div className="flex flex-wrap gap-2">
                                {video.sport && (
                                    <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                        {video.sport.name}
                                    </span>
                                )}
                                {video.difficultyLevel && (
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[video.difficultyLevel] || ''}`}>
                                        {video.difficultyLevel.charAt(0).toUpperCase() + video.difficultyLevel.slice(1)}
                                    </span>
                                )}
                                {video.duration && (
                                    <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {formatDuration(video.duration)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {video.description && (
                        <p className="text-gray-600 text-sm">{video.description}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TrainingVideos() {
    const [videos, setVideos] = useState([]);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);

    const [search, setSearch] = useState('');
    const [selectedSport, setSelectedSport] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');

    useEffect(() => {
        fetchVideos();
        fetchSports();
    }, []);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const data = await trainingService.getAllVideos({ limit: 50 });
            if (data.success) setVideos(data.data);
        } catch (err) {
            console.error('Error fetching training videos:', err);
            setError('Failed to load training videos');
        } finally {
            setLoading(false);
        }
    };

    const fetchSports = async () => {
        try {
            const data = await sportService.getSports();
            if (data.success) setSports(data.data);
        } catch (err) {
            console.error('Error fetching sports:', err);
        }
    };

    // Client-side filter
    const filtered = videos.filter(v => {
        if (selectedDifficulty !== 'all' && v.difficultyLevel !== selectedDifficulty) return false;
        if (selectedSport && v.sport?.id !== selectedSport) return false;
        if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Videos</h1>
                    <p className="text-gray-600">
                        Learn from professional instructional content — improve your skills across different sports and levels.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-end">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search videos..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Sport */}
                    <div className="min-w-[160px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
                        <select
                            value={selectedSport}
                            onChange={(e) => setSelectedSport(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        >
                            <option value="">All Sports</option>
                            {sports.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Difficulty */}
                    <div className="min-w-[160px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                        <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        >
                            {DIFFICULTY_LEVELS.map(d => (
                                <option key={d} value={d}>
                                    {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reset */}
                    <button
                        onClick={() => { setSearch(''); setSelectedSport(''); setSelectedDifficulty('all'); }}
                        className="px-4 py-2.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Clear
                    </button>
                </div>

                {/* Difficulty badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {DIFFICULTY_LEVELS.map(d => (
                        <button
                            key={d}
                            onClick={() => setSelectedDifficulty(d)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDifficulty === d
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Results count */}
                <p className="text-sm text-gray-600 mb-4">{filtered.length} video{filtered.length !== 1 ? 's' : ''} found</p>

                {/* Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
                    </div>
                ) : error ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button onClick={fetchVideos} className="text-primary-600 hover:underline">Try again</button>
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map(video => (
                            <VideoCard key={video.id} video={video} onClick={setSelectedVideo} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-xl text-gray-900 mb-2">No videos found</h3>
                        <p className="text-gray-500">
                            {videos.length === 0
                                ? 'No training videos have been added yet. Check back soon!'
                                : 'Try adjusting your filters'}
                        </p>
                    </div>
                )}
            </main>

            <Footer />

            {/* Video Modal */}
            {selectedVideo && (
                <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
            )}
        </div>
    );
}
