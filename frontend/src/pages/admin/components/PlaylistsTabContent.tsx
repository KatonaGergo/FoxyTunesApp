import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { scanSongsDirectory, createPlaylistsFromSongs } from "@/lib/api";
import { FolderOpen, Music, Plus, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

interface PlaylistInfo {
  name: string;
  songCount: number;
  songs: string[];
}

interface ScanResult {
  playlists: PlaylistInfo[];
  looseSongs: string[];
  totalPlaylists: number;
  totalLooseSongs: number;
}

const PlaylistsTabContent = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: 'scan' | 'create';
    success: boolean;
    message: string;
  } | null>(null);

  const handleScan = async () => {
    setIsScanning(true);
    setLastAction(null);
    
    try {
      const response = await scanSongsDirectory();
      setScanResult(response.data);
      setLastAction({
        type: 'scan',
        success: true,
        message: `Found ${response.data.totalPlaylists} playlists and ${response.data.totalLooseSongs} loose songs`
      });
      toast.success(`Found ${response.data.totalPlaylists} playlists and ${response.data.totalLooseSongs} loose songs`);
    } catch (error: any) {
      console.error('Error scanning songs directory:', error);
      setLastAction({
        type: 'scan',
        success: false,
        message: error.response?.data?.error || 'Failed to scan songs directory'
      });
      toast.error('Failed to scan songs directory');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCreatePlaylists = async () => {
    if (!scanResult || scanResult.totalPlaylists === 0) {
      toast.error('No playlists found to create. Please scan the directory first.');
      return;
    }

    setIsCreating(true);
    setLastAction(null);

    try {
      const response = await createPlaylistsFromSongs();
      setLastAction({
        type: 'create',
        success: true,
        message: response.data.message
      });
      toast.success(response.data.message);
      
      // Refresh scan result after creating playlists
      await handleScan();
    } catch (error: any) {
      console.error('Error creating playlists:', error);
      setLastAction({
        type: 'create',
        success: false,
        message: error.response?.data?.error || 'Failed to create playlists'
      });
      toast.error('Failed to create playlists');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className='bg-light-black/50 border-zinc-700/50'>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 pink-theme-text">
            <FolderOpen className="size-5" />
            Downloaded Songs Management
          </CardTitle>
          <CardDescription className='pink-theme-text-light'>
            Scan the songs directory and create playlists from downloaded songs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={handleScan} 
              disabled={isScanning}
              className="flex items-center gap-2"
            >
              {isScanning ? (
                <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <FolderOpen className="size-4" />
              )}
              {isScanning ? 'Scanning...' : 'Scan Songs Directory'}
            </Button>
            
            <Button 
              onClick={handleCreatePlaylists} 
              disabled={isCreating || !scanResult || scanResult.totalPlaylists === 0}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {isCreating ? (
                <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Plus className="size-4" />
              )}
              {isCreating ? 'Creating...' : 'Create Playlists'}
            </Button>
          </div>

          {lastAction && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${
              lastAction.success 
                ? 'bg-green-900/20 border border-green-700/50 text-green-300' 
                : 'bg-red-900/20 border border-red-700/50 text-red-300'
            }`}>
              {lastAction.success ? (
                <CheckCircle className="size-4" />
              ) : (
                <AlertCircle className="size-4" />
              )}
              <span>{lastAction.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {scanResult && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Playlists Found */}
          <Card className='bg-light-black/50 border-zinc-700/50'>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 pink-theme-text">
                <Music className="size-5" />
                Playlists Found ({scanResult.totalPlaylists})
              </CardTitle>
              <CardDescription className='pink-theme-text-light'>
                Directories that can be converted to playlists
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanResult.playlists.length > 0 ? (
                <div className="space-y-3">
                  {scanResult.playlists.map((playlist, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-light-black/50 rounded-md">
                      <div>
                        <p className="font-medium">{playlist.name}</p>
                        <p className="text-sm pink-theme-text">{playlist.songCount} songs</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">
                          {playlist.songs.slice(0, 2).join(', ')}
                          {playlist.songs.length > 2 && ` +${playlist.songs.length - 2} more`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pink-theme-text text-center py-4">No playlist directories found</p>
              )}
            </CardContent>
          </Card>

          {/* Loose Songs */}
          <Card className='bg-light-black/50 border-zinc-700/50'>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 pink-theme-text">
                <Music className="size-5" />
                Loose Songs ({scanResult.totalLooseSongs})
              </CardTitle>
              <CardDescription className='pink-theme-text-light'>
                Individual MP3 files not in playlist directories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanResult.looseSongs.length > 0 ? (
                <div className="space-y-2">
                  {scanResult.looseSongs.map((song, index) => (
                    <div key={index} className="p-2 bg-light-black/30 rounded text-sm">
                      {song}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pink-theme-text text-center py-4">No loose songs found</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PlaylistsTabContent; 