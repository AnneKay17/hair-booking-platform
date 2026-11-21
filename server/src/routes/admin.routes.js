import { Router } from "express";
import { requireAdmin, noStore } from "../middleware/authMiddleware.js";
import { getDashboard, listBookings, getBooking, updateBookingStatus } from "../controllers/adminBooking.controller.js";
import {
  listAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
} from "../controllers/adminAvailability.controller.js";
import { listAdminServices } from "../controllers/adminService.controller.js";
import {
  getServiceById,
  createService,
  updateService,
  deactivateService,
  listServiceOptions,
  createServiceOption,
} from "../controllers/service.controller.js";
import { updateServiceOption, deactivateServiceOption } from "../controllers/serviceOption.controller.js";

const router = Router();

// One gate for everything below. A route added later is protected automatically.
router.use(noStore);
router.use(requireAdmin);

router.get("/dashboard", getDashboard);

router.get("/bookings", listBookings);
router.get("/bookings/:id", getBooking);
router.patch("/bookings/:id/status", updateBookingStatus);

router.get("/availability", listAvailability);
router.post("/availability", createAvailability);
router.patch("/availability/:id", updateAvailability);
router.delete("/availability/:id", deleteAvailability);

router.get("/services", listAdminServices);
router.get("/services/:id", getServiceById);
router.post("/services", createService);
router.patch("/services/:id", updateService);
router.delete("/services/:id", deactivateService); // soft delete: sets active=false
router.get("/services/:serviceId/options", listServiceOptions);
router.post("/services/:serviceId/options", createServiceOption);
router.patch("/service-options/:id", updateServiceOption);
router.delete("/service-options/:id", deactivateServiceOption); // soft delete

export default router;