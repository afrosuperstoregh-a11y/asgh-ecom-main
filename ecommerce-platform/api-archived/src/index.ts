import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { initializeDatabase } from "./config/database";
import { initializeRedis } from "./config/redis";
import { initializeTypesense } from "./config/typesense";
import { 
  securityHeaders, 
  requestLogger, 
  sanitizeInput, 
  corsMiddleware,
  requestSizeLimit,
  apiVersion
} from "./middleware/validation";
import { 
  authRateLimit, 
  generalRateLimit, 
  searchRateLimit, 
  cartRateLimit, 
  orderRateLimit 
} from "./middleware/rateLimiter";
import productRoutes from "./routes/products";
import cartRoutes from "./routes/cart";
import authRoutes from "./routes/auth";
import orderRoutes from "./routes/orders";
import paymentRoutes from "./routes/payments";

const app = express();
const port = process.env.PORT || 3001;

// Initialize connections
const initializeApp = async () => {
  try {
    await initializeDatabase();
    await initializeRedis();
    await initializeTypesense();
    logger.info("Application initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize application:", error);
    process.exit(1);
  }
};

// Middleware
app.use(apiVersion('1.0.0'));
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(helmet());
app.use(morgan("dev"));
app.use(requestLogger);
app.use(sanitizeInput);
app.use(express.json({ limit: '10mb' }));
app.use(requestSizeLimit(10 * 1024 * 1024)); // 10MB

// Apply rate limiting
app.use('/api/auth', authRateLimit);
app.use('/api/products/search', searchRateLimit);
app.use('/api/cart', cartRateLimit);
app.use('/api/checkout', orderRateLimit);
app.use('/api/orders', orderRateLimit);
app.use('/api/payments', orderRateLimit);
app.use(generalRateLimit);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", orderRoutes); // Orders and checkout
app.use("/api/payments", paymentRoutes);

// Error handling
app.use(errorHandler);

// Start server
initializeApp().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
