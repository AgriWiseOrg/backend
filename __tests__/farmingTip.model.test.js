/*
Unit Tests for FarmingTip Model:
- Saves valid tip with default values
- Verifies default fields are set
- Fails if required fields are missing
*/


const mongoose = require('mongoose');
const FarmingTip = require('../models/FarmingTip');

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/farmingtip_test');
});

afterEach(async () => {
  await FarmingTip.deleteMany();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('FarmingTip Model', () => {

  test('should save valid farming tip with defaults', async () => {
    const tip = new FarmingTip({
      title: 'Watering crops',
      desc: 'Water early in the morning'
    });

    const saved = await tip.save();

    expect(saved._id).toBeDefined();
    expect(saved.iconType).toBe('sprout');
    expect(saved.color).toBe('text-green-600');
    expect(saved.category).toBe('General');
    expect(saved.createdAt).toBeDefined();
  });

  test('should fail if title is missing', async () => {
    const tip = new FarmingTip({
      desc: 'Some description'
    });

    let err;
    try {
      await tip.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

  test('should fail if desc is missing', async () => {
    const tip = new FarmingTip({
      title: 'Missing desc'
    });

    let err;
    try {
      await tip.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

});
