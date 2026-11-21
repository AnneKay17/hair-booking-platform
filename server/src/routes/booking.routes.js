import { Router } from "express";
import { postBooking, getBooking } from "../controllers/booking.controller.js";
import { lookupLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/", postBooking);
router.get("/:bookingReference", lookupLimiter, getBooking);

export default router;