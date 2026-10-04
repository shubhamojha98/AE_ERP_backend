import "dotenv/config";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuditAction, UserStatus } from "../generated/panel";
import { panel } from "../lib/globalprimsaclient";
import { AccessContext, can, getAccessContext } from "../dal/access.dal";

const SECRET_KEY: string = process.env.JWT_SECRET ?? "";
if (SECRET_KEY.length < 32) throw new Error("JWT_SECRET missing or shorter than 32 characters");

export const ACCESS_TOKEN_TTL = "2h";

/** Kept small: permissions are loaded from DB on every request, so role changes apply instantly. */
export type AccessTokenPayload = {
  uid: number; // user id
  sid: string; // session public_id
  cid: number | null; // active company id
  tv: number; // user.token_version
};

export type AuthUser = AccessContext & { sessionId: string };

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  userId?: number;
  companyId?: number | null;
}

export const signAccessToken = (payload: AccessTokenPayload) =>
  jwt.sign(payload, SECRET_KEY, { expiresIn: ACCESS_TOKEN_TTL, algorithm: "HS256" });

const deny = (res: Response, status: number, error: string) => {
  res.status(status).json({ success: false, error });
};

/**
 * Enterprise Auth Middleware
 * Verifies JWT → checks session & user in DB → loads company permissions into req.user
 */
export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return deny(res, 401, "Authorization token missing or malformed");

  const token = authHeader.slice(7).replace(/^["']|["']$/g, "").trim();

  let decoded: AccessTokenPayload;
  try {
    decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }) as AccessTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return deny(res, 401, "Token has expired");
    return deny(res, 401, "Invalid token");
  }

  try {
    const session = await panel.userSession.findUnique({
      where: { public_id: decoded.sid },
      select: {
        user_id: true,
        active_company_id: true,
        revoked_at: true,
        expires_at: true,
        user: { select: { token_version: true, status: true, deleted_at: true, locked_until: true } },
      },
    });

    const now = new Date();
    if (
      !session ||
      session.user_id !== decoded.uid ||
      session.revoked_at ||
      session.expires_at < now ||
      session.user.deleted_at ||
      session.user.status !== UserStatus.ACTIVE ||
      (session.user.locked_until && session.user.locked_until > now) ||
      session.user.token_version !== decoded.tv ||
      session.active_company_id !== decoded.cid
    ) {
      return deny(res, 401, "Session expired. Please login again.");
    }

    const ctx = await getAccessContext(decoded.uid, decoded.cid);
    if (!ctx.isSuperAdmin && (decoded.cid == null || !ctx.companyUserId)) {
      return deny(res, 403, "No access to this company");
    }

    req.user = { ...ctx, sessionId: decoded.sid };
    req.userId = ctx.userId;
    req.companyId = ctx.companyId;
    next();
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Auth Error:`, err);
    return deny(res, 500, "Internal server error");
  }
};

/** router.post("/quotations/:id/approve", authMiddleware, requirePermission("sales.quotations.approve"), handler) */
export const requirePermission =
  (...codes: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (user && codes.every((c) => can(user, c))) return next();

    panel.auditLog
      .create({
        data: {
          user_id: user?.userId,
          company_id: user?.companyId,
          action: AuditAction.DENIED,
          permission_code: codes.join(","),
          entity_type: "route",
          entity_id: `${req.method} ${req.originalUrl}`,
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
        },
      })
      .catch((e) => console.error("[requirePermission] audit failed", e));

    return deny(res, 403, "You do not have permission for this action");
  };

export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void =>
  req.user?.isSuperAdmin ? next() : deny(res, 403, "Super admin only");