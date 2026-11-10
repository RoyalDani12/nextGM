import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Inbox,
  RotateCcw,
} from "lucide-react";

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
      return <ShoppingBag className="size-3.5 text-emerald-600" />;
    case "ORDER_SHIPPED":
      return <Truck className="size-3.5 text-blue-600" />;
    case "ORDER_DELIVERED":
      return <CheckCircle2 className="size-3.5 text-emerald-600" />;
    case "PAYMENT_SUCCESS":
      return <CreditCard className="size-3.5 text-teal-600" />;
    case "PAYMENT_FAILED":
    case "PAYMENT_REFUNDED":
      return <AlertCircle className="size-3.5 text-rose-600" />;
    case "REVIEW_RECEIVED":
      return <Star className="size-3.5 text-amber-500 fill-amber-400" />;
    case "RETURN_REQUESTED":
    case "RETURN_UPDATED":
      return <RotateCcw className="size-3.5 text-orange-600" />;
    default:
      return <Bell className="size-3.5 text-slate-600" />;
  }
};

const getNotificationBg = (type: NotificationType) => {
  switch (type) {
    case "ORDER_PLACED":
      return "bg-emerald-50/70 border-emerald-100 text-emerald-700";
    case "ORDER_SHIPPED":
      return "bg-blue-50/70 border-blue-100 text-blue-700";
    case "ORDER_DELIVERED":
      return "bg-emerald-50/70 border-emerald-100 text-emerald-700";
    case "PAYMENT_SUCCESS":
      return "bg-teal-50/70 border-teal-100 text-teal-700";
    case "PAYMENT_FAILED":
    case "PAYMENT_REFUNDED":
      return "bg-rose-50/70 border-rose-100 text-rose-700";
    case "REVIEW_RECEIVED":
      return "bg-amber-50/70 border-amber-100 text-amber-700";
    case "RETURN_REQUESTED":
    case "RETURN_UPDATED":
      return "bg-orange-50/70 border-orange-100 text-orange-700";
    default:
      return "bg-slate-50 border-slate-200/80 text-slate-600";
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
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/superadmin");
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
    isOpen,
  );

  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = notificationsData?.notifications ?? [];

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    if (notification.type === "REVIEW_RECEIVED") {
      if (isAdminView) {
        navigate("/superadmin/reviews");
      } else if (shopId) {
        navigate(`/dashboard/shop/${shopId}/reviews`);
      }
      setIsOpen(false);
      return;
    }

    if (
      notification.type === "RETURN_REQUESTED" ||
      notification.type === "RETURN_UPDATED"
    ) {
      if (isAdminView) {
        navigate("/superadmin/returns");
      } else if (shopId) {
        navigate(`/dashboard/shop/${shopId}/returns`);
      } else {
        navigate("/returns");
      }
      setIsOpen(false);
      return;
    }

    if (
      notification.type === "ORDER_PLACED" ||
      notification.type === "ORDER_SHIPPED" ||
      notification.type === "ORDER_DELIVERED"
    ) {
      if (isAdminView) {
        navigate("/superadmin/orders");
      } else if (shopId) {
        navigate(`/dashboard/shop/${shopId}/orders`);
      } else {
        navigate(notification.meta?.orderId ? `/orders/${notification.meta.orderId}` : "/orders");
      }
      setIsOpen(false);
      return;
    }

    if (
      notification.type === "PAYMENT_REFUNDED" ||
      notification.type === "PAYMENT_SUCCESS" ||
      notification.type === "PAYMENT_FAILED"
    ) {
      if (isAdminView) {
        navigate("/superadmin/orders");
      } else if (shopId) {
        navigate(`/dashboard/shop/${shopId}/orders`);
      } else {
        navigate("/orders");
      }
      setIsOpen(false);
      return;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        className={`relative inline-flex items-center justify-center outline-none transition-colors cursor-pointer ${
          triggerClassName || "size-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        }`}
        aria-label="View notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white ring-2 ring-white tabular-nums">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="w-[360px] sm:w-[390px] p-0 rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden z-50 text-slate-900 mt-1.5"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 ? (
              <span className="text-[10px] font-medium text-orange-700 bg-orange-50 border border-orange-200/80 px-1.5 py-0.5 rounded tabular-nums">
                {unreadCount} unread
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                All caught up
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate(shopId)}
              disabled={markAllAsRead.isPending}
              className="text-[11px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Check className="size-3 text-slate-400" />
              )}
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 px-3 py-2 bg-slate-50/70 border-b border-slate-100">
          <button
            onClick={() => setFilterUnread(false)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              !filterUnread
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterUnread(true)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              filterUnread
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notification List Body */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-5 animate-spin text-slate-400" />
              <p className="text-xs font-medium text-slate-400">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="size-9 rounded-lg bg-slate-100/80 border border-slate-200/60 flex items-center justify-center text-slate-400">
                <Inbox className="size-4.5" />
              </div>
              <p className="text-xs font-medium text-slate-800">
                {filterUnread ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-[11px] text-slate-400 max-w-[220px]">
                {filterUnread
                  ? "All notifications have been marked as read."
                  : "Order updates, customer reviews, and refunds will appear here."}
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group relative flex items-start gap-3 p-3.5 cursor-pointer transition-colors ${
                  !item.isRead
                    ? "bg-orange-50/20 hover:bg-orange-50/40"
                    : "hover:bg-slate-50/70 bg-white"
                }`}
              >
                {/* Icon Badge */}
                <div
                  className={`size-8 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${getNotificationBg(
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
                          ? "font-semibold text-slate-900"
                          : "font-medium text-slate-700"
                      }`}
                    >
                      {item.title}
                    </p>
                    {!item.isRead && (
                      <span className="size-1.5 rounded-full bg-orange-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.body}
                  </p>
                  <span className="text-[10px] font-medium text-slate-400 mt-1 block tabular-nums">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute right-3 top-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!item.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead.mutate(item.id);
                      }}
                      title="Mark as read"
                      className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
