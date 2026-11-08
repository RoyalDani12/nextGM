import { useNavigate } from "react-router-dom";
import { Image as ImageIcon, Pencil, ArrowUpRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Product, ProductStatus } from "@/features/product/product.types";

interface ProductCardProps {
  product: Product;
  shopId: string;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string, productName: string) => void;
  onStatusChange?: (productId: string, status: ProductStatus) => void;
  onStockChange?: (productId: string, stock: number) => void;
  isDeleting?: boolean;
  isUpdatingStatus?: boolean;
  isUpdatingStock?: boolean;
}

const getImageUrl = (img: any): string | null => {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (typeof img === "object") {
    return img.url || img.secure_url || img.src || null;
  }
  return null;
};

export default function ProductCard({
  product,
  shopId,
  onEdit,
  onStockChange,
  isUpdatingStock,
}: ProductCardProps) {
  const navigate = useNavigate();
  const productId = product.id || (product as any)._id;
  const rawImages = product.images || [];

  const primaryImgObj =
    rawImages.find((img: any) => typeof img === "object" && img?.isPrimary) ||
    rawImages[0];
  const secondaryImgObj = rawImages.find((img: any) => img !== primaryImgObj);

  const primaryImage = getImageUrl(primaryImgObj);
  const secondaryImage = getImageUrl(secondaryImgObj);

  const handleNavigateToDetail = () => {
    navigate(`/dashboard/shop/${shopId}/products/${productId}`);
  };

  const isActive = product.status === "ACTIVE";
  const [stock, setStock] = useState(String(product.stock ?? 0));

  return (
    <div
      onClick={handleNavigateToDetail}
      className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-slate-300 transition-colors flex flex-col justify-between"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50 border-b border-slate-100">
        {primaryImage ? (
          <>
            <img
              src={primaryImage}
              alt={product.name}
              className={`size-full object-cover transition-opacity duration-300 ${
                secondaryImage ? "group-hover:opacity-0" : ""
              }`}
            />
            {secondaryImage && (
              <img
                src={secondaryImage}
                alt={`${product.name} preview`}
                className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex size-full items-center justify-center text-slate-300">
            <ImageIcon size={24} />
          </div>
        )}

        {/* Status dot */}
        <div className="absolute right-2.5 top-2.5 z-10">
          <span className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-medium border border-slate-200/80 shadow-2xs">
            <span
              className={`size-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}
            />
            <span className={isActive ? "text-emerald-700" : "text-slate-600"}>
              {product.status || "DRAFT"}
            </span>
          </span>
        </div>

        {/* Quick edit */}
        {onEdit && (
          <div className="absolute right-2.5 bottom-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-md bg-white/95 border border-slate-200 shadow-xs text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
              title="Edit product"
            >
              <Pencil size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="font-medium text-xs text-slate-900 truncate group-hover:text-orange-600 transition-colors">
              {product.name}
            </h3>
            <ArrowUpRight size={12} className="text-slate-300 group-hover:text-slate-600 shrink-0 transition-colors" />
          </div>
          {product.sku && (
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
              {product.sku}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900 tabular-nums">
              ${Number(product.basePrice ?? 0).toFixed(2)}
            </span>
            <StockBadge stock={Number(product.stock ?? 0)} />
          </div>

          <div
            className="flex items-center gap-1.5 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[11px] text-slate-400 font-medium">Stock:</span>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="h-6 w-14 rounded border border-slate-200 px-1.5 text-xs font-medium tabular-nums outline-none focus:border-orange-400 text-slate-800"
            />
            {onStockChange && Number(stock) !== Number(product.stock) && (
              <button
                type="button"
                disabled={isUpdatingStock}
                onClick={() => onStockChange(productId, Number(stock))}
                className="h-6 px-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-medium transition-colors cursor-pointer disabled:opacity-40"
              >
                {isUpdatingStock ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600">
        <span className="size-1 rounded-full bg-rose-500" />
        Out
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
        <span className="size-1 rounded-full bg-amber-500" />
        {stock} left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
      <span className="size-1 rounded-full bg-emerald-500" />
      {stock} in stock
    </span>
  );
}
