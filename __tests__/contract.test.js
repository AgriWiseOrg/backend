const request = require('supertest');
const server = require('../server');

describe('API Contract Regression Tests', () => {
  describe('Market Endpoints Schema', () => {
    it('Should adhere exactly to the /api/market/crops response schema', async () => {
      const res = await request(server).get('/api/market/crops').expect(200);
      
      // Expected Schema: Array of strings
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(typeof res.body[0]).toBe('string');
      }
    });

    it('Should adhere exactly to /api/market/demand response schema', async () => {
      // Pass crop so we get the single array response
      const res = await request(server).get('/api/market/demand?crop=Wheat').expect(200);
      
      // Expected Schema: Array of objects with specific shapes
      expect(Array.isArray(res.body)).toBe(true);
      
      // Standard Demand Forecast object contract
      const demandSchema = expect.objectContaining({
        crop: expect.any(String),
        currentDemand: expect.any(Number),
        projectedDemand: expect.any(Number),
        demandLevel: expect.stringMatching(/High|Medium|Low/),
        percentage: expect.any(Number),
        trend: expect.stringMatching(/up|down/),
        note: expect.any(String)
      });
      
      if (res.body.length > 0) {
        expect(res.body[0]).toEqual(demandSchema);
      }
    });
  });

  describe('Weather Endpoint Schema', () => {
    it('Should adhere exactly to /api/support/weather response schema', async () => {
      // Mock the native Node fetch for the OpenWeatherMap upstream response
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            list: [
              {
                main: { temp: 28, humidity: 65, temp_max: 30, temp_min: 20 },
                wind: { speed: 12 },
                weather: [{ id: 800, main: 'Clear' }],
                pop: 0.1,
                dt: 1700000000
              }
            ]
          })
        })
      );

      const res = await request(server).get('/api/support/weather?lat=28.6&lon=77.2');
      
      // Top Level Contract
      expect(res.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.any(Object)
      }));

      // Internal Data Contract
      const weatherDataSchema = expect.objectContaining({
        temp: expect.any(Number),
        humidity: expect.any(Number),
        wind: expect.any(Number),
        advisory: expect.any(String),
        rainProb: expect.arrayContaining([expect.any(Number)]),
        forecast: expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(String),
            min: expect.any(Number),
            max: expect.any(Number),
            code: expect.any(Number)
          })
        ])
      });

      expect(res.body.data).toEqual(weatherDataSchema);
    });
  });
});
