// routes/user.routes.ts
import {Hono} from "hono";

const userRoutes = new Hono();

userRoutes.get("/me", (c) => {
  const user = c.get("jwtPayload");
  return c.json(user, 200);
});

export default userRoutes;
