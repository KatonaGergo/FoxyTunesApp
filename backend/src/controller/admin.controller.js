import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createSong = async (req, res, next) => {
	try {
		if (!req.files || !req.files.audioFile || !req.files.imageFile) {
			return res.status(400).json({ message: "Please upload all files" });
		}

		const { title, artist, albumId, duration } = req.body;
		const audioFile = req.files.audioFile;
		const imageFile = req.files.imageFile;

		// Save the original filename for local use
		let originalAudioFilename = audioFile.name;
		let originalImageFilename = imageFile.name;
		const frontendSongsDir = path.resolve(__dirname, '../../../frontend/public/songs');
		if (!fs.existsSync(frontendSongsDir)) {
			fs.mkdirSync(frontendSongsDir, { recursive: true });
		}
		// If file exists, add a unique suffix for audio
		let audioDestPath = path.join(frontendSongsDir, originalAudioFilename);
		if (fs.existsSync(audioDestPath)) {
			const ext = path.extname(originalAudioFilename);
			const base = path.basename(originalAudioFilename, ext);
			let counter = 1;
			let newFilename;
			do {
				newFilename = `${base}_${counter}${ext}`;
				audioDestPath = path.join(frontendSongsDir, newFilename);
				counter++;
			} while (fs.existsSync(audioDestPath));
			originalAudioFilename = newFilename;
		}
		await audioFile.mv(audioDestPath);
		const audioUrl = `/songs/${originalAudioFilename}`;

		// Move artwork image to correct frontend/public/song_artwork
		const frontendArtworkDir = path.resolve(__dirname, '../../../frontend/public/song_artwork');
		if (!fs.existsSync(frontendArtworkDir)) {
			fs.mkdirSync(frontendArtworkDir, { recursive: true });
		}
		// If file exists, add a unique suffix for image
		let imageDestPath = path.join(frontendArtworkDir, originalImageFilename);
		if (fs.existsSync(imageDestPath)) {
			const ext = path.extname(originalImageFilename);
			const base = path.basename(originalImageFilename, ext);
			let counter = 1;
			let newFilename;
			do {
				newFilename = `${base}_${counter}${ext}`;
				imageDestPath = path.join(frontendArtworkDir, newFilename);
				counter++;
			} while (fs.existsSync(imageDestPath));
			originalImageFilename = newFilename;
		}
		await imageFile.mv(imageDestPath);
		const imageUrl = `/song_artwork/${originalImageFilename}`;

		const song = new Song({
			title,
			artist,
			audioUrl,
			imageUrl,
			duration,
			albumId: albumId || null,
			localFilename: originalAudioFilename
		});

		await song.save();

		// if song belongs to an album, update the album's songs array
		if (albumId) {
			await Album.findByIdAndUpdate(albumId, {
				$push: { songs: song._id },
			});
		}
		res.status(201).json(song);
	} catch (error) {
		console.log("Error in createSong", error);
		next(error);
	}
};

export const deleteSong = async (req, res, next) => {
	try {
		const { id } = req.params;

		const song = await Song.findById(id);

		// if song belongs to an album, update the album's songs array
		if (song.albumId) {
			await Album.findByIdAndUpdate(song.albumId, {
				$pull: { songs: song._id },
			});
		}

		await Song.findByIdAndDelete(id);

		res.status(200).json({ message: "Song deleted successfully" });
	} catch (error) {
		console.log("Error in deleteSong", error);
		next(error);
	}
};

export const createAlbum = async (req, res, next) => {
	try {
		const { title, artist, releaseYear } = req.body;
		const { imageFile } = req.files;

		let imageUrl = '';
		if (imageFile) {
			let originalImageFilename = imageFile.name;
			const frontendArtworkDir = path.resolve(__dirname, '../../../frontend/public/song_artwork');
			if (!fs.existsSync(frontendArtworkDir)) {
				fs.mkdirSync(frontendArtworkDir, { recursive: true });
			}
			let imageDestPath = path.join(frontendArtworkDir, originalImageFilename);
			if (fs.existsSync(imageDestPath)) {
				const ext = path.extname(originalImageFilename);
				const base = path.basename(originalImageFilename, ext);
				let counter = 1;
				let newFilename;
				do {
					newFilename = `${base}_${counter}${ext}`;
					imageDestPath = path.join(frontendArtworkDir, newFilename);
					counter++;
				} while (fs.existsSync(imageDestPath));
				originalImageFilename = newFilename;
			}
			await imageFile.mv(imageDestPath);
			imageUrl = `/song_artwork/${originalImageFilename}`;
		}

		const album = new Album({
			title,
			artist,
			imageUrl,
			releaseYear,
		});

		await album.save();

		res.status(201).json(album);
	} catch (error) {
		console.log("Error in createAlbum", error);
		next(error);
	}
};

