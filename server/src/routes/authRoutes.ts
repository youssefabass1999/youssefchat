import { Router } from 'express';
import { register, loginUser } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', loginUser);

export default router;
