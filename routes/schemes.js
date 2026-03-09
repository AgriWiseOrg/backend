const router = require('express').Router();
const Scheme = require('../models/Scheme');
const SchemeApplication = require('../models/SchemeApplication');

// 1. GET all schemes
router.get('/', async (req, res) => {
  try {
    const schemes = await Scheme.find({});
    res.status(200).json(schemes);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch schemes" });
  }
});

// 2. Add a new scheme
router.post('/add', async (req, res) => {
  try {
    const newScheme = new Scheme(req.body);
    const savedScheme = await newScheme.save();
    res.status(201).json(savedScheme);
  } catch (err) {
    res.status(400).json({ error: "Could not add scheme" });
  }
});

// 3. Remove a scheme
router.delete('/:id', async (req, res) => {
  try {
    await Scheme.findByIdAndDelete(req.params.id);
    res.json({ message: "Scheme deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 4. Submit Application
router.post('/apply', async (req, res) => {
  try {
    const newApp = new SchemeApplication({
      farmerEmail: req.body.farmerEmail,
      schemeName: req.body.schemeName,
      schemeId: req.body.schemeId,
      landSize: req.body.landSize
    });
    await newApp.save();
    res.status(201).json({ message: "Application submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit application" });
  }
});

// 5. Get User Applications
router.get('/user-applications', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email required" });
    const apps = await SchemeApplication.find({ farmerEmail: email });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// 6. Get All Applications (Admin)
router.get('/all-applications', async (req, res) => {
  try {
    const apps = await SchemeApplication.find().sort({ appliedAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// 7. Cancel Application
router.delete('/cancel/:farmerEmail/:schemeId', async (req, res) => {
  try {
    const { farmerEmail, schemeId } = req.params;

    const deletedApp = await SchemeApplication.findOneAndDelete({
      farmerEmail,
      schemeId
    });

    if (!deletedApp) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({ message: "Application cancelled successfully" });
  } catch (err) {
    console.error("Scheme Cancellation Error:", err);
    res.status(500).json({ error: "Failed to cancel application" });
  }
});

module.exports = router;