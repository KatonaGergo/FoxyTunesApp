const SectionGridSkeleton = () => {
	return (
		<div className='mb-8'>
			<div className='h-8 w-48 bg-light-black rounded mb-4 animate-pulse' />
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className='bg-light-black/40 p-4 rounded-md animate-pulse'>
						<div className='aspect-square rounded-md bg-pink-100 mb-4' />
						<div className='h-4 bg-pink-100 rounded w-3/4 mb-2' />
						<div className='h-4 bg-pink-100 rounded w-1/2' />
					</div>
				))}
			</div>
		</div>
	);
};
export default SectionGridSkeleton;