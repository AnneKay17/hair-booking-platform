import { Router } from "express";
import { getServices } from "../controllers/service.controller.js";

const router = Router();

// Public: active services with active options. All management lives under /api/admin.
router.get("/", getServices);

export default router;