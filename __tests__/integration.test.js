const request = require('supertest');
const server = require('../server');
const mongoose = require('mongoose');

describe('Backend Integration Tests', () => {
  // Test user data
  const testUser = {
    email: 'integration_test@example.com',
    password: 'password123',
    role: 'farmer',
    phone: '1234567890'
  };

  afterAll(async () => {
    // Cleanup the user we created
    const User = require('../models/User');
    await User.deleteOne({ email: testUser.email });
  });

  describe('Authentication Flow Integration', () => {
    it('Should register a new user', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send(testUser);
      
      // Cleanup might not have finished from previous runs if aborted, so handle 201 or 400 cleanly
      if (res.statusCode === 201) {
        expect(res.body.success || res.body.message).toBeDefined();
      } else {
        expect(res.statusCode).toBe(400); // Already exists
      }
    });

    it('Should login with registered user', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
    });
  });

  describe('Support/Complaint Flow Integration', () => {
    it('Should submit a support query to the database', async () => {
      const res = await request(server)
        .post('/api/support/query')
        .send({
          name: 'Integration Tester',
          email: testUser.email,
          subject: 'Integration Help',
          message: 'This is a test message from supertest.',
          language: 'en'
        })
        .expect(200);
      
      expect(res.body.success).toBe(true);
    });

    it('Should retrieve the submitted support query', async () => {
      const res = await request(server)
        .get(`/api/support/my-reports?email=${testUser.email}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[res.body.data.length - 1].subject).toBe('Integration Help');
    });
  });

  describe('Market Data Integration', () => {
    it('Should fetch available crops from market endpoint', async () => {
      const res = await request(server)
        .get('/api/market/crops')
        .expect(200);
        
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
