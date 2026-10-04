import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  AuditAction,
  OtpPurpose,
  PlatformType,
  Prisma,
  UserStatus,
} from "../../generated/panel";
import { panel } from "../../lib/globalprimsaclient";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { sendWhatsappOtp } from "../../utility/sendWhatsappOtp";
import { extractPayload, encryptData } from "../../lib/apiCryptography";
import {
  ACCESS_TOKEN_TTL,
  AuthenticatedRequest,
  signAccessToken,
} from "../../middleware/authMiddleware";
import {
  AccessContext,
  AccessUser,
  accessUserInclude,
  canAccessCompany,
  CompanyOption,
  getAccessContext,
  isSuperAdmin,
  listAccessibleCompanies,
  resolveDefaultCompanyId,
} from "../../dal/access.dal";

// ============================================================
// CONFIG
// ============================================================
const BCRYPT_ROUNDS = 12;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_FAILED_PASSWORD = 3; // after this → OTP required
const LOCK_MINUTES = 30; // lock when OTP cannot be sent / OTP limit hit
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_WINDOW_MS = 15 * 60 * 1000;
const OTP_MAX_PER_WINDOW = 3; // max OTPs per 15 min per purpose
const RESET_MAX_PER_DAY = 5;
const PASSWORD_MIN_LENGTH = 8;
const WHATSAPP_TEMPLATE = "otp_services_new";

// ============================================================
// HELPERS
// ============================================================
const sha256 = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");
const newRefreshToken = () => crypto.randomBytes(48).toString("base64url");
const newOtp = () => crypto.randomInt(100000, 1000000).toString();

function clientInfo(req: Request) {
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)
      ?.split(",")[0]
      ?.trim() ||
    req.socket.remoteAddress ||
    null;
  const userAgent = req.headers["user-agent"] || null;
  const platform = /mobile|android|iphone/i.test(userAgent ?? "")
    ? PlatformType.MOBILE
    : PlatformType.WEB;
  return { ip, userAgent, platform };
}

function passwordError(password: unknown): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return "Password must contain letters and numbers";
  return null;
}

async function findUserByIdentifier(identifier: string) {
  const value = identifier.trim();
  return panel.user.findFirst({
    where: {
      deleted_at: null,
      OR: [
        { username: value.toLowerCase() },
        { email: value.toLowerCase() },
        { phone: value },
      ],
    },
    include: accessUserInclude,
  });
}

const findUserById = (id: number) =>
  panel.user.findFirst({
    where: { id, deleted_at: null },
    include: accessUserInclude,
  });

async function recordLoginAttempt(
  req: Request,
  identifier: string,
  userId: number | null,
  success: boolean,
  reason?: string,
) {
  const { ip, userAgent } = clientInfo(req);
  await panel.loginAttempt.create({
    data: {
      identifier,
      user_id: userId,
      success,
      reason,
      ip_address: ip,
      user_agent: userAgent,
    },
  });
}

async function audit(
  req: Request,
  data: Omit<Prisma.AuditLogUncheckedCreateInput, "ip_address" | "user_agent">,
) {
  const { ip, userAgent } = clientInfo(req);
  await panel.auditLog
    .create({ data: { ...data, ip_address: ip, user_agent: userAgent } })
    .catch((e) => console.error("[audit]", e));
}

