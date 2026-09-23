import { Router } from "express";
import healthRoutes from "./health.routes.js";

const router = Router();

router.use("/health", healthRoutes);

// Phase 2+ will register: /services, /availability, /bookings, /admin

export default router;