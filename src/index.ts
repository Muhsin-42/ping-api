import {Hono} from "hono";
import {logger} from "hono/logger";
import {poweredBy} from "hono/powered-by";
import {connectDB} from "./config/db";
import {authRoutes} from "./routes/auth";
import {env} from "./config/env.config";
import {jwt} from "hono/jwt";
import userRoutes from "./routes/user.routes";
import {compress} from "hono/compress";

const app = new Hono();

// Global middlewares
app.use("*", logger());
app.use("*", poweredBy());
app.use(compress());

// Health Check
app.get("/", (c) => c.text("✅ API is live"));
app.get("/health", (c) => c.text("🏥 Ping is live and kicking!"));

connectDB()
  .then(() => {
    console.log("✅ MongoDB connected");

    // Auth routes
    app.route("/auth", authRoutes);

    app.use("/api/*", async (c, next) => {
      try {
        await jwt({secret: env.JWT_SECRET})(c, next);
      } catch (err) {
        return c.json({message: "Token invalid or expired"}, 401);
      }
    });

    // User routes
    app.route("/api/user", userRoutes);
  })
  .catch((error) => {
    console.error("❌ DB connection error:", error.message);
    app.get("/*", (c) =>
      c.text("❌ DB connection error: " + error.message, 500)
    );
  });

// Catch-all 404
app.notFound((c) =>
  c.json(
    {message: "Aapke dwaara dial kiya gaya route asthithwa me nahi he"},
    404
  )
);

// Error handler
app.onError((err, c) =>
  c.json({message: "🚨 Internal Server Error", error: err.message}, 500)
);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
