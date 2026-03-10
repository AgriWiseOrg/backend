const router = require('express').Router(); // Create Express router
const GovtScheme = require('../models/GovtScheme'); // Import GovtScheme model
// Ensure this matches your file name: SchemeApplication.js
const SchemeApplication = require('../models/SchemeApplication'); // Import applications model

// === SCHEMES CRUD ===

// GET all schemes
router.get('/', async (req, res) => { // Fetch all govt schemes
    try {
        const schemes = await GovtScheme.find().sort({ createdAt: -1 }); 
        // Get schemes sorted by newest first

        res.json(schemes); // Send schemes as JSON
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch schemes" }); // Error response
    }
});

// ADD new scheme
router.post('/add', async (req, res) => { // Add new scheme route
    try {
        const newScheme = new GovtScheme(req.body); // Create scheme from request body
        const savedScheme = await newScheme.save(); // Save to DB
        res.status(201).json(savedScheme); // Send saved scheme with 201 status
    } catch (err) {
        res.status(500).json({ error: "Failed to add scheme" }); // Error response
    }
});

// DELETE scheme
router.delete('/:id', async (req, res) => { // Delete scheme by ID
    try {
        await GovtScheme.findByIdAndDelete(req.params.id); // Delete from DB
        res.json({ message: "Scheme deleted" }); // Success message
    } catch (err) {
        res.status(500).json({ error: "Failed to delete scheme" }); // Error response
    }
});

// === APPLICATIONS ===

// APPLY to scheme
router.post('/apply', async (req, res) => { // Submit application
    try {
        const { farmerEmail, schemeId, schemeName } = req.body; // Extract data from body

        const existing = await SchemeApplication.findOne({ farmerEmail, schemeId }); 
        // Check if user already applied

        if (existing) {
            return res.status(400).json({ error: "Already applied to this scheme" }); 
            // Prevent duplicate application
        }

        const application = new SchemeApplication({
            farmerEmail,
            schemeId,
            schemeName
        }); // Create new application document

        await application.save(); // Save to DB
        res.status(201).json({ message: "Application submitted" }); // Success response

    } catch (err) {
        console.error("Scheme Application Error:", err); // Log error
        res.status(500).json({ error: "Failed to submit application" }); // Error response
    }
});

// CANCEL application (using URL params)
router.delete('/cancel/:farmerEmail/:schemeId', async (req, res) => { 
    // Delete application using farmerEmail and schemeId

    try {
        const { farmerEmail, schemeId } = req.params; // Extract from URL

        const deletedApp = await SchemeApplication.findOneAndDelete({ 
            farmerEmail, 
            schemeId 
        }); // Delete matching application

        if (!deletedApp) {
            return res.status(404).json({ error: "Application not found" }); 
            // If no application exists
        }

        res.json({ message: "Application cancelled successfully" }); // Success message

    } catch (err) {
        console.error("Scheme Cancellation Error:", err); // Log error
        res.status(500).json({ error: "Failed to cancel application" }); // Error response
    }
});

// GET user applications
router.get('/user-applications', async (req, res) => { 
    // Fetch applications for specific user

    try {
        const { email } = req.query; // Get email from query parameter

        if (!email) 
            return res.status(400).json({ error: "Email required" }); 
            // Validate email exists

        const apps = await SchemeApplication.find({ farmerEmail: email }); 
        // Find all applications for that email

        res.json(apps); // Send applications

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user applications" }); // Error response
    }
});

module.exports = router; // Export router for use in server.js