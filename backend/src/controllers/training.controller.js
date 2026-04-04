const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');
const { deleteVideo, deleteFile, getImageUrl } = require('../middleware/upload');

/**
 * Training Video Controller
 * Public:   browse/filter/view videos
 * Operator: request upload access; manage own videos (upload/edit/delete)
 * Admin:    full CRUD on all videos
 */

// ============================================
// HELPERS
// ============================================

/**
 * Normalise a local file path from multer to a URL-safe string.
 * e.g. uploads\videos\video-xyz.mp4  →  /uploads/videos/video-xyz.mp4
 */
function buildVideoUrl(filePath) {
    if (!filePath) return null;
    let url = filePath.replace(/\\/g, '/');
    return url.startsWith('/') ? url : '/' + url;
}

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * Get all active training videos with filters
 * Public - anyone can view
 */
const getAllVideos = async (req, res) => {
    try {
        const {
            sportId,
            difficultyLevel,
            search,
            page = 1,
            limit = 12
        } = req.query;

        const where = { isActive: true };

        if (sportId) where.sportId = sportId;
        if (difficultyLevel && difficultyLevel !== 'all') where.difficultyLevel = difficultyLevel;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [videos, total] = await Promise.all([
            prisma.trainingVideo.findMany({
                where,
                include: {
                    sport: { select: { id: true, name: true, iconUrl: true } },
                    uploader: { select: { id: true, fullName: true } }
                },
                orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
                skip,
                take: parseInt(limit)
            }),
            prisma.trainingVideo.count({ where })
        ]);

        res.json({
            success: true,
            data: videos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching training videos:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training videos' });
    }
};

/**
 * Get a single training video by ID and increment view count
 * Public
 */
const getVideoById = async (req, res) => {
    try {
        const { id } = req.params;

        const video = await prisma.trainingVideo.findUnique({
            where: { id, isActive: true },
            include: {
                sport: { select: { id: true, name: true, iconUrl: true } },
                uploader: { select: { id: true, fullName: true } }
            }
        });

        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        // Increment view count asynchronously
        prisma.trainingVideo.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
        }).catch(err => console.error('Failed to increment view count:', err));

        res.json({ success: true, data: video });
    } catch (error) {
        console.error('Error fetching training video:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training video' });
    }
};

/**
 * Get featured / popular videos for the landing page (top viewed)
 * Public
 */
const getFeaturedVideos = async (req, res) => {
    try {
        const videos = await prisma.trainingVideo.findMany({
            where: { isActive: true },
            include: {
                sport: { select: { id: true, name: true, iconUrl: true } }
            },
            orderBy: { viewCount: 'desc' },
            take: 6
        });

        res.json({ success: true, data: videos });
    } catch (error) {
        console.error('Error fetching featured videos:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch featured videos' });
    }
};

// ============================================
// VIDEO UPLOADER REQUEST ENDPOINTS
// (operator role only, enforced via middleware)
// ============================================

/**
 * Request video upload access — Operator
 * POST /api/training/request-upload
 */
const requestVideoUploaderAccess = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { canUploadVideos: true, videoUploaderRequestStatus: true, role: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'operator') {
            return res.status(403).json({ success: false, message: 'Only operators can request video upload access' });
        }

        if (user.canUploadVideos) {
            return res.status(400).json({ success: false, message: 'You already have video upload access' });
        }

        if (user.videoUploaderRequestStatus === 'pending') {
            return res.status(400).json({ success: false, message: 'Your request is already pending review' });
        }

        await prisma.user.update({
            where: { id: req.user.id },
            data: { videoUploaderRequestStatus: 'pending' }
        });

        res.json({ success: true, message: 'Video upload request submitted. Awaiting admin approval.' });
    } catch (error) {
        console.error('Error requesting video uploader access:', error);
        res.status(500).json({ success: false, message: 'Failed to submit request' });
    }
};

/**
 * Get current user's video uploader status
 * GET /api/training/my-uploader-status
 */
const getMyUploaderStatus = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { canUploadVideos: true, videoUploaderRequestStatus: true, role: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                canUploadVideos: user.canUploadVideos,
                videoUploaderRequestStatus: user.videoUploaderRequestStatus,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error fetching uploader status:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch status' });
    }
};

