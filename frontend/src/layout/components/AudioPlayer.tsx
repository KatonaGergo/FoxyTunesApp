import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";

const AudioPlayer = () => {
	const audioRef = useRef<HTMLAudioElement>(null);
	const prevSongRef = useRef<string | null>(null);

	const { currentSong, isPlaying, playNext, queue, setCurrentSong, isRepeat, isShuffle } = usePlayerStore();

	// handle play/pause logic
	useEffect(() => {
		if (isPlaying) audioRef.current?.play();
		else audioRef.current?.pause();
	}, [isPlaying]);

	// handle song ends with repeat/shuffle logic
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const handleEnded = () => {
			if (isRepeat) {
				audio.currentTime = 0;
				audio.play();
			} else if (isShuffle && queue && queue.length > 1) {
				let nextSong;
				do {
					nextSong = queue[Math.floor(Math.random() * queue.length)];
				} while (nextSong._id === currentSong?._id && queue.length > 1);
				setCurrentSong(nextSong);
			} else {
				playNext();
			}
		};

		audio.addEventListener("ended", handleEnded);

		return () => audio.removeEventListener("ended", handleEnded);
	}, [isRepeat, isShuffle, queue, setCurrentSong, playNext, currentSong]);

	// handle song changes
	useEffect(() => {
		if (!audioRef.current || !currentSong) return;

		const audio = audioRef.current;

		// check if this is actually a new song
		const isSongChange = prevSongRef.current !== currentSong?.audioUrl;
		if (isSongChange) {
			audio.src = currentSong?.audioUrl;
			// reset the playback position
			audio.currentTime = 0;

			prevSongRef.current = currentSong?.audioUrl;

			if (isPlaying) audio.play();
		}
	}, [currentSong, isPlaying]);

	return <audio ref={audioRef} />;
};
export default AudioPlayer;