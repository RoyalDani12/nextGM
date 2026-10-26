import { ArrowLeft, Bell, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileSection from "./ProfileSection";
import SessionsSection from "./SessionsSection";
import NotificationPreferencesSection from "./NotificationPreferencesSection";

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-7 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
              Your account
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Profile & security
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Keep your details current, manage notifications, and control where your account is signed in.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="size-4" /> Account protected
          </div>
        </div>

        <div className="space-y-6">
          {/* Personal Details */}
          <section className="overflow-hidden rounded-3xl border border-white bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-3 border-b border-slate-100 p-5 sm:p-6">
              <div className="rounded-2xl bg-orange-50 p-2.5 text-orange-600">
                <UserRound className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Personal details</h2>
                <p className="mt-1 text-sm text-slate-500">
                  This is the information associated with your account.
                </p>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <ProfileSection />
            </div>
          </section>

          {/* Notification Preferences */}
          <section className="overflow-hidden rounded-3xl border border-white bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-3 border-b border-slate-100 p-5 sm:p-6">
              <div className="rounded-2xl bg-blue-50 p-2.5 text-blue-600">
                <Bell className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Notifications & Alerts</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage your marketplace notifications and email settings.
                </p>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <NotificationPreferencesSection />
            </div>
          </section>

          {/* Active Sessions */}
          <section className="rounded-3xl border border-white bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6">
            <SessionsSection />
          </section>
        </div>
      </div>
    </main>
  );
}
