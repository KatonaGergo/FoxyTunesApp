import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { Send, Smile } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Picker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";

const MessageInput = () => {
	const [newMessage, setNewMessage] = useState("");
	const [showPicker, setShowPicker] = useState(false);
	const { user } = useUser();
	const { selectedUser, sendMessage } = useChatStore();
	const inputRef = useRef<HTMLInputElement>(null);
	const pickerRef = useRef<HTMLDivElement>(null);

	const handleSend = () => {
		if (!selectedUser || !user || !newMessage.trim()) return;
		sendMessage(selectedUser.clerkId, user.id, newMessage.trim());
		setNewMessage("");
	};

	const onEmojiClick = (emojiData: EmojiClickData) => {
		setNewMessage((prev) => prev + emojiData.emoji);
		inputRef.current?.focus();
	};

	// Close emoji picker if clicked outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				pickerRef.current &&
				!pickerRef.current.contains(event.target as Node)
			) {
				setShowPicker(false);
			}
		};

		if (showPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showPicker]);

	return (
		<div className="relative p-4 mt-auto border-t border-zinc-800">
			<div className="flex gap-2 items-center">
				<Input
					ref={inputRef}
					placeholder="Type a message"
					value={newMessage}
					onChange={(e) => setNewMessage(e.target.value)}
					className="bg-light-black border-none pink-theme-text-light placeholder-zinc-400"
					onKeyDown={(e) => e.key === "Enter" && handleSend()}
				/>

				{/* Emoji picker toggle button */}
				<Button
					size="icon"
					onClick={() => setShowPicker((prev) => !prev)}
					aria-label="Toggle emoji picker"
					type="button"
				>
					<Smile className="size-5" />
				</Button>

				<Button size="icon" onClick={handleSend} disabled={!newMessage.trim()}>
					<Send className="size-4" />
				</Button>
			</div>

			{/* Emoji Picker Dropdown */}
			{showPicker && (
				<div
					ref={pickerRef}
					className="absolute bottom-full mb-2 right-0 z-50"
				>
					<Picker onEmojiClick={onEmojiClick} />
				</div>
			)}
		</div>
	);
};

export default MessageInput;