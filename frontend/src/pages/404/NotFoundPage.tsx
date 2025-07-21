import { Home, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
	const navigate = useNavigate();

	return (
		<div className='h-screen bg-gradient-to-b from-light-black to-dark-black flex items-center justify-center'>
			<div className='text-center space-y-8 px-4'>
				{/* Large animated musical note */}
				<div className='flex justify-center animate-bounce'>
					<Music2 className='h-24 w-24 pink-theme-text' />
				</div>

				{/* Error message */}
				<div className='space-y-4'>
					<h1 className='text-7xl font-bold pink-theme-text'>404</h1>
					<h2 className='text-2xl font-semibold pink-theme-text'>Page not found</h2>
					<p className='pink-theme-text-light max-w-md mx-auto'>
						Looks like this track got lost in the shuffle. Lets get you back to the music.
					</p>
				</div>

				{/* Action buttons */}
				<div className='flex flex-col sm:flex-row gap-4 justify-center items-center mt-8'>
					<Button
						onClick={() => navigate(-1)}
						className='bg-neutral-800 hover:bg-neutral-700 pink-theme-text w-full sm:w-auto pink-theme-bg'
					>
						Go Back
					</Button>
					<Button
						onClick={() => navigate("/")}
						className='bg-emerald-500 hover:bg-emerald-600 pink-theme-text w-full sm:w-auto pink-theme-bg'
					>
						<Home className='mr-2 h-4 w-4' />
						Back to Home
					</Button>
				</div>
			</div>
		</div>
	);
}