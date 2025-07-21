import PlaylistSkeleton from "@/components/skeletons/PlaylistSkeleton";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMusicStore } from "@/stores/useMusicStore";
import { SignedIn } from "@clerk/clerk-react";
import { HomeIcon, Library, MessageCircle, FolderOpen } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import ImportSpotifyPlaylistModal from "@/components/ImportSpotifyPlaylistModal";
import { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { createPlaylistsFromSongs } from "@/lib/api";
import toast from "react-hot-toast";

const LeftSidebar = () => {
	const { albums, fetchAlbums, isLoading } = useMusicStore();
	const { unseenCounts } = useChatStore();
	const unseenTotal = Object.values(unseenCounts).reduce((a, b) => a + b, 0);

	useEffect(() => {
		fetchAlbums();
	}, [fetchAlbums]);

	const [importModalOpen, setImportModalOpen] = useState(false);
	const [isCreatingPlaylists, setIsCreatingPlaylists] = useState(false);

	console.log({ albums });

	const handleCreatePlaylistsFromSongs = async () => {
		setIsCreatingPlaylists(true);
		try {
			const response = await createPlaylistsFromSongs();
			toast.success(response.data.message);
			// Refresh albums to show newly created playlists
			fetchAlbums();
		} catch (error: any) {
			console.error('Error creating playlists:', error);
			toast.error(error.response?.data?.error || 'Failed to create playlists');
		} finally {
			setIsCreatingPlaylists(false);
		}
	};

	return (
		<div className='h-full flex flex-col gap-2'>
			{/* Navigation menu */}

			<div className='rounded-lg bg-dark-black p-4'>
				<div className='space-y-2'>
					<Link
						to={"/"}
						className={cn(
							buttonVariants({
								variant: "ghost",
								className: "w-full justify-start text-white hover:bg-light-black",
							})
						)}
					>
						<HomeIcon className='mr-2 size-5' />
						<span className='hidden md:inline'>Home</span>
					</Link>

					<SignedIn>
						<Link
							to={"/chat"}
							className={cn(
								buttonVariants({
									variant: "ghost",
									className: "w-full justify-start text-white hover:bg-light-black relative",
								})
							)}
						>
							<MessageCircle className='mr-2 size-5' />
							<span className='hidden md:inline'>Messages</span>
							{unseenTotal > 0 && (
								<span className="absolute top-1 right-3 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow border-2 border-zinc-900 animate-pulse z-10">
									{unseenTotal}
								</span>
							)}
						</Link>
					</SignedIn>
				</div>
			</div>

			{/* Library section */}
			<div className='flex-1 rounded-lg bg-dark-black p-4'>
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center text-white px-2 gap-2'>
						<Library className='size-5 mr-2' />
						<span className='hidden md:inline'>Playlists</span>
						<div className="flex gap-2">
							<button
								className="flex items-center gap-2 bg-light-black hover:bg-green-600 transition-all duration-300 text-white px-3 py-1 rounded-md shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400"
								type="button"
								onClick={() => setImportModalOpen(true)}
							>
								{/* Spotify Icon (SVG) */}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="w-5 h-5"
									fill="white"
									viewBox="0 0 24 24"
								>
									<path d="M12 0C5.371 0 0 5.371 0 12c0 6.627 5.371 12 12 12s12-5.373 12-12c0-6.629-5.371-12-12-12zm5.438 17.438c-.229.375-.708.5-1.083.271-2.979-1.813-6.729-2.229-11.146-1.25-.438.104-.896-.167-1-.604-.104-.438.167-.896.604-1 4.833-1.104 8.979-.646 12.271 1.354.375.229.5.708.354 1.229zm1.542-3.021c-.292.479-.896.625-1.375.333-3.417-2.083-8.625-2.688-12.646-1.5-.542.146-1.104-.146-1.25-.688-.146-.542.146-1.104.688-1.25 4.563-1.292 10.229-.625 14.083 1.75.479.292.625.896.5 1.355zm.146-3.104c-4.021-2.396-10.667-2.625-14.438-1.479-.646.188-1.354-.146-1.542-.792-.188-.646.146-1.354.792-1.542 4.25-1.25 11.542-.979 16.021 1.646.604.354.792 1.146.438 1.75-.354.604-1.146.792-1.75.417z"/>
								</svg>
								<span className="hidden md:inline">Import</span>
								<span className="inline md:hidden">Import</span>
							</button>
							<button
								className="flex items-center gap-2 bg-light-black hover:bg-blue-600 transition-all duration-300 text-white px-3 py-1 rounded-md shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
								type="button"
								onClick={handleCreatePlaylistsFromSongs}
								disabled={isCreatingPlaylists}
							>
								{isCreatingPlaylists ? (
									<div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
								) : (
									<FolderOpen className="w-4 h-4" />
								)}
								<span className="hidden md:inline">Create from Songs</span>
								<span className="inline md:hidden">Create</span>
							</button>
						</div>
					</div>
				</div>

				<ScrollArea className='h-[calc(100vh-300px)]'>
					<div className='space-y-2'>
						{isLoading ? (
							<PlaylistSkeleton />
						) : (
							albums.map((album) => (
								<Link
									to={`/albums/${album._id}`}
									key={album._id}
									className='p-2 hover:bg-light-black rounded-md flex items-center gap-3 group cursor-pointer'
								>
									<img
										src={album.imageUrl}
										alt='Playlist img'
										className='size-12 rounded-md flex-shrink-0 object-cover'
									/>

									<div className='flex-1 min-w-0 hidden md:block'>
										<p className='font-medium truncate'>{album.title}</p>
										<p className='text-sm text-zinc-400 truncate pink-theme-text-light'>Album • {album.artist}</p>
									</div>
								</Link>
							))
						)}
					</div>
				</ScrollArea>
			</div>
			<ImportSpotifyPlaylistModal open={importModalOpen} onClose={() => setImportModalOpen(false)} />
		</div>
	);
};
export default LeftSidebar;