import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  ShoppingCart,
  ShoppingBag,
  Trash2,
  ArrowLeft,
  Store,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { useWishlist, useWishlistToggle } from "@/features/marketplace/components/marketplace.hooks";
import { useAddToCart } from "@/features/cart/cart.hook";
import { ProductDetailView } from "@/features/marketplace/components/ProductDetailView";
import { useAuthStore } from "@/store/auth.store";
import type { WishlistItem } from "@/features/marketplace/marketplace.api";

export default function WishlistPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: items = [], isLoading, isError, refetch } = useWishlist();
  const wishlistToggle = useWishlistToggle();
  const addToCart = useAddToCart();

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [movingItemId, setMovingItemId] = useState<string | null>(null);
  const [isMovingAll, setIsMovingAll] = useState(false);

  // Computed metrics
  const totalItems = items.length;
  const inStockItems = items.filter((item) => (item.product?.stock ?? 0) > 0);
  const totalValue = items.reduce(
    (sum, item) => sum + Number(item.product?.basePrice || 0),
    0
  );

  const handleRemoveFromWishlist = (productId: string, productName: string) => {
    wishlistToggle.mutate(
      { productId, saved: true },
      {
        onSuccess: () => {
          toast.add({
            title: "Removed from wishlist",
            description: `"${productName}" was removed from your saved items.`,
            type: "success",
          });
        },
        onError: () => {
          toast.add({
            title: "Failed to remove",
            description: "Could not remove item from wishlist. Please try again.",
            type: "error",
          });
        },
      }
    );
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    if (!item.product) return;
    if (item.product.stock <= 0) {
      toast.add({
        title: "Item is out of stock",
        description: "This item cannot be added to cart at this time.",
        type: "error",
      });
      return;
    }

    setMovingItemId(item.id);
    try {
      await addToCart.mutateAsync({
        productId: item.productId,
        quantity: 1,
      });

      // Remove from wishlist after successfully adding to cart
      await wishlistToggle.mutateAsync({
        productId: item.productId,
        saved: true,
      });

      toast.add({
        title: "Moved to cart!",
        description: `"${item.product.name}" is now in your cart.`,
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Failed to move to cart",
        description: err?.response?.data?.message || "Could not add item to cart.",
        type: "error",
      });
    } finally {
      setMovingItemId(null);
    }
  };

  const handleMoveAllInStockToCart = async () => {
    if (inStockItems.length === 0) return;

    setIsMovingAll(true);
    let successCount = 0;

    for (const item of inStockItems) {
      try {
        await addToCart.mutateAsync({
          productId: item.productId,
          quantity: 1,
        });
        await wishlistToggle.mutateAsync({
          productId: item.productId,
          saved: true,
        });
        successCount++;
      } catch {
        // continue moving remaining items
      }
    }

    setIsMovingAll(false);
    toast.add({
      title: "Items moved to cart",
      description: `Successfully moved ${successCount} item(s) into your shopping cart.`,
      type: "success",
    });
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </button>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <Heart className="h-5 w-5 fill-rose-600" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Wishlist
              </h1>
              <Badge className="bg-slate-900 text-white text-xs px-2.5 py-0.5 rounded-full ml-1">
                {totalItems}
              </Badge>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Manage your saved products, check stock availability, or move them directly to your cart.
            </p>
          </div>

          {/* Quick Action */}
          {inStockItems.length > 0 && (
            <Button
              onClick={handleMoveAllInStockToCart}
              disabled={isMovingAll}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm h-10 px-4 rounded-xl shadow-sm transition-all gap-2"
            >
              {isMovingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingBag className="h-4 w-4" />
              )}
              {isMovingAll ? "Moving Items..." : `Move All In-Stock to Cart (${inStockItems.length})`}
            </Button>
          )}
        </div>

        {/* Guest User Tip Banner */}
        {!isAuthenticated && totalItems > 0 && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-3.5 text-xs text-orange-900 flex flex-wrap items-center justify-between gap-2 shadow-xs">
            <span className="flex items-center gap-2">
              <span className="text-sm">💡</span>
              <span>
                <strong>Guest Mode:</strong> Your wishlist is saved in your current browser. Sign in or create an account to permanently sync your saved items across all devices.
              </span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/login")}
                className="font-bold underline hover:text-orange-950"
              >
                Sign In
              </button>
              <span>•</span>
              <button
                onClick={() => navigate("/register")}
                className="font-bold underline hover:text-orange-950"
              >
                Register
              </button>
            </div>
          </div>
        )}

        {/* Overview Stats Bar */}
        {totalItems > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Saved Products
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{totalItems}</p>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <Heart className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Estimated Value
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    ${totalValue.toFixed(2)}
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Stock Status
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-extrabold text-emerald-600 text-base mr-1">
                      {inStockItems.length}
                    </span>
                    in stock ·{" "}
                    <span className="font-bold text-rose-600">
                      {totalItems - inStockItems.length}
                    </span>{" "}
                    unavailable
                  </p>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-sm font-semibold">Loading your wishlist...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
            <p className="font-bold text-rose-600">Unable to load your saved products.</p>
            <p className="text-xs text-slate-500 mt-1">Please try refreshing the page.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && totalItems === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm max-w-lg mx-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Heart className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">Your wishlist is empty</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Explore our marketplace and click the heart icon on any product to save items you love
              for later.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm h-11 px-6 rounded-xl gap-2"
            >
              <ShoppingBag className="h-4 w-4" /> Explore Marketplace
            </Button>
          </div>
        )}

        {/* Wishlist Items Grid */}
        {!isLoading && !isError && totalItems > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;

              const isOutOfStock = (product.stock ?? 0) <= 0;
              const isLowStock = (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5;
              const imageUrl = product.images?.[0]?.url;
              const shopName = product.shop?.profile?.name || product.shop?.slug || "Verified Seller";
              const isMoving = movingItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
                >
                  {/* Top Image Box */}
                  <div className="relative aspect-4/3 w-full bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center p-4">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
                        <Package className="h-10 w-10 stroke-[1.2]" />
                        <span className="text-[11px] font-medium">No Image</span>
                      </div>
                    )}

                    {/* Quick Preview Button Overlay */}
                    <button
                      type="button"
                      onClick={() => setSelectedProductId(product.id)}
                      className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      title="Quick preview"
                    >
                      <span className="bg-white/95 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                        <Eye className="h-3.5 w-3.5" /> View Details
                      </span>
                    </button>

                    {/* Stock Status Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                          <XCircle className="h-3 w-3" /> Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                          <AlertTriangle className="h-3 w-3" /> Only {product.stock} Left
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                          <CheckCircle2 className="h-3 w-3" /> In Stock
                        </span>
                      )}
                    </div>

                    {/* Remove from Wishlist Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFromWishlist(product.id, product.name)}
                      disabled={wishlistToggle.isPending}
                      className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white shadow-xs transition-colors cursor-pointer"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      {/* Merchant */}
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 truncate">
                        <Store className="h-3 w-3 shrink-0" />
                        <span className="truncate">{shopName}</span>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => setSelectedProductId(product.id)}
                        className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-orange-600 transition-colors cursor-pointer"
                      >
                        {product.name}
                      </h3>
                    </div>

                    {/* Price & Action */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-black text-slate-900 tracking-tight">
                          ${Number(product.basePrice || 0).toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          Added {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 1-Click Move to Cart */}
                        <Button
                          disabled={isOutOfStock || isMoving}
                          onClick={() => handleMoveToCart(item)}
                          className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-none transition-all gap-1.5 disabled:opacity-50"
                        >
                          {isMoving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ShoppingCart className="h-3.5 w-3.5" />
                          )}
                          {isMoving
                            ? "Moving..."
                            : isOutOfStock
                            ? "Unavailable"
                            : "Move to Cart"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Modal Drawer */}
      {selectedProductId && (
        <ProductDetailView
          productId={selectedProductId}
          isOpen={Boolean(selectedProductId)}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </main>
  );
}
