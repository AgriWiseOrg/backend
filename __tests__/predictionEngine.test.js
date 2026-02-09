const PredictionEngine = require('../utils/predictionEngine');

describe('PredictionEngine Utility', () => {

    // 1. Linear Prediction
    test('predictLinear should return correct y for y = mx + c', () => {
        const model = { slope: 2, intercept: 5 };
        const result = PredictionEngine.predictLinear(model, 10); // 2*10 + 5
        expect(result).toBe(25);
    });

    // 2. Seasonality
    test('addSeasonality should add sine wave component', () => {
        const basePrice = 100;
        const dayIndex = 0;
        // At day 0 with phase 0, sin(0) is 0. So result should be base + noise
        // Since noise is random, it's hard to test exact value, but we can check range
        // Volatility 0 means no noise
        const result = PredictionEngine.addSeasonality(basePrice, dayIndex, {
            volatility: 0,
            amplitude: 10,
            frequency: 1,
            phase: 0
        });
        expect(result).toBe(100);
    });

    test('addSeasonality should peak with sine wave', () => {
        const basePrice = 100;
        // peaks at pi/2 for standard sine
        // frequency = 1, phase = 0 => sin(1*x) => x=pi/2 approx 1.57
        const dayIndex = Math.PI / 2;
        const result = PredictionEngine.addSeasonality(basePrice, dayIndex, {
            volatility: 0,
            amplitude: 10,
            frequency: 1
        });
        // 100 + 10*1 = 110
        expect(result).toBeCloseTo(110);
    });

    // 3. Training (Linear Regression)
    test('train should calculate slope and intercept correctly', () => {
        // y = 2x + 1
        // Points: (1, 3), (2, 5), (3, 7)
        // Note: train expects date objects and uses getTime().
        // Let's use timestamps 1, 2, 3 ms for simplicity mocking Date
        const history = [
            { date: new Date(1), price: 3 },
            { date: new Date(2), price: 5 },
            { date: new Date(3), price: 7 }
        ];

        const result = PredictionEngine.train(history);
        expect(result).not.toBeNull();
        expect(result.n).toBe(3);
        expect(result.slope).toBeCloseTo(2);
        expect(result.intercept).toBeCloseTo(1);
    });

    test('train should return null for insufficient data', () => {
        const history = [{ date: new Date(), price: 100 }];
        const result = PredictionEngine.train(history);
        expect(result).toBeNull();
    });

    test('train should handle vertical line (infinite slope) gracefully', () => {
        // x values same, division by zero
        const history = [
            { date: new Date(1000), price: 10 },
            { date: new Date(1000), price: 20 }
        ];
        // denominator sumXX - sumX*sumX/n will be 0
        const result = PredictionEngine.train(history);
        expect(result).toBeNull();
    });
});
