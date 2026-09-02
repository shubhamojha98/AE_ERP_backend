import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../src/core/types";
import { AuthPayload } from "../type/common.type";
import { permission } from "process";
import { error } from "console";

/**
 * Advanced Permission Middleware
 * Supports:
 * 1. Exact Match: 'PROPERTY:VIEW'
 * 2. Wildcard Match: 'PROPERTY:*' (Gives access to all PROPERTY sub-actions)
 * 3. OR Logic: ['PROPERTY:VIEW', 'PROPERTY:EDIT'] (Access if ANY match)
 */
export const checkPermission = (requiredPermission: string | string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const user = req.user as AuthPayload;

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // 1. SUPER ADMIN BYPASS (Ultimate Power)
        if (user.roles?.includes("super-admin")) {
            return next();
        }

        // 2. Ensure user has permissions array and normalize to strings
        const rawPermissions = user.permissions || [];
        const userPermissions: string[] = Array.isArray(rawPermissions)
            ? rawPermissions.map((p: any) => (typeof p === "string" ? p : p?.name)).filter(Boolean)
            : [];

        // 3. Normalize required permissions to an array
        const requiredPermissionsArray = Array.isArray(requiredPermission)
            ? requiredPermission
            : [requiredPermission];

        console.log(`[Permission Check] Route: ${req.originalUrl}, Required: ${requiredPermissionsArray.join(" OR ")}, User Permissions: ${userPermissions.length} items`);

        // 4. Check for Permissions (Exact or Wildcard)
        const hasPermission = requiredPermissionsArray.some((required) => {
            const requiredUpper = required.toUpperCase();

            // A. Exact Match
            if (userPermissions.some(p => p.toUpperCase() === requiredUpper)) return true;

            // B. Wildcard Match (e.g., 'PROPERTY:VIEW' is allowed if user has 'PROPERTY:*')
            const parts = requiredUpper.split(/[:_]/);
            if (parts.length > 1) {
                const modulePrefix = parts[0];
                const wildcards = [`${modulePrefix}:*`, `${modulePrefix}_*`, `${modulePrefix}:ALL`, `${modulePrefix}_ALL`];
                if (userPermissions.some(p => wildcards.includes(p.toUpperCase()))) {
                    return true;
                }
            }

            return false;
        });

        if (!hasPermission) {
            console.warn(`[Permission Denied] User ${user.userId} missing: ${requiredPermissionsArray.join(" or ")}`);
            return res.status(403).json({
                message: `Access Denied. Required permission: ${requiredPermissionsArray.join(" or ")}`,
            });
        }

        next();
    };
};
