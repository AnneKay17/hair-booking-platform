import express from "express";
import cors from "cors";

import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";

const app = express();

// Core middleware
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", routes);

// Unmatched routes and errors (must stay last, in this order)
app.use(notFound);
app.use(errorHandler);

export default app;