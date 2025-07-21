import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuth } from "@clerk/clerk-react";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import Player from "lottie-react";

const updateApiToken = (token: string | null) => {
	if (token) axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
	else delete axiosInstance.defaults.headers.common["Authorization"];
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const { getToken, userId } = useAuth();
	const [loading, setLoading] = useState(true);
	const [lottieData, setLottieData] = useState<any>(null);
	const [lottieDone, setLottieDone] = useState(false);
	const { checkAdminStatus } = useAuthStore();
	const { initSocket, disconnectSocket } = useChatStore();

	useEffect(() => {
		fetch("/Prop/Foxy Hello.json")
			.then((res) => res.json())
			.then((data) => setLottieData(data));
	}, []);

	useEffect(() => {
		const initAuth = async () => {
			try {
				const token = await getToken();
				updateApiToken(token);
				if (token) {
					await checkAdminStatus();
					// init socket
					if (userId) initSocket(userId);
				}
			} catch (error: any) {
				updateApiToken(null);
				console.log("Error in auth provider", error);
			} finally {
				setLoading(false);
			}
		};

		initAuth();

		// clean up
		return () => disconnectSocket();
	}, [getToken, userId, checkAdminStatus, initSocket, disconnectSocket]);

	const showLoading = loading || !lottieDone;

	if (showLoading)
		return (
			<div className='h-screen w-full flex flex-col items-center justify-center gap-6 bg-background'>
				<div className="flex flex-col items-center gap-4">
					{lottieData && (
						<Player
							autoplay
							loop={false}
							animationData={lottieData}
							onComplete={() => setLottieDone(true)}
							style={{ width: 180, height: 180 }}
						/>
					)}
					<Loader className='size-10 text-emerald-500 animate-spin' />
				</div>
				<p className="mt-4 text-center text-lg font-mono text-zinc-300">Loading FoxyTunes...</p>
			</div>
		);

	return <>{children}</>;
};
export default AuthProvider;