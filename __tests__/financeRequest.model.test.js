/*
Unit Tests for FinanceRequest Model:
- Saves valid finance request
- Checks default status & applied date
- Fails if required fields are missing
*/

const mongoose = require('mongoose');
const FinanceRequest = require('../models/FinanceRequest');

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/finance_test');
});

afterEach(async () => {
  await FinanceRequest.deleteMany();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('FinanceRequest Model', () => {

  test('should save valid finance request', async () => {
    const data = new FinanceRequest({
      farmerEmail: 'farmer@test.com',
      schemeName: 'Kisan Credit'
    });

    const saved = await data.save();

    expect(saved._id).toBeDefined();
    expect(saved.status).toBe('Pending');
    expect(saved.appliedAt).toBeDefined();
  });

  test('should fail if farmerEmail is missing', async () => {
    const data = new FinanceRequest({
      schemeName: 'Kisan Credit'
    });

    let err;
    try {
      await data.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

  test('should fail if schemeName is missing', async () => {
    const data = new FinanceRequest({
      farmerEmail: 'farmer@test.com'
    });

    let err;
    try {
      await data.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

});
