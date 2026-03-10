const express = require('express');
const router = express.Router();
const Product = require('../models/Products');

// Start Bidding (Farmer only)
router.post('/start/:productId', async (req, res) => {
    try {
        const { durationMinutes, basePrice } = req.body;
        const endTime = new Date(Date.now() + durationMinutes * 60000);

        const updateData = {
            isBiddingActive: true,
            biddingEndTime: endTime,
            currentBid: basePrice || 0,
            bids: []
        };

        // If farmer provided a custom base price, update the formal product price too
        if (basePrice) {
            updateData.price = basePrice;
        }

        const product = await Product.findByIdAndUpdate(
            req.params.productId,
            updateData,
            { new: true }
        );


        // Emit socket event (handled in server.js)
        req.app.get('socketio').emit('biddingStarted', product);

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Place Bid (Buyer only)
router.post('/bid/:productId', async (req, res) => {
    try {
        const { bidderId, bidderName, amount } = req.body;
        const product = await Product.findById(req.params.productId);

        if (!product.isBiddingActive || new Date() > new Date(product.biddingEndTime)) {
            return res.status(400).json({ message: "Bidding is not active or has ended" });
        }

        if (amount <= product.currentBid) {
            return res.status(400).json({ message: "Bid must be higher than current bid" });
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.productId, {
            currentBid: amount,
            highestBidder: bidderId,
            highestBidderName: bidderName,
            $push: { bids: { bidder: bidderId, bidderName, amount, timestamp: new Date() } }
        }, { new: true });

        req.app.get('socketio').emit('bidUpdated', updatedProduct);

        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
