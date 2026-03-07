const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

// 1. GET USER CART
router.get('/:email', async (req, res) => {
    try {
        const email = req.params.email;
        if (!email) return res.status(400).json({ message: "Email is required" });

        // Standardize to lowercase for search
        const cart = await Cart.findOne({ userEmail: email.toLowerCase() });

        if (!cart) {
            return res.status(200).json({ items: [] });
        }

        res.status(200).json(cart);
    } catch (error) {
        console.error("GET CART ERROR:", error);
        res.status(500).json({ message: "Error fetching cart", error: error.message });
    }
});

// 2. ADD/UPDATE CART
router.post('/add', async (req, res) => {
    try {
        // Log incoming data to help debug
        console.log("Adding to cart for:", req.body.email);

        if (!req.body.email || !req.body.product) {
            return res.status(400).json({ message: "Email and Product data are required" });
        }

        const email = req.body.email.toLowerCase();
        const { product } = req.body;

        // Ensure every field required by your Model is present
        const productItem = {
            productId: String(product.id || product.productId),
            crop: product.crop || "Unknown Crop",
            price: Number(product.price) || 0,
            quantity: 1,
            imageUrl: product.imageUrl || "",
            farmerName: product.farmerName || "Verified Local Farmer"
        };

        let cart = await Cart.findOne({ userEmail: email });

        if (cart) {
            // Check if product exists using String comparison to avoid type errors
            const itemIndex = cart.items.findIndex(p => String(p.productId) === String(productItem.productId));

            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += 1;
            } else {
                cart.items.push(productItem);
            }

            cart.markModified('items');
            await cart.save();
        } else {
            // Create a new cart document if none exists
            cart = await Cart.create({
                userEmail: email,
                items: [productItem]
            });
        }

        res.status(201).json(cart);
    } catch (error) {
        // This log will show the exact reason for the 500 error in your terminal
        console.error("BACKEND POST ERROR:", error);
        res.status(500).json({ message: "Error adding to cart", error: error.message });
    }
});

// 3. REMOVE ITEM
router.post('/remove', async (req, res) => {
    try {
        const email = req.body.email.toLowerCase();
        const { productId } = req.body;

        let cart = await Cart.findOne({ userEmail: email });
        if (cart) {
            cart.items = cart.items.filter(item => String(item.productId) !== String(productId));
            await cart.save();
        }
        res.status(200).json(cart);
    } catch (error) {
        console.error("REMOVE ITEM ERROR:", error);
        res.status(500).json({ message: "Error removing item", error: error.message });
    }
});

// 4. CLEAR CART (After Successful Payment)
router.delete('/clear/:email', async (req, res) => {
    try {
        const email = req.params.email;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const cart = await Cart.findOne({ userEmail: email.toLowerCase() });

        if (cart) {
            cart.items = [];
            await cart.save();
        }

        res.status(200).json({ message: "Cart cleared successfully" });
    } catch (error) {
        console.error("CLEAR CART ERROR:", error);
        res.status(500).json({ message: "Error clearing cart", error: error.message });
    }
});

module.exports = router;