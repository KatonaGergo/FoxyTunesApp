import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMusicStore } from "@/stores/useMusicStore";
import { Calendar, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { updateSongArtwork } from "@/lib/api";
import toast from "react-hot-toast";

const SongsTable = () => {
	const { songs, isLoading, error, deleteSong, fetchSongs } = useMusicStore();
	const [editingSongId, setEditingSongId] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const handleEditClick = (songId: string) => {
		setEditingSongId(songId);
		setSelectedFile(null);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setSelectedFile(e.target.files[0]);
		}
	};

	const handleSubmit = async (songId: string) => {
		if (!selectedFile) return;
		setIsUploading(true);
		try {
			await updateSongArtwork(songId, selectedFile);
			toast.success("Artwork updated!");
			setEditingSongId(null);
			await fetchSongs();
		} catch (err: any) {
			toast.error("Failed to update artwork");
		} finally {
			setIsUploading(false);
		}
	};

	if (isLoading) {
		return (
			<div className='flex items-center justify-center py-8'>
				<div className='text-zinc-400'>Loading songs...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='flex items-center justify-center py-8'>
				<div className='text-red-400'>{error}</div>
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow className='hover:bg-light-black/50'>
					<TableHead className='w-[50px]'></TableHead>
					<TableHead className='pink-theme-text'>Title</TableHead>
					<TableHead className='pink-theme-text'>Artist</TableHead>
					<TableHead className='pink-theme-text'>Release Date</TableHead>
					<TableHead className='text-right pink-theme-text'>Actions</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{songs.map((song) => (
					<TableRow key={song._id} className='hover:bg-light-black/50'>
						<TableCell>
							<img src={song.imageUrl} alt={song.title} className='size-10 rounded object-cover' />
						</TableCell>
						<TableCell className='font-medium'>{song.title}</TableCell>
						<TableCell>{song.artist}</TableCell>
						<TableCell>
							<span className='inline-flex items-center gap-1 pink-theme-text'>
								<Calendar className='h-4 w-4' />
								{song.createdAt.split("T")[0]}
							</span>
						</TableCell>

						<TableCell className='text-right'>
							<div className='flex gap-2 justify-end'>
								<Button
									variant={"ghost"}
									size={"sm"}
									className='text-blue-400 hover:text-blue-300 hover:bg-blue-400/10'
									onClick={() => handleEditClick(song._id)}
								>
									<Pencil className='size-4' />
								</Button>
								<Button
									variant={"ghost"}
									size={"sm"}
									className='text-red-400 hover:text-red-300 hover:bg-red-400/10'
									onClick={() => deleteSong(song._id)}
								>
									<Trash2 className='size-4' />
								</Button>
							</div>
							{editingSongId === song._id && (
								<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60">
									<div className="bg-dark-black p-6 rounded-lg shadow-lg w-full max-w-xs flex flex-col gap-4">
										<h3 className="text-lg font-semibold mb-2 text-center">Update Artwork</h3>
										<input type="file" accept="image/*" onChange={handleFileChange} />
										<div className="flex gap-2 mt-2">
											<Button
												disabled={!selectedFile || isUploading}
												onClick={() => handleSubmit(song._id)}
											>
												{isUploading ? "Uploading..." : "Save"}
											</Button>
											<Button variant="ghost" onClick={() => setEditingSongId(null)}>Cancel</Button>
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
export default SongsTable;