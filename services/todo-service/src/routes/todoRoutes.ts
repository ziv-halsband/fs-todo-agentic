import { authenticate } from '@fs-project/backend-common';
import { Router, type Router as RouterType } from 'express';

import { todoController } from '../controllers';

const router: RouterType = Router();

/**
 * Todo Routes
 *
 * All routes require authentication (JWT token).
 * The authenticate middleware extracts userId from token and adds it to req.user.
 */

// Get all todos for authenticated user
router.get('/', authenticate, todoController.getAllTodos);

// Get todo statistics (must be before /:id to avoid conflicts)
router.get('/stats', authenticate, todoController.getTodoStats);

// Get incomplete task counts grouped by list (must be before /:id)
router.get('/count', authenticate, todoController.getCountsByList);

// Get a single todo by ID
router.get('/:id', authenticate, todoController.getTodoById);

// Create a new todo
router.post('/', authenticate, todoController.createTodo);

// Update an existing todo
router.patch('/:id', authenticate, todoController.updateTodo);

// Delete a todo
router.delete('/:id', authenticate, todoController.deleteTodo);

export default router;
