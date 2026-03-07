const router = require('express').Router(); // Create Express router
const FarmingTip = require('../models/FarmingTip'); // Import FarmingTip model

// GET all tips
router.get('/', async (req, res) => { // Route to fetch all farming tips
    try {
        const tips = await FarmingTip.find().sort({ createdAt: -1 }); 
        // Get all tips from DB and sort by newest first

        res.json(tips); // Send tips as JSON response
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tips" }); 
        // Send 500 error if something fails
    }
});

// ADD tip
router.post('/add', async (req, res) => { // Route to add new farming tip
    try {
        const newTip = new FarmingTip(req.body); 
        // Create new document using request body data

        const savedTip = await newTip.save(); 
        // Save to MongoDB

        res.status(201).json(savedTip); 
        // Send back saved tip with 201 (created) status
    } catch (err) {
        res.status(500).json({ error: "Failed to add tip" }); 
        // Error handling
    }
});

// DELETE tip
router.delete('/:id', async (req, res) => { 
    // Route to delete tip by ID (passed in URL)

    try {
        await FarmingTip.findByIdAndDelete(req.params.id); 
        // Delete tip using ID from URL parameter

        res.json({ message: "Tip deleted" }); 
        // Send success message
    } catch (err) {
        res.status(500).json({ error: "Failed to delete tip" }); 
        // Error handling
    }
});

module.exports = router; // Export router to use in server.js