import { ArrowLeft, Bell, KeyRound, MonitorSmartphone, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import ProfileSection from "./ProfileSection";
import ChangePasswordSection from "./ChangePasswordSection";
import SessionsSection from "./SessionsSection";
import NotificationPreferencesSection from "./NotificationPreferencesSection";

type SettingsTab = "profile" | "security" | "notifications" | "sessions";

interface TabItem {
  key: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TABS: TabItem[] = [
  {
    key: "profile",
    label: "Personal Details",
    icon: UserRound,
    description: "Manage your name, email, phone, and delivery address.",
  },
  {
    key: "security",
    label: "Password & Security",
    icon: KeyRound,
    description: "Update your password and authentication credentials.",
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Configure email alerts and marketplace updates.",
  },
  {
    key: "sessions",
    label: "Active Devices",
    icon: MonitorSmartphone,
    description: "Manage active web sessions and signed-in browsers.",
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as SettingsTab | null;
  const activeTab: SettingsTab = tabParam && ["profile", "security", "notifications", "sessions"].includes(tabParam)
    ? tabParam
    : "profile";

  const handleTabChange = (tab: SettingsTab) => {
    setSearchParams({ tab }, { replace: true });
  };

  const handleBack = () => {
    if (user?.role === "SUPER_ADMIN") {
      navigate("/superadmin");
      return;
    }
    if (user?.role === "SHOP_OWNER") {
      navigate("/dashboard");
      return;
    }
    navigate("/");
  };

  const currentTabMeta = TABS.find((t) => t.key === activeTab) || TABS[0];

  return (
    <main className="min-h-screen bg-slate-50/60 pb-16 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Link */}
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>
            {user?.role === "SUPER_ADMIN"
              ? "Back to Super Admin"
              : user?.role === "SHOP_OWNER"
              ? "Back to Dashboard"
              : "Back to Marketplace"}
          </span>
        </button>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Account Settings
              </h1>
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                <ShieldCheck className="size-3 text-emerald-600" />
                Protected
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Manage your personal credentials, contact information, notifications, and device security.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 mt-5 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "border-orange-500 font-semibold text-slate-900"
                    : "border-transparent font-medium text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon className={`size-3.5 ${isActive ? "text-orange-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Box */}
        <div className="mt-5 rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
          {/* Card Top Title / Description */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xs font-semibold text-slate-900">{currentTabMeta.label}</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{currentTabMeta.description}</p>
          </div>

          <div className="p-5 sm:p-6">
            {activeTab === "profile" && <ProfileSection />}
            {activeTab === "security" && <ChangePasswordSection />}
            {activeTab === "notifications" && <NotificationPreferencesSection />}
            {activeTab === "sessions" && <SessionsSection />}
          </div>
        </div>
      </div>
    </main>
  );
}
