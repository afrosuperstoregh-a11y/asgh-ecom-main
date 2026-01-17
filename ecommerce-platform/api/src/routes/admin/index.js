const express = require('express');
const authRouter = require('./auth');
const dashboardRouter = require('./dashboard');
const productsRouter = require('./products');
const ordersRouter = require('./orders');
const customersRouter = require('./customers');
const categoriesRouter = require('./categories');
const promotionsRouter = require('./promotions');
const paymentsRouter = require('./payments');
const settingsRouter = require('./settings');
const rolesRouter = require('./roles');
const { verifyAdminToken } = require('./auth');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Apply authentication middleware to all admin routes except auth
router.use('/auth', authRouter);

// Apply token verification to all other routes
router.use(verifyAdminToken);

// Route modules
router.use('/dashboard', dashboardRouter);
router.use('/products', productsRouter);
router.use('/orders', ordersRouter);
router.use('/customers', customersRouter);
router.use('/categories', categoriesRouter);
router.use('/promotions', promotionsRouter);
router.use('/payments', paymentsRouter);
router.use('/settings', settingsRouter);
router.use('/roles', rolesRouter);

module.exports = router;
