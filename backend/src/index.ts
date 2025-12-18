import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import config from "./config/index.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import productionRoutes from "./routes/productions.routes.js";
import extractionRoutes from "./routes/extraction.routes.js";
import { testConnection, closePool } from "./database/postgres-client.js";

const app = express();

// Trust proxy - required for Render and other reverse proxies
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN.split(","),
    credentials: true,
  }),
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// API routes
app.use(`${config.API_PREFIX}/productions`, productionRoutes);
app.use(`${config.API_PREFIX}/extraction`, extractionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server with database connection test
async function startServer() {
  // Test database connection first
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.error("❌ Failed to connect to database. Exiting.");
    process.exit(1);
  }

  const server = app.listen(config.PORT, () => {
    logger.info(`🚀 Server running on port ${config.PORT}`);
    logger.info(`📡 API available at http://localhost:${config.PORT}${config.API_PREFIX}`);
    logger.info(`🌍 Environment: ${config.NODE_ENV}`);
  });

  return server;
}

const serverPromise = startServer();
let serverInstance: ReturnType<typeof app.listen> | null = null;
serverPromise.then((server) => {
  serverInstance = server;
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} signal received: closing HTTP server`);

  if (serverInstance) {
    serverInstance.close(async () => {
      logger.info("HTTP server closed");
      await closePool();
      process.exit(0);
    });
  } else {
    await closePool();
    process.exit(0);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