// ============================================
// OPERATOR ENDPOINTS (canUploadVideos required)
// ============================================

/**
 * Get all videos uploaded by the logged-in operator
 * GET /api/training/operator/my-videos
 */
const operatorGetMyVideos = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [videos, total] = await Promise.all([
            prisma.trainingVideo.findMany({
                where: { uploaderId: req.user.id },
                include: {
                    sport: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.trainingVideo.count({ where: { uploaderId: req.user.id } })
        ]);

        res.json({
            success: true,
            data: videos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching operator videos:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch your videos' });
    }
};

/**
 * Create a new training video — Operator
 * POST /api/training/operator
 * Accepts multipart/form-data with optional `video` file field
 */
const operatorCreateVideo = async (req, res) => {
    try {
        const {
            title,
            description,
            videoUrl: bodyVideoUrl,
            thumbnailUrl: bodyThumbnailUrl,
            sportId,
            difficultyLevel,
            duration
        } = req.body;

        // Resolve videoUrl: uploaded file takes priority over URL field
        let videoUrl = bodyVideoUrl || null;
        if (req.files && req.files.video && req.files.video[0]) {
            videoUrl = buildVideoUrl(req.files.video[0].path);
        }

        // Resolve thumbnailUrl: uploaded file takes priority over URL field
        let thumbnailUrl = bodyThumbnailUrl || null;
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            thumbnailUrl = getImageUrl(req.files.thumbnail[0]);
        }

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }
        if (!videoUrl) {
            return res.status(400).json({ success: false, message: 'A video file or video URL is required' });
        }

        const video = await prisma.trainingVideo.create({
            data: {
                title: title.trim(),
                description: description || null,
                videoUrl,
                thumbnailUrl: thumbnailUrl || null,
                sportId: sportId || null,
                difficultyLevel: difficultyLevel || null,
                duration: duration ? parseInt(duration) : null,
                isActive: true,
                uploaderId: req.user.id
            },
            include: {
                sport: { select: { id: true, name: true } }
            }
        });

        res.status(201).json({ success: true, data: video, message: 'Training video created successfully' });
    } catch (error) {
        console.error('Error creating training video (operator):', error);
        // Clean up uploaded files on error
        if (req.files) {
            if (req.files.video && req.files.video[0]) {
                deleteVideo(buildVideoUrl(req.files.video[0].path)).catch(() => {});
            }
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                deleteFile(getImageUrl(req.files.thumbnail[0])).catch(() => {});
            }
        }
        res.status(500).json({ success: false, message: 'Failed to create training video' });
    }
};

/**
 * Update a training video — Operator (own videos only)
 * PUT /api/training/operator/:id
 */
const operatorUpdateVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            videoUrl: bodyVideoUrl,
            thumbnailUrl: bodyThumbnailUrl,
            sportId,
            difficultyLevel,
            duration,
            isActive
        } = req.body;

        const existing = await prisma.trainingVideo.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Training video not found' });
        }
        if (existing.uploaderId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You can only edit your own videos' });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description || null;
        if (sportId !== undefined) updateData.sportId = sportId || null;
        if (difficultyLevel !== undefined) updateData.difficultyLevel = difficultyLevel || null;
        if (duration !== undefined) updateData.duration = duration ? parseInt(duration) : null;
        if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

        // Handle video file replacement
        if (req.files && req.files.video && req.files.video[0]) {
            if (existing.videoUrl) await deleteVideo(existing.videoUrl);
            updateData.videoUrl = buildVideoUrl(req.files.video[0].path);
        } else if (bodyVideoUrl !== undefined) {
            // Keep existing if not provided or empty
            updateData.videoUrl = bodyVideoUrl || existing.videoUrl;
        }

        // Handle thumbnail: file vs URL (Mutually Exclusive)
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            // If new thumbnail uploaded, delete old local thumbnail if it existed
            if (existing.thumbnailUrl && existing.thumbnailUrl.startsWith('/uploads/')) {
                await deleteFile(existing.thumbnailUrl);
            }
            updateData.thumbnailUrl = getImageUrl(req.files.thumbnail[0]);
        } else if (bodyThumbnailUrl !== undefined) {
            // If explicit URL provided or explicitly cleared as ""
            const newThumb = bodyThumbnailUrl === "" || bodyThumbnailUrl === "null" ? null : bodyThumbnailUrl;
            
            // If transitioning away from a local file, delete it
            if (existing.thumbnailUrl && existing.thumbnailUrl.startsWith('/uploads/') && existing.thumbnailUrl !== newThumb) {
                await deleteFile(existing.thumbnailUrl);
            }
            updateData.thumbnailUrl = newThumb;
        }

        const video = await prisma.trainingVideo.update({
            where: { id },
            data: updateData,
            include: { sport: { select: { id: true, name: true } } }
        });

        res.json({ success: true, data: video, message: 'Training video updated successfully' });
    } catch (error) {
        console.error('Error updating training video (operator):', error);
        if (req.files) {
            if (req.files.video && req.files.video[0]) {
                deleteVideo(buildVideoUrl(req.files.video[0].path)).catch(() => {});
            }
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                deleteFile(getImageUrl(req.files.thumbnail[0])).catch(() => {});
            }
        }
        res.status(500).json({ success: false, message: 'Failed to update training video' });
    }
};

