import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import cloudinary from "../lib/cloudinary.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const uploadToCloudinary = async (file) => {
	try {
		const result = await cloudinary.uploader.upload(file.tempFilePath, {
			resource_type: "auto",
		});
		return result.secure_url;
	} catch (error) {
		console.log("Error in uploadToCloudinary", error);
		throw new Error("Error uploading to cloudinary");
	}
};

// __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createSong = async (req, res, next) => {
	try {
		if (!req.files || !req.files.audioFile || !req.files.imageFile) {
			return res.status(400).json({ message: "Please upload all files" });
		}

		const { title, artist, albumId, duration, adminUpload } = req.body;
		const audioFile = req.files.audioFile;
		const imageFile = req.files.imageFile;

		// Always upload to Cloudinary
		const cloudinaryAudioUrl = await uploadToCloudinary(audioFile);
		const cloudinaryImageUrl = await uploadToCloudinary(imageFile);

		// Always save to local file system
		let originalAudioFilename = audioFile.name;
		let originalImageFilename = imageFile.name;
		const frontendSongsDir = path.resolve(__dirname, '../../../frontend/public/songs');
		if (!fs.existsSync(frontendSongsDir)) {
			fs.mkdirSync(frontendSongsDir, { recursive: true });
		}
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
		const localAudioUrl = `/songs/${originalAudioFilename}`;

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
		const localImageUrl = `/song_artwork/${originalImageFilename}`;

		// Decide which URL is the main one
		let audioUrl, imageUrl;
		if (adminUpload === 'true' || adminUpload === true) {
			audioUrl = cloudinaryAudioUrl;
			imageUrl = cloudinaryImageUrl;
		} else {
			audioUrl = localAudioUrl;
			imageUrl = localImageUrl;
		}

		const song = new Song({
			title,
			artist,
			audioUrl,
			imageUrl,
			localAudioUrl,
			localImageUrl,
			cloudinaryAudioUrl,
			cloudinaryImageUrl,
			duration,
			albumId: albumId || null,
			localFilename: originalAudioFilename
		});

		await song.save();

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
		let cloudinaryImageUrl = null;
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

			// Always upload to Cloudinary
			cloudinaryImageUrl = await uploadToCloudinary(imageFile);
		}

		const album = new Album({
			title,
			artist,
			imageUrl,
			cloudinaryImageUrl,
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