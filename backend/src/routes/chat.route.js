import express from 'express';
import { getStreamToken } from '../controller/chat.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/token", protectRoute, getStreamToken);

export default router; 