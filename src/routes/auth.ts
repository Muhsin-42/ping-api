import {Hono} from "hono";
import {login, signup} from "../controllers/auth.controller";

export const authRoutes = new Hono();

authRoutes.post("/register", signup);
authRoutes.post("/login", login);
