import mongoose from "mongoose";

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    artist: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    localImageUrl: {
        type: String,
        required: false
    },
    cloudinaryImageUrl: {
        type: String,
        required: false
    },
    audioUrl: {
        type: String,
        required: true
    },
    localAudioUrl: {
        type: String,
        required: false
    },
    cloudinaryAudioUrl: {
        type: String,
        required: false
    },
    duration: {
        type: Number,
        required: true
    },
    localFilename: {
        type: String,
        required: true
    },
    albumId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Album",
        required: false
    }
}, {timestamps: true});

export const Song = mongoose.model("Song", songSchema)