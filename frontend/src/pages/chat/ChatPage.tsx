import Topbar from "@/components/Topbar";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState, useRef } from "react";
import UsersList from "./components/UsersList";
import ChatHeader from "./components/ChatHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import MessageInput from "./components/MessageInput";
import { AnimatePresence, motion } from "framer-motion";

const formatTime = (date: string) => {
	return new Date(date).toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

const ChatPage = () => {
	const { user } = useUser();
	const { messages, selectedUser, fetchUsers, fetchMessages } = useChatStore();

	const [showBubble, setShowBubble] = useState(false);
	const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (user) fetchUsers();
	}, [fetchUsers, user]);

	useEffect(() => {
		if (selectedUser) {
			fetchMessages(selectedUser.clerkId);

			if (selectedUser.clerkId !== lastSelectedId) {
				setShowBubble(true);
				setLastSelectedId(selectedUser.clerkId);

				// Hide after 2.5s
				setTimeout(() => setShowBubble(false), 2500);
			}
		}
	}, [selectedUser, fetchMessages, lastSelectedId]);

	useEffect(() => {
		// Scroll to bottom when messages or selectedUser changes, after render
		const timeout = setTimeout(() => {
			if (messagesEndRef.current) {
				messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
			}
		}, 50); // 50ms delay to ensure DOM is updated
		return () => clearTimeout(timeout);
	}, [messages, selectedUser]);

	return (
		<main className="h-full rounded-lg bg-gradient-to-b from-light-black to-dark-black overflow-hidden">
			<Topbar />

			<div className="grid lg:grid-cols-[300px_1fr] grid-cols-[80px_1fr] h-[calc(100vh-180px)]">
				<UsersList />

				{/* chat message */}
				<div className="relative flex flex-col h-full">
					{/* Bubble animation */}
					<AnimatePresence>
						{showBubble && selectedUser && (
							<motion.div
								key={selectedUser.clerkId + "-bubble"}
								initial={{ opacity: 0, y: -20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.4 }}
								className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-pink-100 text-white px-4 py-2 rounded-full shadow-md text-sm select-none pointer-events-none"
							>
								You are now chatting with {selectedUser.fullName} 💬
							</motion.div>
						)}
					</AnimatePresence>

					{/* Animate the entire chat panel on selectedUser change */}
					<AnimatePresence mode="wait">
						{selectedUser ? (
							<motion.div
								key={selectedUser.clerkId + "-chatpanel"}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.3 }}
								className="flex flex-col h-full"
							>
								<ChatHeader />

								{/* Messages */}
								<ScrollArea className="h-[calc(100vh-340px)]">
									<div className="p-4 space-y-4">
										{messages.map((message) => (
											<div
												key={message._id}
												className={`flex items-start gap-3 ${
													message.senderId === user?.id ? "flex-row-reverse" : ""
												}`}
											>
												<Avatar className="size-8">
													<AvatarImage
														src={
															message.senderId === user?.id
																? user.imageUrl
																: selectedUser.imageUrl
														}
													/>
												</Avatar>

												<div
													className={`rounded-lg p-3 max-w-[70%] ${
														message.senderId === user?.id
															? "bg-green-500 pink-theme-bg pink-theme-text"
															: "bg-light-black"
													}`}
												>
													<p className="text-sm">{message.content}</p>
													<span className="text-xs text-zinc-300 mt-1 block pink-theme-text-light">
														{formatTime(message.createdAt)}
													</span>
												</div>
											</div>
										))}
										<div ref={messagesEndRef} />
									</div>
								</ScrollArea>

								<MessageInput />
							</motion.div>
						) : (
							<NoConversationPlaceholder />
						)}
					</AnimatePresence>
				</div>
			</div>
		</main>
	);
};
export default ChatPage;

const NoConversationPlaceholder = () => (
	<div className="flex flex-col items-center justify-center h-full space-y-6">
		<img
			src="/fox_spotify_glow_animation.gif"
			alt="Spotify"
			className="size-16 animate-bounce"
		/>
		<div className="text-center">
			<h3 className="text-zinc-300 text-lg font-medium mb-1">No conversation selected</h3>
			<p className="text-zinc-500 text-sm pink-theme-text-light">Choose a friend to start chatting</p>
		</div>
	</div>
);