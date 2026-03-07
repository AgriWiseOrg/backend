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

// GET all orders for a specific buyer email
router.get('/buyer/:email', async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();
        const orders = await Order.find({ buyerEmail: email }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("GET BUYER ORDERS ERROR:", error);
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

// GET single order by ID
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.status(200).json(order);
    } catch (error) {
        console.error("GET ORDER ERROR:", error);
        res.status(500).json({ message: "Error fetching order details", error: error.message });
    }
});

// CREATE new orders from Cart (Split by Farmer)
router.post('/', async (req, res) => {
    try {
        const { buyerEmail, items } = req.body;

        if (!buyerEmail || !items || items.length === 0) {
            return res.status(400).json({ message: "Buyer email and items are required" });
        }

        // Group cart items by farmer email
        const ordersByFarmer = {};

        items.forEach(item => {
            // Fallback for missing farmer info
            const farmerEmail = item.farmerEmail || `${item.farmerName ? item.farmerName.replace(/\s+/g, '').toLowerCase() : 'verifiedfarmer'}@agriwise.com`;

            if (!ordersByFarmer[farmerEmail]) {
                ordersByFarmer[farmerEmail] = {
                    farmerName: item.farmerName || "Verified Farmer",
                    items: [],
                    totalAmount: 0
                };
            }
            ordersByFarmer[farmerEmail].items.push(item);
            ordersByFarmer[farmerEmail].totalAmount += (item.price * item.quantity);
        });

        // Create individual Order documents for each farmer
        const createdOrders = [];
        for (const [farmerEmail, data] of Object.entries(ordersByFarmer)) {
            const newOrder = new Order({
                buyerEmail,
                farmerEmail,
                items: data.items,
                totalAmount: data.totalAmount,
                status: 'Pending'
            });
            await newOrder.save();
            createdOrders.push(newOrder);
        }

        res.status(201).json({
            message: "Orders created successfully",
            orders: createdOrders
        });

    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);
        res.status(500).json({ message: "Error creating orders", error: error.message });
    }
});

module.exports = router;
