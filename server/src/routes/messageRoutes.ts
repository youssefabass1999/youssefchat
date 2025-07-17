// 1. I need Router to define routes
import { Router } from 'express';

// 2. I import the two functions I already wrote in my controller
import { sendMessage, getMessages } from '../controllers/messageController';

// 3. I import the middleware to protect the routes
import { verifyToken } from "../middleware/authMiddleware"; // ✅ CORRECT


// 4. Create the router
const router = Router();

// 5. Route to send a new message
// POST /api/messages  => { from, to, message }
router.post('/', verifyToken, sendMessage);

// 6. Route to get all messages between two users
// GET /api/messages/:from/:to
router.get('/:from/:to', verifyToken, getMessages);

// 7. Export the router so I can use it in index.ts
export default router;
