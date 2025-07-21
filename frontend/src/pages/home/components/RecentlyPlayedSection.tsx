import { usePlayerStore } from "@/stores/usePlayerStore";
import FeaturedGridSkeleton from "@/components/skeletons/RecentlyPlayedGridSkeleton";
import PlayButton from "./PlayButton";

const RecentlyPlayedSection = () => {
	const { recentlyPlayed } = usePlayerStore();

	if (!recentlyPlayed) return <FeaturedGridSkeleton />;

	if (recentlyPlayed.length === 0)
		return <p className='text-zinc-400 mb-4 text-lg'>No recently played songs yet.</p>;

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
			{recentlyPlayed.map((song) => (
				<div
					key={song._id}
					className='flex items-center bg-light-black/50 rounded-md overflow-hidden
         hover:bg-pink-100/50 transition-colors group cursor-pointer relative'
				>
					<img
						src={song.imageUrl}
						alt={song.title}
						className='w-16 sm:w-20 h-16 sm:h-20 object-cover flex-shrink-0'
					/>
					<div className='flex-1 p-4'>
						<p className='font-medium truncate'>{song.title}</p>
						<p className='text-sm text-zinc-400 truncate'>{song.artist}</p>
					</div>
					<PlayButton song={song} />
				</div>
			))}
		</div>
	);
};
export default RecentlyPlayedSection; 