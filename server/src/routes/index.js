import { Router } from "express";
import healthRoutes from "./health.routes.js";
import serviceRoutes from "./service.routes.js";
import serviceOptionRoutes from "./serviceOption.routes.js";
import availabilityRoutes from "./availability.routes.js";
import bookingRoutes from "./booking.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/services", serviceRoutes);
router.use("/service-options", serviceOptionRoutes);
router.use("/availability", availabilityRoutes);
router.use("/bookings", bookingRoutes);

// Phase 5+ will register: /admin (authentication, booking management)

export default router;