/** Returns a blocking message if the user cannot log in right now, otherwise null. */
function loginBlockReason(user: AccessUser): string | null {
  if (user.status === UserStatus.DISABLED)
    return "Account disabled. Please contact your administrator.";
  if (user.status === UserStatus.INVITED) return "Account not activated yet.";
  if (user.locked_until && user.locked_until > new Date()) {
    return `Account locked until ${user.locked_until.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;
  }
  if (user.status === UserStatus.LOCKED)
    return "Account locked. Please contact your administrator.";
  return null;
}

async function otpLimitReached(
  userId: number,
  purpose: OtpPurpose,
  windowMs: number,
  max: number,
) {
  const count = await panel.otpCode.count({
    where: {
      user_id: userId,
      purpose,
      created_at: { gte: new Date(Date.now() - windowMs) },
    },
  });
  return count >= max;
}

/** Creates a new OTP (old unused ones of same purpose are invalidated) and sends it on WhatsApp. */
async function issueOtp(
  req: Request,
  user: { id: number; phone: string },
  purpose: OtpPurpose,
) {
  const code = newOtp();
  await panel.$transaction([
    panel.otpCode.updateMany({
      where: { user_id: user.id, purpose, consumed_at: null },
      data: { consumed_at: new Date() },
    }),
    panel.otpCode.create({
      data: {
        user_id: user.id,
        identifier: user.phone,
        purpose,
        code_hash: sha256(code),
        expires_at: new Date(Date.now() + OTP_TTL_MS),
        ip_address: clientInfo(req).ip,
      },
    }),
  ]);
  sendWhatsappOtp(user.phone, WHATSAPP_TEMPLATE, [code], "en_US").catch((e) =>
    console.error("[OTP] WhatsApp send failed:", e),
  );
}

type OtpCheck = { ok: true } | { ok: false; message: string };

async function verifyOtp(
  userId: number,
  purpose: OtpPurpose,
  code: unknown,
): Promise<OtpCheck> {
  const otp = await panel.otpCode.findFirst({
    where: {
      user_id: userId,
      purpose,
      consumed_at: null,
      expires_at: { gt: new Date() },
    },
    orderBy: { id: "desc" },
  });
  if (!otp)
    return { ok: false, message: "OTP expired. Please request a new one." };

  const expected = Buffer.from(otp.code_hash, "hex");
  const received = Buffer.from(sha256(String(code ?? "")), "hex");
  if (crypto.timingSafeEqual(expected, received)) {
    await panel.otpCode.update({
      where: { id: otp.id },
      data: { consumed_at: new Date() },
    });
    return { ok: true };
  }

  const attempts = otp.attempts + 1;
  const exhausted = attempts >= otp.max_attempts;
  await panel.otpCode.update({
    where: { id: otp.id },
    data: { attempts, ...(exhausted && { consumed_at: new Date() }) },
  });
  return {
    ok: false,
    message: exhausted
      ? "Too many wrong attempts. Please request a new OTP."
      : `Invalid OTP. ${otp.max_attempts - attempts} attempt(s) left.`,
  };
}

function buildUserPayload(
  user: AccessUser,
  ctx: AccessContext,
  companies: CompanyOption[],
) {
  return {
    id: user.id,
    username: user.username,
    name: [user.first_name, user.last_name].filter(Boolean).join(" "),
    email: user.email,
    phone: user.phone,
    profileImage: user.profile_image,
    mustChangePassword: user.must_change_password,
    isSuperAdmin: ctx.isSuperAdmin,
    activeCompanyId: ctx.companyId,
    activeCompany: companies.find((c) => c.id === ctx.companyId) ?? null,
    companies,
    roles: ctx.roles,
    dataScope: ctx.dataScope,
    permissions: ctx.permissions,
    menus: ctx.menus,
  };
}

async function buildAuthResponse(
  user: AccessUser,
  sessionPublicId: string,
  companyId: number | null,
) {
  const [ctx, companies] = await Promise.all([
    getAccessContext(user.id, companyId),
    listAccessibleCompanies(user),
  ]);
  const token = signAccessToken({
    uid: user.id,
    sid: sessionPublicId,
    cid: companyId,
    tv: user.token_version,
  });
  return {
    token,
    expiresIn: ACCESS_TOKEN_TTL,
    user: buildUserPayload(user, ctx, companies),
  };
}

/** Successful authentication → new session + tokens. */
async function startSession(
  req: Request,
  res: Response,
  user: AccessUser,
  identifier: string,
) {
  const companyId = await resolveDefaultCompanyId(user);
  if (!isSuperAdmin(user) && companyId == null) {
    await recordLoginAttempt(
      req,
      identifier,
      user.id,
      false,
      "NO_COMPANY_ACCESS",
    );
    return genrateResponse(
      res,
      HttpStatus.Forbidden,
      "No active company assigned. Please contact your administrator.",
    );
  }

  const { ip, userAgent, platform } = clientInfo(req);
  const refreshToken = newRefreshToken();

  const [session] = await panel.$transaction([
    panel.userSession.create({
      data: {
        user_id: user.id,
        active_company_id: companyId,
        refresh_token_hash: sha256(refreshToken),
        expires_at: new Date(Date.now() + REFRESH_TTL_MS),
        ip_address: ip,
        user_agent: userAgent,
        platform,
      },
    }),
    panel.user.update({
      where: { id: user.id },
      data: {
        failed_login_count: 0,
        locked_until: null,
        last_login_at: new Date(),
      },
    }),
  ]);

  await recordLoginAttempt(req, identifier, user.id, true);
  await audit(req, {
    user_id: user.id,
    company_id: companyId,
    action: AuditAction.LOGIN,
    description: "Login successful",
  });

  const auth = await buildAuthResponse(user, session.public_id, companyId);
  return genrateResponse(res, HttpStatus.OK, "Login successful", {
    ...auth,
    refreshToken,
  });
}

// ============================================================
// LOGIN
// ============================================================
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Username and password are required",
      );
    }
    const identifier = String(username);

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      await recordLoginAttempt(req, identifier, null, false, "USER_NOT_FOUND");
      return genrateResponse(
        res,
        HttpStatus.Unauthorized,
        "Invalid credentials",
      );
    }

    const blocked = loginBlockReason(user);
    if (blocked) {
      await recordLoginAttempt(req, identifier, user.id, false, "BLOCKED");
      return genrateResponse(res, HttpStatus.Forbidden, blocked);
    }

    const passwordOk = await bcrypt.compare(
      String(password),
      user.password_hash,
    );
    if (!passwordOk) {
      const updated = await panel.user.update({
        where: { id: user.id },
        data: { failed_login_count: { increment: 1 } },
        select: { failed_login_count: true },
      });
      await recordLoginAttempt(
        req,
        identifier,
        user.id,
        false,
        "WRONG_PASSWORD",
      );
      await audit(req, {
        user_id: user.id,
        action: AuditAction.LOGIN_FAILED,
        description: "Wrong password",
      });

      if (updated.failed_login_count < MAX_FAILED_PASSWORD) {
        const remainingAttempts =
          MAX_FAILED_PASSWORD - updated.failed_login_count;
        return genrateResponse(
          res,
          HttpStatus.Unauthorized,
          `Invalid password. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining before OTP is required.`,
          { remainingAttempts },
        );
      }

      // Too many failures → OTP on phone, or lock if not possible
      const canSendOtp =
        user.phone &&
        !(await otpLimitReached(
          user.id,
          OtpPurpose.LOGIN,
          OTP_WINDOW_MS,
          OTP_MAX_PER_WINDOW,
        ));
      if (!canSendOtp) {
        const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        await panel.user.update({
          where: { id: user.id },
          data: { locked_until: lockedUntil, failed_login_count: 0 },
        });
        return genrateResponse(
          res,
          HttpStatus.Forbidden,
          `Too many failed attempts. Account locked for ${LOCK_MINUTES} minutes.`,
        );
      }

      await panel.user.update({
        where: { id: user.id },
        data: { failed_login_count: 0 },
      });
      await issueOtp(
        req,
        { id: user.id, phone: user.phone! },
        OtpPurpose.LOGIN,
      );
      return genrateResponse(
        res,
        HttpStatus.OK,
        "Too many failed attempts. An OTP has been sent to your registered phone.",
        {
          otpRequired: true,
          user: user.id,
          phone: user.phone!.slice(-4),
          ttlSeconds: OTP_TTL_MS / 1000,
        },
      );
    }

    return await startSession(req, res, user, identifier);
  } catch (err) {
    console.error("[Login] Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "A security system error occurred during login",
    );
  }
};

// ============================================================
// LOGIN OTP (after too many wrong passwords)
// ============================================================
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.body?.userId);
    const { otp } = req.body ?? {};
    if (!userId || !otp)
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "userId and OTP are required",
      );

    const user = await findUserById(userId);
    if (!user)
      return genrateResponse(res, HttpStatus.BadRequest, "Invalid OTP");

    const blocked = loginBlockReason(user);
    if (blocked) return genrateResponse(res, HttpStatus.Forbidden, blocked);

    const check = await verifyOtp(user.id, OtpPurpose.LOGIN, otp);
    if (!check.ok) {
      await recordLoginAttempt(req, user.username, user.id, false, "WRONG_OTP");
      return genrateResponse(res, HttpStatus.BadRequest, check.message);
    }

    return await startSession(req, res, user, user.username);
  } catch (err) {
    console.error("[VerifyOTP] Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "Failed to verify OTP",
    );
  }
};

export const resendLoginOtp = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.body?.userId);
    if (!userId)
      return genrateResponse(res, HttpStatus.BadRequest, "userId is required");

    const user = await findUserById(userId);
    if (!user?.phone)
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "User not found or phone number missing",
      );

    // Resend only allowed if a login OTP was requested recently
    const pending = await panel.otpCode.count({
      where: {
        user_id: user.id,
        purpose: OtpPurpose.LOGIN,
        created_at: { gte: new Date(Date.now() - OTP_WINDOW_MS) },
      },
    });
    if (!pending)
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "No active login session. Please try logging in again.",
      );

    if (
      await otpLimitReached(
        user.id,
        OtpPurpose.LOGIN,
        OTP_WINDOW_MS,
        OTP_MAX_PER_WINDOW,
      )
    ) {
      return genrateResponse(
        res,
        HttpStatus.Forbidden,
        "OTP limit reached. Please try again after 15 minutes.",
      );
    }

    await issueOtp(req, { id: user.id, phone: user.phone }, OtpPurpose.LOGIN);
    return genrateResponse(
      res,
      HttpStatus.OK,
      "OTP resent to your registered phone.",
      { ttlSeconds: OTP_TTL_MS / 1000 },
    );
  } catch (err) {
    console.error("[ResendLoginOtp] Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "Failed to resend OTP",
    );
  }
};

// ============================================================
// TOKEN REFRESH (rotating refresh token + reuse detection)
// ============================================================
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken)
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Refresh token is required",
      );

    const hash = sha256(String(refreshToken));
    const session = await panel.userSession.findUnique({
      where: { refresh_token_hash: hash },
    });

    if (!session) {
      // Old (already rotated) token used again → treat as stolen, kill that session
      const reused = await panel.userSession.findUnique({
        where: { previous_token_hash: hash },
      });
      if (reused && !reused.revoked_at) {
        await panel.userSession.update({
          where: { id: reused.id },
          data: {
            revoked_at: new Date(),
            revoke_reason: "REFRESH_TOKEN_REUSE",
          },
        });
        await audit(req, {
          user_id: reused.user_id,
          company_id: reused.active_company_id,
          action: AuditAction.TOKEN_REUSE,
          description: "Refresh token reuse detected, session revoked",
        });
      }
      return genrateResponse(
        res,
        HttpStatus.Unauthorized,
        "Invalid or expired refresh token",
      );
    }

    if (session.revoked_at || session.expires_at < new Date()) {
      return genrateResponse(
        res,
        HttpStatus.Unauthorized,
        "Session expired. Please login again.",
      );
    }

    const user = await findUserById(session.user_id);
    if (!user || loginBlockReason(user)) {
      await panel.userSession.update({
        where: { id: session.id },
        data: { revoked_at: new Date(), revoke_reason: "USER_BLOCKED" },
      });
      return genrateResponse(
        res,
        HttpStatus.Unauthorized,
        "Not authorized. Please contact your administrator.",
      );
    }

    // Company may have been suspended / access removed since last login
    let companyId = session.active_company_id;
    if (companyId != null && !(await canAccessCompany(user, companyId)))
      companyId = await resolveDefaultCompanyId(user);
    if (!isSuperAdmin(user) && companyId == null) {
      await panel.userSession.update({
        where: { id: session.id },
        data: { revoked_at: new Date(), revoke_reason: "NO_COMPANY_ACCESS" },
      });
      return genrateResponse(
        res,
        HttpStatus.Forbidden,
        "No active company assigned. Please contact your administrator.",
      );
    }

    const nextRefreshToken = newRefreshToken();
    await panel.userSession.update({
      where: { id: session.id },
      data: {
        refresh_token_hash: sha256(nextRefreshToken),
        previous_token_hash: hash,
        last_used_at: new Date(),
        active_company_id: companyId,
      },
    });

    const auth = await buildAuthResponse(user, session.public_id, companyId);
    return genrateResponse(res, HttpStatus.OK, "Token refreshed successfully", {
      ...auth,
      refreshToken: nextRefreshToken,
    });
  } catch (err) {
    console.error("[RefreshToken] Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "Internal Server Error",
    );
  }
};

// ============================================================
// LOGOUT  (body.allDevices = true → logout everywhere)
// ============================================================
export const logoutUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = req.user;
    if (!auth)
      return genrateResponse(res, HttpStatus.Unauthorized, "Not authenticated");

    const allDevices = req.body?.allDevices === true;
    const now = new Date();

    if (allDevices) {
      await panel.$transaction([
        panel.userSession.updateMany({
          where: { user_id: auth.userId, revoked_at: null },
          data: { revoked_at: now, revoke_reason: "LOGOUT_ALL" },
        }),
        panel.user.update({
          where: { id: auth.userId },
          data: { token_version: { increment: 1 } },
        }),
      ]);
    } else {
      await panel.userSession.update({
        where: { public_id: auth.sessionId },
        data: { revoked_at: now, revoke_reason: "LOGOUT" },
      });
    }

    await audit(req, {
      user_id: auth.userId,
      company_id: auth.companyId,
      action: AuditAction.LOGOUT,
      description: allDevices ? "Logout from all devices" : "Logout",
    });
    return genrateResponse(res, HttpStatus.OK, "Logged out successfully", {
      clearToken: true,
    });
  } catch (err) {
    console.error("[Logout] Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "Internal Server Error",
    );
  }
};

// ============================================================
// SWITCH COMPANY
// ============================================================
export const switchCompany = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const auth = req.user;
    if (!auth)
      return genrateResponse(res, HttpStatus.Unauthorized, "Not authenticated");

    const data = extractPayload(req.body);
    const companyId = Number(data?.company_id);
    if (!companyId)
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Valid company_id is required",
      );

    const user = await findUserById(auth.userId);
    if (!user)
      return genrateResponse(
        res,
        HttpStatus.Unauthorized,
        "User not found or inactive",
      );

    if (!(await canAccessCompany(user, companyId))) {
      await audit(req, {
        user_id: user.id,
        company_id: auth.companyId,
        action: AuditAction.DENIED,
        entity_type: "company",
        entity_id: String(companyId),
        description: "Switch company denied",
      });
      return genrateResponse(
        res,
        HttpStatus.Forbidden,
        "You do not have access to this company",
      );
    }

    await panel.userSession.update({
      where: { public_id: auth.sessionId },
      data: { active_company_id: companyId },
    });

    const result = await buildAuthResponse(user, auth.sessionId, companyId);
    return genrateResponse(
      res,
      HttpStatus.OK,
      `Switched to ${result.user.activeCompany?.name ?? "company"}`,
      result,
    );
  } catch (err) {
    console.error("[SwitchCompany] Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "Failed to switch company",
    );
  }
};

// ============================================================
// PROFILE
// ============================================================
export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = req.user;
    if (!auth)
      return genrateResponse(res, HttpStatus.Unauthorized, "Unauthorized");

    const user = await panel.user.findUnique({
      where: { id: auth.userId },
      include: {
        platform_role: { select: { code: true, name: true } },
        home_company: { select: { id: true, code: true, name: true } },
        memberships: {
          where: { is_active: true },
          select: {
            id: true,
            employee_code: true,
            designation: true,
            department: true,
            is_default: true,
            company: { select: { id: true, code: true, name: true } },
            roles: { select: { role: { select: { code: true, name: true } } } },
          },
        },
      },
    });
    if (!user)
      return genrateResponse(res, HttpStatus.NotFound, "User not found");

    const {
      password_hash,
      failed_login_count,
      locked_until,
      token_version,
      ...profile
    } = user;

    return genrateResponse(
      res,
      HttpStatus.OK,
      "Profile fetched successfully",
      encryptData({
        ...profile,
        access: {
          activeCompanyId: auth.companyId,
          isSuperAdmin: auth.isSuperAdmin,
          roles: auth.roles,
          dataScope: auth.dataScope,
          permissions: auth.permissions,
          menus: auth.menus,
        },
      }),
    );
  } catch (err) {
    console.error("[GetMe] Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "Failed to fetch profile",
    );
  }
};

// ============================================================
// FORGOT / RESET PASSWORD (not logged in)
// ============================================================
export const requestResetPassword = async (req: Request, res: Response) => {
  const genericReply = () =>
    genrateResponse(
      res,
      HttpStatus.OK,
      "If the account exists, an OTP has been sent to the registered WhatsApp number",
      {
        otpRequired: true,
        ttlSeconds: OTP_TTL_MS / 1000,
      },
    );

  try {
    const { username } = req.body ?? {};
    if (!username)
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Username is required",
      );

    const user = await findUserByIdentifier(String(username));
    if (!user?.phone || loginBlockReason(user)) return genericReply(); // never reveal whether the user exists

    if (
      (await otpLimitReached(
        user.id,
        OtpPurpose.PASSWORD_RESET,
        24 * 60 * 60 * 1000,
        RESET_MAX_PER_DAY,
      )) ||
      (await otpLimitReached(
        user.id,
        OtpPurpose.PASSWORD_RESET,
        OTP_WINDOW_MS,
        OTP_MAX_PER_WINDOW,
      ))
    ) {
      return genrateResponse(
        res,
        HttpStatus.Forbidden,
        "OTP limit reached. Please try again later.",
      );
    }

    await issueOtp(
      req,
      { id: user.id, phone: user.phone },
      OtpPurpose.PASSWORD_RESET,
    );
    return genericReply();
  } catch (err) {
    console.error("[RequestResetPassword] Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "Failed to send OTP",
    );
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { username, otp, newPassword } = req.body ?? {};
    if (!username || !otp || !newPassword) {
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "Username, OTP and new password are required",
      );
    }

    const invalid = passwordError(newPassword);
    if (invalid) return genrateResponse(res, HttpStatus.BadRequest, invalid);

    const user = await findUserByIdentifier(String(username));
    if (!user)
      return genrateResponse(res, HttpStatus.BadRequest, "Invalid OTP");

    const check = await verifyOtp(user.id, OtpPurpose.PASSWORD_RESET, otp);
    if (!check.ok)
      return genrateResponse(res, HttpStatus.BadRequest, check.message);

    const now = new Date();
    await panel.$transaction([
      panel.user.update({
        where: { id: user.id },
        data: {
          password_hash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
          password_changed_at: now,
          must_change_password: false,
          failed_login_count: 0,
          locked_until: null,
          token_version: { increment: 1 },
        },
      }),
      panel.userSession.updateMany({
        where: { user_id: user.id, revoked_at: null },
        data: { revoked_at: now, revoke_reason: "PASSWORD_RESET" },
      }),
    ]);

    await audit(req, {
      user_id: user.id,
      action: AuditAction.PASSWORD_CHANGE,
      description: "Password reset via OTP",
    });
    return genrateResponse(
      res,
      HttpStatus.OK,
      "Password reset successful. Please login with your new password.",
    );
  } catch (err) {
    console.error("[ResetPassword] Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "Failed to reset password",
    );
  }
};

// ============================================================
// CHANGE PASSWORD (logged in)
// ============================================================
export const requestChangePasswordOTP = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const auth = req.user;
    if (!auth)
      return genrateResponse(res, HttpStatus.Unauthorized, "Unauthorized");

    const user = await panel.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, phone: true },
    });
    if (!user?.phone)
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "User phone number not found",
      );

    if (
      await otpLimitReached(
        user.id,
        OtpPurpose.PASSWORD_RESET,
        OTP_WINDOW_MS,
        OTP_MAX_PER_WINDOW,
      )
    ) {
      return genrateResponse(
        res,
        HttpStatus.Forbidden,
        "OTP limit reached. Please try again after 15 minutes.",
      );
    }

    await issueOtp(
      req,
      { id: user.id, phone: user.phone },
      OtpPurpose.PASSWORD_RESET,
    );
    return genrateResponse(res, HttpStatus.OK, "OTP sent successfully", {
      ttlSeconds: OTP_TTL_MS / 1000,
    });
  } catch (err) {
    console.error("[RequestChangePasswordOTP] Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "Failed to send OTP",
    );
  }
};

/** Changes password and logs out all OTHER devices; current session stays active. */
export const verifyChangePassword = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const auth = req.user;
    if (!auth)
      return genrateResponse(res, HttpStatus.Unauthorized, "Unauthorized");

    const { otp, newPassword } = req.body ?? {};
    if (!otp || !newPassword)
      return genrateResponse(
        res,
        HttpStatus.BadRequest,
        "OTP and new password required",
      );

    const invalid = passwordError(newPassword);
    if (invalid) return genrateResponse(res, HttpStatus.BadRequest, invalid);

    const check = await verifyOtp(auth.userId, OtpPurpose.PASSWORD_RESET, otp);
    if (!check.ok)
      return genrateResponse(res, HttpStatus.BadRequest, check.message);

    const now = new Date();
    await panel.$transaction([
      panel.user.update({
        where: { id: auth.userId },
        data: {
          password_hash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
          password_changed_at: now,
          must_change_password: false,
        },
      }),
      panel.userSession.updateMany({
        where: {
          user_id: auth.userId,
          revoked_at: null,
          NOT: { public_id: auth.sessionId },
        },
        data: { revoked_at: now, revoke_reason: "PASSWORD_CHANGE" },
      }),
    ]);

    await audit(req, {
      user_id: auth.userId,
      company_id: auth.companyId,
      action: AuditAction.PASSWORD_CHANGE,
      description: "Password changed via OTP",
    });
    return genrateResponse(res, HttpStatus.OK, "Password updated successfully");
  } catch (err) {
    console.error("[VerifyChangePassword] Error:", err);
    return genrateResponse(
      res,
      HttpStatus.InternalServerError,
      "Failed to update password",
    );
  }
};
