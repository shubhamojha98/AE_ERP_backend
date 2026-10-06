import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { DataScope } from "../generated/panel";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
console.log(JWT_SECRET);
if (JWT_SECRET.length < 32)
  throw new Error("JWT_SECRET missing or shorter than 32 characters");

export const ACCESS_TOKEN_TTL = (process.env.JWT_EXPIRES_IN ??
  "8h") as `${number}h`;

// Ye sab JWT ke andar jaata hai
export type TokenPayload = {
  userId: number;
  username: string;
  name: string;
  isSuperAdmin: boolean;
  company: { id: number; code: string; name: string } | null; // active company
  companyUserId: number | null;
  roles: string[]; // ["SALES_MANAGER"]
  dataScope: DataScope | null; // SELF / TEAM / COMPANY / COMPANY_TREE
  permissions: string[]; // ["sales.quotations.view", "sales.quotations.approve", ...]
};

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const signToken = (payload: TokenPayload) =>
  jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
    algorithm: "HS256",
  });

const deny = (res: Response, status: number, error: string) => {
  res.status(status).json({ success: false, error });
};

// Token check karo aur req.user me user ki saari details daal do
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return deny(res, 401, "Authorization token missing");

  try {
    const { iat, exp, ...user } = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as TokenPayload & {
      iat: number;
      exp: number;
    };
    req.user = user;
    next();
  } catch (err) {
    return deny(
      res,
      401,
      err instanceof jwt.TokenExpiredError
        ? "Token has expired"
        : "Invalid token",
    );
  }
};

// Route par permission check: requirePermission("sales.quotations.approve")
export const requirePermission =
  (...codes: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (
      user &&
      (user.isSuperAdmin ||
        codes.every((code) => user.permissions.includes(code)))
    )
      return next();
    return deny(res, 403, "You do not have permission for this action");
  };

// Sirf super admin ke liye
export const requireSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.isSuperAdmin) return next();
  return deny(res, 403, "Super admin only");
};
