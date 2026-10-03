//Routes for availability management and slot retrieval.
import { Router } from "express";
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getSlots,
} from "../controllers/availability.controller.js";

const router = Router();

// Customer-facing
router.get("/slots", getSlots);

// Admin — NOT authenticated yet, auth added in a later phase
router.get("/", getAvailability);
router.post("/", createAvailability);
router.patch("/:id", updateAvailability);
router.delete("/:id", deleteAvailability);

export default router;