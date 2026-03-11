/*
Unit Tests for GovtScheme Model:
- Saves valid scheme successfully
- Fails when required fields are missing
- Verifies MongoDB schema validation
*/

const mongoose = require('mongoose');
const GovtScheme = require('../models/GovtScheme');

beforeAll(async () => {
  
});

afterEach(async () => {
  await GovtScheme.deleteMany();
});

afterAll(async () => {
  
});

describe('GovtScheme Model', () => {

  test('should save valid govt scheme', async () => {
    const scheme = new GovtScheme({
      name: 'PM Kisan',
      benefit: 'Financial support',
      minLand: 1,
      maxLand: 5,
      description: 'Income support scheme'
    });

    const saved = await scheme.save();

    expect(saved._id).toBeDefined();
    expect(saved.createdAt).toBeDefined();
  });

  test('should fail if required fields are missing', async () => {
    const scheme = new GovtScheme({
      name: 'Invalid Scheme'
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
