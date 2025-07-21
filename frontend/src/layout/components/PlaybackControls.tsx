import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Laptop2, ListMusic, Mic2, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume1, VolumeX } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const formatTime = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const PlaybackControls = () => {
	const { currentSong, isPlaying, togglePlay, playNext, playPrevious, queue, setCurrentSong, isRepeat, isShuffle, toggleRepeat, toggleShuffle, deviceConnected, setDeviceConnected } = usePlayerStore();

	const [volume, setVolume] = useState(75);
	const [previousVolume, setPreviousVolume] = useState(75);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [showShuffleIndicator, setShowShuffleIndicator] = useState(false);
	const [showRepeatIndicator, setShowRepeatIndicator] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Bass Booster states and refs
	const [showBassBooster, setShowBassBooster] = useState(false);
	const [bass, setBass] = useState(0);
	const [mid, setMid] = useState(0);
	const [treble, setTreble] = useState(0);
	const audioContextRef = useRef<AudioContext | null>(null);
	const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
	const bassFilterRef = useRef<BiquadFilterNode | null>(null);
	const midFilterRef = useRef<BiquadFilterNode | null>(null);
	const trebleFilterRef = useRef<BiquadFilterNode | null>(null);

	const [showDeviceModal, setShowDeviceModal] = useState(false);
	const [foundDevices, setFoundDevices] = useState<{id: string, name: string, address: string}[]>([]);
	const [scanning, setScanning] = useState(false);

	useEffect(() => {
		audioRef.current = document.querySelector("audio");
		if (audioRef.current) {
			audioRef.current.crossOrigin = "anonymous";
		}

		// Create AudioContext and MediaElementSourceNode ONCE
		if (!audioContextRef.current && audioRef.current) {
			audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
			sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
		}

		const audio = audioRef.current;
		if (!audio) return;

		const updateTime = () => setCurrentTime(audio.currentTime);
		const updateDuration = () => setDuration(audio.duration);

		audio.addEventListener("timeupdate", updateTime);
		audio.addEventListener("loadedmetadata", updateDuration);

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
				usePlayerStore.setState({ isPlaying: true });
			} else {
				usePlayerStore.setState({ isPlaying: false });
			}
		};

		audio.addEventListener("ended", handleEnded);

		return () => {
			audio.removeEventListener("timeupdate", updateTime);
			audio.removeEventListener("loadedmetadata", updateDuration);
			audio.removeEventListener("ended", handleEnded);
		};
	}, [currentSong, isRepeat, isShuffle, queue, setCurrentSong]);

	// Bass Booster: connect/disconnect filters only
	useEffect(() => {
		if (!audioContextRef.current || !sourceRef.current) return;

		if (showBassBooster) {
			// Create filters
			bassFilterRef.current = audioContextRef.current.createBiquadFilter();
			bassFilterRef.current.type = "lowshelf";
			bassFilterRef.current.frequency.value = 200;
			bassFilterRef.current.gain.value = bass;

			midFilterRef.current = audioContextRef.current.createBiquadFilter();
			midFilterRef.current.type = "peaking";
			midFilterRef.current.frequency.value = 1000;
			midFilterRef.current.Q.value = 1;
			midFilterRef.current.gain.value = mid;

			trebleFilterRef.current = audioContextRef.current.createBiquadFilter();
			trebleFilterRef.current.type = "highshelf";
			trebleFilterRef.current.frequency.value = 3000;
			trebleFilterRef.current.gain.value = treble;

			// Connect: source -> bass -> mid -> treble -> destination
			sourceRef.current
				.connect(bassFilterRef.current)
				.connect(midFilterRef.current)
				.connect(trebleFilterRef.current)
				.connect(audioContextRef.current.destination);
		} else {
			// Disconnect filters when popup is closed
			if (sourceRef.current) sourceRef.current.disconnect();
			if (bassFilterRef.current) bassFilterRef.current.disconnect();
			if (midFilterRef.current) midFilterRef.current.disconnect();
			if (trebleFilterRef.current) trebleFilterRef.current.disconnect();
			// Reconnect source directly to destination
			if (sourceRef.current && audioContextRef.current) {
				sourceRef.current.connect(audioContextRef.current.destination);
			}
		}
		// Only run when showBassBooster changes
		// eslint-disable-next-line
	}, [showBassBooster]);

	// Update filter values when sliders change
	useEffect(() => {
		if (bassFilterRef.current) bassFilterRef.current.gain.value = bass;
		if (midFilterRef.current) midFilterRef.current.gain.value = mid;
		if (trebleFilterRef.current) trebleFilterRef.current.gain.value = treble;
	}, [bass, mid, treble]);

	const handleSeek = (value: number[]) => {
		if (audioRef.current) {
			audioRef.current.currentTime = value[0];
		}
	};

	const handleMuteToggle = () => {
		if (volume === 0) {
			setVolume(previousVolume);
			if (audioRef.current) {
				audioRef.current.volume = previousVolume / 100;
			}
		} else {
			setPreviousVolume(volume);
			setVolume(0);
			if (audioRef.current) {
				audioRef.current.volume = 0;
			}
		}
	};

	const handleShuffle = () => {
		toggleShuffle();
		setShowShuffleIndicator(!isShuffle);
		if (!isShuffle && queue && queue.length > 1) {
			let nextSong;
			do {
				nextSong = queue[Math.floor(Math.random() * queue.length)];
			} while (nextSong._id === currentSong?._id && queue.length > 1);
			setCurrentSong(nextSong);
			usePlayerStore.setState({ isPlaying: true });
		}
		if (isShuffle) setShowShuffleIndicator(false);
		setTimeout(() => setShowShuffleIndicator(false), 1200);
	};

	const handleRepeat = () => {
		toggleRepeat();
		setShowRepeatIndicator(!isRepeat);
		if (isRepeat) setShowRepeatIndicator(false);
		setTimeout(() => setShowRepeatIndicator(false), 1200);
	};

	const handleDeviceSearch = async () => {
		if (!(window as any).electronAPI?.scanBluetooth) {
			alert('Bluetooth scanning is not available.');
			return;
		}
		setScanning(true);
		setShowDeviceModal(true);
		try {
			const devices = await (window as any).electronAPI.scanBluetooth();
			setFoundDevices(devices);
		} catch (err: any) {
			alert('Bluetooth scan failed: ' + (err?.message || err));
		} finally {
			setScanning(false);
		}
	};

	const handleStartLyrics = () => {
		if ((window as any).electronAPI?.startLyrics) {
			(window as any).electronAPI.startLyrics();
		} else {
			alert('Lyrics integration is only available in the Electron app.');
		}
	};

	const handleDeviceSelect = (_device: {id: string, name: string, address: string}) => {
		setDeviceConnected(true);
		setShowDeviceModal(false);
		// Optionally, store the selected device in Zustand or local state
	};

	return (
		<>
			{deviceConnected && (
				<div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded shadow-lg z-50 text-lg font-semibold">
					Device connected successfully!
				</div>
			)}

			{/* Bass Booster Popup with Framer Motion */}
			<AnimatePresence>
				{showBassBooster && (
					<motion.div
						className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-96"
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
					>
						<div className="bg-dark-black p-6 rounded shadow-lg w-96">
							<h2 className="text-white text-lg mb-4">Bass Booster</h2>
							<div className="mb-4">
								<label className="block text-zinc-300 mb-1">Bass</label>
								<input
									type="range"
									min="-15"
									max="15"
									value={bass}
									onChange={e => setBass(Number(e.target.value))}
									className="w-full"
								/>
								<span className="text-zinc-400">{bass} dB</span>
							</div>
							<div className="mb-4">
								<label className="block text-zinc-300 mb-1">Mid</label>
								<input
									type="range"
									min="-15"
									max="15"
									value={mid}
									onChange={e => setMid(Number(e.target.value))}
									className="w-full"
								/>
								<span className="text-zinc-400">{mid} dB</span>
							</div>
							<div className="mb-4">
								<label className="block text-zinc-300 mb-1">Treble</label>
								<input
									type="range"
									min="-15"
									max="15"
									value={treble}
									onChange={e => setTreble(Number(e.target.value))}
									className="w-full"
								/>
								<span className="text-zinc-400">{treble} dB</span>
							</div>
							<button
								className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded"
								onClick={() => setShowBassBooster(false)}
							>
								Close
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Device Search Modal */}
			{showDeviceModal && (
				<div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-dark-black p-6 rounded shadow-lg w-80">
						<h2 className="text-white text-lg mb-4">{scanning ? 'Scanning for devices...' : 'Select a device'}</h2>
						{scanning && <div className="text-zinc-300 mb-2">Please wait...</div>}
						<ul>
							{!scanning && foundDevices.length === 0 && <li className="text-zinc-400">No devices found.</li>}
							{foundDevices.map((device) => (
								<li key={device.id}>
									<button
										className="w-full text-left px-4 py-2 my-1 bg-light-black hover:bg-dark-black text-white rounded"
										onClick={() => handleDeviceSelect(device)}
									>
										{device.name} <span className="text-xs text-zinc-400">({device.address})</span>
									</button>
								</li>
							))}
						</ul>
						<button
							className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded"
							onClick={() => setShowDeviceModal(false)}
						>
							Cancel
						</button>
					</div>
				</div>
			)}

		<footer className='h-20 sm:h-24 bg-dark-black border-t border-light-black px-4'>
			<div className='flex justify-between items-center h-full max-w-[1800px] mx-auto'>
				{/* currently playing song */}
				<div className='hidden sm:flex items-center gap-4 min-w-[180px] w-[30%]'>
					{currentSong && (
						<>
							<img
								src={currentSong.imageUrl}
								alt={currentSong.title}
								className='w-14 h-14 object-cover rounded-md'
							/>
							<div className='flex-1 min-w-0'>
								<div className='font-medium truncate hover:underline cursor-pointer'>
									{currentSong.title}
								</div>
								<div className='text-sm text-zinc-400 truncate hover:underline cursor-pointer'>
									{currentSong.artist}
								</div>
							</div>
						</>
					)}
				</div>

				{/* player controls*/}
				<div className='flex flex-col items-center gap-2 flex-1 max-w-full sm:max-w-[45%]'>
					<div className='flex items-center gap-4 sm:gap-6 relative'>
						<Button
							size='icon'
							variant={isShuffle ? "default" : "ghost"}
							className={cn('hidden sm:inline-flex hover:text-white text-zinc-400', isShuffle && 'bg-zinc-700 pink-theme-text-light')}
							onClick={handleShuffle}
						>
							<Shuffle className='h-4 w-4' />
						</Button>
						{showShuffleIndicator && (
							<span className="absolute left-0 -top-5 text-xs text-zinc-400 bg-light-black px-2 py-0.5 rounded shadow pink-theme-text-light">Randomized</span>
						)}

						<Button
							size='icon'
							variant='ghost'
							className='hover:text-white text-zinc-400'
							onClick={playPrevious}
							disabled={!currentSong}
						>
							<SkipBack className='h-4 w-4' />
						</Button>

						<Button
							size='icon'
							className='bg-white hover:bg-white/80 text-black rounded-full h-8 w-8'
							onClick={togglePlay}
							disabled={!currentSong}
						>
							{isPlaying ? <Pause className='h-5 w-5' /> : <Play className='h-5 w-5' />}
						</Button>
						<Button
							size='icon'
							variant='ghost'
							className='hover:text-white text-zinc-400'
							onClick={playNext}
							disabled={!currentSong}
						>
							<SkipForward className='h-4 w-4' />
						</Button>
						<Button
							size='icon'
							variant={isRepeat ? "default" : "ghost"}
							className={cn('hidden sm:inline-flex hover:text-white text-zinc-400', isRepeat && 'bg-zinc-700 pink-theme-text-light')}
							onClick={handleRepeat}
						>
							<Repeat className='h-4 w-4' />
						</Button>
						{showRepeatIndicator && (
							<span className="absolute right-0 -top-5 text-xs text-zinc-400 bg-light-black px-2 py-0.5 rounded shadow pink-theme-text-light">Looped</span>
						)}
					</div>

					<div className='hidden sm:flex items-center gap-2 w-full'>
						<div className='text-xs text-zinc-400'>{formatTime(currentTime)}</div>
						<Slider
							value={[currentTime]}
							max={duration || 100}
							step={1}
							className='w-full hover:cursor-grab active:cursor-grabbing'
							onValueChange={handleSeek}
						/>
						<div className='text-xs text-zinc-400'>{formatTime(duration)}</div>
					</div>
				</div>
				{/* volume controls */}
				<div className='hidden sm:flex items-center gap-4 min-w-[180px] w-[30%] justify-end'>
						<Button size='icon' variant='ghost' className='hover:text-white text-zinc-400' onClick={() => setShowBassBooster(true)}>
						<Mic2 className='h-4 w-4' />
					</Button>
					<Button size='icon' variant='ghost' className='hover:text-white text-zinc-400' onClick={handleStartLyrics}>
						<ListMusic className='h-4 w-4' />
					</Button>
						<Button size='icon' variant='ghost' className='hover:text-white text-zinc-400' onClick={handleDeviceSearch}>
						<Laptop2 className='h-4 w-4' />
					</Button>
					<div className='flex items-center gap-2'>
						<Button size='icon' variant='ghost' className='hover:text-white text-zinc-400' onClick={handleMuteToggle}>
							{volume === 0 ? <VolumeX className='h-4 w-4' /> : <Volume1 className='h-4 w-4' />}
						</Button>

						<Slider
							value={[volume]}
							max={100}
							step={1}
							className='w-24 hover:cursor-grab active:cursor-grabbing'
							onValueChange={(value) => {
								setVolume(value[0]);
								if (audioRef.current) {
									audioRef.current.volume = value[0] / 100;
								}
								if (value[0] !== 0) {
									setPreviousVolume(value[0]);
								}
							}}
						/>
					</div>
				</div>
			</div>
		</footer>
		</>
	);
};