const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

// Assuming you have STRIPE_SECRET_KEY in your .env
// We initialize it here. If it's missing, it will throw an error when used,
// which is a good reminder to add it.
let stripe;
try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
} catch (error) {
    console.error("Stripe initialization failed. Missing STRIPE_SECRET_KEY in .env");
}

router.post('/create-checkout-session', async (req, res) => {
    try {
        const { items, email } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // Format cart items for Stripe line_items
        const lineItems = items.map((item) => ({
            price_data: {
                currency: 'inr',
                product_data: {
                    name: item.crop,
                    description: `Sold by: ${item.farmerName || item.farmer || "Verified Farmer"}`
                },
                // Stripe requires amounts in the smallest currency unit (paise for INR, cents for USD)
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        // --- MOCK CHECKOUT FALLBACK ---
        // If the user hasn't put their real Stripe Key in .env, we skip actual Stripe to prevent crashing
        // and instantly simulate a successful checkout redirect so they can test the workflow.
        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
            console.log("Mocking Stripe Checkout (Missing real STRIPE_SECRET_KEY)");
            return res.status(200).json({
                id: "mock_session_123",
                url: `http://localhost:5173/payment?success=true&session_id=mock_session_123`
            });
        }

        // --- REAL STRIPE CHECKOUT ---
        // Create Checkout Sessions from body params
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: email, // Pre-fill customer email
            line_items: lineItems,
            mode: 'payment',
            // Success URL passes success=true so our frontend knows to clear the cart and create the Order
            success_url: `http://localhost:5173/payment?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:5173/payment?success=false`,
        });

        res.status(200).json({ id: session.id, url: session.url });
    } catch (error) {
        console.error("STRIPE SESSION CREATE ERROR:", error);
        res.status(500).json({ message: "Failed to initialize checkout", error: error.message });
    }
});

module.exports = router;
