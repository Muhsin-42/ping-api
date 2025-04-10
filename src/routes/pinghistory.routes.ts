// routes/pingHistory.routes.ts
import {Hono} from "hono";
import {jwt} from "hono/jwt";
import {env} from "../config/env.config";
import {
  getUrlPingHistory,
  getAllPingHistory,
  getUrlPingStats,
} from "../controllers/pinghistory.controller";

export const pingHistoryRoutes = new Hono();

// Authentication middleware
// pingHistoryRoutes.use("/*", jwt({secret: env.JWT_SECRET}));

// Ping history routes
pingHistoryRoutes.get("/", getAllPingHistory);
pingHistoryRoutes.get("/url/:id", getUrlPingHistory);
pingHistoryRoutes.get("/url/:id/stats", getUrlPingStats);
