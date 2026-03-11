/*
Unit Tests for Scheme Model:
- Saves valid scheme with default values
- Verifies timestamps & default color
- Fails if required fields are missing
*/

const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');

beforeAll(async () => {
  
});

afterEach(async () => {
  await Scheme.deleteMany();
});

afterAll(async () => {
  
});

describe('Scheme Model', () => {

  test('should save valid scheme with defaults', async () => {
    const scheme = new Scheme({
      name: 'PM Kisan',
      benefit: '₹6000/year',
      minLand: 1,
      maxLand: 5,
      type: 'Govt',
      interest: '0%',
      tag: 'Popular',
      description: 'Income support'
    });

    const saved = await scheme.save();

    expect(saved._id).toBeDefined();
    expect(saved.color).toBe('emerald');
    expect(saved.createdAt).toBeDefined();
    expect(saved.updatedAt).toBeDefined();
  });

  test('should fail if name is missing', async () => {
    const scheme = new Scheme({
      benefit: '₹6000/year'
    });

    let err;
    try {
      await scheme.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

});
