import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "./components/ui/toast.tsx";
import { Toaster as HotToaster } from "react-hot-toast";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
                <Toaster />
                <HotToaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: "#0f172a",
                            color: "#f8fafc",
                            borderRadius: "14px",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
                            fontSize: "13px",
                            fontWeight: "600",
                            padding: "12px 18px",
                        },
                        success: {
                            iconTheme: {
                                primary: "#10b981",
                                secondary: "#ffffff",
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: "#f43f5e",
                                secondary: "#ffffff",
                            },
                        },
                    }}
                />
            </BrowserRouter>
        </QueryClientProvider>
    </StrictMode>,
);
