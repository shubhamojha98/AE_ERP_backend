import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import type { ClientRequest } from "http";

const microservices = JSON.parse(process.env.MICROSERVICES || '{}');

/**
 * Middleware to handle proxying requests to microservices based on the :service parameter.
 */
export const microserviceProxy = (req: Request, res: Response, next: NextFunction) => {
    const serviceName = req.params.service;
    const serviceUrl = microservices[serviceName];

    if (serviceUrl) {
        return createProxyMiddleware({
            target: serviceUrl,
            changeOrigin: true,
            logger: console,
            pathRewrite: (path, req) => {
                const serviceReq = req as Request;
                const rewritten = path.replace(new RegExp(`^/api/service/${serviceName}`), '');
                const finalUrl = serviceUrl + rewritten;

                console.log(`[Proxy] ${serviceReq.method} ${serviceReq?.originalUrl} → ${finalUrl}`);
                return rewritten;
            },
            onProxyReq: (proxyReq: ClientRequest, req: Request) => {
                if (req.headers["authorization"]) {
                    proxyReq.setHeader("authorization", req.headers["authorization"]);
                }
            },
            logLevel: 'debug',
        } as Options)(req, res, next);
    } else {
        res.status(404).json({ error: `Service '${serviceName}' not found` });
    }
};
