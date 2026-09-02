import { Request, Response } from "express";
import { PrismaClient as panelClient, UserType } from "../../generated/panel";
import { PrismaClient as dblogClient } from "../../generated/db-log";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import {
  buildUserPermissions,
  buildUserZoneWardScopes,
} from "../../dal/panel.dal";
import { sendWhatsappOtp } from "../../utility/sendWhatsappOtp";
import pointInPolygon from "../../utility/geoLocation";
// import {
//   createBlockEntry,
//   isUserBlockedInPropertyBlock,
// } from "../property/property.controller";
import socketService from "../../services/socket-service";
import { AuthenticatedRequest } from "../../src/core/types";
import { extractPayload, encryptData } from "../../lib/apiCryptography";

const panel = new panelClient();
const log = new dblogClient();

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET; // Set REFRESH_SECRET in .env separately
const REFRESH_EXPIRES = 7 * 24 * 60 * 60 * 1000; // 7 days in ms


function isPrivilegedUserCheck(
  userType: string,
  roleNames: string[] = [],
): boolean {
  if (userType === "SUPER_ADMIN" || userType === "PROJECT_MANAGER") return true;
  return roleNames.some(
    (r) => r.toLowerCase().replace(/[-_]/g, "") === "superadmin",
  );
}

/**
 * Fetch all active ULBs the user can see, using their privilege level.
 */
async function resolveAccessibleUlbs(
  isPrivileged: boolean,
  ulb_mappings: Array<{
    ulb: {
      id: number;
      name: string;
      name_hindi: string | null;
      is_active: boolean;
    };
  }>,
  orderBy: "id" | "name" = "id",
) {
  if (isPrivileged) {
    return panel.ulb_master.findMany({
      where: { deleted_at: null, is_active: true },
      select: { id: true, name: true, name_hindi: true },
      orderBy: { [orderBy]: "asc" },
    });
  }
  return ulb_mappings
    .filter((m) => m.ulb.is_active)
    .map((m) => ({
      id: m.ulb.id,
      name: m.ulb.name,
      name_hindi: m.ulb.name_hindi,
    }));
}

