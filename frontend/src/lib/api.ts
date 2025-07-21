import { axiosInstance } from "@/lib/axios";

// This function does NOT use hooks, it's safe to export
export const getStreamToken = async (token: string | null) => {
  return axiosInstance.post(
    "/chat/token",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// Playlist API functions
export const scanSongsDirectory = async () => {
  return axiosInstance.get("/playlists/scan");
};

export const createPlaylistsFromSongs = async () => {
  return axiosInstance.post("/playlists/create-from-songs");
};

export const updateSongArtwork = async (songId: string, imageFile: File) => {
  const formData = new FormData();
  formData.append("imageFile", imageFile);
  return axiosInstance.patch(`/admin/songs/${songId}/artwork`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateAlbumArtwork = async (albumId: string, imageFile: File) => {
  const formData = new FormData();
  formData.append("imageFile", imageFile);
  return axiosInstance.patch(`/admin/albums/${albumId}/artwork`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};