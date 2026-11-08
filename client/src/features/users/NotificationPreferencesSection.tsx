import { Mail, Package, Sparkles, Star, Loader2 } from "lucide-react";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/features/notification/notification.hooks";

export default function NotificationPreferencesSection() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const handleToggle = (key: "emailEnabled" | "pushEnabled" | "orderUpdates" | "promotions" | "reviews") => {
    if (!prefs) return;
    const currentVal = prefs[key] ?? true;
    updatePrefs.mutate({ [key]: !currentVal });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-orange-500" />
      </div>
    );
  }

  const items = [
    {
      key: "emailEnabled" as const,
      title: "Email Notifications",
      desc: "Receive transaction receipts, order updates, and critical security alerts via email.",
      icon: Mail,
      enabled: prefs?.emailEnabled ?? true,
    },
    {
      key: "orderUpdates" as const,
      title: "Order & Shipping Alerts",
      desc: "Instant notifications when orders are placed, paid, shipped, or delivered.",
      icon: Package,
      enabled: prefs?.orderUpdates ?? true,
    },
    {
      key: "reviews" as const,
      title: "Review & Reply Notifications",
      desc: "Alerts when customers post product reviews or merchants respond to feedback.",
      icon: Star,
      enabled: prefs?.reviews ?? true,
    },
    {
      key: "promotions" as const,
      title: "Promotions & Discounts",
      desc: "Exclusive discounts, promotional campaigns, and store sale announcements.",
      icon: Sparkles,
      enabled: prefs?.promotions ?? true,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-semibold text-slate-900">Communication Channels</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Configure which events trigger email delivery and in-app notifications.
          </p>
        </div>
        {updatePrefs.isPending && (
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin text-orange-500" />
            <span>Saving...</span>
          </span>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex items-center justify-between py-3.5 gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-md bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                  <Icon className="size-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5 max-w-lg">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => handleToggle(item.key)}
                disabled={updatePrefs.isPending}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  item.enabled ? "bg-orange-500" : "bg-slate-200"
                }`}
                aria-label={`Toggle ${item.title}`}
              >
                <span
                  className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    item.enabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