export function buildMenuTree(
  menus: Array<{
    id: number;
    label: string;
    path: string;
    parentId: number | null;
  }>,
) {
  const menusById = new Map<number, any>();
  const tree: any[] = [];

  // First, create placeholder entries for each menu
  menus.forEach((menu) => {
    menusById.set(menu.id, { ...menu, children: [] });
  });

  // Assign children to parent menus
  menus.forEach((menu) => {
    if (menu.parentId && menusById.has(menu.parentId)) {
      menusById.get(menu.parentId).children.push(menusById.get(menu.id));
    } else {
      tree.push(menusById.get(menu.id));
    }
  });

  return tree;
}

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password, latitude, longitude } = req.body;

    if (!username || !password) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Username and password are required",
      );
    }

    // ---------- FETCH USER (Enterprise Layer) ----------
    const user = await panel.user.findFirst({
      where: {
        OR: [{ username: username }, { phone: username }],
      },
      include: {
        ulb_mappings: {
          include: {
            ulb: {
              select: {
                id: true,
                name: true,
                name_hindi: true,
                is_active: true,
              },
            },
          },
        },
        loginAttempts: true,
      },
    });

    if (!user || user.deleted_at) {
      return genrateResponse(
        res,
        HttpStatus.Unauthorized,
        "Invalid credentials",
      );
    }

    if (!user.is_active) {
      return genrateResponse(
        res,
        HttpStatus.Forbidden,
        "Not authorized. Please contact your administrator.",
      );
    }

    // Resolve ULB Access list — using shared helper
    const isGlobalPrivileged =
      user.user_type === "SUPER_ADMIN" || user.user_type === "PROJECT_MANAGER";
    const ulbs = await resolveAccessibleUlbs(
      isGlobalPrivileged,
      user.ulb_mappings as any,
      "id",
    );

    // ---------- LOCATION CHECK (skip for super-admin/PM globally) ----------
    if (!isGlobalPrivileged) {
      if (latitude == null || longitude == null) {
        return genrateResponse(
          res,
          HttpStatus.BadRequest,
          "Latitude & Longitude required for field staff",
        );
      }

      const latNum = Number(latitude);
      const lngNum = Number(longitude);

      if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        return genrateResponse(
          res,
          HttpStatus.BadRequest,
          "Invalid coordinates",
        );
      }

      const targetUlbId = ulbs.length > 0 ? ulbs[0].id : null;
      const targetBoundary = [[1, 1], [1, 1.1], [1.1, 1.1], [1.1, 1]] as [number, number][];
      const isInside = pointInPolygon([lngNum, latNum], targetBoundary);

      if (!isInside) {
        // record / increment invalid location attempts
        let attempt = user.loginAttempts[0];

        if (!attempt) {
          await panel.tbl_login_attempts.create({
            data: {
              user_id: user.id,
              outside_location_attempts: 1,
              lastAttempt: new Date(),
              isOtpVerified: false,
            },
          });
        } else {
          const updated = await panel.tbl_login_attempts.update({
            where: { id: attempt.id },
            data: {
              outside_location_attempts: { increment: 1 },
              lastAttempt: new Date(),
            },
          });

          if (updated.outside_location_attempts >= 3) {
            const { to } = await createBlockEntry(
              user.id,
              "Invalid location attempts exceeded",
              req,
              24,
            );
            await panel.tbl_login_attempts.update({
              where: { id: attempt.id },
              data: { outside_location_blockUntil: to },
            });

            return genrateResponse(
              res,
              HttpStatus.Forbidden,
              `Account locked due to location security breach until ${to}`,
            );
          }
        }

        return genrateResponse(
          res,
          HttpStatus.Forbidden,
          "Restricted: You must be within the allowed municipal area to login.",
        );
      }
    }

    // ---------- PASSWORD CHECK ----------
    const passwordMatch = await bcrypt.compare(password, user.password);
    let attempt = user.loginAttempts[0];

    if (!passwordMatch) {
      const MAX_ATTEMPTS = 3;
      let updatedAttempt;

      if (!attempt) {
        // First-ever failure — create the record
        updatedAttempt = await panel.tbl_login_attempts.create({
          data: {
            user_id: user.id,
            attempts: 1,
            lastAttempt: new Date(),
            isOtpVerified: false,
          },
        });
      } else {
        updatedAttempt = await panel.tbl_login_attempts.update({
          where: { id: attempt.id },
          data: { attempts: { increment: 1 }, lastAttempt: new Date() },
        });
      }

      const currentAttempts = updatedAttempt.attempts;

      // ── 3 failures → send OTP and gate login behind verification
      if (currentAttempts >= MAX_ATTEMPTS) {
        if (!user.phone) {
          return genrateResponse(
            res,
            HttpStatus.Forbidden,
            "Too many failed login attempts. Contact your administrator to unlock your account.",
          );
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await panel.tbl_otp_login.create({
          data: {
            user_id: user.id,
            otp,
            msg: "Login OTP – too many failed attempts",
            mobile_no: user.phone,
          },
        });

        await panel.tbl_login_attempts.update({
          where: { id: updatedAttempt.id },
          data: {
            otp_expires: new Date(Date.now() + 5 * 60 * 1000),
            isOtpVerified: false,
            attempts: 0, // reset so next login cycle works cleanly
          },
        });

        // Non-blocking — failure here should not stop the OTP response
        sendWhatsappOtp(user.phone, "otp_services_new", [otp], "en_US").catch(
          (otpErr) =>
            console.error("[Login] OTP send failed (non-blocking):", otpErr),
        );

        return genrateResponse(
          res,
          HttpStatus.OK,
          "Too many failed attempts. An OTP has been sent to your registered phone.",
          {
            otpRequired: true,
            user: user.id, // consumed by frontend enterOtpState()
            phone: user.phone, // frontend masks to ****XXXX
            ttlSeconds: 300,
          },
        );
      }

      const remainingAttempts = MAX_ATTEMPTS - currentAttempts;
      return genrateResponse(
        res,
        HttpStatus.Unauthorized,
        `Invalid password. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining before OTP is required.`,
        { remainingAttempts },
      );
    }

    // ---------- SUCCESSFUL LOGIN ----------

    // Reset security flags
    if (attempt) {
      await panel.tbl_login_attempts.update({
        where: { id: attempt.id },
        data: {
          attempts: 0,
          outside_location_attempts: 0,
          isOtpVerified: true,
          otp_expires: null,
        },
      });
    }

    // Create Enterprise Session Context
    // Default to the first mapped ULB if not privileged
    const activeUlbId = ulbs.length > 0 ? ulbs[0].id : 0;
    const sessionToken = jwt.sign(
      { userId: user.id, ts: Date.now() },
      String(JWT_SECRET),
      { expiresIn: "8h" },
    );

    await panel.user_session_context.create({
      data: {
        user_id: user.id,
        active_ulb_id: activeUlbId,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    });

    // Audit Log
    const ipAddress =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0] ||
      req.socket.remoteAddress ||
      null;
    const userAgent = req.headers["user-agent"] || null;

    await log.tbl_user_login_logs.create({
      data: {
        username: user.username,
        password: "HIDDEN",
        userType: user.user_type,
        login_id: String(user.id),
        ip_address: ipAddress,
        user_agent: userAgent,
        ismobileDesktop: /mobile/i.test(userAgent || "") ? "mobile" : "desktop",
        entryBy: user.id,
        is_success: true,
      },
    });

    // ---------- PREPARE PAYLOAD ----------
    const roles = user.ulb_mappings.map((m) => m.role_id);
    const roleNames = await panel.role.findMany({
      where: { id: { in: roles } },
      select: { name: true },
    });

    const roleList = roleNames.map((r) => r.name);
    const isPrivilegedUser = isPrivilegedUserCheck(user.user_type, roleList);

    // Build permission set — MODULE:ACTION strings derived from role → menu_action → module
    // Privileged users bypass middleware, so they get an empty array (no JWT bloat).
    const primaryUlbId = ulbs[0]?.id ?? null;
    const permissions =
      !isPrivilegedUser && primaryUlbId
        ? await buildUserPermissions(user.id, primaryUlbId)
        : [];

    const zone_ward_scopes =
      !isPrivilegedUser && primaryUlbId
        ? await buildUserZoneWardScopes(user.id, primaryUlbId)
        : "ALL";

    const payload = {
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      ulbs,
      roles: roleList,
      permissions, // ✅ e.g. ["PROPERTY:VIEW", "WATER:ADD"]
      zone_ward_scopes,
      isPrivilegedUser,
      sessionToken,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
    };

    // Access token — short lived (2h). Refresh token handles re-auth silently.
    const accessToken = jwt.sign(payload, String(JWT_SECRET), {
      expiresIn: "2h",
    });

    // Refresh token — long lived (7 days), stored in DB for revocation control
    const refreshPayload = { userId: user.id, ulbId: primaryUlbId };
    const rawRefreshToken = jwt.sign(refreshPayload, String(REFRESH_SECRET), {
      expiresIn: "7d",
    });

    const refreshExpiry = new Date(Date.now() + REFRESH_EXPIRES);
    await panel.refresh_token.create({
      data: {
        token: rawRefreshToken,
        user_id: user.id,
        ulb_id: primaryUlbId,
        expires_at: refreshExpiry,
      },
    });

    return genrateResponse(res, HttpStatus.OK, "Login successful", {
      token: accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: "2h",
      user: payload,
    });
  } catch (err: any) {
    console.error("Enterprise Login Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "A security system error occurred during login",
    );
  }
};

