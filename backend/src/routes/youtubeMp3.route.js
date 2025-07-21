import { Router } from "express";
import axios from "axios";
const router = Router();

router.get("/:id", async (req, res) => {
  const videoId = req.params.id;
  try {
    const response = await axios.get('https://youtube-mp36.p.rapidapi.com/dl', {
      params: { id: videoId },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': process.env.RAPIDAPI_HOST
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch MP3 link" });
  }
});

export default router; 