// import { config } from 'dotenv'
// import type { Request, Response, NextFunction } from "express"
// import jwt, { type JwtPayload } from "jsonwebtoken"
// import { TenantContext } from '../src/core/TenantContext';
// import { UserType } from '../generated/panel';
// import { AuthPayload } from "../type/common.type";

// config()

// const SECRET_KEY = process.env.JWT_SECRET
// import { AuthenticatedRequest } from '../src/core/types';
// export { AuthenticatedRequest };

// /**
//  * Enterprise Auth Middleware
//  * Handles JWT verification and injects Tenant/User context
//  */
// export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
//     const authHeader = req.headers.authorization

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//         res.status(401).json({ error: "Authorization token missing or malformed" })
//         return
//     }

//     const token = authHeader.split(" ")[1].replace(/^["']|["']$/g, '').trim()
//     try {
//         if (!SECRET_KEY) {
//             throw new Error("JWT secret key is not defined")
//         }

//         const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;

//         // Inject Core Context into Express Request
//         req.userId = decoded.userId;
//         req.userType = decoded.userType as UserType;
//         req.user = decoded as AuthPayload;

//         // Run Tenant Isolation Middleware
//         TenantContext.middleware(req, res, () => {
//             next();
//         });

//     } catch (err) {
//         console.error(`[${new Date().toISOString()}] Auth Error:`, err);

//         if (err instanceof jwt.TokenExpiredError) {
//             res.status(401).json({ error: "Token has expired" })
//             return
//         }

//         if (err instanceof jwt.JsonWebTokenError) {
//             res.status(401).json({ error: "Invalid token" })
//             return
//         }

//         res.status(500).json({ error: "Internal server error" })
//     }
// }


import { Request, Response, NextFunction } from "express";
import { firebaseAuth } from "../config/firebase";

export interface AuthenticatedRequest extends Request {
    user?: {
        uid: string;
        email?: string;
        name?: string;
    };
}

export const authMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is required",
            });
        }

        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split("Bearer ")[1]
            : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format",
            });
        }

        const decodedToken = await firebaseAuth.verifyIdToken(token);

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
        };

        next();
    } catch (error) {
        console.error("Firebase token verification failed:", error);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
