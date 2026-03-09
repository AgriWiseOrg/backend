const request = require('supertest');
const express = require('express');
const supportRouter = require('../routes/support');
const axios = require('axios');

// Mock axios for weather API calls
jest.mock('axios');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/support', supportRouter);

describe('Weather Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/support/weather', () => {
        const mockWeatherData = {
            data: {
                current: {
                    temperature_2m: 25,
                    relative_humidity_2m: 65,
                    weather_code: 0,
                    wind_speed_10m: 10
                },
                daily: {
                    time: ['2024-02-01', '2024-02-02', '2024-02-03', '2024-02-04', '2024-02-05'],
                    temperature_2m_max: [28, 29, 27, 26, 28],
                    temperature_2m_min: [18, 19, 17, 16, 18],
                    weather_code: [0, 1, 2, 0, 1]
                },
                hourly: {
                    precipitation_probability: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
                }
            }
        };

        it('should fetch weather data with default parameters', async () => {
            axios.get.mockResolvedValue(mockWeatherData);

            const response = await request(app)
                .get('/api/support/weather')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('temp');
            expect(response.body.data).toHaveProperty('humidity');
            expect(response.body.data).toHaveProperty('wind');
            expect(response.body.data).toHaveProperty('advisory');
            expect(response.body.data).toHaveProperty('forecast');
            expect(response.body.data.forecast).toHaveLength(5);
        });

        it('should fetch weather data for specific location', async () => {
            axios.get.mockResolvedValue(mockWeatherData);

            const response = await request(app)
                .get('/api/support/weather?lat=12.9716&lon=77.5946')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.location.lat).toBe('12.9716');
            expect(response.body.data.location.lon).toBe('77.5946');
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('latitude=12.9716')
            );
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('longitude=77.5946')
            );
        });

        describe('Crop-specific advisories', () => {
            it('should provide Rice-specific advisory for high heat', async () => {
                const hotWeather = {
                    ...mockWeatherData,
                    data: {
                        ...mockWeatherData.data,
                        current: {
                            ...mockWeatherData.data.current,
                            temperature_2m: 36
                        }
                    }
                };

                axios.get.mockResolvedValue(hotWeather);

                const response = await request(app)
                    .get('/api/support/weather?crop=Rice')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.advisory).toContain('Rice requires standing water');
                expect(response.body.data.crop).toBe('Rice');
            });

            it('should provide Rice-specific advisory for rain', async () => {
                const rainyWeather = {
                    ...mockWeatherData,
                    data: {
                        ...mockWeatherData.data,
                        current: {
                            ...mockWeatherData.data.current,
                            temperature_2m: 28,
                            weather_code: 61 // Rain code
                        }
                    }
                };

                axios.get.mockResolvedValue(rainyWeather);

                const response = await request(app)
                    .get('/api/support/weather?crop=Rice')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.advisory).toContain('transplanting');
            });

            it('should provide Wheat-specific advisory for high temperature', async () => {
                const warmWeather = {
                    ...mockWeatherData,
                    data: {
                        ...mockWeatherData.data,
                        current: {
                            ...mockWeatherData.data.current,
                            temperature_2m: 30
                        }
                    }
                };

                axios.get.mockResolvedValue(warmWeather);

                const response = await request(app)
                    .get('/api/support/weather?crop=Wheat')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.advisory).toContain('Terminal heat');
                expect(response.body.data.crop).toBe('Wheat');
            });

            it('should provide Wheat-specific advisory for rain', async () => {
                const rainyWeather = {
                    ...mockWeatherData,
                    data: {
                        ...mockWeatherData.data,
                        current: {
                            ...mockWeatherData.data.current,
                            temperature_2m: 25,
                            weather_code: 55 // Rain code
                        }
                    }
                };

                axios.get.mockResolvedValue(rainyWeather);

                const response = await request(app)
                    .get('/api/support/weather?crop=Wheat')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.advisory).toContain('waterlogging');
            });

            it('should provide Tomato-specific advisory for extreme heat', async () => {
                const hotWeather = {
                    ...mockWeatherData,
                    data: {
                        ...mockWeatherData.data,
                        current: {
                            ...mockWeatherData.data.current,
                            temperature_2m: 33
                        }
                    }
                };

                axios.get.mockResolvedValue(hotWeather);

                const response = await request(app)
                    .get('/api/support/weather?crop=Tomato')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.advisory).toContain('blossom drop');
                expect(response.body.data.crop).toBe('Tomato');
            });

            it('should provide Tomato-specific advisory for rain/humidity', async () => {
                const rainyWeather = {
                    ...mockWeatherData,
                    data: {
                        ...mockWeatherData.data,
                        current: {
                            ...mockWeatherData.data.current,
                            temperature_2m: 28,
                            weather_code: 63 // Rain code
                        }
                    }
                };

                axios.get.mockResolvedValue(rainyWeather);

                const response = await request(app)
                    .get('/api/support/weather?crop=Tomato')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.advisory).toContain('Late Blight');
            });

            it('should provide general advisory for normal conditions', async () => {
                axios.get.mockResolvedValue(mockWeatherData);

                const response = await request(app)
                    .get('/api/support/weather?crop=General')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.advisory).toContain('stable');
                expect(response.body.data.level).toBe('Normal');
            });

            it('should provide critical alert for extreme heat', async () => {
                const extremeHeat = {
                    ...mockWeatherData,
                    data: {
                        ...mockWeatherData.data,
                        current: {
                            ...mockWeatherData.data.current,
                            temperature_2m: 40
                        }
                    }
                };

                axios.get.mockResolvedValue(extremeHeat);

                const response = await request(app)
                    .get('/api/support/weather?crop=General')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.advisory).toContain('Extreme heat alert');
                expect(response.body.data.level).toBe('Critical');
                expect(response.body.data.icon).toBe('🔥');
            });

            it('should provide warning for precipitation', async () => {
                const rainyWeather = {
                    ...mockWeatherData,
                    data: {
                        ...mockWeatherData.data,
                        current: {
                            ...mockWeatherData.data.current,
                            temperature_2m: 28,
                            weather_code: 61
                        }
                    }
                };

                axios.get.mockResolvedValue(rainyWeather);

                const response = await request(app)
                    .get('/api/support/weather?crop=General')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.advisory).toContain('Precipitation alert');
                expect(response.body.data.level).toBe('Warning');
                expect(response.body.data.icon).toBe('🌧️');
            });
        });

        describe('Multilingual support', () => {
            it('should return advisory in Hindi', async () => {
                axios.get.mockResolvedValue(mockWeatherData);

                const response = await request(app)
                    .get('/api/support/weather?lang=hi')
                    .expect(200);

                expect(response.body.success).toBe(true);
                // Advisory should be in Hindi for stable conditions
                expect(response.body.data.advisory).toMatch(/फसलों|स्थिर/);
            });

            it('should return advisory in Telugu', async () => {
                axios.get.mockResolvedValue(mockWeatherData);

                const response = await request(app)
                    .get('/api/support/weather?lang=te')
                    .expect(200);

                expect(response.body.success).toBe(true);
                // Advisory should be in Telugu
                expect(response.body.data.advisory).toMatch(/పంటలకు|స్థిరంగా/);
            });

            it('should return advisory in Kannada', async () => {
                axios.get.mockResolvedValue(mockWeatherData);

                const response = await request(app)
                    .get('/api/support/weather?lang=kn')
                    .expect(200);

                expect(response.body.success).toBe(true);
                // Advisory should be in Kannada
                expect(response.body.data.advisory).toMatch(/ಬೆಳೆಗಳಿಗೆ|ಸ್ಥಿರವಾಗಿವೆ/);
            });

            it('should default to English when language not specified', async () => {
                axios.get.mockResolvedValue(mockWeatherData);

                const response = await request(app)
                    .get('/api/support/weather')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.advisory).toContain('stable');
            });
        });

        describe('Error handling', () => {
            it('should handle weather API errors gracefully', async () => {
                axios.get.mockRejectedValue(new Error('Weather API unavailable'));

                const response = await request(app)
                    .get('/api/support/weather')
                    .expect(500);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Failed to fetch');
            });

            it('should handle network timeout errors', async () => {
                axios.get.mockRejectedValue(new Error('ETIMEDOUT'));

                const response = await request(app)
                    .get('/api/support/weather')
                    .expect(500);

                expect(response.body.success).toBe(false);
            });
        });

        describe('Data validation', () => {
            it('should include rain probability data', async () => {
                axios.get.mockResolvedValue(mockWeatherData);

                const response = await request(app)
                    .get('/api/support/weather')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.rainProb).toBeDefined();
                expect(Array.isArray(response.body.data.rainProb)).toBe(true);
                expect(response.body.data.rainProb.length).toBe(8);
            });

            it('should include 5-day forecast', async () => {
                axios.get.mockResolvedValue(mockWeatherData);

                const response = await request(app)
                    .get('/api/support/weather')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.forecast).toBeDefined();
                expect(response.body.data.forecast).toHaveLength(5);
                expect(response.body.data.forecast[0]).toHaveProperty('date');
                expect(response.body.data.forecast[0]).toHaveProperty('max');
                expect(response.body.data.forecast[0]).toHaveProperty('min');
                expect(response.body.data.forecast[0]).toHaveProperty('code');
            });

            it('should include current weather parameters', async () => {
                axios.get.mockResolvedValue(mockWeatherData);

                const response = await request(app)
                    .get('/api/support/weather')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.temp).toBe(25);
                expect(response.body.data.humidity).toBe(65);
                expect(response.body.data.wind).toBe(10);
                expect(response.body.data.code).toBe(0);
            });
        });
    });
});
