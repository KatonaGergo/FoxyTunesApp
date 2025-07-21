import fs from 'fs';
import path from 'path';
import { Album } from "../models/album.model.js";
import { Song } from "../models/song.model.js";

export const createPlaylistsFromSongs = async (req, res) => {
    try {
        const songsDir = path.resolve(process.cwd(), '../frontend/public/songs');
        
        if (!fs.existsSync(songsDir)) {
            return res.status(404).json({ error: 'Songs directory not found' });
        }

        const items = fs.readdirSync(songsDir, { withFileTypes: true });
        const playlists = [];
        const errors = [];

        for (const item of items) {
            if (item.isDirectory()) {
                const playlistName = item.name;
                const playlistPath = path.join(songsDir, playlistName);
                
                try {
                    // Check if playlist already exists in database
                    const existingAlbum = await Album.findOne({ title: playlistName });
                    if (existingAlbum) {
                        console.log(`Playlist "${playlistName}" already exists, skipping...`);
                        continue;
                    }

                    // Get all MP3 files in the playlist directory
                    const files = fs.readdirSync(playlistPath).filter(file => file.endsWith('.mp3'));
                    
                    if (files.length === 0) {
                        console.log(`No MP3 files found in playlist "${playlistName}"`);
                        continue;
                    }

                    // Create songs for each MP3 file
                    const songIds = [];
                    for (const file of files) {
                        const songTitle = path.basename(file, '.mp3');
                        const audioUrl = `/songs/${playlistName}/${file}`;
                        
                        // Check if song already exists
                        let song = await Song.findOne({ audioUrl });
                        if (!song) {
                            song = await Song.create({
                                title: songTitle,
                                artist: 'Unknown Artist', // Could be extracted from filename if needed
                                imageUrl: '/album_artwork/lofi-9278027_1280.jpg', // Default image
                                audioUrl: audioUrl,
                                duration: 0, // Could be extracted from MP3 metadata if needed
                                localFilename: file
                            });
                        }
                        songIds.push(song._id);
                    }

                    // Create album/playlist
                    const album = await Album.create({
                        title: playlistName,
                        artist: 'Various Artists',
                        imageUrl: '/album_artwork/lofi-9278027_1280.jpg', // Default image
                        releaseYear: new Date().getFullYear(),
                        songs: songIds
                    });

                    // Update songs with album reference
                    await Song.updateMany(
                        { _id: { $in: songIds } },
                        { albumId: album._id }
                    );

                    playlists.push({
                        name: playlistName,
                        songCount: files.length,
                        albumId: album._id
                    });

                    console.log(`Created playlist "${playlistName}" with ${files.length} songs`);
                } catch (error) {
                    console.error(`Error creating playlist "${playlistName}":`, error);
                    errors.push({
                        playlist: playlistName,
                        error: error.message
                    });
                }
            }
        }

        res.json({
            success: true,
            message: `Created ${playlists.length} playlists from downloaded songs`,
            playlists,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error creating playlists from songs:', error);
        res.status(500).json({ error: 'Failed to create playlists from songs', details: error.message });
    }
};

export const scanSongsDirectory = async (req, res) => {
    try {
        const songsDir = path.resolve(process.cwd(), '../frontend/public/songs');
        
        if (!fs.existsSync(songsDir)) {
            return res.status(404).json({ error: 'Songs directory not found' });
        }

        const items = fs.readdirSync(songsDir, { withFileTypes: true });
        const playlists = [];
        const looseSongs = [];

        for (const item of items) {
            if (item.isDirectory()) {
                const playlistName = item.name;
                const playlistPath = path.join(songsDir, playlistName);
                const files = fs.readdirSync(playlistPath).filter(file => file.endsWith('.mp3'));
                
                playlists.push({
                    name: playlistName,
                    songCount: files.length,
                    songs: files.map(file => path.basename(file, '.mp3'))
                });
            } else if (item.isFile() && item.name.endsWith('.mp3')) {
                looseSongs.push(path.basename(item.name, '.mp3'));
            }
        }

        res.json({
            playlists,
            looseSongs,
            totalPlaylists: playlists.length,
            totalLooseSongs: looseSongs.length
        });

    } catch (error) {
        console.error('Error scanning songs directory:', error);
        res.status(500).json({ error: 'Failed to scan songs directory', details: error.message });
    }
}; 