const multer = require('multer');
const path = require('path');

// Determine if we're in serverless environment
const isServerless = process.env.NODE_ENV === 'production';

// Configure storage based on environment
let storage;

if (isServerless) {
    // Use memory storage for serverless environments
    storage = multer.memoryStorage();
} else {
    // Use disk storage for local development
    storage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, 'uploads/doctors/');  // Make sure this directory exists
        },
        filename: function(req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });
}

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function(req, file, cb) {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (jpeg, jpg, png) are allowed!'));
        }
    }
});

module.exports = upload; 