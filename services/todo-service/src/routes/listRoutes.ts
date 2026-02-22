import { authenticate } from '@fs-project/backend-common';
import { Router, type Router as RouterType } from 'express';

import { listController } from '../controllers';

const router: RouterType = Router();

router.get('/', authenticate, listController.getAllLists);
router.post('/', authenticate, listController.createList);
router.patch('/:id', authenticate, listController.updateList);
router.delete('/:id', authenticate, listController.deleteList);

export default router;
