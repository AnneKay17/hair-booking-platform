import { Router } from "express";
import { login, logout, me } from "../controllers/auth.controller.js";
import { requireAdmin, noStore } from "../middleware/authMiddleware.js";
import { loginLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.use(noStore);

// There is deliberately NO registration route. Use `npm run create-admin`.
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.get("/me", requireAdmin, me);

export default router;