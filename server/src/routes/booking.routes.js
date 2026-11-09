//Booking routes — unauthenticated, as with all admin-adjacent endpoints so far.
import { Router } from "express";
import { postBooking, getBooking } from "../controllers/booking.controller.js";

const router = Router();

// Customer-facing — NOT authenticated. Admin booking management (confirm/
// reject/cancel) and customer self-service cancellation are deferred to a
// later phase.
router.post("/", postBooking);
router.get("/:bookingReference", getBooking);

export default router;