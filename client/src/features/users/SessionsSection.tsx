import { Laptop, Loader2, LogOut, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRevokeOtherSessions, useRevokeSession, useSessions } from "./users.hook";

export default function SessionsSection() {
  const { data: sessions = [], isLoading, isError } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-orange-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
        We could not load your active sessions. Please refresh the page to try again.
      </div>
    );
  }

  const otherSessions = sessions.filter((session) => !session.isCurrentSession);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-semibold text-slate-900">Signed-in Devices</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Review active web sessions and revoke access from unrecognized browsers.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!otherSessions.length || revokeOthers.isPending}
          onClick={() => revokeOthers.mutate()}
          className="h-8 px-3 rounded-md border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
        >
          {revokeOthers.isPending ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <LogOut className="mr-1.5 size-3.5 text-slate-400" />
          )}
          Sign out other devices
        </Button>
      </div>

      <div className="space-y-2.5">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between gap-3 rounded-md border border-slate-200/80 bg-white p-3 hover:bg-slate-50/60 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-50 border border-slate-200/70 text-slate-600">
                <MonitorSmartphone className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {session.deviceName || "Web Browser"}
                  </p>
                  {session.isCurrentSession && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      <ShieldCheck className="size-3 text-emerald-600" />
                      Current device
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                  IP: {session.ipAddress || "Unknown"} · First active {new Date(session.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {!session.isCurrentSession && (
              <Button
                variant="ghost"
                size="sm"
                disabled={revokeSession.isPending}
                onClick={() => revokeSession.mutate(session.id)}
                className="h-7 px-2.5 rounded-md text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
              >
                Sign out
              </Button>
            )}
          </div>
        ))}

        {!sessions.length && (
          <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-400">
            <Laptop className="mx-auto mb-2 size-5 text-slate-300" />
            No other active sessions detected.
          </div>
        )}
      </div>
    </div>
  );
}
