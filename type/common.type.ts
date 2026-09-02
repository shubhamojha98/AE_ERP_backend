
export type pagination = {
    next?: {
        page: number
        take: number
    }
    prev?: {
        page: number
        take: number
    }
    currentPage?: number
    currentTake?: number
    totalPage?: number
    totalResult?: number
}

/**
 * JWT Payload — matches exactly what auth.controller.login() signs.
 * permissions[] format: "MODULE:ACTION"  e.g. ["PROPERTY:VIEW", "WATER:ADD"]
 */
export interface AuthPayload {
    userId:          number;
    userType:        string;                                          // 'SUPER_ADMIN' | 'PROJECT_MANAGER' | 'ULB_ADMIN' | 'ULB_USER'
    isPrivilegedUser: boolean;
    email:           string | null;
    roles:           string[];                                        // role names e.g. ["Tax Inspector"]
    permissions:     string[];                                        // "MODULE:ACTION" strings e.g. ["PROPERTY:VIEW"]
    zone_ward_scopes?: Array<{ zone_id: number; wards: number[] }> | "ALL"; // Geographic restrictions
    ulbs:            Array<{ id: number; name: string; name_hindi?: string | null }>;
    companyId?:      number;
    sessionToken?:   string;
    iat:             number;
    exp:             number;
}