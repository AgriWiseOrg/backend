const express = require('express');
const router = express.Router();
const Product = require('../models/Products');

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

// 5. DELETE PRODUCT
router.delete('/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting product", error: error.message });
    }
});

module.exports = router;