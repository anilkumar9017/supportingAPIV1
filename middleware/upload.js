const multer = require('multer');
const os = require('os');
const path = require('path');

// Use disk storage to avoid buffering large uploads in memory
// Files are stored in OS temp directory. Ensure cleanup after processing.
const tmpDir = process.env.UPLOAD_TMP_DIR || os.tmpdir();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tmpDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`);
    }
});

// Limit file size to avoid exhausting server resources.
// Default: 20 MB (can be overridden with env var MAX_UPLOAD_FILE_SIZE_BYTES)
const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_FILE_SIZE_BYTES, 10) || 20 * 1024 * 1024;

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    }
});

module.exports = upload;