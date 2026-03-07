const QualityPriceCalculator = {
    /**
     * Calculates a suggested price based on quality parameters.
     * @param {number} basePrice - The current market modal price for the crop.
     * @param {string} grade - 'A', 'B', or 'C'.
     * @param {Object} params - Specific quality metrics (moisture, damage, size, etc.)
     * @returns {Object} Calculation result
     */
    calculate: (basePrice, grade, params = {}) => {
        let adjustmentFactor = 1.0;
        let notes = [];

        // 1. Grade-based Base Multiplier
        switch (grade.toUpperCase()) {
            case 'A':
                adjustmentFactor = 1.10; // +10% for premium grade
                notes.push('Premium Grade A: +10% bonus');
                break;
            case 'B':
                adjustmentFactor = 1.00; // Standard price
                notes.push('Standard Grade B: Market rate');
                break;
            case 'C':
                adjustmentFactor = 0.90; // -10% for lower grade
                notes.push('Grade C: -10% deduction');
                break;
            default:
                adjustmentFactor = 1.0;
        }

        // 2. Specific Parameter Penalties/Bonuses

        // Moisture Content (Common for grains like Wheat, Rice, Corn)
        if (params.moisture) {
            const moisture = parseFloat(params.moisture);
            if (moisture > 14) { // Standard safe moisture often ~14%
                const penalty = (moisture - 14) * 0.02; // 2% penalty per excess percentage point
                adjustmentFactor -= penalty;
                notes.push(`High Moisture (${moisture}%): -${(penalty * 100).toFixed(1)}% deduction`);
            } else if (moisture < 10) {
                // Too dry might slightly reduce weight/value but often neutral or good for storage
                // minimal impact.
            }
        }

        // Foreign Matter / Damage
        if (params.damage) {
            const damage = parseFloat(params.damage); // % of damaged grain
            if (damage > 2) {
                const penalty = (damage - 2) * 0.01; // 1% penalty per excess damage %
                adjustmentFactor -= penalty;
                notes.push(`Damage/Foreign Matter (${damage}%): -${(penalty * 100).toFixed(1)}% deduction`);
            }
        }

        // Size (e.g., for Fruits/Vegetables like Onion, Potato, Tomato)
        // Assuming size is in mm or grams, purely illustrative logic
        if (params.size === 'Large') {
            adjustmentFactor += 0.05;
            notes.push('Large Size: +5% bonus');
        }

        // 3. Final Calculation
        // Cap minimum adjustment to 50% of base price to prevent negative or zero
        adjustmentFactor = Math.max(0.5, adjustmentFactor);

        const suggestedPrice = Math.round(basePrice * adjustmentFactor);

        return {
            originalPrice: basePrice,
            suggestedPrice: suggestedPrice,
            adjustmentFactor: parseFloat(adjustmentFactor.toFixed(2)),
            qualityScore: Math.round(adjustmentFactor * 100), // simplistic score out of 100 (normalized to base)
            notes: notes
        };
    }
};

module.exports = QualityPriceCalculator;