export const logoutUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    const { refreshToken } = req.body;

    // Revoke the specific refresh token if provided, otherwise revoke all
    if (refreshToken) {
      await panel.refresh_token.updateMany({
        where: { token: refreshToken, user_id: userId },
        data: { is_revoked: true },
      });
    } else {
      // Full logout — revoke ALL refresh tokens for this user
      await panel.refresh_token.updateMany({
        where: { user_id: userId, is_revoked: false },
        data: { is_revoked: true },
      });
    }

    // Log the logout
    const user = await panel.user.findUnique({ where: { id: userId } });
    if (user) {
      const ip =
        req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
        req.socket.remoteAddress ||
        "";
      const device = req.headers["user-agent"] || "";
      await log.tbl_user_logout_logs.create({
        data: {
          username: user.username,
          password: "N/A",
          userType: user.user_type,
          login_id: String(userId),
          ip_address: ip,
          user_agent: device,
          entryBy: userId,
        },
      });
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Logged out successfully",
        clearToken: true,
      });
  } catch (error) {
    console.error("[Logout] Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token is required" });
    }

    // 1. Verify the refresh token JWT
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, String(REFRESH_SECRET));
    } catch {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }

    // 2. Check DB — token must exist and not be revoked
    const storedToken = await panel.refresh_token.findUnique({
      where: { token: refreshToken },
    });

    if (
      !storedToken ||
      storedToken.is_revoked ||
      storedToken.expires_at < new Date()
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Refresh token has been revoked or expired",
        });
    }

    // 3. Fetch fresh user data (role / permissions may have changed)
    const user = await panel.user.findUnique({
      where: { id: storedToken.user_id },
      include: {
        ulb_mappings: { include: { ulb: true, role: true } },
      },
    });

    if (!user || !user.is_active) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Not authorized. Please contact your administrator.",
        });
    }

    const roleNames = user.ulb_mappings
      .map((m) => (m.role as any)?.name)
      .filter(Boolean);
    const isPrivilegedUser = isPrivilegedUserCheck(user.user_type, roleNames);

    const ulbId = storedToken.ulb_id || user.ulb_mappings[0]?.ulb_id || null;
    const ulbs = await resolveAccessibleUlbs(
      isPrivilegedUser,
      user.ulb_mappings as any,
      "id",
    );

    // 4. Rebuild permissions from DB (picks up any role changes since last login)
    const permissions =
      !isPrivilegedUser && ulbId
        ? await buildUserPermissions(user.id, ulbId)
        : [];

    const zone_ward_scopes =
      !isPrivilegedUser && ulbId
        ? await buildUserZoneWardScopes(user.id, ulbId)
        : "ALL";

    const roles = roleNames;

    const accessPayload = {
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      ulbs,
      roles,
      permissions,
      zone_ward_scopes,
      isPrivilegedUser,
    };

    const newAccessToken = jwt.sign(accessPayload, String(JWT_SECRET), {
      expiresIn: "2h",
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: { token: newAccessToken, user: accessPayload },
    });
  } catch (error) {
    console.error("[RefreshToken] Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};


export const switchUlb = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user!;
    const data = extractPayload(req.body);
    const ulbId = Number(data?.ulb_id);

    if (!ulbId || isNaN(ulbId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid ulb_id is required" });
    }

    // 1. Fetch fresh user from DB (never rely on stale JWT data)
    const freshUser = await panel.user.findUnique({
      where: { id: currentUser.userId },
      include: {
        ulb_mappings: {
          include: {
            ulb: {
              select: {
                id: true,
                name: true,
                name_hindi: true,
                is_active: true,
              },
            },
            role: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!freshUser || !freshUser.is_active) {
      return res
        .status(401)
        .json({ success: false, message: "User not found or inactive" });
    }

    const freshRoleNames = freshUser.ulb_mappings
      .map((m) => m.role?.name)
      .filter(Boolean) as string[];
    const isPrivilegedUser = isPrivilegedUserCheck(
      freshUser.user_type,
      freshRoleNames,
    );

    // 2. Validate ULB access (standard users only)
    if (!isPrivilegedUser) {
      const hasAccess = freshUser.ulb_mappings.some((m) => m.ulb_id === ulbId);
      if (!hasAccess) {
        return res
          .status(403)
          .json({
            success: false,
            message: "You do not have access to this ULB",
          });
      }
    }

    // 3. Fetch the target ULB details
    const targetUlb = await panel.ulb_master.findUnique({
      where: { id: ulbId, deleted_at: null } as any,
      select: { id: true, name: true, name_hindi: true, is_active: true },
    });

    if (!targetUlb) {
      return res.status(404).json({ success: false, message: "ULB not found" });
    }

    if (!targetUlb.is_active) {
      return res
        .status(403)
        .json({ success: false, message: "This ULB is currently inactive" });
    }

    // 4. Build fresh permissions for the target ULB scope
    const permissions = !isPrivilegedUser
      ? await buildUserPermissions(freshUser.id, ulbId)
      : [];

    const zone_ward_scopes = !isPrivilegedUser
      ? await buildUserZoneWardScopes(freshUser.id, ulbId)
      : "ALL";

    // 5. Get all accessible ULBs for this user (for the nav switcher)
    const allAccessibleUlbs = await resolveAccessibleUlbs(
      isPrivilegedUser,
      freshUser.ulb_mappings as any,
      "name",
    );

    // 5b. Session-context hardening: validate the session's ULB is still active
    const activeSession = await panel.user_session_context.findFirst({
      where: { user_id: freshUser.id },
      orderBy: { updated_at: "desc" },
    });
    if (activeSession && activeSession.active_ulb_id !== ulbId) {
      // Session is for a different ULB than requested — verify it is still accessible
      const sessionUlbStillActive = allAccessibleUlbs.some(
        (u: any) => u.id === activeSession.active_ulb_id,
      );
      if (!sessionUlbStillActive) {
        // The previously active ULB was disabled — silently fall back to the target
        console.warn(
          `[SwitchULB] Session ULB ${activeSession.active_ulb_id} is inactive, resetting to ${ulbId}`,
        );
      }
    }

    // 6. Derive roles for the target ULB specifically
    const targetMapping = freshUser.ulb_mappings.find(
      (m) => m.ulb_id === ulbId,
    );
    const roleList = targetMapping?.role ? [targetMapping.role.name] : [];

    // 7. Update the session context in DB
    await panel.user_session_context.updateMany({
      where: { user_id: freshUser.id },
      data: { active_ulb_id: ulbId },
    });

    // 8. Build a clean, fresh payload (NO stale iat/exp fields)
    const newPayload = {
      userId: freshUser.id,
      email: freshUser.email,
      userType: freshUser.user_type,
      ulbs: allAccessibleUlbs,
      activeUlbId: ulbId, // ← explicit active ULB for frontend
      roles: roleList,
      permissions,
      zone_ward_scopes,
      isPrivilegedUser,
    };

    const newToken = jwt.sign(newPayload, String(JWT_SECRET), {
      expiresIn: "8h",
    });

    console.info(
      `[SwitchULB] userId=${freshUser.id} → ulbId=${ulbId} (${targetUlb.name})`,
    );

    return res.status(200).json({
      success: true,
      message: `Switched to ${targetUlb.name}`,
      data: {
        token: newToken,
        activeUlb: targetUlb,
        user: newPayload,
      },
    });
  } catch (error: any) {
    console.error("[SwitchULB] Error:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Failed to switch ULB context",
      ...(process.env.NODE_ENV === "development" && { detail: error?.message }),
    });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Missing UserId" });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const loginAttempt = await panel.tbl_login_attempts.findFirst({
      where: { user_id: userId },
      orderBy: { id: "desc" },
    });

    if (!loginAttempt) {
      return res
        .status(400)
        .json({ message: "No active OTP session found. Please log in again." });
    }

    const now = new Date();
    if (!loginAttempt.otp_expires || now > loginAttempt.otp_expires) {
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new one." });
    }

    const lastOTPRecord = await panel.tbl_otp_login.findFirst({
      where: { user_id: userId },
      orderBy: { id: "desc" },
    });

    if (!lastOTPRecord || String(lastOTPRecord.otp) !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Reset attempt counters + mark OTP used (prevents replay)
    await Promise.all([
      panel.tbl_login_attempts.update({
        where: { id: loginAttempt.id },
        data: {
          isOtpVerified: true,
          attempts: 0,
          outside_location_attempts: 0,
          otp_expires: null,
        },
      }),
      panel.tbl_otp_login.update({
        where: { id: lastOTPRecord.id },
        data: { is_used: true },
      }),
    ]);

    const user = await panel.user.findUnique({
      where: { id: userId },
      include: {
        ulb_mappings: { include: { ulb: true, role: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otpRoleNames = user.ulb_mappings
      .map((m) => (m.role as any)?.name)
      .filter(Boolean) as string[];
    const isPrivilegedUser = isPrivilegedUserCheck(
      user.user_type,
      otpRoleNames,
    );

    const ulbs = await resolveAccessibleUlbs(
      isPrivilegedUser,
      user.ulb_mappings as any,
      "id",
    );

    // Build permission set for OTP-verified session
    const primaryUlbId = ulbs[0]?.id ?? null;
    const permissions =
      !isPrivilegedUser && primaryUlbId
        ? await buildUserPermissions(user.id, primaryUlbId)
        : [];

    const zone_ward_scopes =
      !isPrivilegedUser && primaryUlbId
        ? await buildUserZoneWardScopes(user.id, primaryUlbId)
        : "ALL";

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      ulbs,
      permissions, // ✅ MODULE:ACTION strings
      zone_ward_scopes,
      isPrivilegedUser,
    };

    const token = jwt.sign(tokenPayload, String(JWT_SECRET), {
      expiresIn: "1d",
    });

    return res.status(200).json({
      message: "OTP verified successfully",
      login: true,
      token,
      user: tokenPayload,
    });
  } catch (err: any) {
    console.error("OTP Verify Error:", err);
    return res.status(500).json({
      message: err.message || "Internal Server Error",
    });
  }
};


export const resendLoginOtp = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return genrateResponse(res, HttpStatus.BadRequest, "userId is required");
    }

    const user = await panel.user.findUnique({ where: { id: Number(userId) } });
    if (!user || !user.phone) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "User not found or phone number missing",
      );
    }

    const attempt = await panel.tbl_login_attempts.findFirst({
      where: { user_id: user.id },
      orderBy: { id: "desc" },
    });

    if (!attempt) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "No active login session. Please try logging in again.",
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await panel.tbl_otp_login.create({
      data: {
        user_id: user.id,
        otp,
        msg: "Login OTP resend",
        mobile_no: user.phone,
      },
    });

    await panel.tbl_login_attempts.update({
      where: { id: attempt.id },
      data: {
        otp_expires: new Date(Date.now() + 5 * 60 * 1000),
        isOtpVerified: false,
      },
    });

    sendWhatsappOtp(user.phone, "otp_services_new", [otp], "en_US").catch((e) =>
      console.error("[ResendOTP] WhatsApp send failed:", e),
    );

    return genrateResponse(
      res,
      HttpStatus.OK,
      "OTP resent to your registered phone.",
      { ttlSeconds: 300 },
    );
  } catch (err: any) {
    console.error("[ResendLoginOtp] Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "Failed to resend OTP",
    );
  }
};

// *********************************RESET PASSWORD*****************************//

export const requestResetPassword = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;

    if (!username) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Username is required",
      );
    }

    // Fetch user
    const user = await panel.user.findUnique({
      where: { username },
      include: { employee: true },
    });

    if (!user) {
      return genrateResponse(res, HttpStatus.NotFound, "User not found");
    }

    if (!user.phone) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "User contact number missing",
      );
    }

    // Transaction to prevent race conditions bypassing the limit
    const otp = await panel.$transaction(async (tx) => {
      let attempt = await tx.tbl_login_attempts.findFirst({
        where: { user_id: user.id },
        orderBy: { id: "desc" },
      });

      if (!attempt) {
        attempt = await tx.tbl_login_attempts.create({
          data: {
            user_id: user.id,
            attempts: 0,
            lastAttempt: new Date(),
            otp_expires: null,
            isOtpVerified: false,
            otp_sent_count: 0,
            otp_block_until: null,
          },
        });
      }

      // 1️ Check if user is currently blocked
      if (attempt.otp_block_until && attempt.otp_block_until > new Date()) {
        throw new Error(
          `You are blocked for OTP requests until ${attempt.otp_block_until}`,
        );
      }

      // 2️ Daily OTP Count Check (tbl_otp_login)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const otpCountToday = await tx.tbl_otp_login.count({
        where: {
          user_id: user.id,
          created_at: { gte: todayStart, lte: todayEnd },
        },
      });

      // If already 3 OTPs sent today → block 24 hours
      if (otpCountToday >= 300) {
        const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await tx.tbl_login_attempts.update({
          where: { id: attempt.id },
          data: { otp_block_until: blockUntil },
        });
        throw new Error(
          `Daily OTP limit exceeded. You are blocked until ${blockUntil}`,
        );
      }

      // 3️ Generate OTP
      const generatedOtp = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();

      // 4️ Save OTP in tbl_otp_login
      await tx.tbl_otp_login.create({
        data: {
          user_id: user.id,
          otp: generatedOtp,
          msg: "Reset password OTP sent",
          mobile_no: user.phone!,
        },
      });

      // 5️ Update login_attempts (expiry + flags)
      await tx.tbl_login_attempts.update({
        where: { id: attempt.id },
        data: {
          otp_expires: new Date(Date.now() + 5 * 60 * 1000),
          isOtpVerified: false,
        },
      });

      return generatedOtp;
    });

    // 6️ Send OTP on WhatsApp
    await sendWhatsappOtp(user.phone, "otp_services_new", [otp], "en_US");

    return genrateResponse(
      res,
      HttpStatus.OK,
      "OTP sent to registered WhatsApp number",
      { otpRequired: true, userId: user.id },
    );
  } catch (err: any) {
    console.error("Reset Password OTP Error:", err);
    return genrateResponse(
      res,
      HttpStatus.BadRequest,
      err?.message || "Failed to send OTP",
    );
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { username, otp, newPassword } = req.body;

    if (!username || !otp || !newPassword) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Username, OTP and new password are required",
      );
    }

    // 1️Fetch user
    const user = await panel.user.findUnique({
      where: { username },
    });

    if (!user) {
      return genrateResponse(res, HttpStatus.NotFound, "User not found");
    }

    // 2️ Fetch login_attempts row
    const attempt = await panel.tbl_login_attempts.findFirst({
      where: { user_id: user.id },
      orderBy: { id: "desc" },
    });

    if (!attempt) {
      return genrateResponse(res, HttpStatus.BadRequest, "Request OTP first");
    }

    // 3️ Check OTP expiry
    if (!attempt.otp_expires || attempt.otp_expires < new Date()) {
      return genrateResponse(res, HttpStatus.BadRequest, "OTP expired");
    }

    // 4️ Fetch latest OTP from tbl_otp_login
    const otpRecord = await panel.tbl_otp_login.findFirst({
      where: { user_id: user.id },
      orderBy: { id: "desc" },
    });

    if (!otpRecord) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "OTP not found. Request again.",
      );
    }

    // 5️ Validate OTP
    if (String(otpRecord.otp) !== String(otp)) {
      return genrateResponse(res, HttpStatus.BadRequest, "Invalid OTP");
    }

    // 6️ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await panel.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 7️ Clear OTP + reset counters
    await panel.tbl_login_attempts.update({
      where: { id: attempt.id },
      data: {
        otp_expires: null,
        isOtpVerified: true,
        attempts: 0,
        otp_sent_count: 0,
        otp_block_until: null,
      },
    });

    // io.to("admins").emit("password_reset", {
    //     userId: user.id,
    //     username: user.username,
    //     message: `User ${user.username} has reset their password`,
    //     time: new Date()
    // });

    // 8) Real-time notification to the effected user (toast-style)
    // try {
    //     socketService.emitNotification(String(user.id), {
    //         title: "Password changed",
    //         message: "Your password was successfully changed. If this wasn't you, contact support immediately.",
    //         type: "warning",
    //         data: { action: "password_reset" },
    //     });
    // } catch (notifyErr) {
    //     console.warn("Failed to emit password-change notification to user:", notifyErr);
    // }

    // 9) Optional admin notification (non-blocking)
    try {
      // @ts-ignore - optional call if socketService implements emitToRoom
      if (typeof (socketService as any).emitToRoom === "function") {
        // send a concise admin-facing message
        (socketService as any).emitToRoom("admins", {
          title: "User password reset",
          message: `User ${user.username} (id: ${user.id}) reset their password.`,
          type: "info",
          data: { userId: user.id },
        });
      }
    } catch (adminNotifyErr) {
      console.warn("Admin notification failed (non-fatal):", adminNotifyErr);
    }

    return genrateResponse(res, HttpStatus.OK, "Password reset successful");
  } catch (err: any) {
    console.error("Reset Password Error:", err);
    return genrateResponse(
      res,
      HttpStatus.BadRequest,
      err?.message || "Failed",
    );
  }
};