export const deleteAlbum = async (req, res, next) => {
	try {
		const { id } = req.params;
		await Song.deleteMany({ albumId: id });
		await Album.findByIdAndDelete(id);
		res.status(200).json({ message: "Album deleted successfully" });
	} catch (error) {
		console.log("Error in deleteAlbum", error);
		next(error);
	}
};

export const updateSongArtwork = async (req, res, next) => {
	try {
		const { id } = req.params;
		if (!req.files || !req.files.imageFile) {
			return res.status(400).json({ message: "Please upload an image file" });
		}
		const imageFile = req.files.imageFile;
		let originalImageFilename = imageFile.name;
		const frontendArtworkDir = path.resolve(__dirname, '../../../frontend/public/song_artwork');
		if (!fs.existsSync(frontendArtworkDir)) {
			fs.mkdirSync(frontendArtworkDir, { recursive: true });
		}
		let imageDestPath = path.join(frontendArtworkDir, originalImageFilename);
		if (fs.existsSync(imageDestPath)) {
			const ext = path.extname(originalImageFilename);
			const base = path.basename(originalImageFilename, ext);
			let counter = 1;
			let newFilename;
			do {
				newFilename = `${base}_${counter}${ext}`;
				imageDestPath = path.join(frontendArtworkDir, newFilename);
				counter++;
			} while (fs.existsSync(imageDestPath));
			originalImageFilename = newFilename;
		}
		await imageFile.mv(imageDestPath);
		const imageUrl = `/song_artwork/${originalImageFilename}`;
		const song = await Song.findByIdAndUpdate(
			id,
			{ imageUrl },
			{ new: true }
		);
		if (!song) {
			return res.status(404).json({ message: "Song not found" });
		}
		res.status(200).json(song);
	} catch (error) {
		console.log("Error in updateSongArtwork", error);
		next(error);
	}
};

export const updateAlbumArtwork = async (req, res, next) => {
	try {
		const { id } = req.params;
		if (!req.files || !req.files.imageFile) {
			return res.status(400).json({ message: "Please upload an image file" });
		}
		const imageFile = req.files.imageFile;
		let originalImageFilename = imageFile.name;
		const frontendArtworkDir = path.resolve(__dirname, '../../../frontend/public/song_artwork');
		if (!fs.existsSync(frontendArtworkDir)) {
			fs.mkdirSync(frontendArtworkDir, { recursive: true });
		}
		let imageDestPath = path.join(frontendArtworkDir, originalImageFilename);
		if (fs.existsSync(imageDestPath)) {
			const ext = path.extname(originalImageFilename);
			const base = path.basename(originalImageFilename, ext);
			let counter = 1;
			let newFilename;
			do {
				newFilename = `${base}_${counter}${ext}`;
				imageDestPath = path.join(frontendArtworkDir, newFilename);
				counter++;
			} while (fs.existsSync(imageDestPath));
			originalImageFilename = newFilename;
		}
		await imageFile.mv(imageDestPath);
		const imageUrl = `/song_artwork/${originalImageFilename}`;
		const album = await Album.findByIdAndUpdate(
			id,
			{ imageUrl },
			{ new: true }
		);
		if (!album) {
			return res.status(404).json({ message: "Album not found" });
		}
		res.status(200).json(album);
	} catch (error) {
		console.log("Error in updateAlbumArtwork", error);
		next(error);
	}
};

export const checkAdmin = async (req, res, next) => {
	res.status(200).json({ admin: true });
};