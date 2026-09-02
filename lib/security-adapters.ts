import { AuthPayload } from "../type/common.type";

/**
 * Enforces enterprise geographic scope boundaries for database queries.
 * This takes raw incoming `where` clauses and automatically intercepts
 * and forces them to remain within the user's mapped zone and ward boundaries.
 */
export function applyGeoScope(user: AuthPayload, whereClause: any = {}) {
    // 1. Privileged users bypass geographic filters entirely
    if (user.isPrivilegedUser || user.zone_ward_scopes === "ALL") {
        return whereClause;
    }

    const scopes = user.zone_ward_scopes || [];

    // If user has zero scopes assigned, forcefully return empty results
    if (scopes.length === 0) {
        return {
            ...whereClause,
            zone_id: -1, // Impossible to match
            ward_id: -1,
        };
    }

    // 2. Build Prisma OR conditions
    // Each scope is a logical OR: (zone = X AND ward IN (A,B)) OR (zone = Y)

    const scopeConditions = scopes.map((scope: any) => {
        const condition: any = { zone_id: scope.zone_id };
        if (scope.wards && scope.wards.length > 0) {
            condition.ward_id = { in: scope.wards };
        }
        return condition;
    });

    // 3. Inject safely into incoming whereClause
    // Shallow copy root, deep copy AND array to prevent mutating shared references
    const augmentedWhere = { ...whereClause };

    augmentedWhere.AND = augmentedWhere.AND 
        ? (Array.isArray(augmentedWhere.AND) ? [...augmentedWhere.AND] : [augmentedWhere.AND])
        : [];

    // Add the boundary security logic safely to the query
    augmentedWhere.AND.push({ OR: scopeConditions });

    return augmentedWhere;
}
