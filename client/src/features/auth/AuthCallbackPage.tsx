import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { exchangeTicketRequest } from "./auth.api";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
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
        const response = await exchangeTicketRequest(ticket);

        if (!response?.data?.accessToken || !response?.data?.user) {
          throw new Error("Invalid authentication payload returned by server");
        }

        const { accessToken, user } = response.data;

        // Populate auth store
        setAuth(user, accessToken);
        queryClient.removeQueries({ queryKey: ["my-shops"] });

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
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="size-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
    </div>
  );
}
