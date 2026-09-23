import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../src/core/types";
import { AuthPayload } from "../type/common.type";

// ================================================================
// ARCHITECTURE: Two-Tier Permission Model
//
// TIER 1 — GATEWAY (this middleware):
//   "Does this user BELONG to this module?"
//   → Checks if the user has ANY permission for the module (e.g. PROPERTY:VIEW)
//   → If YES → pass through to controller
//   → If NO  → 403 Access Denied
//
// TIER 2 — CONTROLLER (enforced inside each controller):
//   "Can this user perform THIS specific action?"
//   → Controllers check req.user.permissions for PROPERTY:ADD, PROPERTY:DELETE etc.
//   → UI also reads permissions to show/hide buttons
//
// WHY: HTTP verbs (POST/GET/PUT) don't map 1:1 with business actions.
//   A POST to /property/reAssessment/get-propertyData is a READ, not an ADD.
//   Only the developer knows the business intent — not the HTTP method.
// ================================================================

// ================================================================
// PRIVILEGED USER TYPES — bypass all permission checks
// ================================================================
const PRIVILEGED_USER_TYPES = new Set(['SUPER_ADMIN', 'PROJECT_MANAGER']);
const PRIVILEGED_ROLE_NAMES = new Set(['superadmin', 'admin', 'super_admin', 'project_manager']);

// ================================================================
// INFRASTRUCTURE EXEMPT ROUTES
//
// These authenticated routes do NOT need a module permission.
// They are self-scoped inside their controllers (e.g. "get my own menu").
//
// Rules:
//  • INFRA_EXACT_EXEMPT  — full path must match (O(1) Set lookup)
//  • INFRA_PREFIX_EXEMPT — any sub-path under the prefix is exempt
// ================================================================

const INFRA_EXACT_EXEMPT: ReadonlySet<string> = new Set([
    '/api/panel/master/employee/getMenuWithEmployee-id',
    '/api/dashboard/common-stats',
    '/api/property/getAllMasterData',
    '/api/property/category-master',
    '/api/panel/master/zoneList',
    '/api/panel/master/wardList',
]);

const INFRA_PREFIX_EXEMPT: readonly string[] = [
    '/api/panel/notifications',
    '/api/panel/master/ward-list',
    '/api/project',
];

function isInfraExempt(rawPath: string): boolean {
    const path = rawPath.split('?')[0];
    if (INFRA_EXACT_EXEMPT.has(path)) return true;
    return INFRA_PREFIX_EXEMPT.some(p => path === p || path.startsWith(p + '/'));
}

// ================================================================
// MODULE RESOLVER
// Extracts the module name from the URL path.
// /api/property/... → "PROPERTY"
// /api/water/...    → "WATER"
// /api/panel/...    → "PANEL"
// ================================================================
export const resolveModuleFromPath = (req: AuthenticatedRequest): string | null => {
    let path = req.originalUrl.split('?')[0];
    path = path.replace(/^\/api\//, '').replace(/^\/|\/$/g, '');
    const segments = path.split('/').filter(Boolean);
    if (!segments.length) return null;
    return segments[0].toUpperCase();
};

// ================================================================
// PERMISSION DNA RESOLVER
// Generates all possible permission candidates for a given request.
// Used to check if user holds ANY of these permissions.
//
// Strategy: Module-first matching.
//   1. MODULE:*          — wildcard module access
//   2. MODULE:VIEW       — any VIEW permission grants module gateway access
//   3. MODULE:ADD        — any ADD permission grants module gateway access
//   4. MODULE:EDIT       — etc.
//   5. (any valid MODULE:ACTION combination)
//
// The gateway only checks if the user "belongs" to this module.
// Fine-grained actions are enforced inside controllers.
// ================================================================
export const resolvePermissionDNA = (req: AuthenticatedRequest): string[] => {
    const module = resolveModuleFromPath(req);
    if (!module) return [];

    // All valid module-level access candidates
    // Having ANY of these grants access through the gateway
    const candidates: string[] = [
        `${module}:*`,
        `${module}:VIEW`,
        `${module}:ADD`,
        `${module}:EDIT`,
        `${module}:DELETE`,
        `${module}:PAYMENT`,
        `${module}:APPROVE`,
        `${module}:REJECT`,
        `${module}:EXPORT`,
        `${module}:PRINT`,
        `${module}:VERIFY`,
    ];

    return candidates;
};

// ================================================================
// Dynamic Permission Middleware
// Applied ONCE at the router level — covers all protected routes.
// Implements the GATEWAY tier of the Two-Tier permission model.
// ================================================================
export const dynamicCheckPermission = () =>
    (req: AuthenticatedRequest, res: Response, next: Function) => {
        const user = req.user as AuthPayload;

        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // 1. Privileged bypass — SUPER_ADMIN and PROJECT_MANAGER skip all checks
        const currentUserType = (req.userType || (user as any).userType || '').toUpperCase();
        const userTypePrivileged = PRIVILEGED_USER_TYPES.has(currentUserType);

        const hasPrivilegedRole = user.roles?.some(r => {
            const normalized = r.toUpperCase().replace(/[-_\s]/g, '');
            return Array.from(PRIVILEGED_ROLE_NAMES).some(p => p.toUpperCase().replace(/[-_\s]/g, '') === normalized);
        });

        const isPrivileged = userTypePrivileged || hasPrivilegedRole || (user as any).isPrivilegedUser === true;
        if (isPrivileged) return next();

        // 2. Infrastructure route check — authenticated but no module permission needed.
        if (isInfraExempt(req.originalUrl)) return next();

        // 3. Resolve which module this request targets
        const module = resolveModuleFromPath(req);
        if (!module) return next(); // Can't determine module — pass through

        // 4. Check if user has ANY permission for this module (gateway check)
        const userPerms = new Set(
            (user.permissions ?? [])
                .map((p: any) => (typeof p === 'string' ? p : p?.name)?.toUpperCase())
                .filter(Boolean)
        );

        // User passes gateway if they have at least one permission for this module
        const hasModuleAccess = Array.from(userPerms).some(perm => {
            if (!perm.includes(':')) return false;
            const [permModule] = perm.split(':');
            return permModule === module;
        });

        if (hasModuleAccess) return next();

        // 5. Denied — user has no permissions for this module at all
        console.warn(
            `[DNA Denied] userId=${user.userId} | module=${module} | url=${req.originalUrl} | userPerms=[${Array.from(userPerms).join(', ')}]`
        );

        return res.status(403).json({
            success: false,
            message: 'Access Denied',
            module,
            hint: `You need at least one ${module}:ACTION permission to access this module's APIs.`
        });
    };

// ================================================================
// ACTION CHECKER (for use inside controllers)
// Use this to enforce fine-grained action control inside controllers.
//
// Usage:
//   import { hasPermission } from '../middleware/dynamicPermission';
//   if (!hasPermission(req, 'PROPERTY:ADD')) return res.status(403)...
// ================================================================
export const hasPermission = (req: AuthenticatedRequest, permission: string): boolean => {
    const user = req.user as AuthPayload;
    if (!user) return false;

    // Privileged users bypass action checks too
    if (PRIVILEGED_USER_TYPES.has((user as any).userType ?? '') || (user as any).isPrivilegedUser) {
        return true;
    }

    const userPerms = new Set(
        (user.permissions ?? [])
            .map((p: any) => (typeof p === 'string' ? p : p?.name)?.toUpperCase())
            .filter(Boolean)
    );

    const [module] = permission.toUpperCase().split(':');
    return userPerms.has(permission.toUpperCase()) || userPerms.has(`${module}:*`);
};


