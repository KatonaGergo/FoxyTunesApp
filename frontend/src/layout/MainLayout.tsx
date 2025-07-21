import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Outlet } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import FriendsActivity from "./components/FriendsActivity";
import AudioPlayer from "./components/AudioPlayer";
import { PlaybackControls } from "./components/PlaybackControls";
import { useEffect, useRef, useState } from "react";
import WindowControls from "@/components/ui/WindowControls";
import Player from "lottie-react";

// User can edit this list:
const PROP_MESSAGES = [
  "Hey, how is it going? Long time no see!",
  // Add more messages here
];

const MainLayout = () => {
	const [isMobile, setIsMobile] = useState(false);
	const [foxyHeheData, setFoxyHeheData] = useState<any>(null);
	const [showConversation, setShowConversation] = useState(false);
	const [currentMessage, setCurrentMessage] = useState("");
	const [displayedText, setDisplayedText] = useState("");
	const conversationRef = useRef<HTMLDivElement>(null);

	// Typewriter effect
	useEffect(() => {
		if (!showConversation) return;
		setDisplayedText("");
		if (currentMessage) {
			let i = 0;
			const interval = setInterval(() => {
				setDisplayedText(currentMessage.slice(0, i + 1));
				i++;
				if (i >= currentMessage.length) clearInterval(interval);
			}, 40);
			return () => clearInterval(interval);
		}
	}, [showConversation, currentMessage]);

	const handlePropClick = () => {
		const msg = PROP_MESSAGES[Math.floor(Math.random() * PROP_MESSAGES.length)];
		setCurrentMessage(msg);
		setShowConversation(true);
	};

	// Hide conversation on outside click
	useEffect(() => {
		if (!showConversation) return;
		const handleClick = (e: MouseEvent) => {
			if (conversationRef.current && !conversationRef.current.contains(e.target as Node)) {
				setShowConversation(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [showConversation]);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		fetch("/Prop/Foxy_hehe.json")
			.then((res) => res.json())
			.then((data) => setFoxyHeheData(data));
	}, []);

	return (
		<>
			<div className='h-screen bg-background text-white flex flex-col'>
				{/* Put controls as fixed top-right, hide on mobile */}
				{!isMobile && (
					<div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
						<WindowControls />
					</div>
				)}

				{/* Lottie animation fixed at bottom right corner, responsive */}
				{!isMobile && foxyHeheData && (
					<div className="fixed bottom-16 right-6 z-40 w-60 h-60 cursor-pointer md:w-60 md:h-60 w-40 h-40 right-2" onClick={handlePropClick} style={{ pointerEvents: "auto" }}>
						<Player
							autoplay
							loop
							animationData={foxyHeheData}
							style={{ width: '100%', height: '100%' }}
						/>
					</div>
				)}

				{/* Conversation box, responsive */}
				{showConversation && (
					<div
						ref={conversationRef}
						className="fixed bottom-80 right-10 z-50 bg-dark-black text-white px-6 py-4 rounded-xl shadow-lg border border-pink-500 transition-all duration-500 animate-fade-in message-arrow-box md:bottom-80 md:right-10 bottom-52 right-2 w-[90vw] max-w-xs md:w-auto"
						style={{ minWidth: 220, position: 'fixed' }}
					>
						<button
							onClick={() => setShowConversation(false)}
							className="absolute top-2 right-2 text-pink-400 hover:text-pink-200 text-xl font-bold focus:outline-none"
							aria-label="Close"
						>
							&times;
						</button>
						<span className="font-mono text-lg">{displayedText}</span>
						{/* Arrow with more visible border and shadow */}
						<div className="absolute -bottom-5 right-7 w-0 h-0 drop-shadow-lg md:block hidden">
							{/* Outer border triangle (brighter and larger) */}
							<div className="absolute w-0 h-0 border-l-[22px] border-l-transparent border-r-[22px] border-r-transparent border-t-[22px] border-t-pink-500 left-[-3px] top-[-3px]"></div>
							{/* Inner background triangle */}
							<div className="absolute w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[18px] border-t-dark-black"></div>
						</div>
						{/* Mobile arrow (smaller, repositioned) */}
						<div className="absolute -bottom-3 right-4 w-0 h-0 drop-shadow-lg md:hidden block">
							<div className="absolute w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[14px] border-t-pink-500 left-[-2px] top-[-2px]"></div>
							<div className="absolute w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-dark-black"></div>
						</div>
					</div>
				)}

				<ResizablePanelGroup direction='horizontal' className='flex-1 flex h-full overflow-hidden p-2'>
					<AudioPlayer />
					{/* left sidebar */}
					<ResizablePanel defaultSize={20} minSize={isMobile ? 0 : 10} maxSize={30}>
						<LeftSidebar />
					</ResizablePanel>

					<ResizableHandle className='w-2 bg-background rounded-lg transition-colors' />

					{/* Main content */}
					<ResizablePanel defaultSize={isMobile ? 80 : 60}>
						<Outlet />
					</ResizablePanel>

					{!isMobile && (
						<>
							<ResizableHandle className='w-2 bg-background rounded-lg transition-colors' />

							{/* right sidebar */}
							<ResizablePanel defaultSize={20} minSize={0} maxSize={25} collapsedSize={0}>
								<FriendsActivity />
							</ResizablePanel>
						</>
					)}
				</ResizablePanelGroup>

				<PlaybackControls />
			</div>
		</>
	);
};

// Add this to your global CSS:
// @keyframes fade-in { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: translateY(0);} }
// .animate-fade-in { animation: fade-in 0.5s; }
export default MainLayout;