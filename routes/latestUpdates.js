const router = require('express').Router(); // Create Express router
const LatestUpdate = require('../models/LatestUpdate'); // Import LatestUpdate model

// GET all updates
router.get('/', async (req, res) => { // Route to fetch all latest updates
    try {
        const updates = await LatestUpdate.find().sort({ date: -1 }); 
        // Get all updates from DB, sorted by latest date first

        res.json(updates); // Send updates as JSON response
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch updates" }); 
        // Send 500 error if something goes wrong
    }
});

// ADD update
router.post('/add', async (req, res) => { // Route to add new update
    try {
        const newUpdate = new LatestUpdate(req.body); 
        // Create new update document using request body data

        const savedUpdate = await newUpdate.save(); 
        // Save update to MongoDB

        res.status(201).json(savedUpdate); 
        // Send saved update with 201 (created) status
    } catch (err) {
        res.status(500).json({ error: "Failed to add update" }); 
        // Error response if save fails
    }
});

// DELETE update
router.delete('/:id', async (req, res) => { 
    // Route to delete update by ID (passed as URL parameter)

    try {
        await LatestUpdate.findByIdAndDelete(req.params.id); 
        // Delete document from MongoDB using ID

        res.json({ message: "Update deleted" }); 
        // Send success message
    } catch (err) {
        res.status(500).json({ error: "Failed to delete update" }); 
        // Error response if deletion fails
    }
});

module.exports = router; // Export router to use in main server file