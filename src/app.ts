import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import masterRouter from '../route/app.route';

const app = express();

// Swagger Setup
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger-output.json');

export const createApp = () => {
    // 1. Core Middlewares
    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        exposedHeaders: ['Content-Disposition'],
    }));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // 2. Rate Limiters
    // Login: max 20 attempts per IP per 15 minutes (brute-force protection)
    app.use('/api/auth/login', rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Too many login attempts. Please try again after 15 minutes.'
        }
    }));

    // Refresh token: max 30 per 15 minutes per IP
    app.use('/api/auth/refresh', rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 30,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many refresh requests.' }
    }));

    // 3. Static Files & Documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    // app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

    const isProduction = process.env.NODE_ENV === 'production';
    const uploadsPath = isProduction
        ? path.join(__dirname, '..', '..', 'uploads')  // production path
        : path.join(__dirname, '..', 'uploads');       // local path

    app.use("/uploads", express.static(uploadsPath));

    // 4. Routing Layer
    app.use(masterRouter);

    // 5. Global Error Handler
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || 'Internal server error';

        // Log full error server-side
        console.error(`[${new Date().toISOString()}] [ERROR] ${req.method} ${req.originalUrl} →`, err);

        res.status(status).json({
            success: false,
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    });

    return app;
};

export default app;
