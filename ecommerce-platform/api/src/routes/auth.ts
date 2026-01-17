import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateUserRegistration, validateUserLogin } from '../utils/validators';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/auth/register - User registration
router.post('/register',
  validateUserRegistration,
  AuthController.register
);

// POST /api/auth/login - User login
router.post('/login',
  validateUserLogin,
  AuthController.login
);

// POST /api/auth/verify-email - Email verification
router.post('/verify-email',
  AuthController.verifyEmail
);

// POST /api/auth/forgot-password - Forgot password
router.post('/forgot-password',
  AuthController.forgotPassword
);

// POST /api/auth/reset-password - Reset password
router.post('/reset-password',
  AuthController.resetPassword
);

// POST /api/auth/change-password - Change password (authenticated)
router.post('/change-password',
  authenticate,
  AuthController.changePassword
);

// GET /api/auth/me - Get current user profile
router.get('/me',
  authenticate,
  AuthController.getProfile
);

// PUT /api/auth/me - Update user profile
router.put('/me',
  authenticate,
  AuthController.updateProfile
);

// POST /api/auth/logout - Logout user
router.post('/logout',
  authenticate,
  AuthController.logout
);

export default router;
