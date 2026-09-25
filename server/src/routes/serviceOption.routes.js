//Routes for a service option by its own id.
import { Router } from "express";
import {
  updateServiceOption,
  deactivateServiceOption,
} from "../controllers/serviceOption.controller.js";

const router = Router();

// Admin — NOT authenticated yet, auth added in a later phase
router.patch("/:id", updateServiceOption);
router.delete("/:id", deactivateServiceOption);

export default router;