export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return genrateResponse(res, HttpStatus.Unauthorized, "Unauthorized");
    }

    const user = await panel.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            agency: true,
            module: true,
          },
        },
        ulb_mappings: {
          include: {
            ulb: true,
            role: true,
          },
        },
        zone_ward_scopes: {
          include: { zone: true, ward: true },
        },
      },
    });

    if (!user) {
      return genrateResponse(res, HttpStatus.NotFound, "User not found");
    }

    // Strip password
    const { password, ...userWithoutPassword } = user;

    const encrypted = encryptData(userWithoutPassword);
    return genrateResponse(
      res,
      HttpStatus.OK,
      "Profile fetched successfully",
      encrypted,
    );
  } catch (err: any) {
    console.error("GetMe Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "Failed to fetch profile",
    );
  }
};

/**
 * Request OTP for password change (Authenticated)
 */
export const requestChangePasswordOTP = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return genrateResponse(res, HttpStatus.Unauthorized, "Unauthorized");
    }

    const user = await panel.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.phone) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "User phone number not found",
      );
    }

    // Reuse OTP logic from requestResetPassword
    let attempt = await panel.tbl_login_attempts.findFirst({
      where: { user_id: user.id },
      orderBy: { id: "desc" },
    });

    if (!attempt) {
      attempt = await panel.tbl_login_attempts.create({
        data: { user_id: user.id, lastAttempt: new Date() },
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await panel.tbl_otp_login.create({
      data: {
        user_id: user.id,
        otp,
        msg: "Change password OTP",
        mobile_no: user.phone,
      },
    });

    await panel.tbl_login_attempts.update({
      where: { id: attempt.id },
      data: {
        otp_expires: new Date(Date.now() + 5 * 60 * 1000),
        isOtpVerified: false,
      },
    });

    // Send OTP
    await sendWhatsappOtp(user.phone, "otp_services_new", [otp], "en_US");

    return genrateResponse(res, HttpStatus.OK, "OTP sent successfully");
  } catch (err: any) {
    console.error("RequestChangePasswordOTP Error:", err);
    return genrateResponse(res, HttpStatus.BadRequest, "Failed to send OTP");
  }
};

/**
 * Verify OTP and Update Password (Authenticated)
 */
export const verifyChangePassword = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;
    const { otp, newPassword } = req.body;

    if (!userId)
      return genrateResponse(res, HttpStatus.Unauthorized, "Unauthorized");
    if (!otp || !newPassword)
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "OTP and new password required",
      );

    const otpRecord = await panel.tbl_otp_login.findFirst({
      where: { user_id: userId, is_used: false },
      orderBy: { id: "desc" },
    });

    if (!otpRecord || otpRecord.otp !== String(otp)) {
      return genrateResponse(res, HttpStatus.BadRequest, "Invalid OTP");
    }

    const attempt = await panel.tbl_login_attempts.findFirst({
      where: { user_id: userId },
      orderBy: { id: "desc" },
    });

    if (!attempt || !attempt.otp_expires || attempt.otp_expires < new Date()) {
      return genrateResponse(res, HttpStatus.BadRequest, "OTP expired");
    }

    // Update Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await panel.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Mark OTP as used
    await panel.tbl_otp_login.update({
      where: { id: otpRecord.id },
      data: { is_used: true },
    });

    // Reset attempts
    await panel.tbl_login_attempts.update({
      where: { id: attempt.id },
      data: { isOtpVerified: true, otp_expires: null },
    });

    return genrateResponse(res, HttpStatus.OK, "Password updated successfully");
  } catch (err: any) {
    console.error("VerifyChangePassword Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "Failed to update password",
    );
  }
};


// ********************Blocking Functioanlity******************** //
// helper: create block record in tbl_property_block and update login_attempts
export async function createBlockEntry(userId: number | null, reason: string, req: Request, durationHours = 24) {
  const from = new Date();
  const to = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "UNKNOWN";

  await panel.tbl_property_block.create({
    data: {
      user_id: userId,
      reason,
      from_block: from,
      to_block: to,
      ip_address: ip,
      recstatus: 1
    }
  });

  // return to for message
  return { from, to };
}

export async function isUserBlockedInPropertyBlock(userId: number) {
  const now = new Date();
  const block = await panel.tbl_property_block.findFirst({
    where: {
      user_id: userId,
      to_block: { gte: now },
      recstatus: 1
    },
    orderBy: { created_at: "desc" }
  });
  return block;
}
