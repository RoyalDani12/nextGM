import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { exchangeTicketRequest } from "./auth.api";
import { Spinner } from "@/components/ui/spinner";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [statusText, setStatusText] = useState("Completing secure sign-in...");
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Avoid double execution in React StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const ticket = searchParams.get("ticket");
    const googleError = searchParams.get("googleError") || searchParams.get("error");

    if (googleError) {
      navigate(`/login?googleError=${encodeURIComponent(googleError)}`, { replace: true });
      return;
    }

    if (!ticket) {
      navigate(
        `/login?googleError=${encodeURIComponent("Authentication ticket was not received. Please try again.")}`,
        { replace: true }
      );
      return;
    }

    const processTicket = async () => {
      try {
        setStatusText("Verifying authentication with Google...");
        const response = await exchangeTicketRequest(ticket);

        if (!response?.data?.accessToken || !response?.data?.user) {
          throw new Error("Invalid authentication payload returned by server");
        }

        const { accessToken, user } = response.data;

        // Populate auth store
        setAuth(user, accessToken);
        queryClient.removeQueries({ queryKey: ["my-shops"] });

        setStatusText("Redirecting to your dashboard...");
        navigate("/role-redirect", { replace: true });
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Google sign-in could not be completed. Please try again.";
        navigate(`/login?googleError=${encodeURIComponent(errorMsg)}`, { replace: true });
      }
    };

    processTicket();
  }, [searchParams, navigate, queryClient, setAuth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md text-center">
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
          <svg className="size-7" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#ffffff"
              d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.14c1.84-1.69 2.91-4.18 2.91-7.29Z"
            />
            <path
              fill="#ffffff"
              d="M12 21.75c2.63 0 4.83-.87 6.44-2.36l-3.14-2.52c-.87.58-1.99.92-3.3.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.6A9.73 9.73 0 0 0 12 21.75Z"
            />
            <path
              fill="#ffffff"
              d="M6.54 13.76A5.86 5.86 0 0 1 6.24 12c0-.61.11-1.2.3-1.76v-2.6H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.36l3.24-2.6Z"
            />
            <path
              fill="#ffffff"
              d="M12 6.21c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.82 3.3 14.62 2.25 12 2.25A9.73 9.73 0 0 0 3.3 7.64l3.24 2.6C7.31 7.93 9.46 6.21 12 6.21Z"
            />
          </svg>
        </div>

        <h2 className="mb-2 text-lg font-bold tracking-tight">Authenticating with Google</h2>
        <p className="mb-6 text-xs text-slate-400">{statusText}</p>

        <Spinner className="size-6 text-indigo-400" />
      </div>
    </div>
  );
}
