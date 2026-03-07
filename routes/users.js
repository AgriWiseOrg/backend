const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET User Profile
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

// UPDATE User Profile
router.put('/:id', async (req, res) => {
    try {
        const { profile } = req.body;

        // Ensure the profile object is being updated
        if (!profile) {
            return res.status(400).json({ error: 'Profile data is required' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { profile: profile } },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Server error updating profile' });
    }
});

module.exports = router;
