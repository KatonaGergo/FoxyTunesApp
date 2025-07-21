import React, { useState } from "react";
import { axiosInstance } from "@/lib/axios";

// Fallback copy function for older browsers or non-HTTPS
const fallbackCopyTextToClipboard = (text: string, setCopyButtonText: (text: string) => void) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    // Show feedback
    setCopyButtonText('Copied!');
    setTimeout(() => {
      setCopyButtonText('Copy URL');
    }, 2000);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }
  
  document.body.removeChild(textArea);
};

interface ImportSpotifyPlaylistModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  "Authenticate with Spotify"
];

const ImportSpotifyPlaylistModal: React.FC<ImportSpotifyPlaylistModalProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authCallbackLoading, setAuthCallbackLoading] = useState(false);
  const [authCallbackError, setAuthCallbackError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<{ [name: string]: string }>({});
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState("Copy URL");
  const [downloadPath, setDownloadPath] = useState("");

  // Placeholder playlists for UI
  // const mockPlaylists = [
  //   { id: "1", name: "Chill Vibes" },
  //   { id: "2", name: "Workout Mix" },
  //   { id: "3", name: "Top Hits" },
  // ];

  // Fetch playlists when step changes to 1
  React.useEffect(() => {
    if (step === 1 && email) {
      setPlaylistsLoading(true);
      setPlaylistsError(null);
      fetch(`/api/spotify/playlists?userId=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.playlists) {
            setPlaylists(data.playlists);
          } else {
            setPlaylistsError("Failed to fetch playlists.");
          }
        })
        .catch(() => setPlaylistsError("Failed to fetch playlists."))
        .finally(() => setPlaylistsLoading(false));
    }
  }, [step, email]);

  // Add: Import playlist and add songs logic
  const importDownloadedPlaylist = async () => {
    try {
      // 1. Fetch the manifest file
      const manifestRes = await fetch("/songs/imported_songs.json");
      const importedFilenames = await manifestRes.json(); // Array of filenames

      // 2. Fetch all songs
      const res = await axiosInstance.get("/songs");
      const allSongs = res.data;

      // 3. Filter for newly downloaded songs
      // Assuming your Song object has a filename or fileUrl property
      const newSongs = allSongs.filter((song: any) =>
        importedFilenames.some((filename: string) =>
          song.fileUrl?.endsWith(filename) || song.filename === filename
        )
      );

      if (newSongs.length === 0) {
        alert("No new songs found to import.");
        return;
      }

      // 4. Create a new playlist
      const playlistRes = await axiosInstance.post("/playlists", { name: "Imported from Spotify" });
      const playlistId = playlistRes.data._id || playlistRes.data.id;

      // 5. Add only new songs to the playlist
      await axiosInstance.post(`/playlists/${playlistId}/songs`, { songIds: newSongs.map((song: any) => song._id) });

      alert("Playlist imported successfully!");
    } catch (err: any) {
      alert("Failed to import playlist: " + (err?.message || err));
    }
  };

  // Call importDownloadedPlaylist when importSuccess becomes true and step === 3
  React.useEffect(() => {
    if (importSuccess && step === 3) {
      importDownloadedPlaylist();
    }
    // eslint-disable-next-line
  }, [importSuccess, step]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background bg-opacity-60">
      <div className="bg-dark-black rounded-lg shadow-lg w-full max-w-md p-6 relative animate-fade-in">
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-zinc-400 hover:text-white"
          onClick={onClose}
        >
          &times;
        </button>

        {/* Stepper */}
        <div className="flex items-center mb-6">
          {steps.map((label, idx) => (
            <React.Fragment key={label}>
              <div className={`flex items-center ${idx === step ? "text-green-400" : "text-zinc-400"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${idx === step ? "border-green-400" : "border-zinc-600"}`}>{idx + 1}</div>
                <span className="ml-2 text-sm hidden sm:inline">{label}</span>
              </div>
              {idx < steps.length - 1 && <div className="flex-1 h-0.5 bg-zinc-700 mx-2" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        {step === 0 && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white text-center">Enter your email to link your Spotify account:</p>
            <input
              type="email"
              className="w-full px-3 py-2 rounded bg-light-black text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@gmail.com"
            />
            {emailError && <p className="text-red-400 text-sm w-full text-left">{emailError}</p>}
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            {!authUrl && (
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                onClick={async () => {
                  setEmailError(null);
                  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                    setEmailError("Please enter a valid email address.");
                    return;
                  }
                  setLoading(true);
                  setAuthError(null);
                  setAuthUrl(null);
                  try {
                    const res = await fetch("/api/spotify/auth", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: email }),
                    });
                    const data = await res.json();
                    if (data.authUrl) {
                      setAuthUrl(data.authUrl);
                    } else {
                      setAuthError("Could not retrieve Spotify authentication URL.");
                    }
                  } catch (err) {
                    setAuthError("Failed to connect to backend.");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !email}
              >
                {loading ? "Connecting..." : "Connect to Spotify"}
              </button>
            )}
            {authUrl && (
              <div className="w-full flex flex-col gap-3 items-center">
                <label className="text-zinc-200 text-sm w-full text-left">Spotify Authorization URL:</label>
                <input
                  type="text"
                  value={authUrl}
                  readOnly
                  className="w-full px-3 py-2 rounded bg-light-black text-white border border-zinc-700 focus:outline-none"
                  onFocus={e => e.target.select()}
                />
                <button
                  className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded transition text-center w-full"
                  onClick={() => {
                    // Try modern clipboard API first
                    if (navigator.clipboard && window.isSecureContext) {
                      navigator.clipboard.writeText(authUrl).then(() => {
                        // Show feedback
                        setCopyButtonText('Copied!');
                        setTimeout(() => {
                          setCopyButtonText('Copy URL');
                        }, 2000);
                      }).catch(() => {
                        // Fallback to old method
                        fallbackCopyTextToClipboard(authUrl, setCopyButtonText);
                      });
                    } else {
                      // Fallback for older browsers or non-HTTPS
                      fallbackCopyTextToClipboard(authUrl, setCopyButtonText);
                    }
                  }}
                >
                  {copyButtonText}
                </button>
                <label className="text-zinc-200 text-sm w-full text-left mt-2">Paste the authorization code from Spotify:</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded bg-light-black text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={authCode}
                  onChange={e => setAuthCode(e.target.value)}
                  placeholder="Enter code here"
                />
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50 w-full"
                  disabled={!authCode || authCallbackLoading}
                  onClick={async () => {
                    setAuthCallbackLoading(true);
                    setAuthCallbackError(null);
                    try {
                      const res = await fetch("/api/spotify/auth/callback", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code: authCode, userId: email }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setStep(1);
                      } else {
                        setAuthCallbackError(data.error || "Failed to complete authentication.");
                      }
                    } catch (err) {
                      setAuthCallbackError("Failed to connect to backend.");
                    } finally {
                      setAuthCallbackLoading(false);
                    }
                  }}
                >
                  {authCallbackLoading ? "Verifying..." : "Continue"}
                </button>
                {authCallbackError && <p className="text-red-400 text-sm w-full text-left">{authCallbackError}</p>}
              </div>
            )}
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <p className="text-white">Select a playlist to import:</p>
            {playlistsLoading ? (
              <p className="text-zinc-400">Loading playlists...</p>
            ) : playlistsError ? (
              <p className="text-red-400">{playlistsError}</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(playlists).map(([name, id]) => (
                  <li key={id}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded ${selectedPlaylist === id ? "bg-green-600 text-white" : "bg-light-black text-zinc-200 hover:bg-dark-black"}`}
                      onClick={() => setSelectedPlaylist(id)}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
              disabled={!selectedPlaylist}
              onClick={() => setStep(2)}
            >
              Next
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-white">Choose a download path for your playlist:</p>
            <input
              type="text"
              className="w-full px-3 py-2 rounded bg-light-black text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={downloadPath}
              onChange={e => setDownloadPath(e.target.value)}
              placeholder="/absolute/path/on/server"
            />
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
              disabled={!downloadPath || importLoading}
              onClick={async () => {
                setImportLoading(true);
                setImportError(null);
                setImportSuccess(false);
                try {
                  const res = await fetch('/api/spotify/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: email,
                      playlistName: Object.keys(playlists).find(name => playlists[name] === selectedPlaylist),
                      downloadPath,
                    }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setImportSuccess(true);
                    setStep(3);
                  } else {
                    setImportError(data.error || 'Import failed.');
                  }
                } catch (err) {
                  setImportError('Failed to connect to backend.');
                } finally {
                  setImportLoading(false);
                }
              }}
            >
              {importLoading ? 'Importing...' : 'Start Import'}
            </button>
            {importError && <p className="text-red-400">{importError}</p>}
          </div>
        )}
        {step === 3 && (
          <div className="flex flex-col items-center gap-4">
            {importSuccess ? (
              <>
                <p className="text-green-400">Playlist imported successfully!</p>
                <button
                  className="mt-4 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded"
                  onClick={onClose}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <p className="text-red-400">Import failed.</p>
                <button
                  className="mt-4 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded"
                  onClick={onClose}
                >
                  Close
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportSpotifyPlaylistModal; 