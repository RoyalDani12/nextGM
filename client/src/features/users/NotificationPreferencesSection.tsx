import {
  Mail,
  Bell,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Sparkles,
  Star,
  Loader2,
} from "lucide-react";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/features/notification/notification.hooks";
import type { UpdatePreferencesPayload } from "@/features/notification/notification.types";

type PrefKey = keyof UpdatePreferencesPayload;

interface PreferenceCardItem {
  key: PrefKey;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  badgeColor: string;
}

export default function NotificationPreferencesSection() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const handleToggle = (key: PrefKey) => {
    if (!prefs) return;
    const currentVal = (prefs as Record<string, any>)[key] ?? true;
    updatePrefs.mutate({ [key]: !currentVal });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-orange-500" />
      </div>
    );
  }

  const orderItems: PreferenceCardItem[] = [
    {
      key: "orderPlaced",
      title: "When Ordered",
      desc: "Instant notification when you place an order and the merchant confirms your checkout.",
      icon: ShoppingBag,
      enabled: prefs?.orderPlaced ?? true,
      badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      key: "orderShipped",
      title: "When Shipped",
      desc: "Tracking updates, courier details, and dispatch alerts as soon as packages are in transit.",
      icon: Truck,
      enabled: prefs?.orderShipped ?? true,
      badgeColor: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      key: "orderDelivered",
      title: "When Delivered",
      desc: "Delivery confirmations and pickup notifications when your parcel arrives safely.",
      icon: CheckCircle2,
      enabled: prefs?.orderDelivered ?? true,
      badgeColor: "bg-teal-50 text-teal-600 border-teal-200",
    },
  ];

  const channelItems: PreferenceCardItem[] = [
    {
      key: "emailEnabled",
      title: "Email Notifications",
      desc: "Receive invoices, status alerts, and critical order emails directly in your inbox.",
      icon: Mail,
      enabled: prefs?.emailEnabled ?? true,
      badgeColor: "bg-orange-50 text-orange-600 border-orange-200",
    },
    {
      key: "pushEnabled",
      title: "In-App Alerts",
      desc: "Show real-time notification alerts and badge counts in the navigation bar.",
      icon: Bell,
      enabled: prefs?.pushEnabled ?? true,
      badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
    },
  ];

  const marketingItems: PreferenceCardItem[] = [
    {
      key: "reviews",
      title: "Reviews & Feedback",
      desc: "Alerts when merchants respond to your product reviews or inquiries.",
      icon: Star,
      enabled: prefs?.reviews ?? true,
      badgeColor: "bg-amber-50 text-amber-600 border-amber-200",
    },
    {
      key: "promotions",
      title: "Deals & Promotions",
      desc: "Curated sales announcements, seasonal offers, and store coupon drops.",
      icon: Sparkles,
      enabled: prefs?.promotions ?? true,
      badgeColor: "bg-purple-50 text-purple-600 border-purple-200",
    },
  ];

  const renderItemGroup = (
    title: string,
    subtitle: string,
    items: PreferenceCardItem[]
  ) => (
    <div className="space-y-2">
      <div className="pb-2 border-b border-slate-100">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{title}</h4>
        <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex items-center justify-between py-3 gap-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`size-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${item.badgeColor}`}
                >
                  <Icon className="size-4" />
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
                  item.enabled ? "bg-orange-600" : "bg-slate-200"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Personal Notification Preferences</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose which order events trigger alerts and select your preferred notification channels.
          </p>
        </div>
        {updatePrefs.isPending && (
          <span className="text-xs font-semibold text-orange-600 flex items-center gap-1.5">
            <Loader2 className="size-3.5 animate-spin text-orange-600" />
            <span>Saving changes...</span>
          </span>
        )}
      </div>

      {renderItemGroup(
        "Order Lifecycle Notifications",
        "Control personal updates when your orders are placed, shipped, or delivered.",
        orderItems
      )}

      {renderItemGroup(
        "Delivery Channels",
        "Select which channels deliver your activity notifications.",
        channelItems
      )}

      {renderItemGroup(
        "Offers & Social",
        "Stay updated on community feedback and marketplace discounts.",
        marketingItems
      )}
    </div>
  );
}
