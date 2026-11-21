import { Router } from "express";
import healthRoutes from "./health.routes.js";
import serviceRoutes from "./service.routes.js";
import availabilityRoutes from "./availability.routes.js";
import bookingRoutes from "./booking.routes.js";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/services", serviceRoutes);
router.use("/availability", availabilityRoutes);
router.use("/bookings", bookingRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

export default router;