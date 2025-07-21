import Topbar from "@/components/Topbar";
import { useMusicStore } from "@/stores/useMusicStore";
import { useEffect, useState, useRef } from "react";
import RecentlyPlayedSection from "./components/RecentlyPlayedSection.tsx";
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionGrid from "./components/SectionGrid";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useChatStore } from "@/stores/useChatStore";
import ClockWeather from "./components/ClockWeather.tsx";

const YOUTUBE_API_KEY = "AIzaSyAHvXRx9Qw8QNFJVyVFSRYLJZhE8BxzIN4";

const fetchYouTubeResults = async (query: string) => {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
      query
    )}&key=${YOUTUBE_API_KEY}`
  );
  return res.json();
};

const getGreeting = (hour: number) => {
  if (hour < 5) return "Good night 🩷🌕";
  if (hour < 12) return "Good morning🩷☀️";
  if (hour < 18) return "Good afternoon 🩷🌸";
  return "Good evening🩷🌙";
};

const HomePage = () => {
  const {
    fetchRecentlyPlayedSongs,
    fetchMadeForYouSongs,
    fetchTrendingSongs,
    isLoading,
    madeForYouSongs,
    recentlyPlayedSongs,
    trendingSongs,
  } = useMusicStore();

  const { initializeQueue } = usePlayerStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const [mp3Links, setMp3Links] = useState<{ [videoId: string]: string }>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [localTime, setLocalTime] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    fetchRecentlyPlayedSongs();
    fetchMadeForYouSongs();
    fetchTrendingSongs();
  }, [fetchRecentlyPlayedSongs, fetchMadeForYouSongs, fetchTrendingSongs]);

  useEffect(() => {
    if (
      madeForYouSongs.length > 0 &&
      recentlyPlayedSongs.length > 0 &&
      trendingSongs.length > 0
    ) {
      const allSongs = [...recentlyPlayedSongs, ...madeForYouSongs, ...trendingSongs];
      initializeQueue(allSongs);
    }
  }, [initializeQueue, madeForYouSongs, trendingSongs, recentlyPlayedSongs]);

  useEffect(() => {
    // Try to get geolocation and country
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lon: longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          setCountry(data.address?.country || null);
        } catch {
          setCountry(null);
        }
        setLocationLoading(false);
      }, () => setLocationLoading(false));
    } else {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    // Update greeting and time every second
    const updateTime = () => {
      const now = new Date();
      setGreeting(getGreeting(now.getHours()));
      setLocalTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchLoading(true);
    try {
      const results = await fetchYouTubeResults(query);
      setSearchResults(results);
    } catch (e) {
      setSearchResults(null);
    }
    setSearchLoading(false);
  };

  const handleDownload = async (videoId: string) => {
    setDownloadingId(videoId);
    try {
      const res = await fetch(`/api/youtube-mp3/${videoId}`);
      const data = await res.json();
      if (data.link) {
        setMp3Links((prev) => ({ ...prev, [videoId]: data.link }));
        // Trigger download
        const a = document.createElement('a');
        a.href = data.link;
        a.download = '';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      alert('Failed to get MP3 link.');
    }
    setDownloadingId(null);
  };

  const handleYouTubePlay = (video: any) => {
    const socket = useChatStore.getState().socket;
    if (socket.auth) {
      socket.emit("update_activity", {
        userId: socket.auth.userId,
        activity: `Watching \"${video.snippet.title}\" on YouTube`,
      });
    }
    setPlayingVideoId(video.id.videoId);
  };

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-light-black to-dark-black">
      <Topbar onSearch={handleSearch} />
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 sm:p-6">
          {searchQuery ? (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-6">
                Search results for "{searchQuery}"
              </h1>
              {searchLoading && <div className="text-zinc-400">Loading...</div>}
              {searchResults && (
                <div className="space-y-8">
                  {/* Songs */}
                  <div>
                    <h2 className="text-xl font-bold mb-2">Songs</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {searchResults.items?.map((video: any) => (
                        <div
                          key={video.id.videoId}
                          className="bg-light-black/40 rounded-lg p-3 flex flex-col gap-2 items-center relative"
                        >
                          <img
                            src={video.snippet.thumbnails.medium.url}
                            alt={video.snippet.title}
                            className="w-full h-40 object-cover rounded"
                          />
                          <div className="font-medium text-center mt-2">
                            {video.snippet.title}
                          </div>
                          <div className="text-zinc-400 text-sm text-center">
                            {video.snippet.channelTitle}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {/* Play Button */}
                            {playingVideoId === video.id.videoId ? (
                              <button
                                className="bg-red-500 hover:bg-red-400 text-white rounded-full px-4 py-2 font-semibold shadow"
                                onClick={() => {
                                  // Emit idle activity
                                  const socket = useChatStore.getState().socket;
                                  if (socket.auth) {
                                    socket.emit("update_activity", {
                                      userId: socket.auth.userId,
                                      activity: "Idle",
                                    });
                                  }
                                  setPlayingVideoId(null);
                                }}
                              >
                                Stop
                              </button>
                            ) : (
                              <button
                                className="bg-green-500 hover:bg-green-400 text-black rounded-full px-4 py-2 font-semibold shadow"
                                onClick={() => handleYouTubePlay(video)}
                              >
                                Play
                              </button>
                            )}
                            {/* Download Button */}
                            {mp3Links[video.id.videoId] ? (
                              <a
                                href={mp3Links[video.id.videoId]}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-500 hover:bg-blue-400 text-white rounded-full px-4 py-2 font-semibold shadow"
                              >
                                Click to Save MP3
                              </a>
                            ) : (
                              <button
                                className="bg-blue-500 hover:bg-blue-400 text-white rounded-full px-4 py-2 font-semibold shadow"
                                onClick={() => handleDownload(video.id.videoId)}
                                disabled={downloadingId === video.id.videoId}
                              >
                                {downloadingId === video.id.videoId ? 'Downloading...' : 'Download MP3'}
                              </button>
                            )}
                          </div>
                          {/* Embedded YouTube Player (only for the playing video) */}
                          {playingVideoId === video.id.videoId && (
                            <div className="w-full mt-2">
                              <iframe
                                ref={playerRef}
                                width="100%"
                                height="200"
                                src={`https://www.youtube.com/embed/${video.id.videoId}?autoplay=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {greeting}
                </h1>
                <ClockWeather country={country} localTime={localTime} loading={locationLoading} coords={coords} />
              </div>
              <div className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Recently Played</h2>
                <RecentlyPlayedSection />
              </div>
              <div className="space-y-8">
                <SectionGrid
                  title="Made For You"
                  songs={madeForYouSongs}
                  isLoading={isLoading}
                />
                <SectionGrid
                  title="Trending"
                  songs={trendingSongs}
                  isLoading={isLoading}
                />
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </main>
  );
};
export default HomePage;
