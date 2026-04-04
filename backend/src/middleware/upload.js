const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const fs = require('fs');

// Check if Cloudinary is configured
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

let storage;

if (isCloudinaryConfigured) {
    // Configure Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        timeout: 120000, // 120 seconds timeout
    });

    // Cloudinary storage
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'bookmygame/venues',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [
                { width: 1200, height: 800, crop: 'limit' }, // Max dimensions
                { quality: 'auto:good' }, // Auto optimize quality
            ],
            timeout: 120000, // 120 seconds timeout for uploads
        },
    });

    console.log('Using Cloudinary for image uploads');
} else {
    // Fallback to local storage
    const uploadDirs = ['uploads/venues', 'uploads/products', 'uploads/users', 'uploads/events', 'uploads/misc', 'uploads/videos', 'uploads/thumbnails'];
    uploadDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            let folder = 'misc';
            if (req.query.folder) {
                folder = req.query.folder;
            } else if (req.originalUrl.includes('/products')) {
                folder = 'products';
            } else if (req.originalUrl.includes('/venues')) {
                folder = 'venues';
            } else if (req.originalUrl.includes('/auth/profile')) {
                folder = 'users';
            } else if (req.originalUrl.includes('/events')) {
                folder = 'events';
            } else if (req.originalUrl.includes('/training') || req.query.folder === 'thumbnails') {
                folder = 'thumbnails';
            }

            const dest = `uploads/${folder}`;
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const ext = path.extname(file.originalname).toLowerCase();

            let prefix = 'image';
            if (req.query.folder) {
                prefix = req.query.folder.replace(/s$/, ''); // e.g., 'events' -> 'event'
            } else if (req.originalUrl.includes('/products')) {
                prefix = 'product';
            } else if (req.originalUrl.includes('/venues')) {
                prefix = 'venue';
            } else if (req.originalUrl.includes('/auth/profile')) {
                prefix = 'user';
            } else if (req.originalUrl.includes('/events')) {
                prefix = 'event';
            } else if (req.originalUrl.includes('/training') || req.query.folder === 'thumbnails') {
                prefix = 'thumbnail';
            }

            cb(null, `${prefix}-${uniqueSuffix}${ext}`);
        }
    });

    console.log('Using structured local storage for image uploads (Cloudinary not configured)');
}

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for local high-quality media
        files: 10 // Maximum 10 files per upload
    }
});

// Helper to delete an image (works for both Cloudinary and local)
const deleteImage = async (imageUrl) => {
    try {
        if (!imageUrl) return;
        if (isCloudinaryConfigured && imageUrl.includes('cloudinary.com')) {
            // Extract public_id from Cloudinary URL
            const parts = imageUrl.split('/');
            const filenameWithExt = parts[parts.length - 1];
            const folder = parts[parts.length - 2];
            const publicId = `${folder}/${filenameWithExt.split('.')[0]}`;

            await cloudinary.uploader.destroy(publicId);
        } else if (imageUrl.startsWith('/uploads/')) {
            // Local file
            const fullPath = path.join(process.cwd(), imageUrl);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }
    } catch (error) {
        console.error('Error deleting image:', error);
    }
};

/**
 * Generic local file deletion helper.
 * Handles paths starting with /uploads/
 */
const deleteFile = async (fileUrl) => {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
    try {
        const fullPath = path.join(process.cwd(), fileUrl);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (err) {
        console.error(`Error deleting local file: ${fileUrl}`, err);
    }
};

// Helper to get image URL from multer file
const getImageUrl = (file) => {
    if (file.path && file.path.includes('cloudinary.com')) {
        // Cloudinary returns the full URL in file.path
        return file.path;
    } else if (file.path) {
        // Local storage - normalize backslashes to forward slashes and ensure leading slash
        let localPath = file.path.replace(/\\/g, '/');
        return localPath.startsWith('/') ? localPath : '/' + localPath;
    }
    return null;
};

// ============================================
// TRAINING MEDIA UPLOAD — Special handling for Video + Thumbnail
// ============================================

const trainingMediaStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'misc';
        if (file.fieldname === 'video') {
            folder = 'videos';
        } else if (file.fieldname === 'thumbnail') {
            folder = 'thumbnails';
        }

        const dest = `uploads/${folder}`;
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        const prefix = file.fieldname === 'video' ? 'video' : 'thumbnail';
        cb(null, `${prefix}-${uniqueSuffix}${ext}`);
    }
});

const trainingMediaFilter = (req, file, cb) => {
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/avi'];
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.fieldname === 'video') {
        if (videoTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid video type. Only MP4, WebM, OGG, MOV, and AVI are allowed.'), false);
        }
    } else if (file.fieldname === 'thumbnail') {
        if (imageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid thumbnail type. Only JPEG, PNG, and WebP are allowed.'), false);
        }
    } else {
        cb(null, true); // Allow other fields if any
    }
};

const trainingMediaUpload = multer({
    storage: trainingMediaStorage,
    fileFilter: trainingMediaFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit
        files: 2
    }
});

// Legacy video upload: for single video files only (backward compatibility)
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = 'uploads/videos';
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `video-${uniqueSuffix}${ext}`);
    }
});

const videoUpload = multer({
    storage: videoStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/avi'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only MP4, WebM, OGG, MOV, and AVI are allowed.'), false);
        }
    },
    limits: {
        fileSize: 500 * 1024 * 1024, 
        files: 1
    }
});

// Helper to delete a local video file
const deleteVideo = async (videoUrl) => {
    return deleteFile(videoUrl);
};

module.exports = {
    upload,
    videoUpload,
    trainingMediaUpload,
    deleteImage,
    deleteVideo,
    deleteFile,
    getImageUrl,
    isCloudinaryConfigured
};
