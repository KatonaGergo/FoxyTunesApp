import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./providers/AuthProvider.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // <-- Add this

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
	throw new Error("Missing Publishable Key");
}

const queryClient = new QueryClient(); // <-- Add this

// Set theme class before React renders
const saved = localStorage.getItem("theme");
const theme = saved || "theme-dark";
document.documentElement.classList.add(theme);

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl='/'>
			<AuthProvider>
				<BrowserRouter>
					<QueryClientProvider client={queryClient}> {/* <-- Add this */}
						<App />
					</QueryClientProvider>
				</BrowserRouter>
			</AuthProvider>
		</ClerkProvider>
	</StrictMode>
);