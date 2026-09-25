//Routes for services and their nested options.
import { Router } from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deactivateService,
  listServiceOptions,
  createServiceOption,
} from "../controllers/service.controller.js";

const router = Router();

// Customer-facing
router.get("/", getServices);

// Admin — NOT authenticated yet, auth added in a later phase
router.get("/:id", getServiceById);
router.post("/", createService);
router.patch("/:id", updateService);
router.delete("/:id", deactivateService);

// Nested service options — admin, NOT authenticated yet
router.get("/:serviceId/options", listServiceOptions);
router.post("/:serviceId/options", createServiceOption);

export default router;