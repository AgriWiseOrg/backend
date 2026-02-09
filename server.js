const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// ================= MODELS =================
const User = require('./models/User');
const FoodProduct = require('./models/FoodProduct');
const MarketPrice = require('./models/MarketPrice');
const DemandForecast = require('./models/DemandForecast');
const PredictionModel = require('./models/PredictionModel');

// ================= ROUTE IMPORTS =================
const schemeRoutes = require('./routes/schemes');
const financeRoutes = require('./routes/finance');
const cartRoutes = require('./routes/cartroutes');
const supportRoutes = require('./routes/support');
const productRoutes = require('./routes/products');
// ================= MIDDLEWARE (CRITICAL ORDER) =================
// These must be defined BEFORE any routes to process data correctly
app.use(cors());
app.use(express.json());

// ================= API ROUTES =================
app.use('/api/schemes', schemeRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/govt-schemes', require('./routes/govtSchemes'));
app.use('/api/farming-tips', require('./routes/farmingTips'));
app.use('/api/latest-updates', require('./routes/latestUpdates'));

// ================= DATABASE CONNECTION =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🍃 MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ================= AUTHENTICATION =================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({
      email,
      password, // Reminder: Hash this with bcrypt in production!
      role: role.toLowerCase()
    });

    await user.save();
    console.log('✅ New User Registered:', email);

    res.status(201).json({
      message: 'Registration successful',
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('❌ Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.status(200).json({
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ================= AI PRICE PREDICTION =================

app.post('/api/predict-price', async (req, res) => {
  const { product, region, month } = req.body;

  try {
    // 1. Check for existing trained model
    let model = await PredictionModel.findOne({ crop: product });
    const now = new Date();

    // 2. Retrain if missing or stale (> 24 hours)
    if (!model || (now - new Date(model.lastTrained) > 24 * 60 * 60 * 1000)) {
      console.log(`🧠 Training model for ${product}...`);

      // Fetch history
      const history = await MarketPrice.find({ crop: product }).sort({ date: 1 });

      if (history.length < 2) {
        // Fallback if not enough data
        return res.json({
          product,
          predictedPrice: 0,
          currency: 'INR',
          confidence: '0% (Insufficient Data)',
          factors: { note: 'Need at least 2 historical records to predict.' }
        });
      }

      // Prepare data for Linear Regression
      // X = Time (timestamp), Y = Price
      const n = history.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

      history.forEach(record => {
        const x = new Date(record.date).getTime();
        const y = record.price;
        sumX += x;
        sumY += y;
        sumXY += (x * y);
        sumX2 += (x * x);
      });

      // Least Squares Calculation
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Save/Update Model
      if (!model) {
        model = new PredictionModel({ crop: product, slope, intercept, sampleSize: n });
      } else {
        model.slope = slope;
        model.intercept = intercept;
        model.sampleSize = n;
        model.lastTrained = now;
      }
      await model.save();
    }

    // 3. Predict Code
    // Convert target month to future timestamp
    // Assuming prediction is for current year if month is passed, or next available
    const targetDateStr = `${month} 1, ${new Date().getFullYear()}`;
    let targetTime = new Date(targetDateStr).getTime();

    // If month passed is in the past for this year, assume the user means NEXT year
    if (targetTime < Date.now()) {
      targetTime = new Date(`${month} 1, ${new Date().getFullYear() + 1}`).getTime();
    }

    const predictedPriceRaw = model.slope * targetTime + model.intercept;
    const predictedPrice = Math.max(0, Math.round(predictedPriceRaw * 100) / 100); // No negative prices

    // Confidence heuristic based on sample size
    let confidence = Math.min(95, 50 + (model.sampleSize * 2));

    res.json({
      product,
      predictedPrice,
      currency: 'INR',
      confidence: `${confidence}%`,
      factors: {
        trend: model.slope > 0 ? 'Increasing' : 'Decreasing',
        sampleSize: model.sampleSize,
        lastTrained: model.lastTrained
      }
    });

  } catch (error) {
    console.error('Prediction Error:', error);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

// ================= MARKET DATA ENDPOINTS =================

// 1. Current Market Prices (Live API)
app.get('/api/market/prices', async (req, res) => {
  try {
    const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
    const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
    const URL = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=100`;

    const response = await axios.get(URL);
    const records = response.data.records;

    const prices = records.map((record, index) => ({
      id: index + 1,
      crop: `${record.commodity} (${record.variety})`,
      mandi: `${record.market}, ${record.state}`,
      price: `₹${record.modal_price}`,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    }));

    res.json(prices);
  } catch (error) {
    console.warn('⚠️ API failed, using fallbacks');
    const fallbackPrices = [
      { id: 1, crop: 'Wheat (Sarbati)', mandi: 'Indore Mandi', price: '₹2,350', trend: 'up' },
      { id: 2, crop: 'Soybean (Yellow)', mandi: 'Ujjain Mandi', price: '₹4,800', trend: 'down' },
      { id: 3, crop: 'Rice (Basmati)', mandi: 'Karnal Mandi', price: '₹6,000', trend: 'stable' }
    ];
    res.json(fallbackPrices);
  }
});

// 2. Historical Data
app.get('/api/market/history', async (req, res) => {
  const { crop } = req.query;
  try {
    if (!crop) return res.status(400).json({ error: 'Crop parameter required' });
    const historyData = await MarketPrice.find({ crop }).sort({ date: 1 }).limit(10);
    const data = historyData.map(record => ({
      month: new Date(record.date).toLocaleString('default', { month: 'short' }),
      price: record.price
    }));
    res.json({ crop, period: '6m', data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// 3. Available Crops
app.get('/api/market/crops', async (req, res) => {
  try {
    const crops = await MarketPrice.distinct('crop');
    res.json(crops);
  } catch (error) {
    console.error('Failed to fetch crops:', error);
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

// 4. Demand Forecasts
app.get('/api/market/forecast-30-days', async (req, res) => {
  const { crop } = req.query;
  if (!crop) return res.status(400).json({ error: 'Crop parameter required' });

  try {
    // 1. Check for existing trained model
    let model = await PredictionModel.findOne({ crop });
    const now = new Date();

    // 2. Train if missing or stale
    if (!model || (now - new Date(model.lastTrained) > 24 * 60 * 60 * 1000)) {
      const history = await MarketPrice.find({ crop }).sort({ date: 1 });
      if (history.length >= 2) {
        const n = history.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        history.forEach(record => {
          const x = new Date(record.date).getTime();
          const y = record.price;
          sumX += x;
          sumY += y;
          sumXY += (x * y);
          sumX2 += (x * x);
        });
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        if (!model) {
          model = new PredictionModel({ crop, slope, intercept, sampleSize: n });
        } else {
          model.slope = slope;
          model.intercept = intercept;
          model.sampleSize = n;
          model.lastTrained = now;
        }
        await model.save();
      }
    }

    if (!model) {
      return res.json({ crop, data: [], note: 'Insufficient data to forecast' });
    }

    // 3. Generate 30-day forecast with Sine Wave + Randomness
    const forecastData = [];
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);

    // Reduced volatility (smooth sine wave with gentle randomness)
    const volatility = 0.02 + Math.random() * 0.03; // 2% to 5% range
    const waveFrequency = 0.1 + Math.random() * 0.2;
    const waveAmplitude = 100 + Math.random() * 200;
    const phaseShift = Math.random() * Math.PI * 2;

    for (let i = 0; i < 30; i++) {
      const time = currentDate.getTime();
      const linearTrend = model.slope * time + model.intercept;

      // Cyclic seasonality (Sine wave)
      const seasonality = waveAmplitude * Math.sin((waveFrequency * i) + phaseShift);

      // Reduced Random Noise (Multiplier 0.5)
      const noise = linearTrend * volatility * (Math.random() - 0.5) * 0.5;

      // Combined price
      let priceRaw = linearTrend + seasonality + noise;

      // Ensure positive price
      const predictedPrice = Math.max(0, Math.round(priceRaw * 100) / 100);

      forecastData.push({
        date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD
        price: predictedPrice
      });

      // Next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ crop, data: forecastData });

  } catch (error) {
    console.error('Forecast Error:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// 5. Demand Data (for visualization)
app.get('/api/market/demand', async (req, res) => {
  const { crop } = req.query;

  try {
    // If specific crop requested, return forecast for that crop
    if (crop) {
      const model = await PredictionModel.findOne({ crop });
      if (!model) {
        return res.json([]);
      }

      // Return simplified demand data
      res.json([{
        crop,
        demandLevel: 'Moderate',
        trend: model.slope > 0 ? 'Increasing' : 'Decreasing',
        confidence: Math.min(95, 50 + (model.sampleSize * 2))
      }]);
    } else {
      // Return general demand data
      const crops = await MarketPrice.distinct('crop');
      const demandData = crops.slice(0, 10).map(crop => ({
        crop,
        demandLevel: 'Moderate',
        trend: 'Stable'
      }));
      res.json(demandData);
    }
  } catch (error) {
    console.error('Demand Error:', error);
    res.status(500).json({ error: 'Failed to fetch demand data' });
  }
});

// 6. Quality-Based Price Calculator
app.get('/api/market/quality-price', async (req, res) => {
  const { crop, grade, moisture, damage } = req.query;

  try {
    if (!crop || !grade) {
      return res.status(400).json({ error: 'Crop and grade parameters required' });
    }

    // Get base price from most recent market data
    const recentPrice = await MarketPrice.findOne({ crop }).sort({ date: -1 });

    if (!recentPrice) {
      return res.status(404).json({ error: 'No price data found for this crop' });
    }

    // Use quality calculator utility
    const QualityCalculator = require('./utils/qualityCalculator');
    const params = {
      moisture: moisture ? parseFloat(moisture) : undefined,
      damage: damage ? parseFloat(damage) : undefined
    };

    const result = QualityCalculator.calculate(recentPrice.price, grade, params);
    res.json(result);

  } catch (error) {
    console.error('Quality Price Error:', error);
    res.status(500).json({ error: 'Failed to calculate quality price' });
  }
});

// POST version for Quality Price Calculator (used by frontend)
app.post('/api/market/quality-price', async (req, res) => {
  const { crop, grade, params } = req.body;

  try {
    if (!crop || !grade) {
      return res.status(400).json({ error: 'Crop and grade are required' });
    }

    // Get base price from most recent market data
    const recentPrice = await MarketPrice.findOne({ crop }).sort({ date: -1 });

    if (!recentPrice) {
      return res.status(404).json({ error: 'No price data found for this crop' });
    }

    // Use quality calculator utility
    const QualityCalculator = require('./utils/qualityCalculator');
    const result = QualityCalculator.calculate(recentPrice.price, grade, params || {});
    res.json(result);

  } catch (error) {
    console.error('Quality Price Error:', error);
    res.status(500).json({ error: 'Failed to calculate quality price' });
  }
});

// Cart Routes
app.use('/api/cart', cartRoutes);

// Support Routes
app.use('/api/support', supportRoutes);

// MarketPlace Products
app.use('/api/products', productRoutes);


// ================= SERVER START =================
const PORT = process.env.PORT || 5001;

// Only start server if not being imported for testing
if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
}

// Export for testing
module.exports = app;