import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMusicStore } from "@/stores/useMusicStore";
import { Calendar, Music, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { updateAlbumArtwork } from "@/lib/api";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";

const AlbumsTable = () => {
	const { albums, deleteAlbum, fetchAlbums } = useMusicStore();
	const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const handleEditClick = (albumId: string) => {
		setEditingAlbumId(albumId);
		setSelectedFile(null);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setSelectedFile(e.target.files[0]);
		}
	};

	const handleSubmit = async (albumId: string) => {
		if (!selectedFile) return;
		setIsUploading(true);
		try {
			await updateAlbumArtwork(albumId, selectedFile);
			toast.success("Artwork updated!");
			setEditingAlbumId(null);
			await fetchAlbums();
		} catch (err: any) {
			toast.error("Failed to update artwork");
		} finally {
			setIsUploading(false);
		}
	};

	useEffect(() => {
		fetchAlbums();
	}, [fetchAlbums]);

	return (
		<Table>
			<TableHeader>
				<TableRow className='hover:bg-light-black/50'>
					<TableHead className='w-[50px]'></TableHead>
					<TableHead className='pink-theme-text'>Title</TableHead>
					<TableHead className='pink-theme-text'>Artist</TableHead>
					<TableHead className='pink-theme-text'>Release Year</TableHead>
					<TableHead className='pink-theme-text'>Songs</TableHead>
					<TableHead className='text-right pink-theme-text'>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{albums.map((album) => (
					<TableRow key={album._id} className='hover:bg-light-black/50'>
						<TableCell>
							<img src={album.imageUrl} alt={album.title} className='w-10 h-10 rounded object-cover' />
						</TableCell>
						<TableCell className='font-medium pink-theme-text'>{album.title}</TableCell>
						<TableCell className='pink-theme-text'>{album.artist}</TableCell>
						<TableCell>
							<span className='inline-flex items-center gap-1 pink-theme-text'>
								<Calendar className='h-4 w-4' />
								{album.releaseYear}
							</span>
						</TableCell>
						<TableCell>
							<span className='inline-flex items-center gap-1 pink-theme-text'>
								<Music className='h-4 w-4' />
								{album.songs.length} songs
							</span>
						</TableCell>
						<TableCell className='text-right'>
							<div className='flex gap-2 justify-end'>
								<Button
									variant='ghost'
									size='sm'
									className='text-blue-400 hover:text-blue-300 hover:bg-blue-400/10'
									onClick={() => handleEditClick(album._id)}
								>
									<Pencil className='h-4 w-4' />
								</Button>
								<Button
									variant='ghost'
									size='sm'
									onClick={() => deleteAlbum(album._id)}
									className='text-red-400 hover:text-red-300 hover:bg-red-400/10'
								>
									<Trash2 className='h-4 w-4' />
								</Button>
							</div>
							{editingAlbumId === album._id && (
								<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60">
									<div className="bg-dark-black p-6 rounded-lg shadow-lg w-full max-w-xs flex flex-col gap-4">
										<h3 className="text-lg font-semibold mb-2 text-center">Update Artwork</h3>
										<input type="file" accept="image/*" onChange={handleFileChange} />
										<div className="flex gap-2 mt-2">
											<Button
												disabled={!selectedFile || isUploading}
												onClick={() => handleSubmit(album._id)}
											>
												{isUploading ? "Uploading..." : "Save"}
											</Button>
											<Button variant="ghost" onClick={() => setEditingAlbumId(null)}>Cancel</Button>
										</div>
									</div>
								</div>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};
export default AlbumsTable;