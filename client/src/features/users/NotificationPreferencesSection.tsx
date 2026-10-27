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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-6 animate-spin text-orange-500" />
      </div>
    );
  }

  const items = [
    {
      key: "emailEnabled" as const,
      title: "Email Notifications",
      desc: "Receive order receipts, shipping updates, and account alerts to your email.",
      icon: Mail,
      enabled: prefs?.emailEnabled ?? true,
    },
    {
      key: "orderUpdates" as const,
      title: "Order & Shipping Alerts",
      desc: "Stay notified when your orders are placed, dispatched, or delivered.",
      icon: Package,
      enabled: prefs?.orderUpdates ?? true,
    },
    {
      key: "reviews" as const,
      title: "Review & Reply Notifications",
      desc: "Get notified when customers leave reviews on your products or merchants reply.",
      icon: Star,
      enabled: prefs?.reviews ?? true,
    },
    {
      key: "promotions" as const,
      title: "Promotions & Discounts",
      desc: "Receive alerts for seasonal drops, flash coupons, and store discounts.",
      icon: Sparkles,
      enabled: prefs?.promotions ?? true,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Notification Preferences</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose what alerts and emails you want to receive across the marketplace.
          </p>
        </div>
        {updatePrefs.isPending && (
          <span className="text-xs font-semibold text-orange-600 flex items-center gap-1">
            <Loader2 className="size-3 animate-spin" /> Saving...
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
                <div className="size-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(item.key)}
                disabled={updatePrefs.isPending}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  item.enabled ? "bg-orange-500" : "bg-slate-200"
                }`}
                aria-label={`Toggle ${item.title}`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    item.enabled ? "translate-x-5" : "translate-x-0"
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
