/**
 * Auth Routes
 *
 * Wires together:
 * - Routes (URLs)
 * - Validators (input validation)
 * - Auth middleware (authentication)
 * - Controllers (handlers)
 *
 * Layered approach:
 * Request → Validation → Auth (if needed) → Controller → Response
 */

import { Router, type Router as RouterType } from 'express';

import { authController } from '../controllers';
import { validateSignup, validateLogin, authenticate } from '../middleware';

const router: RouterType = Router();

router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);

export default router;
