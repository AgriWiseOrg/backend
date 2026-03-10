const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const User = require('../models/User');

// 1. GET ALL PRODUCTS (For Marketplace.jsx)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        console.error("GET Products Error:", error);
        res.status(500).json({ message: "Error fetching marketplace data", error: error.message });
    }
});

// 2. GET PRODUCTS BY FARMER (For MyCrops.jsx Inventory)
router.get('/farmer/:farmerId', async (req, res) => {
    try {
        const products = await Product.find({ farmerId: req.params.farmerId });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Error fetching your crops", error: error.message });
    }
});

// 3. CREATE NEW PRODUCT (The fix for your "Infinite Loading")
router.post('/', async (req, res) => {
    try {
        // Ensure data types are correct before saving
        const productData = {
            ...req.body,
            price: Number(req.body.price),
            quantity: Number(req.body.quantity),
            // Important: If frontend only sends 'name', we map it to 'crop' for the schema
            crop: req.body.crop || req.body.name
        };

        const newProduct = new Product(productData);
        const savedProduct = await newProduct.save();

        // This response tells the frontend to stop the loading spinner
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error("POST Product Error:", error);
        // We MUST send a response here or the frontend loads forever
        res.status(400).json({ message: "Validation failed", error: error.message });
    }
});

// 4. UPDATE PRODUCT
router.put('/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: "Update failed", error: error.message });
    }
});

// 6. ADD REVIEW
router.post('/:id/review', async (req, res) => {
    try {
        const { rating, comment, userId, userEmail } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Fetch user profile for name
        const user = await User.findById(userId);
        const displayName = user?.profile?.name || userEmail || "Verified Buyer";

        const review = {
            user: displayName,
            userId,
            rating: Number(rating),
            comment,
            date: new Date()
        };

        product.reviews.push(review);

        // Update average rating
        const totalRating = product.reviews.reduce((sum, item) => sum + item.rating, 0);
        product.rating = totalRating / product.reviews.length;

        await product.save();
        res.status(201).json({ message: "Review added", product });
    } catch (error) {
        console.error("Review Error:", error);
        res.status(400).json({ message: "Failed to add review", error: error.message });
    }
});

// 7. DELETE PRODUCT
router.delete('/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting product", error: error.message });
    }
});

module.exports = router;