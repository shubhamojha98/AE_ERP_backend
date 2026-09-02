import express, { Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { dynamicCheckPermission } from "../middleware/dynamicPermission";
import { microserviceProxy } from "../middleware/proxy.middleware";
import { sendOtpHandler } from "../controller/external/whatsapp.controller";
import { proxyImageHandler } from "../controller/external/imageProxy.controller";
import rateLimit from "express-rate-limit";

// Module Routes
import authRoute from "./auth/auth.route";
import panelRoute from "./panel/panel.route";
import dashboard from "./dashboard/dashboard.route";
import inventoryRoutes from "./inventory/invenotry.route";


const router = express.Router();

/**
 * Health Check & Basic Info
 */
router.get("/", (req: Request, res: Response) => {
  res.send("ERP Panel API");
});

/**
 * Public Routes (No Auth Required)
 */
router.use("/uploads", express.static("assets"));
router.use("/api/auth", authRoute);
router.post("/api/whatsapp/otp", sendOtpHandler);

const proxyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 800,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many image preview requests. Please try again later." }
});

router.get("/api/proxy-image", proxyLimiter, proxyImageHandler);


router.use(authMiddleware);
router.use(dynamicCheckPermission());

router.use("/api/panel", panelRoute);
router.use("/api/dashboard", dashboard);
router.use("/api/inventory", inventoryRoutes);

export default router;
