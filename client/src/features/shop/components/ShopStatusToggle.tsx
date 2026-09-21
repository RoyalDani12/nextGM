import { useState } from "react";
import { Power } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Switch } from "@/components/ui/switch";

import { useUpdateShopStatus } from "@/features/shop/shop.hooks";
import type { ShopStatus } from "@/features/shop/shop.types";

interface ShopStatusToggleProps {
  shopId: string;
  status: ShopStatus;
}

export const ShopStatusToggle = ({
  shopId,
  status,
}: ShopStatusToggleProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const updateShopStatus = useUpdateShopStatus();

  const canToggle = status === "ACTIVE" || status === "PAUSED";

  const isActive = status === "ACTIVE";

  const nextStatus: "ACTIVE" | "PAUSED" = isActive
    ? "PAUSED"
    : "ACTIVE";

  const handleSwitchChange = () => {
    if (!canToggle || updateShopStatus.isPending) {
      return;
    }

    setDialogOpen(true);
  };

  const handleConfirm = () => {
    updateShopStatus.mutate(
      {
        shopId,
        status: nextStatus,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
        },
      }
    );
  };

  return (
    <>
      {/* Status Toggle */}
      <div className="flex items-center justify-between rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              isActive
                ? "bg-emerald-100 text-emerald-600"
                : "bg-amber-100 text-amber-600"
            }`}
          >
            <Power className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold">
              Shop availability
            </p>

            <p className="text-xs text-muted-foreground">
              {isActive
                ? "Your shop is currently active."
                : status === "PAUSED"
                  ? "Your shop is temporarily paused."
                  : `Your shop is ${status.toLowerCase()}.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold ${
              isActive
                ? "text-emerald-600"
                : "text-amber-600"
            }`}
          >
            {status}
          </span>

          <Switch
            checked={isActive}
            disabled={!canToggle || updateShopStatus.isPending}
            onCheckedChange={handleSwitchChange}
            aria-label="Toggle shop availability"
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!updateShopStatus.isPending) {
            setDialogOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {nextStatus === "PAUSED"
                ? "Pause your shop?"
                : "Reactivate your shop?"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {nextStatus === "PAUSED"
                ? "Your shop will temporarily stop operating. You can reactivate it whenever you're ready."
                : "Your shop will become active again and customers will be able to interact with it."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateShopStatus.isPending}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
              disabled={updateShopStatus.isPending}
            >
              {updateShopStatus.isPending
                ? "Updating..."
                : nextStatus === "PAUSED"
                  ? "Pause Shop"
                  : "Activate Shop"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};