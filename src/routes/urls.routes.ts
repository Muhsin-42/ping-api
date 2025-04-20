// routes/url.routes.ts
import {Hono} from "hono";
import {
  addUrl,
  getAllUrls,
  updateUrl,
  deleteUrl,
} from "../controllers/urls.controller";

export const urlRoutes = new Hono();

// Authentication middleware
// urlRoutes.use("/*", jwt({secret: env.JWT_SECRET}));

// URL routes
urlRoutes.post("/", addUrl);
urlRoutes.get("/", getAllUrls);
urlRoutes.patch("/:id", updateUrl);
urlRoutes.delete("/:id", deleteUrl);
