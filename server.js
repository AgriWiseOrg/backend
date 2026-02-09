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
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000
})
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

const PredictionEngine = require('./utils/predictionEngine');

// ================= CONSTANTS =================
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

      const history = await MarketPrice.find({ crop: product }).sort({ date: 1 });
      const trainedRecord = PredictionEngine.train(history);

      if (!trainedRecord) {
        return res.json({
          product,
          predictedPrice: 0,
          currency: 'INR',
          confidence: '0% (Insufficient Data)',
          factors: { note: 'Need at least 2 historical records to predict.' }
        });
      }

      const { slope, intercept, n } = trainedRecord;

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

    // 3. Predict Code (Using Shared Engine)
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();
    const targetMonthIndex = MONTHS.indexOf(month); // Assuming MONTHS global or find index

    // Future target date logic
    let targetYear = currentYear;
    if (targetMonthIndex < currentMonthIndex) {
      targetYear++;
    }
    const targetDateStr = `${month} 15, ${targetYear}`; // Mid-month check
    const targetTime = new Date(targetDateStr).getTime();

    // Days difference for seasonality index
    const daysDiff = Math.floor((targetTime - Date.now()) / (1000 * 60 * 60 * 24));

    // Base Linear Prediction
    const linearPrice = PredictionEngine.predictLinear(model, targetTime);

    // Add Seasonality & Noise
    const predictedPrice = PredictionEngine.addSeasonality(linearPrice, daysDiff, {
      volatility: 0.05, // Slightly higher volatility for long-term prediction
      amplitude: linearPrice * 0.1 // 10% seasonal swing
    });

    const confidence = Math.min(95, 50 + (model.sampleSize * 0.5)); // Adjusted confidence calc

    res.json({
      product,
      predictedPrice,
      currency: 'INR',
      confidence: `${Math.round(confidence)}%`,
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

// 1. Current Market Prices (Live API with DB Fallback)
app.get('/api/market/prices', async (req, res) => {
  try {
    const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
    const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
    const URL = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=100`;

    // Try External API First
    try {
      const response = await axios.get(URL, { timeout: 3000 }); // 3s timeout
      const records = response.data.records;

      if (records && records.length > 0) {
        const prices = records.map((record, index) => ({
          id: index + 1,
          crop: `${record.commodity} (${record.variety})`,
          mandi: `${record.market}, ${record.state}`,
          price: `₹${record.modal_price}`,
          trend: Math.random() > 0.5 ? 'up' : 'down'
        }));
        return res.json(prices);
      }
    } catch (apiError) {
      console.warn('⚠️ External Market API unreachable or empty, switching to DB Fallback...');
    }

    // Fallback: Fetch recent unique market prices from DB
    const recentPrices = await MarketPrice.find()
      .sort({ date: -1 })
      .limit(50);

    if (recentPrices.length === 0) {
      throw new Error('No data in DB');
    }

    const prices = recentPrices.map((record, index) => ({
      id: index + 1,
      crop: record.crop, // Clean name
      mandi: `${record.market}, ${record.state}`,
      price: `₹${record.price}`,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    }));

    res.json(prices);

  } catch (error) {
    console.error('❌ Market Price Error:', error.message);
    const fallbackPrices = [
      { id: 1, crop: 'Wheat (Sarbati)', mandi: 'Indore Mandi', price: '₹2,350', trend: 'up' },
      { id: 2, crop: 'Soybean (Yellow)', mandi: 'Ujjain Mandi', price: '₹4,800', trend: 'down' },
      { id: 3, crop: 'Rice (Basmati)', mandi: 'Karnal Mandi', price: '₹6,000', trend: 'stable' }
    ];
    res.json(fallbackPrices);
  }
});

// Helper for safe regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ================= QUALITY PRICE SUGGESTION =================
const QualityPriceCalculator = require('./utils/qualityCalculator');

app.post('/api/market/quality-price', async (req, res) => {
  const { crop, grade, params } = req.body;

  if (!crop || !grade) {
    return res.status(400).json({ error: 'Crop and Grade are required' });
  }

  try {
    // 1. Get base price from DB (Avg of last 10 records for this crop)
    const recentRecords = await MarketPrice.find({ crop: new RegExp(escapeRegExp(crop), 'i') })
      .sort({ date: -1 })
      .limit(10);

    let basePrice = 2000; // Default fallback if no data

    if (recentRecords.length > 0) {
      const sum = recentRecords.reduce((acc, curr) => acc + curr.price, 0);
      basePrice = sum / recentRecords.length;
    }

    // 2. Calculate
    const result = QualityPriceCalculator.calculate(basePrice, grade, params);

    res.json({
      crop,
      ...result,
      currency: 'INR'
    });

  } catch (error) {
    console.error('Quality Calc Error:', error);
    res.status(500).json({ error: 'Failed to calculate quality price' });
  }
});

// 2. Historical Data
app.get('/api/market/history', async (req, res) => {
  const { crop } = req.query;
  try {
    if (!crop) return res.status(400).json({ error: 'Crop parameter required' });
    // Use regex for case-insensitive match
    const historyData = await MarketPrice.find({ crop: new RegExp(escapeRegExp(crop), 'i') }).sort({ date: 1 }).limit(10);
    const data = historyData.map(record => ({
      month: new Date(record.date).toLocaleString('default', { month: 'short' }),
      price: record.price
    }));
    res.json({ crop, period: '6m', data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// 3. Demand Forecasts
app.get('/api/market/demand', async (req, res) => {
  try {
    const demandData = await DemandForecast.find({});
    res.json(demandData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demand forecasts' });
  }
});

// 4. Unique Crops List
app.get('/api/market/crops', async (req, res) => {
  try {
    const crops = await MarketPrice.distinct('crop');
    // If no crops in DB, return a default list or empty
    if (crops.length === 0) {
      return res.json(['Wheat', 'Rice', 'Corn', 'Potato', 'Tomato', 'Onion', 'Soybean']);
    }
    res.json(crops.sort());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crops list' });
  }
});

// 4. 30-Day Price Forecast (Restored with PredictionEngine)
app.get('/api/market/forecast-30-days', async (req, res) => {
  const { crop } = req.query;
  if (!crop) return res.status(400).json({ error: 'Crop parameter required' });

  try {
    // Reuse existing model or retrain (similar logic to above, omitted for brevity, assume model exists or let predict-price handle training)
    // Quick check model
    let model = await PredictionModel.findOne({ crop });

    if (!model) {
      // Auto-train if model doesn't exist
      const history = await MarketPrice.find({ crop: new RegExp(escapeRegExp(crop), 'i') }).sort({ date: 1 });

      const trainedRecord = PredictionEngine.train(history);

      if (!trainedRecord) {
        return res.json({ crop, data: [], note: 'Insufficient data to generate forecast.' });
      }

      const { slope, intercept, n } = trainedRecord;

      // Save the model (cache for faster future access)
      model = new PredictionModel({
        crop,
        slope,
        intercept,
        sampleSize: n,
        lastTrained: new Date()
      });
      await model.save();
    }

    const forecastData = [];
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);

    for (let i = 0; i < 30; i++) {
      const time = currentDate.getTime();

      const linearPrice = PredictionEngine.predictLinear(model, time);
      const predictedPrice = PredictionEngine.addSeasonality(linearPrice, i, {
        volatility: 0.02,
        amplitude: linearPrice * 0.03 // 3% seasonal swing for daily forecast
      });

      forecastData.push({
        date: currentDate.toISOString().split('T')[0],
        price: predictedPrice
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ crop, data: forecastData });

  } catch (error) {
    console.error('Forecast Error:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// Cart Routes
app.use('/api/cart', cartRoutes);

// Support Routes
app.use('/api/support', supportRoutes);

// MarketPlace Products
app.use('/api/products', productRoutes);


// ================= SERVER START =================
// ================= SERVER START =================
const PORT = process.env.PORT || 5001;

if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
}

module.exports = app;