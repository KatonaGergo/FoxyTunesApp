const RecentlyPlayedGridSkeleton = () => {
	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className='flex items-center bg-light-black/50 rounded-md overflow-hidden animate-pulse'>
					<div className='w-16 sm:w-20 h-16 sm:h-20 bg-pink-100 flex-shrink-0' />
					<div className='flex-1 p-4'>
						<div className='h-4 bg-pink-100 rounded w-3/4 mb-2' />
					</div>
				</div>
			))}
		</div>
	);
};
export default RecentlyPlayedGridSkeleton;