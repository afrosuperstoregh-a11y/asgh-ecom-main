"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validators_1 = require("../utils/validators");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/auth/register - User registration
router.post('/register', validators_1.validateUserRegistration, authController_1.AuthController.register);
// POST /api/auth/login - User login
router.post('/login', validators_1.validateUserLogin, authController_1.AuthController.login);
// POST /api/auth/verify-email - Email verification
router.post('/verify-email', authController_1.AuthController.verifyEmail);
// POST /api/auth/forgot-password - Forgot password
router.post('/forgot-password', authController_1.AuthController.forgotPassword);
// POST /api/auth/reset-password - Reset password
router.post('/reset-password', authController_1.AuthController.resetPassword);
// POST /api/auth/change-password - Change password (authenticated)
router.post('/change-password', auth_1.authenticate, authController_1.AuthController.changePassword);
// GET /api/auth/me - Get current user profile
router.get('/me', auth_1.authenticate, authController_1.AuthController.getProfile);
// PUT /api/auth/me - Update user profile
router.put('/me', auth_1.authenticate, authController_1.AuthController.updateProfile);
// POST /api/auth/logout - Logout user
router.post('/logout', auth_1.authenticate, authController_1.AuthController.logout);
exports.default = router;
