import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  ShieldAlert,
  LifeBuoy,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useCloseShop } from "@/features/shop/shop.hooks";
import type { Shop } from "@/features/shop/shop.types";

interface CloseShopDialogProps {
  shop: Shop;
}

const CONFIRM_TEXT = "CLOSE MY SHOP";

export const CloseShopDialog = ({
  shop,
}: CloseShopDialogProps) => {
  const closeShop = useCloseShop();

  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  /**
   * Reset dialog state
   */
  const handleOpenChange = (value: boolean) => {
    if (closeShop.isPending) {
      return;
    }

    setOpen(value);

    if (!value) {
      setConfirmText("");
    }
  };

  /**
   * Close shop
   */
  const handleCloseShop = () => {
    if (confirmText !== CONFIRM_TEXT) {
      return;
    }

    if (closeShop.isPending) {
      return;
    }

    closeShop.mutate(
      {
        shopId: shop.id,
        confirmText,
      },
      {
        onSuccess: () => {
          setConfirmText("");
          setOpen(false);
        },
      }
    );
  };

  /*
   * ============================================================
   * CLOSED SHOP
   * ============================================================
   *
   * A closed shop cannot be closed again.
   * Instead, show a support option.
   */
  if (shop.status === "CLOSED") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="
              gap-2
              border-amber-200
              text-amber-700
              hover:bg-amber-50
              hover:text-amber-800
            "
          >
            <LifeBuoy className="h-4 w-4" />
            Contact Support
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <div
              className="
                mb-2
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-amber-50
              "
            >
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            </div>

            <AlertDialogTitle>
              Shop is Closed
            </AlertDialogTitle>

            <AlertDialogDescription className="space-y-3 pt-2">
              <span className="block">
                <strong className="text-foreground">
                  {shop.profile?.name || "This shop"}
                </strong>{" "}
                is currently closed.
              </span>

              <span className="block">
                This shop cannot be reopened directly from your
                dashboard.
              </span>

              <span className="block">
                If you need to reopen this shop or believe it was
                closed by mistake, please contact the platform
                support team or a Super Admin.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Close
            </AlertDialogCancel>

            <AlertDialogAction
              className="gap-2"
              onClick={() => {
                // Replace with your real support route later.
                window.location.href = "/support";
              }}
            >
              <LifeBuoy className="h-4 w-4" />
              Contact Support
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  /*
   * ============================================================
   * ACTIVE / PAUSED SHOP
   * ============================================================
   *
   * Owner can permanently close the shop.
   */
  return (
    <AlertDialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="
            gap-2
            border-destructive/30
            text-destructive
            hover:bg-destructive/5
            hover:text-destructive
          "
        >
          <AlertTriangle className="h-4 w-4" />
          Close Shop
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <div
            className="
              mb-2
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-destructive/10
            "
          >
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>

          <AlertDialogTitle>
            Close {shop.profile?.name || "Shop"}?
          </AlertDialogTitle>

          <AlertDialogDescription className="space-y-4 pt-2">
            <span className="block">
              You are about to permanently close this shop.
            </span>

            <span className="block">
              Once closed, the shop will no longer be available
              for normal shop management.
            </span>

            <span className="block">
              <strong className="text-destructive">
                This action cannot be undone from your dashboard.
              </strong>{" "}
              If you need to reopen the shop later, you will need
              to contact Support or a Super Admin.
            </span>

            {/* Current Status */}
            <span
              className="
                block
                rounded-lg
                border
                bg-muted/50
                p-3
                text-xs
              "
            >
              Current status:{" "}
              <strong className="text-foreground">
                {shop.status}
              </strong>
            </span>

            {/* Confirmation Input */}
            <div className="space-y-2">
              <Label htmlFor="close-confirmation">
                Type{" "}
                <strong className="text-foreground">
                  {CONFIRM_TEXT}
                </strong>{" "}
                to confirm
              </Label>

              <Input
                id="close-confirmation"
                value={confirmText}
                onChange={(event) =>
                  setConfirmText(event.target.value)
                }
                placeholder={CONFIRM_TEXT}
                autoComplete="off"
                disabled={closeShop.isPending}
              />

              {confirmText.length > 0 &&
                confirmText !== CONFIRM_TEXT && (
                  <p className="text-xs text-destructive">
                    Confirmation text does not match.
                  </p>
                )}

              {confirmText === CONFIRM_TEXT && (
                <p className="text-xs text-emerald-600">
                  Confirmation text matched.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={closeShop.isPending}
          >
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={
              confirmText !== CONFIRM_TEXT ||
              closeShop.isPending
            }
            onClick={(event) => {
              /*
               * Prevent AlertDialog from closing before
               * the API request finishes.
               */
              event.preventDefault();

              handleCloseShop();
            }}
            className="
              gap-2
              bg-destructive
              text-destructive-foreground
              hover:bg-destructive/90
            "
          >
            {closeShop.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Closing Shop...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Yes, Close Shop
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};