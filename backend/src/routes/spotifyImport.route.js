import { Router } from "express";
import spotifyImportController from '../controller/spotifyImport.controller.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Endpoints will be added here

// POST /api/spotify/auth
router.post('/auth', spotifyImportController.spotifyAuth);
// POST /api/spotify/auth/callback
router.post('/auth/callback', spotifyImportController.spotifyAuthCallback);
// GET /api/spotify/playlists
router.get('/playlists', spotifyImportController.getPlaylists);
// POST /api/spotify/import
router.post('/import', upload.single('artwork'), spotifyImportController.importPlaylist);

export default router;