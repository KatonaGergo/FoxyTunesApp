import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Album } from '../models/album.model.js';
import { Song } from '../models/song.model.js';
import fs from 'fs';

// __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const spotifyAuth = (req, res) => {
  const { userId } = req.body;
  const scriptPath = path.resolve(__dirname, '../../../spotify-downloader/main.py');
  const python = spawn('python', [scriptPath, userId], {
    env: { ...process.env },
  });
  let authUrl = null;
  let output = '';
  let responded = false;
  python.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    const match = text.match(/authorize the app:\s*(https?:\/\/\S+)/);
    if (match && !responded) {
      authUrl = match[1];
      res.json({ authUrl });
      responded = true;
      python.kill();
    }
  });
  python.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });
  python.on('close', (code) => {
    if (!responded) {
      res.status(500).json({ error: 'Could not retrieve Spotify auth URL', output });
      responded = true;
    }
  });
};

export const spotifyAuthCallback = (req, res) => {
  const { code, userId } = req.body;
  if (!code || !userId) {
    return res.status(400).json({ error: 'Authorization code and userId are required.' });
  }
  const scriptPath = path.resolve(__dirname, '../../../spotify-downloader/main.py');
  const python = spawn('python', [scriptPath, userId, '--auth-callback'], {
    env: { ...process.env },
  });
  let output = '';
  let waitingForInput = false;
  python.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    if (text.includes('Enter the authorization code')) {
      waitingForInput = true;
      python.stdin.write(code + '\n');
    }
  });
  python.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });
  python.on('close', (codeNum) => {
    if (output.toLowerCase().includes('access_token')) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to complete Spotify authentication.', output });
    }
  });
};

export const getPlaylists = (req, res) => {
  // Accept userId from query or body
  const userId = req.query.userId || req.body.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId (email) is required.' });
  }
  const scriptPath = path.resolve(__dirname, '../../../spotify-downloader/main.py');
  const python = spawn('python', [scriptPath, userId, '--list-playlists'], {
    env: { ...process.env },
  });
  let output = '';
  python.stdout.on('data', (data) => {
    output += data.toString();
  });
  python.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });
  python.on('close', (code) => {
    try {
      const playlists = JSON.parse(output);
      res.json({ playlists });
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse playlists from Python script', output });
    }
  });
};

export const importPlaylist = async (req, res) => {
  const { userId, playlistName, downloadPath } = req.body;

  if (!userId || !playlistName || !downloadPath) {
    return res.status(400).json({ error: 'userId, playlistName, and downloadPath are required.' });
  }

  try {
    // 1. Call Python script to download playlist for this user
    const scriptPath = path.resolve(__dirname, '../../../spotify-downloader/main.py');
    await new Promise((resolve, reject) => {
      const python = spawn('python', [scriptPath, userId, downloadPath, playlistName], {
        env: { ...process.env },
      });
      let output = '';
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      python.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
      });
      python.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Python script failed'));
        }
      });
      python.on('error', (err) => {
        reject(err);
      });
    });

    // 2. (Optional) Scan the downloadPath/playlistName directory for downloaded files and update DB as needed
    // ...

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to import playlist', details: error.message });
  }
};

export default {
  spotifyAuth,
  spotifyAuthCallback,
  getPlaylists,
  importPlaylist
};