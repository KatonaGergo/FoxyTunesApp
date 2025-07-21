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
  const { userId, playlistId } = req.body;
  const artwork = req.file;

  if (!userId || !playlistId || !artwork) {
    return res.status(400).json({ error: 'userId, playlistId, and artwork are required.' });
  }

  try {
    // 1. Save artwork locally
    let originalArtworkFilename = artwork.originalname || artwork.filename || 'artwork.jpg';
    const frontendArtworkDir = path.resolve(__dirname, '../../../../frontend/public/song_artwork');
    if (!fs.existsSync(frontendArtworkDir)) {
      fs.mkdirSync(frontendArtworkDir, { recursive: true });
    }
    let artworkDestPath = path.join(frontendArtworkDir, originalArtworkFilename);
    if (fs.existsSync(artworkDestPath)) {
      const ext = path.extname(originalArtworkFilename);
      const base = path.basename(originalArtworkFilename, ext);
      let counter = 1;
      let newFilename;
      do {
        newFilename = `${base}_${counter}${ext}`;
        artworkDestPath = path.join(frontendArtworkDir, newFilename);
        counter++;
      } while (fs.existsSync(artworkDestPath));
      originalArtworkFilename = newFilename;
    }
    fs.writeFileSync(artworkDestPath, artwork.buffer);
    const artworkUrl = `/song_artwork/${originalArtworkFilename}`;

    // 2. Call Python script to download playlist for this user
    const scriptPath = path.resolve(__dirname, '../../../spotify-downloader/main.py');
    let playlistName = '';
    let artistName = 'Unknown';
    let downloadFolder = '';
    await new Promise((resolve, reject) => {
      const python = spawn('python', [scriptPath, userId, '--download-playlist', playlistId], {
        env: { ...process.env },
      });
      let output = '';
      python.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        const match = text.match(/Downloaded \d+ tracks for playlist (.+)/);
        if (match) {
          playlistName = match[1].trim();
        }
      });
      python.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
      });
      python.on('close', (code) => {
        if (!playlistName) {
          playlistName = playlistId;
        }
        downloadFolder = path.join(process.cwd(), playlistName.replace(/ /g, '_'));
        resolve();
      });
      python.on('error', (err) => {
        reject(err);
      });
    });

    // 3. Read downloaded files and create album/songs in MongoDB
    const files = fs.readdirSync(downloadFolder).filter(f => f.endsWith('.mp3'));
    if (!files.length) {
      return res.status(500).json({ error: 'No songs were downloaded.' });
    }

    // Ensure frontend/public/songs exists
    const frontendSongsDir = path.resolve(__dirname, '../../../../frontend/public/songs');
    if (!fs.existsSync(frontendSongsDir)) {
      fs.mkdirSync(frontendSongsDir, { recursive: true });
    }

    // Create album
    const album = await Album.create({
      title: playlistName,
      artist: artistName,
      imageUrl: artworkUrl,
      songs: [],
    });

    // Copy files and create songs
    for (const file of files) {
      const srcPath = path.join(downloadFolder, file);
      const destPath = path.join(frontendSongsDir, file);
      fs.copyFileSync(srcPath, destPath);
      const songTitle = path.basename(file, '.mp3');
      const song = await Song.create({
        title: songTitle,
        artist: artistName,
        album: album._id,
        audioUrl: `/songs/${file}`,
        localFilename: file
      });
      album.songs.push(song._id);
    }
    await album.save();

    res.json({ success: true, albumId: album._id });
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