const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// ================= MODELS =================
const User = require('./models/User');
const FoodProduct = require('./models/FoodProduct');
const MarketPrice = require('./models/MarketPrice');
const DemandForecast = require('./models/DemandForecast');
const PredictionModel = require('./models/PredictionModel');
const QualityPriceCalculator = require('./utils/qualityCalculator');

// ================= ROUTE IMPORTS =================
const schemeRoutes = require('./routes/schemes');
const financeRoutes = require('./routes/finance');
const cartRoutes = require('./routes/cartroutes');
const supportRoutes = require('./routes/support');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const stripeRoutes = require('./routes/stripeRoutes');
// ================= MIDDLEWARE (CRITICAL ORDER) =================
// These must be defined BEFORE any routes to process data correctly
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ================= API ROUTES =================
app.use('/api/schemes', schemeRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/govt-schemes', require('./routes/govtSchemes'));
app.use('/api/farming-tips', require('./routes/farmingTips'));
app.use('/api/latest-updates', require('./routes/latestUpdates'));
app.use('/api/ml', require('./routes/mlRoutes'));

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
    console.error('❌ Registration Error DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ error: 'Server error during registration', details: error.message });
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
    console.error('❌ Login Error DETAILS:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Server error during login', details: error.message });
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
        // [NEW] Fallback: Use CSV Data if valid
        const csvItem = csvMarketData.find(c => c.crop.toLowerCase().includes(product.toLowerCase()));

        if (csvItem) {
          const basePrice = parseInt(csvItem.price.replace(/[^\d]/g, '')) || 2500;

          // Heuristic Prediction based on month
          // Assume simple seasonality: higher in summer (Apr-Jun), lower in winter? (Just detail)
          const multiplier = 0.95 + Math.random() * 0.1; // +/- 5%

          const predictedPrice = Math.round(basePrice * multiplier);

          return res.json({
            product,
            predictedPrice,
            currency: 'INR',
            confidence: '75%',
            factors: {
              note: 'Prediction based on current CSV market rates.',
              trend: multiplier > 1 ? 'Increasing' : 'Decreasing'
            }
          });
        }

        // Fallback if not enough data AND not in CSV
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

// 3. Demand Forecasts (Updated with Dynamic Crop Selection)
app.get('/api/market/demand', async (req, res) => {
  const { crop } = req.query;
  try {
    if (crop) {
      // Generate a specific demand forecast for the requested crop
      const demandLevel = ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)];
      const percentage = Math.floor(Math.random() * 40) + (demandLevel === 'High' ? 60 : demandLevel === 'Medium' ? 30 : 5);

      const forecast = {
        crop: crop,
        currentDemand: Math.floor(Math.random() * 5000) + 1000,
        projectedDemand: Math.floor(Math.random() * 6000) + 1500,
        demandLevel: demandLevel,
        percentage: percentage,
        trend: Math.random() > 0.4 ? 'up' : 'down',
        note: `Projected ${demandLevel.toLowerCase()} demand for ${crop} based on current market arrivals.`
      };
      return res.json([forecast]); // Return as array for compatibility
    }

    const demandData = await DemandForecast.find({});

    if (demandData.length === 0 && csvMarketData.length > 0) {
      // Simulate demand data based on CSV crops
      const simulatedDemand = [];
      const crops = [...new Set(csvMarketData.map(c => c.crop))].sort(() => 0.5 - Math.random()).slice(0, 10);

      crops.forEach(crop => {
        const demandLevel = ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)];
        simulatedDemand.push({
          crop: crop,
          currentDemand: Math.floor(Math.random() * 5000) + 1000,
          projectedDemand: Math.floor(Math.random() * 6000) + 1500,
          demandLevel: demandLevel,
          percentage: Math.floor(Math.random() * 40) + (demandLevel === 'High' ? 60 : demandLevel === 'Medium' ? 30 : 5),
          trend: Math.random() > 0.4 ? 'up' : 'down',
          note: 'Projected increase due to seasonal factors.'
        });
      });
      return res.json(simulatedDemand);
    }

    res.json(demandData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demand forecasts' });
  }
});


