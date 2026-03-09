const PredictionEngine = {
    /**
     * Predicts price based on linear regression model
     * @param {Object} model - { slope, intercept }
     * @param {number} time - detailed timestamp
     * @returns {number} Predicted linear price
     */
    predictLinear: (model, time) => {
        return model.slope * time + model.intercept;
    },

    /**
     * Adds seasonality (Sine Wave) and noise to a base price
     * @param {number} basePrice - The linear trend price
     * @param {number} dayIndex - Index for sine wave calculation
     * @param {Object} params - { variety, volatility }
     * @returns {number} Final predicted price
     */
    addSeasonality: (basePrice, dayIndex, params = {}) => {
        const volatility = params.volatility ?? 0.03; // 3% default volatility
        const waveAmplitude = params.amplitude ?? (basePrice * 0.05); // 5% amplitude
        const waveFrequency = params.frequency ?? 0.1;
        const phaseShift = params.phase ?? 0;

        // Cyclic seasonality (Sine wave)
        const seasonality = waveAmplitude * Math.sin((waveFrequency * dayIndex) + phaseShift);

        // Random Noise
        const noise = basePrice * volatility * (Math.random() - 0.5);

        return Math.max(0, Math.round((basePrice + seasonality + noise) * 100) / 100);
    },

    /**
     * Back-calculates a historical price that would result in the current price
     * @param {number} currentPrice - The target current price
     * @param {Date} targetDate - The date for the historical point
     * @param {Date} currentDate - The anchor date (today)
     * @returns {number} Historical price
     */
    backcastPrice: (currentPrice, targetDate, currentDate) => {
        const timeDiffCheck = currentDate.getTime() - targetDate.getTime();
        const daysDiff = Math.floor(timeDiffCheck / (1000 * 60 * 60 * 24));

        // Simulating a general upward trend of inflation/growth (e.g. 5% per year)
        // So history should be cheaper than today
        const yearlyInflation = 0.05;
        const inflationFactor = 1 - (yearlyInflation * (daysDiff / 365));

        const basePrice = currentPrice * inflationFactor;

        // Apply same seasonality logic but in reverse time
        // We use daysDiff as the index to keep waves consistent
        return PredictionEngine.addSeasonality(basePrice, daysDiff, {
            volatility: 0.02, // Lower volatility for history to look "cleaner"
            amplitude: currentPrice * 0.02 // Smaller waves for history
        });
    },

    /**
     * Performs linear regression on historical data
     * @param {Array} history - Array of { date, price } objects
     * @returns {Object} { slope, intercept, n }
     */
    train: (history) => {
        const n = history.length;
        if (n < 2) return null;

        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

        history.forEach(record => {
            const x = new Date(record.date).getTime();
            const y = record.price;
            sumX += x;
            sumY += y;
            sumXY += (x * y);
            sumXX += (x * x);
        });

        const denominator = (n * sumXX - sumX * sumX);
        if (denominator === 0) return null;

        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept, n };
    }
};

module.exports = PredictionEngine;
