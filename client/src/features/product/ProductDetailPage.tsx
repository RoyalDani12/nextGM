import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
} from "lucide-react";
import { useShopProducts, useDeleteProduct, useUpdateProductStatus, useDeleteVariant } from "./product.hooks";
import { ProductVariantEditDialog } from "./components/ProductVariantEditDialog";
import { AddVariantDialog } from "./components/AddVariantDialog";
import ProductEditDialog from "./components/ProductEditDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ProductStatus } from "./product.types";

const PRODUCT_STATUS_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["ARCHIVED"],
  ARCHIVED: ["ACTIVE"],
};

const STATUS_CONFIG: Record<ProductStatus, { label: string; dotClass: string }> = {
  DRAFT: {
    label: "Draft",
    dotClass: "bg-amber-500",
  },
  ACTIVE: {
    label: "Active",
    dotClass: "bg-emerald-500",
  },
  ARCHIVED: {
    label: "Archived",
    dotClass: "bg-slate-400",
  },
};

const getImageUrl = (img: any): string | null => {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (typeof img === "object") {
    return img.url || img.secure_url || img.src || null;
  }
  return null;
};

export default function ProductDetailPage() {
  const { shopId = "", productId = "" } = useParams<{ shopId: string; productId: string }>();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [editVariant, setEditVariant] = useState<any>(null);
  const [editVariantOpen, setEditVariantOpen] = useState(false);

  // Delete confirmation modals
  const [deleteProductConfirmOpen, setDeleteProductConfirmOpen] = useState(false);
  const [deleteVariantTarget, setDeleteVariantTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useShopProducts(shopId);
  const deleteProduct = useDeleteProduct(shopId);
  const updateProductStatus = useUpdateProductStatus(shopId);
  const deleteVariant = useDeleteVariant(shopId, productId);

  const products = (data as any)?.data?.products ?? [];
  const product = products.find((p: any) => (p.id || p._id) === productId);

  if (isLoading) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-sm mx-auto text-center py-20 space-y-3">
        <AlertCircle className="size-8 text-slate-300 mx-auto" />
        <p className="text-sm font-medium text-slate-700">Product not found</p>
        <p className="text-xs text-slate-400">This product may have been deleted.</p>
        <Link
          to={`/dashboard/shop/${shopId}/products`}
          className="inline-block text-xs font-medium text-orange-600 hover:text-orange-700"
        >
          Return to products
        </Link>
      </div>
    );
  }

  const handleDeleteProduct = () => {
    deleteProduct.mutate(product.id || product._id, {
      onSuccess: () => {
        setDeleteProductConfirmOpen(false);
        navigate(`/dashboard/shop/${shopId}/products`);
      },
    });
  };

  const handleDeleteVariantConfirm = () => {
    if (!deleteVariantTarget) return;
    deleteVariant.mutate(deleteVariantTarget.id, {
      onSuccess: () => setDeleteVariantTarget(null),
    });
  };

  const rawImages = product.images || [];
  const images = rawImages.map(getImageUrl).filter(Boolean) as string[];
  const activeImage = images[selectedImageIndex] || images[0];
  const currentStatus = (product.status as ProductStatus) || "DRAFT";
  const currentStatusMeta = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.DRAFT;
  const variants = product.variants || [];

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to={`/dashboard/shop/${shopId}/products`}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={13} /> Back to products
        </Link>
      </div>

      {/* Main Product Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gallery */}
          <div className="lg:col-span-5 space-y-3">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon size={32} className="text-slate-300" />
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`size-14 shrink-0 overflow-hidden rounded-md border transition-all cursor-pointer ${
                      selectedImageIndex === idx
                        ? "border-orange-500 ring-2 ring-orange-500/20"
                        : "border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={imgUrl} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-slate-900">{product.name}</h1>
                    {product.type && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {product.type}
                      </span>
                    )}
                  </div>
                  {product.sku && (
                    <p className="text-xs text-slate-400 font-mono">SKU: {product.sku}</p>
                  )}
                </div>

                {/* Status selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      disabled={updateProductStatus.isPending}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {updateProductStatus.isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>
                          <span className={`size-1.5 rounded-full ${currentStatusMeta.dotClass}`} />
                          <span>{currentStatusMeta.label}</span>
                          <ChevronDown size={11} className="text-slate-400" />
                        </>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 p-1 rounded-lg border border-slate-200 shadow-lg bg-white">
                    {PRODUCT_STATUS_TRANSITIONS[currentStatus]?.map((status) => {
                      const itemMeta = STATUS_CONFIG[status];
                      return (
                        <DropdownMenuItem
                          key={status}
                          onClick={() =>
                            updateProductStatus.mutate({
                              productId: product.id || product._id,
                              status,
                            })
                          }
                          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded cursor-pointer"
                        >
                          <span className={`size-1.5 rounded-full ${itemMeta?.dotClass}`} />
                          <span>{itemMeta?.label || status}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Price */}
              <div>
                <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                  ${Number(product.basePrice ?? 0).toFixed(2)}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500">Description</span>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {product.description || "No description provided."}
                </p>
              </div>

              {/* Stock and details */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <span className="text-xs text-slate-500 block">Inventory</span>
                  <span className="text-sm font-semibold text-slate-800 tabular-nums mt-0.5 block">
                    {product.stock ?? 0} in stock
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <span className="text-xs text-slate-500 block">Variants</span>
                  <span className="text-sm font-semibold text-slate-800 tabular-nums mt-0.5 block">
                    {variants.length} options
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Pencil size={12} />
                <span>Edit product</span>
              </button>
              <button
                onClick={() => setDeleteProductConfirmOpen(true)}
                disabled={deleteProduct.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Delete product</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Variants Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-slate-800">
              Product variants ({variants.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sizes, colors, or material options
            </p>
          </div>
          <button
            onClick={() => setVariantOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>Add variant</span>
          </button>
        </div>

        {variants.length > 0 ? (
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {variants.map((variant: any) => {
              const varId = variant.id || variant._id;
              return (
                <div key={varId} className="flex items-center justify-between py-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{variant.name}</span>
                      {variant.sku && (
                        <span className="text-[11px] font-mono text-slate-400">
                          {variant.sku}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400">
                      {variant.stock} units in stock
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900 tabular-nums">
                      ${Number(variant.price ?? 0).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditVariant(variant);
                          setEditVariantOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit variant"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteVariantTarget({ id: varId, name: variant.name })
                        }
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete variant"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center border-t border-slate-100">
            No variants added yet. Add size, color, or option variants for this product.
          </p>
        )}
      </div>

      {/* Product Edit Dialog */}
      <ProductEditDialog
        product={product}
        open={editOpen}
        shopId={shopId}
        onOpenChange={setEditOpen}
      />

      {/* Add Variant Dialog */}
      <AddVariantDialog
        open={variantOpen}
        onOpenChange={setVariantOpen}
        shopId={shopId}
        productId={productId}
      />

      {/* Edit Variant Dialog */}
      <ProductVariantEditDialog
        open={editVariantOpen}
        onOpenChange={setEditVariantOpen}
        shopId={shopId}
        productId={productId}
        variant={editVariant}
      />

      {/* Delete Product Confirmation Modal */}
      <Dialog open={deleteProductConfirmOpen} onOpenChange={setDeleteProductConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-lg bg-white p-5 shadow-xl border border-slate-200">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Delete product
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete <strong className="text-slate-800">"{product.name}"</strong>? This will permanently remove this item from your catalog.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setDeleteProductConfirmOpen(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteProduct.isPending}
              onClick={handleDeleteProduct}
              className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {deleteProduct.isPending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Variant Confirmation Modal */}
      <Dialog
        open={Boolean(deleteVariantTarget)}
        onOpenChange={(open) => !open && setDeleteVariantTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-lg bg-white p-5 shadow-xl border border-slate-200">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Delete variant
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete variant <strong className="text-slate-800">"{deleteVariantTarget?.name}"</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setDeleteVariantTarget(null)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteVariant.isPending}
              onClick={handleDeleteVariantConfirm}
              className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {deleteVariant.isPending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
