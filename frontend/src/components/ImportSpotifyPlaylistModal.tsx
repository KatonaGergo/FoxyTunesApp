import React, { useState } from "react";

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

const ImportSpotifyPlaylistModal: React.FC<ImportSpotifyPlaylistModalProps> = ({ open, onClose }) => {
  const [accessToken, setAccessToken] = useState<string>("");
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [downloadPath, setDownloadPath] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<{ [name: string]: string }>({});
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState("Copy URL");

  // Step 0: Show/copy auth URL
  // Step 1: User pastes access token
  // Step 2: User selects playlist and download path
  // Step 3: Import result

  // Generate the Spotify auth URL (replace with your real client ID and redirect URI)
  const clientId = import.meta.env.CLIENT_ID;
  const redirectUri = import.meta.env.REDIRECT_URL;
  const scopes = "playlist-read-private playlist-read-collaborative";
  const generatedAuthUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

  React.useEffect(() => {
    setAuthUrl(generatedAuthUrl);
  }, []);

  React.useEffect(() => {
    if (step === 2 && accessToken) {
      setPlaylistsLoading(true);
      setPlaylistsError(null);
      fetch(`/api/spotify/playlists?accessToken=${encodeURIComponent(accessToken)}`)
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
  }, [step, accessToken]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background bg-opacity-60">
      <div className="bg-dark-black rounded-lg shadow-lg w-full max-w-md p-6 relative animate-fade-in">
        <button className="absolute top-3 right-3 text-zinc-400 hover:text-white" onClick={onClose}>&times;</button>
        {/* Step 0: Show/copy auth URL */}
        {step === 0 && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white text-center">1. Copy and open the Spotify authorization URL in your browser:</p>
            <input
              type="text"
              value={authUrl || ""}
              readOnly
              className="w-full px-3 py-2 rounded bg-light-black text-white border border-zinc-700 focus:outline-none"
              onFocus={e => e.target.select()}
            />
            <button
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded transition text-center w-full"
              onClick={() => {
                if (navigator.clipboard && window.isSecureContext) {
                  navigator.clipboard.writeText(authUrl || "").then(() => {
                    setCopyButtonText('Copied!');
                    setTimeout(() => setCopyButtonText('Copy URL'), 2000);
                  });
                } else {
                  fallbackCopyTextToClipboard(authUrl || "", setCopyButtonText);
                }
              }}
            >
              {copyButtonText}
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
              onClick={() => setStep(1)}
            >
              Next
            </button>
          </div>
        )}
        {/* Step 1: User pastes access token */}
        {step === 1 && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white text-center">2. After authorizing, paste your Spotify access token here:</p>
            <input
              type="text"
              className="w-full px-3 py-2 rounded bg-light-black text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
              placeholder="Paste your access token"
            />
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
              disabled={!accessToken}
              onClick={() => setStep(2)}
            >
              Next
            </button>
          </div>
        )}
        {/* Step 2: Select playlist and download path */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-white">3. Select a playlist to import:</p>
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
            <input
              type="text"
              className="w-full px-3 py-2 rounded bg-light-black text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={downloadPath}
              onChange={e => setDownloadPath(e.target.value)}
              placeholder="/absolute/path/on/server"
            />
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
              disabled={!downloadPath || importLoading || !accessToken || !selectedPlaylist}
              onClick={async () => {
                setImportLoading(true);
                setImportError(null);
                setImportSuccess(false);
                try {
                  const res = await fetch('/api/spotify/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      accessToken,
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
        {/* Step 3: Import result */}
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