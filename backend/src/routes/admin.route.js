import { Router } from "express";
import { checkAdmin, createAlbum, createSong, deleteAlbum, deleteSong, updateSongArtwork, updateAlbumArtwork } from "../controller/admin.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute, requireAdmin);

router.get("/check", checkAdmin);

router.post("/songs", createSong);
router.delete("/songs/:id", deleteSong);
router.patch("/songs/:id/artwork", updateSongArtwork);

router.post("/albums", createAlbum);
router.delete("/albums/:id", deleteAlbum);
router.patch("/albums/:id/artwork", updateAlbumArtwork);

export default router;