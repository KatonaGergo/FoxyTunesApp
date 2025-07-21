import express from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = express.Router();

// To replicate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.post('/', (req, res) => {
  const { title, filename } = req.body;
  if (!title || !filename) {
    return res.status(400).json({ error: 'Missing title or filename' });
  }

  const filePath = join(__dirname, '../../../frontend/public/current_song.json');
  fs.writeFileSync(filePath, JSON.stringify({ title, filename }, null, 2), 'utf-8');
  res.json({ success: true });
});

export default router;