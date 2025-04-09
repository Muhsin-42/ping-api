// src/env.config.ts (or just env.config.ts if flat)
export const env = {
  JWT_SECRET: Bun.env.JWT_SECRET || "secret",
  PORT: parseInt(Bun.env.PORT || "3000", 10),
  NODE_ENV: Bun.env.NODE_ENV || "development",
};
