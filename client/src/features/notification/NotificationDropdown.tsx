import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ShoppingBag,
  Truck,
  CheckCircle2,
  CreditCard,
  AlertCircle,
  Star,
  Check,
  Trash2,
  Loader2,
  Sparkles,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from "./notification.hooks";
import type { Notification, NotificationType } from "./notification.types";

interface NotificationDropdownProps {
  shopId?: string;
  triggerClassName?: string;
  align?: "start" | "end" | "center";
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "ORDER_PLACED":
      return <ShoppingBag className="size-4 text-emerald-600" />;
    case "ORDER_SHIPPED":
      return <Truck className="size-4 text-blue-600" />;
    case "ORDER_DELIVERED":
      return <CheckCircle2 className="size-4 text-emerald-600" />;
    case "PAYMENT_SUCCESS":
      return <CreditCard className="size-4 text-teal-600" />;
    case "PAYMENT_FAILED":
    case "PAYMENT_REFUNDED":
      return <AlertCircle className="size-4 text-rose-600" />;
    case "REVIEW_RECEIVED":
      return <Star className="size-4 text-amber-500 fill-amber-400" />;
    default:
      return <Bell className="size-4 text-slate-600" />;
  }
};

const getNotificationBg = (type: NotificationType) => {
  switch (type) {
    case "ORDER_PLACED":
      return "bg-emerald-50 border-emerald-100";
    case "ORDER_SHIPPED":
      return "bg-blue-50 border-blue-100";
    case "ORDER_DELIVERED":
      return "bg-emerald-50 border-emerald-100";
    case "PAYMENT_SUCCESS":
      return "bg-teal-50 border-teal-100";
    case "PAYMENT_FAILED":
    case "PAYMENT_REFUNDED":
      return "bg-rose-50 border-rose-100";
    case "REVIEW_RECEIVED":
      return "bg-amber-50 border-amber-100";
    default:
      return "bg-slate-50 border-slate-100";
  }
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export function NotificationDropdown({
  shopId,
  triggerClassName,
  align = "end",
}: NotificationDropdownProps) {
  const navigate = useNavigate();
  const [filterUnread, setFilterUnread] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { data: countData } = useUnreadNotificationCount(shopId);
  const unreadCount = countData?.unreadCount ?? 0;

  const { data: notificationsData, isLoading } = useNotifications(
    {
      shopId,
      unreadOnly: filterUnread,
      limit: 15,
    },
    isOpen, // Only fetch notifications list when open or opened
  );

  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = notificationsData?.notifications ?? [];

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    // Smart routing based on notification content
    if (notification.type === "REVIEW_RECEIVED" && shopId) {
      navigate(`/dashboard/shop/${shopId}/reviews`);
      setIsOpen(false);
      return;
    }

    if (
      notification.type === "ORDER_PLACED" ||
      notification.type === "ORDER_SHIPPED" ||
      notification.type === "ORDER_DELIVERED"
    ) {
      if (shopId) {
        navigate(`/dashboard/shop/${shopId}/orders`);
      } else {
        navigate("/customer-order");
      }
      setIsOpen(false);
      return;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        className={`relative inline-flex items-center justify-center outline-none transition-colors cursor-pointer ${
          triggerClassName || "size-9 rounded-full text-slate-600 hover:bg-slate-100"
        }`}
        aria-label="View notifications"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-orange-600 text-[10px] font-black text-white ring-2 ring-white shadow-xs animate-in zoom-in-75">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="w-[360px] sm:w-[400px] p-0 rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-900/10 overflow-hidden z-50 text-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-black text-slate-900">Notifications</h3>
            {unreadCount > 0 ? (
              <span className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Caught up
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate(shopId)}
              disabled={markAllAsRead.isPending}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Check className="size-3" />
              )}
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-50/70 border-b border-slate-100">
          <button
            onClick={() => setFilterUnread(false)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              !filterUnread
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterUnread(true)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterUnread
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notification List Body */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-orange-500" />
              <p className="text-xs font-semibold text-slate-400">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="size-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Sparkles className="size-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {filterUnread ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-[11px] text-slate-400 max-w-[200px]">
                {filterUnread
                  ? "All your notifications have been marked as read."
                  : "Order updates, reviews, and alerts will appear here."}
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group relative flex items-start gap-3.5 p-4 cursor-pointer transition-colors ${
                  !item.isRead
                    ? "bg-orange-50/25 hover:bg-orange-50/50"
                    : "hover:bg-slate-50/80 bg-white"
                }`}
              >
                {/* Icon Badge */}
                <div
                  className={`size-9 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 ${getNotificationBg(
                    item.type,
                  )}`}
                >
                  {getNotificationIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`text-xs truncate ${
                        !item.isRead
                          ? "font-black text-slate-900"
                          : "font-semibold text-slate-700"
                      }`}
                    >
                      {item.title}
                    </p>
                    {!item.isRead && (
                      <span className="size-1.5 rounded-full bg-orange-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.body}
                  </p>
                  <span className="text-[10px] font-medium text-slate-400 mt-1 block">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute right-3 top-3.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!item.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead.mutate(item.id);
                      }}
                      title="Mark as read"
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Check className="size-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification.mutate(item.id);
                    }}
                    title="Delete notification"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
