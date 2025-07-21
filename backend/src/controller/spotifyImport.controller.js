import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';

// __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const spotifyAuth = async (req, res) => {
  const { code } = req.body;
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.REDIRECT_URL,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    });
    const response = await axios.post('https://accounts.spotify.com/api/token', params);
    res.json({ accessToken: response.data.access_token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get access token' });
  }
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
  const { accessToken, playlistName, downloadPath } = req.body;

  if (!accessToken || !playlistName || !downloadPath) {
    return res.status(400).json({ error: 'accessToken, playlistName, and downloadPath are required.' });
  }

  try {
    const scriptPath = path.resolve(__dirname, '../../../spotify-downloader/main.py');
    await new Promise((resolve, reject) => {
      const python = spawn('python', [scriptPath, accessToken, downloadPath, playlistName], {
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