/**
 * Delete a training video — Operator (own videos only)
 * DELETE /api/training/operator/:id
 */
const operatorDeleteVideo = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.trainingVideo.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Training video not found' });
        }
        if (existing.uploaderId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You can only delete your own videos' });
        }

        // Delete local video file if applicable
        if (existing.videoUrl) {
            await deleteVideo(existing.videoUrl);
        }
        // Delete local thumbnail if applicable
        if (existing.thumbnailUrl && existing.thumbnailUrl.startsWith('/uploads/')) {
            await deleteFile(existing.thumbnailUrl);
        }

        await prisma.trainingVideo.delete({ where: { id } });

        res.json({ success: true, message: 'Training video deleted successfully' });
    } catch (error) {
        console.error('Error deleting training video (operator):', error);
        res.status(500).json({ success: false, message: 'Failed to delete training video' });
    }
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * Get all training videos (including inactive) — Admin
 */
const adminGetAllVideos = async (req, res) => {
    try {
        const { page = 1, limit = 20, sportId, difficultyLevel, search } = req.query;

        const where = {};
        if (sportId) where.sportId = sportId;
        if (difficultyLevel && difficultyLevel !== 'all') where.difficultyLevel = difficultyLevel;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [videos, total] = await Promise.all([
            prisma.trainingVideo.findMany({
                where,
                include: {
                    sport: { select: { id: true, name: true } },
                    uploader: { select: { id: true, fullName: true, email: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.trainingVideo.count({ where })
        ]);

        res.json({
            success: true,
            data: videos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching videos (admin):', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training videos' });
    }
};

/**
 * Create a new training video — Admin
 * Accepts multipart/form-data with optional `video` file field
 */
const createVideo = async (req, res) => {
    try {
        const {
            title,
            description,
            videoUrl: bodyVideoUrl,
            thumbnailUrl: bodyThumbnailUrl,
            sportId,
            difficultyLevel,
            duration,
            isActive = true
        } = req.body;

        let videoUrl = bodyVideoUrl || null;
        if (req.files && req.files.video && req.files.video[0]) {
            videoUrl = buildVideoUrl(req.files.video[0].path);
        }

        let thumbnailUrl = bodyThumbnailUrl || null;
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            thumbnailUrl = getImageUrl(req.files.thumbnail[0]);
        }

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }
        if (!videoUrl) {
            return res.status(400).json({ success: false, message: 'A video file or video URL is required' });
        }

        const video = await prisma.trainingVideo.create({
            data: {
                title: title.trim(),
                description: description || null,
                videoUrl,
                thumbnailUrl: thumbnailUrl || null,
                sportId: sportId || null,
                difficultyLevel: difficultyLevel || null,
                duration: duration ? parseInt(duration) : null,
                isActive: isActive === 'false' || isActive === false ? false : true,
                uploaderId: req.user.id
            },
            include: {
                sport: { select: { id: true, name: true } }
            }
        });

        res.status(201).json({ success: true, data: video, message: 'Training video created successfully' });
    } catch (error) {
        console.error('Error creating training video:', error);
        if (req.files) {
            if (req.files.video && req.files.video[0]) {
                deleteVideo(buildVideoUrl(req.files.video[0].path)).catch(() => {});
            }
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                deleteFile(getImageUrl(req.files.thumbnail[0])).catch(() => {});
            }
        }
        res.status(500).json({ success: false, message: 'Failed to create training video' });
    }
};

/**
 * Update a training video — Admin
 */
const updateVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            videoUrl: bodyVideoUrl,
            thumbnailUrl: bodyThumbnailUrl,
            sportId,
            difficultyLevel,
            duration,
            isActive
        } = req.body;

        const existing = await prisma.trainingVideo.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Training video not found' });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description || null;
        if (sportId !== undefined) updateData.sportId = sportId || null;
        if (difficultyLevel !== undefined) updateData.difficultyLevel = difficultyLevel || null;
        if (duration !== undefined) updateData.duration = duration ? parseInt(duration) : null;
        if (isActive !== undefined) updateData.isActive = isActive === 'false' || isActive === false ? false : true;

        // Handle video file replacement
        if (req.files && req.files.video && req.files.video[0]) {
            if (existing.videoUrl) await deleteVideo(existing.videoUrl);
            updateData.videoUrl = buildVideoUrl(req.files.video[0].path);
        } else if (bodyVideoUrl !== undefined) {
            updateData.videoUrl = bodyVideoUrl || existing.videoUrl;
        }

        // Handle thumbnail replacement (mutual exclusivity)
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            if (existing.thumbnailUrl && existing.thumbnailUrl.startsWith('/uploads/')) {
                await deleteFile(existing.thumbnailUrl);
            }
            updateData.thumbnailUrl = getImageUrl(req.files.thumbnail[0]);
        } else if (bodyThumbnailUrl !== undefined) {
            const newThumb = bodyThumbnailUrl === "" || bodyThumbnailUrl === "null" ? null : bodyThumbnailUrl;
            if (existing.thumbnailUrl && existing.thumbnailUrl.startsWith('/uploads/') && existing.thumbnailUrl !== newThumb) {
                await deleteFile(existing.thumbnailUrl);
            }
            updateData.thumbnailUrl = newThumb;
        }

        const video = await prisma.trainingVideo.update({
            where: { id },
            data: updateData,
            include: { sport: { select: { id: true, name: true } } }
        });

        res.json({ success: true, data: video, message: 'Training video updated successfully' });
    } catch (error) {
        console.error('Error updating training video:', error);
        if (req.files) {
            if (req.files.video && req.files.video[0]) {
                deleteVideo(buildVideoUrl(req.files.video[0].path)).catch(() => {});
            }
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                deleteFile(getImageUrl(req.files.thumbnail[0])).catch(() => {});
            }
        }
        res.status(500).json({ success: false, message: 'Failed to update training video' });
    }
};

/**
 * Delete a training video — Admin
 */
const deleteVideo2 = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.trainingVideo.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Training video not found' });
        }

        if (existing.videoUrl) await deleteVideo(existing.videoUrl);
        if (existing.thumbnailUrl && existing.thumbnailUrl.startsWith('/uploads/')) {
            await deleteFile(existing.thumbnailUrl);
        }

        await prisma.trainingVideo.delete({ where: { id } });

        res.json({ success: true, message: 'Training video deleted successfully' });
    } catch (error) {
        console.error('Error deleting training video:', error);
        res.status(500).json({ success: false, message: 'Failed to delete training video' });
    }
};

module.exports = {
    // Public
    getAllVideos,
    getVideoById,
    getFeaturedVideos,
    // Request workflow
    requestVideoUploaderAccess,
    getMyUploaderStatus,
    // Operator
    operatorGetMyVideos,
    operatorCreateVideo,
    operatorUpdateVideo,
    operatorDeleteVideo,
    // Admin
    adminGetAllVideos,
    createVideo,
    updateVideo,
    deleteVideo: deleteVideo2
};
