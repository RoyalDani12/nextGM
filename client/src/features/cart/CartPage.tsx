import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Info,
  ShieldCheck,
  AlertCircle,
  Heart,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowLeft,
  ArrowRight,
  Truck,
  Store,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";

import {
  useCart,
  useClearCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useValidateCoupon,
} from "./cart.hook";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  getStoredDeliveryLocation,
  getBrowserInstantLocation,
} from "../marketplace/utils/deliveryLocation";

interface AppliedCouponInfo {
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  discountAmount: number;
  freeShipping: boolean;
  shopId: string | null;
  shopName: string;
  message?: string;
}

export const CartPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useCart();
  const { mutate: clearCart, isPending: isClearing } = useClearCart();
  const { mutate: updateCartItem, isPending: isUpdating } = useUpdateCartItem();
  const { mutate: removeCartItem, isPending: isRemoving } = useRemoveCartItem();
  const validateCouponMutation = useValidateCoupon();

  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(() => {
    try {
      const saved = localStorage.getItem("cart_applied_coupon");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [shippingMethod, setShippingMethod] = useState<"standard" | "free">(() => {
    try {
      const saved = localStorage.getItem("cart_shipping_method");
      return saved === "free" ? "free" : "standard";
    } catch {
      return "standard";
    }
  });

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const deliveryLocation = getStoredDeliveryLocation() || getBrowserInstantLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans">
        <header className="border-b border-slate-200/80 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-36 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </header>
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans">
        <header className="border-b border-slate-200/80 bg-white">
          <div className="mx-auto flex max-w-7xl items-center px-4 py-3.5 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 cursor-pointer"
            >
              <ArrowLeft className="size-4" /> Continue Shopping
            </button>
          </div>
        </header>
        <div className="max-w-3xl mx-auto p-8 md:p-12">
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5 rounded-2xl">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="text-base font-medium">
              Failed to load your cart. Please check your connection and try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const cartData = data?.data;
  const groupedShops = cartData?.groupedBy || [];
  const allItems = groupedShops.flatMap((group: any) => group.items || []);
  const hasItems = allItems.length > 0;

  // Real Subtotal & Shipping Calculation
  const subtotal = Number(cartData?.totalPrice || 0);

  // If applied coupon grants free shipping, or user chose free saver shipping
  const isFreeShipping = shippingMethod === "free" || Boolean(appliedCoupon?.freeShipping);
  const standardShippingFee = 5.0;
  const shippingCost = isFreeShipping ? 0 : standardShippingFee;

  // Real Dynamic Discount Calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "FREE_SHIPPING") {
      discountAmount = 0; // Discount is delivered via shippingCost = 0
    } else if (appliedCoupon.type === "PERCENTAGE") {
      if (appliedCoupon.shopId) {
        const matchingGroup = groupedShops.find(
          (g: any) => (g.shop?.id || g.shopId) === appliedCoupon.shopId
        );
        const eligibleSubtotal = matchingGroup ? Number(matchingGroup.subtotal || 0) : subtotal;
        discountAmount = (eligibleSubtotal * appliedCoupon.value) / 100;
      } else {
        discountAmount = (subtotal * appliedCoupon.value) / 100;
      }
    } else if (appliedCoupon.type === "FIXED_AMOUNT") {
      discountAmount = Math.min(appliedCoupon.value, subtotal);
    }
  }

  const grandTotal = Math.max(0, subtotal + shippingCost - discountAmount);

  const handleUpdateQuantity = (itemId: string, newQuantity: number, productName: string) => {
    if (newQuantity < 1) return;
    updateCartItem(
      { itemId, quantity: newQuantity },
      {
        onSuccess: () => {
          toast.add({
            title: "Cart Updated",
            description: `Updated quantity for ${productName}.`,
            type: "success",
          });
        },
      }
    );
  };

  const handleRemove = (itemId: string, productName: string) => {
    removeCartItem(itemId, {
      onSuccess: () => {
        toast.add({
          title: "Item Removed",
          description: `${productName} was removed from your cart.`,
          type: "error",
        });
      },
    });
  };

  const handleClearCart = () => {
    clearCart(undefined, {
      onSuccess: () => {
        setAppliedCoupon(null);
        localStorage.removeItem("cart_applied_coupon");
        toast.add({
          title: "Cart Cleared",
          description: "All items have been removed from your cart.",
          type: "success",
        });
        setIsClearDialogOpen(false);
      },
    });
  };

  const handleCheckout = () => {
    localStorage.setItem("cart_shipping_method", shippingMethod);
    if (appliedCoupon) {
      localStorage.setItem("cart_applied_coupon", JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem("cart_applied_coupon");
    }

    if (isAuthenticated) {
      navigate("/checkout", {
        state: {
          shippingMethod,
          coupon: appliedCoupon,
        },
      });
    } else {
      navigate("/login?redirect=/checkout");
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoCode.trim().toUpperCase();
    if (!cleanCode) return;

    const shopIds = Array.from(
      new Set(groupedShops.map((g: any) => g.shop?.id || g.shopId).filter(Boolean))
    ) as string[];

    const items = allItems.map((item: any) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: Number(item.quantity),
      price: Number(item.price || (Number(item.lineToal) / Number(item.quantity))),
      shopId: item.shopId,
    }));

    validateCouponMutation.mutate(
      {
        code: cleanCode,
        shopIds,
        subtotal,
        items,
      },
      {
        onSuccess: (res: any) => {
          const couponData = res.data;
          setAppliedCoupon(couponData);
          localStorage.setItem("cart_applied_coupon", JSON.stringify(couponData));
          setPromoCode("");
          toast.add({
            title: "Promo Applied! 🎉",
            description: couponData.message || `Code "${cleanCode}" applied to your order.`,
            type: "success",
          });
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || `Coupon "${cleanCode}" could not be applied.`;
          toast.add({
            title: "Coupon Error",
            description: message,
            type: "error",
          });
        },
      }
    );
  };

  const handleRemovePromo = () => {
    setAppliedCoupon(null);
    localStorage.removeItem("cart_applied_coupon");
    toast.add({
      title: "Promo Code Removed",
      description: "Coupon discount removed from cart.",
      type: "info",
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-foreground font-sans antialiased">
      {/* Clean Focused Header */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="size-4 text-slate-600" />
            <span>Back</span>
          </button>

          {hasItems && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearDialogOpen(true)}
              disabled={isClearing}
              className="h-8 px-2.5 sm:px-3 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 hover:border-rose-300 text-rose-600 font-bold text-xs shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer gap-1.5"
            >
              <Trash2 className="size-3.5" />
              <span>Clear Cart</span>
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Empty Cart State */}
        {!hasItems ? (
          <div className="py-12 sm:py-16 px-4 text-center max-w-xl mx-auto space-y-5 sm:space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-xs">
              <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Your shopping cart is empty</h2>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
                Looks like you haven't added anything to your cart yet. Explore our store departments to find great items!
              </p>
            </div>

            {!isAuthenticated && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 text-left flex items-start gap-3">
                <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-900">Have an account?</p>
                  <p className="text-slate-600">
                    <Link to="/login" className="text-orange-600 font-semibold hover:underline">
                      Sign in
                    </Link>{" "}
                    to view items previously added to your cart.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                asChild
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 rounded-full font-semibold shadow-md cursor-pointer h-11"
              >
                <Link to="/">
                  Start Shopping
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          /* Main 2-Column Section */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Items, Real Shipping Options & Coupons */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6 min-w-0">
              {!isAuthenticated && (
                <Alert className="bg-slate-50 border border-slate-200/80 text-slate-800 rounded-2xl p-3.5 sm:p-4 flex items-center">
                  <Info className="h-5 w-5 text-slate-500 shrink-0 mr-3" />
                  <AlertDescription className="text-xs md:text-sm">
                    You're shopping as a guest.{" "}
                    <Link to="/login" className="font-bold text-orange-600 hover:underline">
                      Sign in
                    </Link>{" "}
                    to sync your cart across your devices.
                  </AlertDescription>
                </Alert>
              )}

              {/* Real Shipping Status & Delivery Options (Replaces the fake progress bar) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                      <Truck className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        Delivery & Shipping Options
                      </h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span>Destination:</span>
                        <span className="font-semibold text-slate-800">
                          {deliveryLocation.flag} {deliveryLocation.countryName}
                        </span>
                      </p>
                    </div>
                  </div>

                  {appliedCoupon?.freeShipping ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold self-start sm:self-auto gap-1">
                      <CheckCircle2 className="size-3 text-emerald-600" />
                      Free Shipping Unlocked via Promo
                    </Badge>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400">
                      Select delivery option
                    </span>
                  )}
                </div>

                {/* Real Shipping Method Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Standard Delivery */}
                  <label
                    onClick={() => {
                      setShippingMethod("standard");
                      localStorage.setItem("cart_shipping_method", "standard");
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      shippingMethod === "standard"
                        ? "border-orange-500 bg-orange-50/20 ring-1 ring-orange-500/20 shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="radio"
                        name="cart-shipping"
                        checked={shippingMethod === "standard"}
                        onChange={() => {}}
                        className="mt-0.5 accent-orange-600 size-4 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900">Standard Delivery</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Estimated 3–5 business days</p>
                        <span className="inline-block text-[10px] font-semibold text-slate-400 mt-1">
                          Tracked courier delivery
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-bold shrink-0 ${
                        appliedCoupon?.freeShipping ? "text-emerald-600 font-extrabold" : "text-slate-900"
                      }`}
                    >
                      {appliedCoupon?.freeShipping ? "FREE" : "$5.00"}
                    </span>
                  </label>

                  {/* Free Saver Shipping */}
                  <label
                    onClick={() => {
                      setShippingMethod("free");
                      localStorage.setItem("cart_shipping_method", "free");
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      shippingMethod === "free"
                        ? "border-orange-500 bg-orange-50/20 ring-1 ring-orange-500/20 shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="radio"
                        name="cart-shipping"
                        checked={shippingMethod === "free"}
                        onChange={() => {}}
                        className="mt-0.5 accent-orange-600 size-4 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900">Free Saver Shipping</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Estimated 5–7 business days</p>
                        <span className="inline-block text-[10px] font-semibold text-emerald-600 mt-1">
                          Economy postal delivery
                        </span>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-emerald-600 shrink-0">
                      FREE
                    </span>
                  </label>
                </div>
              </div>

              {/* Clean Item Rows Grouped by Merchant Shop */}
              <div className="bg-white border border-slate-200/60 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-xs">
                {groupedShops.map((group: any, groupIdx: number) => {
                  const shopName = group.shop?.name || group.shopName || "Verified Supplier";
                  const shopId = group.shop?.id || group.shopId || `shop-${groupIdx}`;

                  return (
                    <div key={shopId} className="divide-y divide-slate-100">
                      {/* Shop Row Header */}
                      <div className="bg-slate-50/70 px-4 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-medium text-xs sm:text-sm text-slate-800 min-w-0">
                          <Store className="w-4 h-4 text-orange-500 shrink-0" />
                          <span className="truncate font-semibold text-slate-900">{shopName}</span>
                          <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-600 shrink-0">
                            Verified Merchant
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0 font-medium">
                          {group.items?.length || 0} {group.items?.length === 1 ? "item" : "items"}
                        </span>
                      </div>

                      {/* Product Rows */}
                      {group.items?.map((item: any) => {
                        const unitPrice = item.price || (Number(item.lineToal) / Number(item.quantity || 1));

                        return (
                          <div
                            key={item.id}
                            className="p-3.5 sm:p-5 flex flex-row items-start gap-3 sm:gap-4 transition-colors hover:bg-slate-50/40"
                          >
                            {/* Image Box */}
                            <div className="size-20 sm:size-24 shrink-0 rounded-xl bg-slate-50 border border-slate-100 p-1.5 sm:p-2 flex items-center justify-center overflow-hidden">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.productName}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <ShoppingBag className="w-8 h-8 text-slate-300" />
                              )}
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-sm sm:text-base text-slate-900 hover:text-orange-600 cursor-pointer transition-colors line-clamp-2">
                                    {item.productName}
                                  </h3>
                                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                                    {item.variantName ? `Variant: ${item.variantName}` : "Standard Edition"}
                                  </p>
                                </div>
                                <span className="font-bold text-sm sm:text-base text-slate-900 shrink-0">
                                  ${Number(item.lineToal).toFixed(2)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 pt-0.5">
                                {item.isAvailable === false ? (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    Out of Stock
                                  </Badge>
                                ) : (
                                  <span className="text-[10px] sm:text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                    In Stock
                                  </span>
                                )}
                                <span className="text-[10px] sm:text-xs text-slate-400">
                                  (${Number(unitPrice).toFixed(2)} ea)
                                </span>
                              </div>

                              {/* Actions & Quantity Stepper */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5">
                                <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden h-7.5 sm:h-8">
                                  <button
                                    type="button"
                                    disabled={isUpdating || item.quantity <= 1}
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.productName)}
                                    className="px-2.5 h-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 cursor-pointer transition-colors"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-7 sm:w-8 text-center text-xs font-semibold select-none text-slate-800">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.productName)}
                                    className="px-2.5 h-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 cursor-pointer transition-colors"
                                    aria-label="Increase quantity"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toast.add({
                                        title: "Saved to Wishlist",
                                        description: `${item.productName} was saved for later.`,
                                        type: "success",
                                      })
                                    }
                                    className="text-xs font-medium text-slate-400 hover:text-orange-600 flex items-center gap-1 transition-colors cursor-pointer py-1"
                                  >
                                    <Heart className="w-3.5 h-3.5" />
                                    <span>Save</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isRemoving}
                                    onClick={() => handleRemove(item.id, item.productName)}
                                    className="text-xs font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer py-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Real Functional Promo Code Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="size-4 text-orange-500" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">Promotions & Coupons</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Shop or platform discount code</span>
                </div>

                <form onSubmit={handleApplyPromo} className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <Tag className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enter promo or coupon code (e.g. 10009, SAVE10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={validateCouponMutation.isPending}
                      className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 uppercase placeholder:normal-case font-medium transition-all"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={validateCouponMutation.isPending || !promoCode.trim()}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl cursor-pointer h-10 px-5 font-bold text-xs shrink-0 w-full sm:w-auto shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5"
                  >
                    {validateCouponMutation.isPending ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Validating…</span>
                      </>
                    ) : (
                      <span>Apply Code</span>
                    )}
                  </Button>
                </form>

                {appliedCoupon && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold uppercase tracking-wider">{appliedCoupon.code}</span>
                        <span className="mx-1.5 text-emerald-400">•</span>
                        <span>
                          {appliedCoupon.freeShipping
                            ? "Free Delivery"
                            : appliedCoupon.type === "PERCENTAGE"
                            ? `${appliedCoupon.value}% OFF`
                            : `$${appliedCoupon.value} OFF`}
                        </span>
                        {appliedCoupon.shopName && (
                          <span className="text-emerald-700 font-medium ml-1">({appliedCoupon.shopName})</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-emerald-700 hover:text-rose-600 font-semibold text-xs ml-3 cursor-pointer transition-colors p-1 flex items-center gap-1"
                      title="Remove coupon"
                    >
                      <X className="size-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Sticky Order Summary */}
            <div className="lg:col-span-4 lg:sticky lg:top-20 z-10 self-start w-full">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-xs">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                  Order Summary
                </h2>

                {/* Subtotal & Breakdown */}
                <div className="space-y-3 text-sm border-b border-slate-100 pb-4">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Tag className="size-3.5" />
                        <span>Discount ({appliedCoupon?.code})</span>
                      </span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-500">
                    <div className="space-y-0.5">
                      <span className="block">Shipping</span>
                      <span className="text-[11px] text-slate-400">
                        {isFreeShipping ? "Free Saver Shipping" : "Standard (3–5 business days)"}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {shippingCost === 0 ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        `$${shippingCost.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>

                {/* Shipping Selector inside Summary */}
                <div className="space-y-2.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Shipping Method
                  </span>
                  <div className="space-y-2 text-xs">
                    <label
                      onClick={() => {
                        setShippingMethod("standard");
                        localStorage.setItem("cart_shipping_method", "standard");
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        shippingMethod === "standard"
                          ? "border-orange-500 bg-orange-50/30 text-slate-900 font-semibold ring-1 ring-orange-500/20"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shipping-summary"
                          checked={shippingMethod === "standard"}
                          onChange={() => {}}
                          className="accent-orange-600 cursor-pointer"
                        />
                        <span>Standard Delivery</span>
                      </div>
                      <span className="font-bold">
                        {appliedCoupon?.freeShipping ? <span className="text-emerald-600">FREE</span> : "$5.00"}
                      </span>
                    </label>

                    <label
                      onClick={() => {
                        setShippingMethod("free");
                        localStorage.setItem("cart_shipping_method", "free");
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        shippingMethod === "free"
                          ? "border-orange-500 bg-orange-50/30 text-slate-900 font-semibold ring-1 ring-orange-500/20"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shipping-summary"
                          checked={shippingMethod === "free"}
                          onChange={() => {}}
                          className="accent-orange-600 cursor-pointer"
                        />
                        <span>Free Saver Shipping</span>
                      </div>
                      <span className="font-bold text-emerald-600">FREE</span>
                    </label>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                  <span className="text-base font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-extrabold text-slate-900">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>

                {/* Checkout CTA */}
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white text-base font-semibold py-6 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Protected by NextG Buyer Protection</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Clear Cart Modal */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all items from your shopping cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCart}
              className="bg-red-500 hover:bg-red-600 text-white cursor-pointer rounded-xl"
            >
              {isClearing ? "Clearing..." : "Clear Cart"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
