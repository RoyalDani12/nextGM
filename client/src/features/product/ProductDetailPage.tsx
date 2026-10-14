import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, AlertCircle, Loader2, Image as ImageIcon, ChevronDown, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useShopProducts, useDeleteProduct, useUpdateProductStatus,useDeleteVariant } from "./product.hooks"; 
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProductStatus } from "./product.types";

const PRODUCT_STATUS_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["ARCHIVED"],
  ARCHIVED: ["ACTIVE"],
};

const STATUS_CONFIG: Record<ProductStatus, { label: string; desc: string; dotClass: string }> = {
  DRAFT: { 
    label: "Draft", 
    desc: "Product is hidden from customers and store catalog.",
    dotClass: "bg-amber-500"
  },
  ACTIVE: { 
    label: "Active", 
    desc: "Product is live, searchable, and available for purchase.",
    dotClass: "bg-emerald-500"
  },
  ARCHIVED: { 
    label: "Archived", 
    desc: "Product is discontinued and hidden from all channels.",
    dotClass: "bg-zinc-400"
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
  const { shopId, productId } = useParams<{ shopId: string; productId: string }>();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data, isLoading } = useShopProducts(shopId!);
  const deleteProduct = useDeleteProduct(shopId!);
  const updateProductStatus = useUpdateProductStatus(shopId!);

  const products = (data as any)?.data?.products ?? [];
  const product = products.find((p: any) => (p.id || p._id) === productId);
  const [editVariant, setEditVariant] = useState<any>(null);
const [editVariantOpen, setEditVariantOpen] = useState(false);

const deleteVariant = useDeleteVariant(shopId!, productId!);

const handleDeleteVariant = (variantId: string, variantName: string) => {
  if (window.confirm(`Are you sure you want to delete variant "${variantName}"?`)) {
    deleteVariant.mutate(variantId);
  }
};

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>;
  }

  if (!product) {
    return (
      <div className="p-6">
        <Card className="border-destructive/30">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold">Product not found</p>
              <p className="text-sm text-muted-foreground">The product may have been deleted or doesn't exist.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProduct.mutate(product.id || product._id, {
        onSuccess: () => navigate(`/dashboard/shop/${shopId}/products`)
      });
    }
  };

  const rawImages = product.images || [];
  const images = rawImages.map(getImageUrl).filter(Boolean) as string[];
  const activeImage = images[selectedImageIndex] || images[0];
  const currentStatus = (product.status as ProductStatus) || "DRAFT";
  const currentStatusMeta = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.DRAFT;
  const variants = product.variants || [];

  return (
    <TooltipProvider delay={150}>
      <div className="w-full p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
        {/* NAVIGATION BAR */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Button>

        {/* TOP HERO DETAILS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-card border border-border/80 rounded-2xl p-6 md:p-8 shadow-sm">
          {/* IMAGE GALLERY DISPLAY */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted/50 border border-border/60 shadow-inner">
              {activeImage ? (
                <img src={activeImage} alt={product.name} className="h-full w-full object-cover transition-all duration-300" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImageIndex === idx ? "border-primary ring-2 ring-primary/20 shadow-md scale-105" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* METADATA & ACTIONS */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{product.name}</h1>
                    {product.type && (
                      <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-semibold">
                        {product.type}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* STATUS CHANGE VISIBILITY SELECTOR */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Change Visibility:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild={false}>
                      <Button variant="outline" size="sm" disabled={updateProductStatus.isPending} className="gap-2 h-9 px-3.5 shadow-xs">
                        {updateProductStatus.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <span className={`h-2 w-2 rounded-full ${currentStatusMeta.dotClass}`} />
                            <span className="font-semibold text-xs">{currentStatusMeta.label}</span>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-1.5 shadow-xl">
                      <div className="px-2 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase border-b border-border/50 mb-1">
                        Select Visibility Status
                      </div>
                      {PRODUCT_STATUS_TRANSITIONS[currentStatus]?.map((status) => {
                        const itemMeta = STATUS_CONFIG[status];
                        return (
                          <Tooltip key={status}>
                            <TooltipTrigger asChild={false}>
                              <DropdownMenuItem
                                className="flex items-center gap-2.5 py-2 px-2.5 rounded-md cursor-pointer focus:bg-accent w-full"
                                onClick={() => updateProductStatus.mutate({ productId: product.id || product._id, status })}
                              >
                                <span className={`h-2 w-2 rounded-full ${itemMeta?.dotClass || "bg-muted-foreground"}`} />
                                <span className="font-medium text-xs text-foreground">{itemMeta?.label || status}</span>
                              </DropdownMenuItem>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs text-xs bg-popover text-popover-foreground border border-border shadow-lg p-2.5">
                              <p>{itemMeta?.desc || `Switch status to ${status}`}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                ${Number(product.basePrice ?? 0).toFixed(2)}
              </div>

              <div className="bg-muted/30 p-3.5 rounded-xl border border-border/40">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {product.description || "No description provided for this product."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-muted/30 p-3 rounded-xl border border-border/40">
                  <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">Stock Availability</span>
                  <span className="font-bold text-foreground mt-0.5 block">{product.stock ?? 0} units available</span>
                </div>
                {product.sku && (
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/40">
                    <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">SKU Code</span>
                    <span className="font-mono font-bold text-foreground mt-0.5 block">{product.sku}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS (EDIT / DELETE) */}
            <div className="flex items-center gap-3 pt-4 border-t border-border/60">
              <Button variant="outline" className="flex-1 gap-2 font-medium shadow-xs" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 text-muted-foreground" /> Edit Product
              </Button>
              <Button 
                variant="destructive" 
                className="gap-2 font-medium shadow-xs" 
                disabled={deleteProduct.isPending} 
                onClick={handleDelete}
              >
                {deleteProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} 
                Delete Product
              </Button>
            </div>
          </div>
        </div>

        {/* VARIANTS SECTION */}
      {/* VARIANTS SECTION */}
        <Card className="border border-border/80 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 bg-muted/20 px-6 py-4">
            <CardTitle className="text-base font-bold tracking-tight">Product Variants ({variants.length})</CardTitle>
            <Button size="sm" onClick={() => setVariantOpen(true)} className="gap-2 shadow-xs">
              <Plus className="h-4 w-4" /> Add Variant
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {variants.length > 0 ? (
              <div className="divide-y divide-border/60">
                {variants.map((variant: any) => {
                  const varId = variant.id || variant._id;
                  return (
                    <div key={varId} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-sm text-foreground">{variant.name}</span>
                          {variant.sku && (
                            <span className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border/50">
                              SKU: {variant.sku}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Stock: <span className="font-medium text-foreground">{variant.stock}</span> units available</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-extrabold text-sm text-foreground">${Number(variant.price ?? 0).toFixed(2)}</span>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setEditVariant(variant);
                              setEditVariantOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deleteVariant.isPending}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteVariant(varId, variant.name)}
                          >
                            {deleteVariant.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No variants found. Add size or color options for this product.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DIALOGS */}
        <ProductEditDialog
          product={product}
          open={editOpen}
          shopId={shopId!}
          onOpenChange={setEditOpen}
        />

        <AddVariantDialog
          open={variantOpen}
          onOpenChange={setVariantOpen}
          shopId={shopId!}
          productId={productId!}
        />
        <ProductVariantEditDialog
          open={editVariantOpen}
          onOpenChange={setEditVariantOpen}
          shopId={shopId!}
          productId={productId!}
          variant={editVariant}
        />
      </div>
    </TooltipProvider>
  );
}