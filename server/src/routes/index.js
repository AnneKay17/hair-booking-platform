import { Router } from "express";
import healthRoutes from "./health.routes.js";
import serviceRoutes from "./service.routes.js";
import serviceOptionRoutes from "./serviceOption.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/services", serviceRoutes);
router.use("/service-options", serviceOptionRoutes);

// Phase 3+ will register: /availability, /bookings, /admin

export default router;