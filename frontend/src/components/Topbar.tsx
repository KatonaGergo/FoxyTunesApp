import { SignedOut, UserButton } from "@clerk/clerk-react";
import { LayoutDashboardIcon } from "lucide-react";
import { Link } from "react-router-dom";
import SignInOAuthButtons from "./SignInOAuthButtons";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";
import SearchBar from "./SearchBar";
import ThemeSelector from "./ThemeSelector";

const Topbar = ({ onSearch }: { onSearch?: (query: string) => void }) => {
	const { isAdmin } = useAuthStore();

	return (
		<div
			className='flex items-center justify-between p-4 sticky top-0 bg-dark-black/75 
      backdrop-blur-md z-10
    '
		>
			<div className='flex gap-6 items-center w-full'>
				<div className='flex gap-2 items-center'>
					<img src='/FoxyTunes-logo.png' className='size-12 rounded-full object-cover' alt='Spotify logo' />
					FoxyTunes
				</div>
				<div className='flex-1 flex justify-center'>
					<SearchBar onSearch={onSearch} />
				</div>
				<div className='flex items-center gap-4'>
					{isAdmin && (
						<>
							<ThemeSelector />
							<Link to={"/admin"} className={cn(buttonVariants({ variant: "secondary" }))}>
								<LayoutDashboardIcon className='size-4  mr-2' />
								Admin Dashboard
							</Link>
						</>
					)}

					<SignedOut>
						<SignInOAuthButtons />
					</SignedOut>

					<UserButton />
				</div>
			</div>
		</div>
	);
};
export default Topbar;