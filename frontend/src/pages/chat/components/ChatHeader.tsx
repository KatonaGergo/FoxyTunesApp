import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore } from "@/stores/useChatStore";
import { useNavigate } from "react-router-dom";
import { Video } from "lucide-react";

const ChatHeader = () => {
	const { selectedUser, onlineUsers } = useChatStore();
	const navigate = useNavigate();

	if (!selectedUser) return null;

	return (
		<div className='p-4 border-b border-light-black flex items-center justify-between'>
			<div className='flex items-center gap-3'>
				<Avatar>
					<AvatarImage src={selectedUser.imageUrl} />
					<AvatarFallback>{selectedUser.fullName[0]}</AvatarFallback>
				</Avatar>
				<div>
					<h2 className='font-medium'>{selectedUser.fullName}</h2>
					<p className='text-sm text-zinc-400 pink-theme-text-light'>
						{onlineUsers.has(selectedUser.clerkId) ? "Online" : "Offline"}
					</p>
				</div>
			</div>
			<button
				className="ml-auto bg-emerald-500 hover:bg-emerald-400 text-white rounded-full p-2 flex items-center justify-center shadow pink-theme-bg"
				onClick={() => navigate(`/call/${selectedUser.clerkId}`)}
				title="Start Video Call"
			>
				<Video className="w-5 h-5" />
			</button>
		</div>
	);
};
export default ChatHeader;