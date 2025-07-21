import express from "express";
import { createPlaylistsFromSongs, scanSongsDirectory } from "../controller/playlist.controller.js";

const router = express.Router();

// GET /api/playlists/scan - Scan the songs directory to see available playlists
router.get('/scan', scanSongsDirectory);

// POST /api/playlists/create-from-songs - Create playlists from downloaded songs
router.post('/create-from-songs', createPlaylistsFromSongs);

export default router; 