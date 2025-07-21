import { create } from "zustand";
import type { Song } from "@/types";
import { useChatStore } from "./useChatStore";

interface PlayerStore {
	currentSong: Song | null;
	isPlaying: boolean;
	queue: Song[];
	currentIndex: number;

	recentlyPlayed: Song[];

	isRepeat: boolean;
	isShuffle: boolean;
	toggleRepeat: () => void;
	toggleShuffle: () => void;

	initializeQueue: (songs: Song[]) => void;
	playAlbum: (songs: Song[], startIndex?: number) => void;
	setCurrentSong: (song: Song | null) => void;
	togglePlay: () => void;
	playNext: () => void;
	playPrevious: () => void;

	deviceConnected: boolean;
	setDeviceConnected: (connected: boolean) => void;
}

async function updateCurrentSongFile(song: Song & { localFilename?: string }) {
	try {
		// Use localFilename if available, otherwise extract from audioUrl
		let filename = song.localFilename || song.audioUrl.split('/').pop() || '';
		await fetch('/api/current-song', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: song.title, filename })
		});
	} catch (e) {
		// Optionally handle error
		console.error('Failed to update current song file', e);
	}
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
	currentSong: null,
	isPlaying: false,
	queue: [],
	currentIndex: -1,
	recentlyPlayed: [],
	isRepeat: false,
	isShuffle: false,
	toggleRepeat: () => set((state) => ({ isRepeat: !state.isRepeat })),
	toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

	initializeQueue: (songs: Song[]) => {
		set({
			queue: songs,
			currentSong: get().currentSong || songs[0],
			currentIndex: get().currentIndex === -1 ? 0 : get().currentIndex,
		});
	},

	playAlbum: (songs: Song[], startIndex = 0) => {
		if (songs.length === 0) return;

		const song = songs[startIndex];

		const socket = useChatStore.getState().socket;
		if (socket.auth) {
			socket.emit("update_activity", {
				userId: socket.auth.userId,
				activity: `Playing ${song.title} by ${song.artist}`,
			});
		}
		set((state) => {
			// Add all album songs to recentlyPlayed, remove duplicates, keep max 20
			const newRecentlyPlayed = [
				...songs,
				...state.recentlyPlayed.filter((s) => !songs.some((ns) => ns._id === s._id)),
			].slice(0, 20);
			return {
				queue: songs,
				currentSong: song,
				currentIndex: startIndex,
				isPlaying: true,
				recentlyPlayed: newRecentlyPlayed,
			};
		});

		// Update current song file for lyrics.py
		updateCurrentSongFile(song);
	},

	setCurrentSong: (song: Song | null) => {
		if (!song) return;

		const socket = useChatStore.getState().socket;
		if (socket.auth) {
			socket.emit("update_activity", {
				userId: socket.auth.userId,
				activity: `Playing ${song.title} by ${song.artist}`,
			});
		}

		const songIndex = get().queue.findIndex((s) => s._id === song._id);

		// Add to recently played (remove duplicates, keep max 20)
		set((state) => {
			const filtered = state.recentlyPlayed.filter((s) => s._id !== song._id);
			return {
				currentSong: song,
				isPlaying: true,
				currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
				recentlyPlayed: [song, ...filtered].slice(0, 20),
			};
		});

		// Update current song file for lyrics.py
		updateCurrentSongFile(song);
	},

	togglePlay: () => {
		const willStartPlaying = !get().isPlaying;

		const currentSong = get().currentSong;
		const socket = useChatStore.getState().socket;
		if (socket.auth) {
			socket.emit("update_activity", {
				userId: socket.auth.userId,
				activity:
					willStartPlaying && currentSong ? `Playing ${currentSong.title} by ${currentSong.artist}` : "Idle",
			});
		}

		set({
			isPlaying: willStartPlaying,
		});
	},

	playNext: () => {
		const { currentIndex, queue } = get();
		const nextIndex = currentIndex + 1;

		// if there is a next song to play, let's play it
		if (nextIndex < queue.length) {
			const nextSong = queue[nextIndex];

			const socket = useChatStore.getState().socket;
			if (socket.auth) {
				socket.emit("update_activity", {
					userId: socket.auth.userId,
					activity: `Playing ${nextSong.title} by ${nextSong.artist}`,
				});
			}

			set((state) => {
				const filtered = state.recentlyPlayed.filter((s) => s._id !== nextSong._id);
				return {
				currentSong: nextSong,
				currentIndex: nextIndex,
				isPlaying: true,
					recentlyPlayed: [nextSong, ...filtered].slice(0, 20),
				};
			});

			// Update current song file for lyrics.py
			updateCurrentSongFile(nextSong);
		} else {
			// no next song
			set({ isPlaying: false });

			const socket = useChatStore.getState().socket;
			if (socket.auth) {
				socket.emit("update_activity", {
					userId: socket.auth.userId,
					activity: `Idle`,
				});
			}
		}
	},
	playPrevious: () => {
		const { currentIndex, queue } = get();
		const prevIndex = currentIndex - 1;

		// theres a prev song
		if (prevIndex >= 0) {
			const prevSong = queue[prevIndex];

			const socket = useChatStore.getState().socket;
			if (socket.auth) {
				socket.emit("update_activity", {
					userId: socket.auth.userId,
					activity: `Playing ${prevSong.title} by ${prevSong.artist}`,
				});
			}

			set((state) => {
				const filtered = state.recentlyPlayed.filter((s) => s._id !== prevSong._id);
				return {
				currentSong: prevSong,
				currentIndex: prevIndex,
				isPlaying: true,
					recentlyPlayed: [prevSong, ...filtered].slice(0, 20),
				};
			});

			// Update current song file for lyrics.py
			updateCurrentSongFile(prevSong);
		} else {
			// no prev song
			set({ isPlaying: false });

			const socket = useChatStore.getState().socket;
			if (socket.auth) {
				socket.emit("update_activity", {
					userId: socket.auth.userId,
					activity: `Idle`,
				});
			}
		}
	},

	deviceConnected: false,
	setDeviceConnected: (connected: boolean) => set({ deviceConnected: connected }),
}));