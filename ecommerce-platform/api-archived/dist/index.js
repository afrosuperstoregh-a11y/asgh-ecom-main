"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const typesense_1 = require("./config/typesense");
const validation_1 = require("./middleware/validation");
const rateLimiter_1 = require("./middleware/rateLimiter");
const products_1 = __importDefault(require("./routes/products"));
const cart_1 = __importDefault(require("./routes/cart"));
const auth_1 = __importDefault(require("./routes/auth"));
const orders_1 = __importDefault(require("./routes/orders"));
const payments_1 = __importDefault(require("./routes/payments"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Initialize connections
const initializeApp = async () => {
    try {
        await (0, database_1.initializeDatabase)();
        await (0, redis_1.initializeRedis)();
        await (0, typesense_1.initializeTypesense)();
        logger_1.logger.info("Application initialized successfully");
    }
    catch (error) {
        logger_1.logger.error("Failed to initialize application:", error);
        process.exit(1);
    }
};
// Middleware
app.use((0, validation_1.apiVersion)('1.0.0'));
app.use(validation_1.securityHeaders);
app.use(validation_1.corsMiddleware);
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(validation_1.requestLogger);
app.use(validation_1.sanitizeInput);
app.use(express_1.default.json({ limit: '10mb' }));
app.use((0, validation_1.requestSizeLimit)(10 * 1024 * 1024)); // 10MB
// Apply rate limiting
app.use('/api/auth', rateLimiter_1.authRateLimit);
app.use('/api/products/search', rateLimiter_1.searchRateLimit);
app.use('/api/cart', rateLimiter_1.cartRateLimit);
app.use('/api/checkout', rateLimiter_1.orderRateLimit);
app.use('/api/orders', rateLimiter_1.orderRateLimit);
app.use('/api/payments', rateLimiter_1.orderRateLimit);
app.use(rateLimiter_1.generalRateLimit);
// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// API Routes
app.use("/api/products", products_1.default);
app.use("/api/cart", cart_1.default);
app.use("/api/auth", auth_1.default);
app.use("/api", orders_1.default); // Orders and checkout
app.use("/api/payments", payments_1.default);
// Error handling
app.use(errorHandler_1.errorHandler);
// Start server
initializeApp().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
});
