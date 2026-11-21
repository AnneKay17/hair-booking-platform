import { Router } from "express";
import { getSlots, getDates } from "../controllers/availability.controller.js";

const router = Router();

// Public, read-only. Availability management lives under /api/admin.
router.get("/slots", getSlots);
router.get("/dates", getDates);

export default router;