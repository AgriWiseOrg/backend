const QualityPriceCalculator = require('../utils/qualityCalculator');

describe('QualityPriceCalculator Utility', () => {

    test('should return base price when no quality params provided', () => {
        const result = QualityPriceCalculator.calculate(2000, 'B', {});
        expect(result.suggestedPrice).toBe(2000);
        expect(result.adjustmentFactor).toBe(1.0);
    });

    test('should apply premium for Grade A', () => {
        const result = QualityPriceCalculator.calculate(1000, 'A', {});
        expect(result.suggestedPrice).toBe(1100); // +10%
        expect(result.adjustmentFactor).toBe(1.1);
    });

    test('should apply penalty for Grade C', () => {
        const result = QualityPriceCalculator.calculate(1000, 'C', {});
        expect(result.suggestedPrice).toBe(900); // -10%
        expect(result.adjustmentFactor).toBe(0.9);
    });

    test('should apply moisture penalty manually', () => {
        // Moisture > 14 gets penalized. 16 means 2% excess => 4% penalty
        const result = QualityPriceCalculator.calculate(1000, 'B', { moisture: 16 });
        // Base 1.0 - (16-14)*0.02 = 1.0 - 0.04 = 0.96
        expect(result.adjustmentFactor).toBeCloseTo(0.96);
        expect(result.suggestedPrice).toBe(960);
        expect(result.notes).toEqual(expect.arrayContaining([expect.stringMatching(/High Moisture/)]));
    });

    test('should apply damage penalty', () => {
        // Damage > 2 gets penalized. 5 means 3% excess => 3% penalty
        const result = QualityPriceCalculator.calculate(1000, 'B', { damage: 5 });
        // Base 1.0 - (5-2)*0.01 = 1.0 - 0.03 = 0.97
        expect(result.adjustmentFactor).toBeCloseTo(0.97);
        expect(result.suggestedPrice).toBe(970);
    });

    test('should cap minimum price adjustment at 50%', () => {
        // Extreme bad quality
        const result = QualityPriceCalculator.calculate(1000, 'C', { moisture: 50, damage: 50 });
        // Should not go below 0.5
        expect(result.adjustmentFactor).toBe(0.5);
        expect(result.suggestedPrice).toBe(500);
    });
});
