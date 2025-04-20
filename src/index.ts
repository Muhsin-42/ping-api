import {Hono} from "hono";
import {logger} from "hono/logger";
import {poweredBy} from "hono/powered-by";
import {connectDB} from "./config/db";
import {authRoutes} from "./routes/auth";
import {env} from "./config/env.config";
import {jwt} from "hono/jwt";
import {urlRoutes} from "./routes/urls.routes";
import {pingService} from "./services/ping.service";
import urlsModel from "./models/urls.model";
import {cors} from "hono/cors";
const app = new Hono();

// Global middlewares
app.use("*", logger());
app.use("*", poweredBy());
app.use("*", cors());

// Health Check
app.get("/", (c) => c.text("✅ API is live"));
app.get("/health", (c) => c.text("🏥 Ping is live and kicking!"));

connectDB()
  .then(() => {
    console.log("✅ MongoDB connected");

    pingService
      .initialize()
      .then(() => console.log("Ping service initialized"))
      .catch((err) => console.error("Error initializing ping service:", err));

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
    app.route("/api/urls", urlRoutes);
  })
  .catch((error) => {
    console.error("❌ DB connection error:", error.message);
    app.get("/*", (c) =>
      c.text("❌ DB connection error: " + error.message, 500)
    );
  });

setupUrlHooks();

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

function setupUrlHooks() {
  // When a URL is created
  urlsModel.schema.post("save", async function (doc) {
    if (doc.isActive) {
      await pingService.scheduleUrl(doc);
    }
  });

  // When a URL is updated
  urlsModel.schema.post("findOneAndUpdate", async function (doc) {
    if (doc) {
      if (doc.isActive) {
        await pingService.updateUrlSchedule(doc);
      } else {
        await pingService.cancelUrl(doc._id.toString());
      }
    }
  });

  // When a URL is deleted
  urlsModel.schema.post("findOneAndDelete", async function (doc) {
    if (doc) {
      await pingService.cancelUrl(doc._id.toString());
    }
  });
}
