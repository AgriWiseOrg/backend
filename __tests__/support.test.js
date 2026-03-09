const request = require('supertest');
const express = require('express');
const supportRouter = require('../routes/support');
const Complaint = require('../models/Complaint');

// Mock the Complaint model
jest.mock('../models/Complaint');

// Mock axios for weather API calls
jest.mock('axios');
const axios = require('axios');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/support', supportRouter);

describe('Support Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/support/query', () => {
        it('should submit a general support query successfully', async () => {
            const mockQuery = {
                name: 'Test Farmer',
                email: 'farmer@test.com',
                subject: 'Need help with crops',
                message: 'How do I deal with pests?',
                language: 'en'
            };

            Complaint.prototype.save = jest.fn().mockResolvedValue({
                _id: 'mock-id',
                type: 'query',
                userName: mockQuery.name,
                userEmail: mockQuery.email,
                subject: mockQuery.subject,
                details: { message: mockQuery.message, language: mockQuery.language }
            });

            const response = await request(app)
                .post('/api/support/query')
                .send(mockQuery)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('query has been received');
            expect(Complaint.prototype.save).toHaveBeenCalled();
        });

        it('should handle query submission with missing name', async () => {
            const mockQuery = {
                email: 'farmer@test.com',
                subject: 'Test',
                message: 'Test message',
                language: 'en'
            };

            Complaint.prototype.save = jest.fn().mockResolvedValue({});

            const response = await request(app)
                .post('/api/support/query')
                .send(mockQuery)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should handle database errors gracefully', async () => {
            const mockQuery = {
                name: 'Test Farmer',
                email: 'farmer@test.com',
                subject: 'Test',
                message: 'Test message'
            };

            Complaint.prototype.save = jest.fn().mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/api/support/query')
                .send(mockQuery)
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Failed to save query');
        });
    });

    describe('POST /api/support/dispute', () => {
        it('should submit a dispute successfully', async () => {
            const mockDispute = {
                name: 'Test Farmer',
                email: 'farmer@test.com',
                buyerName: 'Test Buyer',
                orderId: 'ORD-123',
                issue: 'Delayed Payment',
                details: 'Payment not received for 30 days'
            };

            Complaint.prototype.save = jest.fn().mockResolvedValue({
                _id: 'mock-id',
                type: 'dispute',
                userName: mockDispute.name,
                userEmail: mockDispute.email,
                subject: `Dispute: ${mockDispute.issue}`,
                details: {
                    buyerName: mockDispute.buyerName,
                    orderId: mockDispute.orderId,
                    issue: mockDispute.issue,
                    details: mockDispute.details
                }
            });

            const response = await request(app)
                .post('/api/support/dispute')
                .send(mockDispute)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Dispute has been registered');
            expect(Complaint.prototype.save).toHaveBeenCalled();
        });

        it('should handle dispute submission errors', async () => {
            const mockDispute = {
                name: 'Test Farmer',
                email: 'farmer@test.com',
                buyerName: 'Test Buyer',
                orderId: 'ORD-123',
                issue: 'Quality Dispute',
                details: 'Product quality not as agreed'
            };

            Complaint.prototype.save = jest.fn().mockRejectedValue(new Error('Save failed'));

            const response = await request(app)
                .post('/api/support/dispute')
                .send(mockDispute)
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Failed to register dispute');
        });
    });

    describe('GET /api/support/all-reports', () => {
        it('should fetch all reports successfully', async () => {
            const mockReports = [
                {
                    _id: '1',
                    type: 'query',
                    userName: 'Farmer 1',
                    userEmail: 'farmer1@test.com',
                    subject: 'Test Query',
                    status: 'pending',
                    createdAt: new Date()
                },
                {
                    _id: '2',
                    type: 'dispute',
                    userName: 'Farmer 2',
                    userEmail: 'farmer2@test.com',
                    subject: 'Test Dispute',
                    status: 'in-progress',
                    createdAt: new Date()
                }
            ];

            Complaint.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockReports)
            });

            const response = await request(app)
                .get('/api/support/all-reports')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(Complaint.find).toHaveBeenCalled();
        });

        it('should handle fetch errors', async () => {
            Complaint.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            const response = await request(app)
                .get('/api/support/all-reports')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Failed to fetch reports');
        });
    });

    describe('PUT /api/support/:id/status', () => {
        it('should update complaint status successfully', async () => {
            const mockUpdatedReport = {
                _id: 'test-id',
                type: 'query',
                userName: 'Test Farmer',
                status: 'resolved',
                updatedAt: Date.now()
            };

            Complaint.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedReport);

            const response = await request(app)
                .put('/api/support/test-id/status')
                .send({ status: 'resolved' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('resolved');
            expect(Complaint.findByIdAndUpdate).toHaveBeenCalledWith(
                'test-id',
                expect.objectContaining({ status: 'resolved' }),
                { new: true }
            );
        });

        it('should handle update errors', async () => {
            Complaint.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));

            const response = await request(app)
                .put('/api/support/test-id/status')
                .send({ status: 'resolved' })
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Failed to update status');
        });
    });

    describe('GET /api/support/my-reports', () => {
        it('should fetch user-specific reports successfully', async () => {
            const mockReports = [
                {
                    _id: '1',
                    type: 'query',
                    userName: 'Test Farmer',
                    userEmail: 'farmer@test.com',
                    subject: 'My Query',
                    status: 'pending',
                    createdAt: new Date()
                }
            ];

            Complaint.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockReports)
            });

            const response = await request(app)
                .get('/api/support/my-reports?email=farmer@test.com')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(Complaint.find).toHaveBeenCalledWith({ userEmail: 'farmer@test.com' });
        });

        it('should return error when email is missing', async () => {
            const response = await request(app)
                .get('/api/support/my-reports')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Email is required');
        });

        it('should handle fetch errors', async () => {
            Complaint.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            const response = await request(app)
                .get('/api/support/my-reports?email=farmer@test.com')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Failed to fetch user reports');
        });
    });

    describe('GET /api/support/advisory', () => {
        it('should fetch advisories successfully', async () => {
            const response = await request(app)
                .get('/api/support/advisory')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('category');
            expect(response.body[0]).toHaveProperty('message');
        });
    });
});
