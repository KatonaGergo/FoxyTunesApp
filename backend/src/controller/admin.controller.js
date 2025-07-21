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

export const createSong = async (req, res, next) => {
	try {
		if (!req.files || !req.files.audioFile || !req.files.imageFile) {
			return res.status(400).json({ message: "Please upload all files" });
		}

		const { title, artist, albumId, duration } = req.body;
		const audioFile = req.files.audioFile;
		const imageFile = req.files.imageFile;

		// Only upload to Cloudinary
		const audioUrl = await uploadToCloudinary(audioFile);
		const imageUrl = await uploadToCloudinary(imageFile);

		const song = new Song({
			title,
			artist,
			audioUrl,
			imageUrl,
			duration,
			albumId: albumId || null
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
			// Only upload to Cloudinary
			cloudinaryImageUrl = await uploadToCloudinary(imageFile);
			imageUrl = cloudinaryImageUrl;
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
		// Only upload to Cloudinary
		const cloudinaryImageUrl = await uploadToCloudinary(imageFile);
		const imageUrl = cloudinaryImageUrl;
		const song = await Song.findByIdAndUpdate(
			id,
			{ imageUrl, cloudinaryImageUrl },
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
		// Only upload to Cloudinary
		const cloudinaryImageUrl = await uploadToCloudinary(imageFile);
		const imageUrl = cloudinaryImageUrl;
		const album = await Album.findByIdAndUpdate(
			id,
			{ imageUrl, cloudinaryImageUrl },
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