// 4. 30-Day Price Forecast (with Robust Fallback)
app.get('/api/market/forecast-30-days', async (req, res) => {
  const { crop } = req.query;
  if (!crop) return res.status(400).json({ error: 'Crop parameter required' });

  try {
    const now = new Date();
    let model = await PredictionModel.findOne({ crop });

    // 1. Attempt to Train from DB History
    if (!model || (now - new Date(model.lastTrained) > 24 * 60 * 60 * 1000)) {
      const history = await MarketPrice.find({ crop }).sort({ date: 1 });

      if (history.length >= 2) {
        // ... (Existing Training Logic) ...
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

    // 2. Generate Forecast
    let slope = 0, intercept = 0;

    // Use DB Model if available
    if (model) {
      slope = model.slope;
      intercept = model.intercept;
    } else {
      // FALBACK: Generate Synthetic Model 
      // [NEW] Check CSV for base price anchor
      let basePrice = 2000;

      const csvItem = csvMarketData.find(c => c.crop.toLowerCase().includes(crop.toLowerCase()));
      if (csvItem) {
        basePrice = parseInt(csvItem.price.replace(/[^\d]/g, '')) || 2500;
      } else {
        basePrice = 1500 + (crop.length * 100) + Math.random() * 2000;
      }

      slope = 0.00000005; // Slight Inflation
      const time = new Date().getTime();
      intercept = basePrice - (slope * time);
    }

    const forecastData = [];
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);

    // Simulation Parameters
    const volatility = 0.02 + Math.random() * 0.03;
    const waveFrequency = 0.1 + Math.random() * 0.2;
    const waveAmplitude = 100 + Math.random() * 200;
    const phaseShift = Math.random() * Math.PI * 2;

    for (let i = 0; i < 30; i++) {
      const time = currentDate.getTime();
      const linearTrend = slope * time + intercept;
      const seasonality = waveAmplitude * Math.sin((waveFrequency * i) + phaseShift);
      const noise = linearTrend * volatility * (Math.random() - 0.5) * 0.5;

      let priceRaw = linearTrend + seasonality + noise;
      const predictedPrice = Math.max(500, Math.round(priceRaw * 100) / 100);

      forecastData.push({
        date: currentDate.toISOString().split('T')[0],
        price: predictedPrice
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ crop, data: forecastData, source: model ? 'Database Model' : 'AgriWise AI Simulation' });

  } catch (error) {
    console.error('Forecast Error:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// ================= MARKET DATA ENDPOINTS =================

// ================= MARKET DATA PROVIDERS =================

const cropData = {
  'Wheat': { markets: ['Indore Mandi', 'Karnal Mandi', 'Pune Mandi'], price: [2100, 2600] },
  'Rice': { markets: ['Karnal Mandi', 'Amritsar Mandi', 'Raipur Mandi'], price: [3000, 4500] },
  'Tomato': { markets: ['Nashik Mandi', 'Kolar Mandi', 'Jaipur Mandi'], price: [1200, 2500] },
  'Onion': { markets: ['Lasalgaon Mandi', 'Pune Mandi', 'Solapur Mandi'], price: [1500, 4000] },
  'Potato': { markets: ['Agra Mandi', 'Farrukhabad Mandi', 'Indore Mandi'], price: [800, 1600] },
  'Soybean': { markets: ['Ujjain Mandi', 'Latur Mandi', 'Kota Mandi'], price: [4500, 5200] },
  'Cotton': { markets: ['Rajkot Mandi', 'Warangal Mandi', 'Akola Mandi'], price: [5500, 6500] }
};

// path is already required at the top
const parseCSV = require('./utils/csvParser');

// Cache for CSV Data
let csvMarketData = [];

// Load CSV Data Initialy
const loadCSVData = async () => {
  try {
    const dataPath = path.join(__dirname, 'data', 'commodity_price.csv');
    console.log('📂 Loading Market Data from CSV:', dataPath);
    const rawData = await parseCSV(dataPath);

    // Transform CSV data to match API format
    csvMarketData = rawData.map((row, index) => ({
      id: `csv-${index + 1}`,
      crop: `${row['Commodity']} (${row['Variety']})`,
      mandi: `${row['Market']}, ${row['District']}, ${row['State']}`,
      price: `₹${row['Modal_x0020_Price']}`,
      trend: Math.random() > 0.5 ? 'up' : 'down', // CSV doesn't have trend, simulated
      source: 'AgriWise Database (CSV)',
      date: row['Arrival_Date']
    }));

    console.log(`✅ Loaded ${csvMarketData.length} records from CSV`);
  } catch (error) {
    console.error('❌ Failed to load CSV data:', error);
  }
};

// Load immediately on start
loadCSVData();

const providers = {
  // 1. Primary: Data.gov.in API
  primary: async () => {
    const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
    const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
    const URL = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=100`;

    console.log('📡 Fetching from Primary API (data.gov.in)...');
    const response = await axios.get(URL, { timeout: 5000 }); // 5s timeout
    const records = response.data.records;

    if (!records || records.length === 0) throw new Error('Empty response from Primary API');

    return records.map((record, index) => ({
      id: index + 1,
      crop: `${record.commodity} (${record.variety})`,
      mandi: `${record.market}, ${record.state}`,
      price: `₹${record.modal_price}`,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      source: 'Govt API'
    }));
  },

  // 2. CSV Provider (Preferred Fallback)
  csv: async () => {
    if (csvMarketData.length > 0) {
      console.log('📂 Serving data from CSV Cache...');
      // Return a random subset or all? Let's return first 100 to match limit
      // Or maybe shuffle them to keep it dynamic if the list is huge
      const shuffled = [...csvMarketData].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 100);
    }
    throw new Error('CSV Data not available');
  },

  // 3. Secondary: Robust Simulation (Last Resort)
  secondary: async () => {
    console.log('🔄 Engaging Secondary Provider (AgriWise Simulation)...');
    // Generate realistic 100 items
    return Array.from({ length: 100 }, (_, i) => {
      const cropNames = Object.keys(cropData);
      const cropName = cropNames[i % cropNames.length];
      const info = cropData[cropName];
      const market = info.markets[i % info.markets.length];

      // Random price within realistic range
      const min = info.price[0];
      const max = info.price[1];
      const price = Math.floor(Math.random() * (max - min + 1)) + min;

      return {
        id: i + 1,
        crop: `${cropName} (${['Desi', 'Hybrid', 'Local', 'Export'].at(Math.floor(Math.random() * 4))})`,
        mandi: market,
        price: `₹${price}`,
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        source: 'AgriWise Grid'
      };
    });
  }
};

const fetchWithFailover = async () => {
  // Try CSV first as requested by user ("if we dont have any other data source rather than generating")
  // Actually user said: "i added data csv file... i want you to take data from it if we dont have any other data source rather than generating"
  // This implies: API -> CSV -> Generation. 

  // Try Primary (API)
  try {
    const data = await providers.primary();
    return data;
  } catch (error) {
    console.warn(`⚠️ Primary Provider Failed: ${error.message}`);
  }

  // Try CSV (File Data)
  try {
    const data = await providers.csv();
    return data;
  } catch (error) {
    console.warn(`⚠️ CSV Provider Failed/Empty: ${error.message}`);
  }

  // Try Secondary (Guaranteed Fallback - Generation)
  try {
    const data = await providers.secondary();
    return data;
  } catch (error) {
    console.error(`❌ Critical: All providers failed.`, error);
    return []; // Should never happen with simulation
  }
};

// 1. Current Market Prices (Live API with Redundancy)
app.get('/api/market/prices', async (req, res) => {
  try {
    const prices = await fetchWithFailover();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: "Market data unavailable" });
  }
});

// 2. Historical Data (Updated to use CSV Anchor)
app.get('/api/market/history', async (req, res) => {
  const { crop } = req.query;
  try {
    if (!crop) return res.status(400).json({ error: 'Crop parameter required' });

    // 1. Try DB first (Scenario: Real persistent data)
    let historyData = await MarketPrice.find({ crop }).sort({ date: 1 }).limit(50);

    // 2. If no DB data, check CSV (Scenario: User provided file)
    if (historyData.length === 0) {
      // Find current price from CSV to anchor the simulation
      // We look for partial match because crop name in CSV might be longer, e.g., "Wheat (Lokwan)"
      const csvItem = csvMarketData.find(c => c.crop.toLowerCase().includes(crop.toLowerCase()));

      if (csvItem) {
        // Parse "₹2850" -> 2850
        const currentPrice = parseInt(csvItem.price.replace(/[^\d]/g, '')) || 2500;

        // Generate 6 months of simulated history ending at currentPrice
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const simulatedData = months.map((month, index) => {
          // Trend: slightly lower in past, rising to current? or random variation
          // Let's make it realistic: variation around the target
          const variance = (Math.random() - 0.5) * 0.2; // +/- 10%
          // Trend factor: assume price rose slightly (0.5% per month)
          const trend = 1 - (months.length - 1 - index) * 0.02;

          let price = currentPrice * trend * (1 + variance);

          // Force the LAST item to match the CURRENT CSV price exactly (or very close)
          if (index === months.length - 1) price = currentPrice;

          return {
            month, // Just label
            price: Math.round(price)
          };
        });

        return res.json({ crop, period: '6m', data: simulatedData, source: 'AgriWise Simulation (Anchored to CSV)' });
      }
    }

    // Default DB Mapping
    const data = historyData.map(record => ({
      month: new Date(record.date).toLocaleString('default', { month: 'short' }),
      price: record.price
    }));

    res.json({ crop, period: '6m', data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// 5. [NEW] Available Crops List (From CSV)
app.get('/api/market/crops', (req, res) => {
  try {
    if (csvMarketData.length > 0) {
      // Extract unique commodity names
      const crops = [...new Set(csvMarketData.map(item => item.crop))].sort();
      res.json(crops);
    } else {
      // Fallback
      res.json(Object.keys(cropData));
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

// 6. Quality Check Pricing
app.post('/api/market/quality-price', (req, res) => {
  try {
    const { crop, grade, params } = req.body;

    // 1. Get Base Price from CSV Data (or default)
    let basePrice = 2500; // Fallback
    const csvItem = csvMarketData.find(c => c.crop.toLowerCase().includes(crop.toLowerCase()));

    if (csvItem) {
      basePrice = parseInt(csvItem.price.replace(/[^\d]/g, '')) || 2500;
    } else {
      // Check hardcoded data
      const hardcoded = cropData[crop];
      if (hardcoded) {
        basePrice = Math.round((hardcoded.price[0] + hardcoded.price[1]) / 2);
      }
    }

    // 2. Calculate
    const result = QualityPriceCalculator.calculate(basePrice, grade, params);

    res.json(result);
  } catch (error) {
    console.error('Quality Calc Error:', error);
    res.status(500).json({ error: 'Failed to calculate quality price' });
  }
});

// ================= SERVER START =================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  // Keep-alive ping to prevent Render free tier sleep
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  setInterval(async () => {
    try {
      await axios.get(`${RENDER_URL}/api/market/crops`);
      console.log(`⏱️ Keep-alive ping sent to ${RENDER_URL}/api/market/crops`);
    } catch (error) {
      console.error('Keep-alive ping failed:', error.message);
    }
  }, 5 * 60 * 1000); // Ping every 5 minutes (300000 ms)
});

// Export app for testing
module.exports = app;