const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET all orders for a specific farmer mail
router.get('/farmer/:email', async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();
        const orders = await Order.find({ farmerEmail: email }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("GET FARMER ORDERS ERROR:", error);
        res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
});

// UPDATE order status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error("UPDATE ORDER STATUS ERROR:", error);
        res.status(500).json({ message: "Error updating order status", error: error.message });
    }
});

module.exports = router;
