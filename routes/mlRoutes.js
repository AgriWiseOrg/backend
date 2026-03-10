const express = require('express');
const router = express.Router();
const multer = require('multer');
const mlController = require('../controllers/mlController');

// Configure multer for memory storage (we don't need to save the file locally)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// POST /api/ml/analyze-crop
router.post('/analyze-crop', upload.single('image'), mlController.analyzeCropImage);

module.exports = router;
