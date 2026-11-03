import { useNavigate } from "react-router-dom";
import { Image as ImageIcon, Pencil, ArrowUpRight, Save } from "lucide-react";
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
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-xl shadow-2xs flex flex-col justify-between"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {primaryImage ? (
          <>
            <img
              src={primaryImage}
              alt={product.name}
              className={`h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                secondaryImage ? "group-hover:opacity-0" : ""
              }`}
            />
            {secondaryImage && (
              <img
                src={secondaryImage}
                alt={`${product.name} preview`}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 ease-out scale-110 group-hover:opacity-100 group-hover:scale-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50 text-slate-300">
            <ImageIcon className="size-10" />
          </div>
        )}

        {/* TYPE BADGE */}
        {product.type && (
          <div className="absolute left-3 top-3 z-10">
            <span className="rounded-lg bg-white/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-2xs border border-white/40">
              {product.type}
            </span>
          </div>
        )}

        {/* STATUS BADGE */}
        <div className="absolute right-3 top-3 z-10">
          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-2xs border ${
            isActive
              ? "bg-emerald-500/90 text-white border-emerald-400"
              : "bg-slate-800/80 text-slate-200 border-slate-700"
          }`}>
            <span className={`size-1.5 rounded-full ${isActive ? "bg-white animate-pulse" : "bg-slate-400"}`} />
            {product.status || "DRAFT"}
          </span>
        </div>

        {/* QUICK EDIT HOVER BUTTON */}
        {onEdit && (
          <div className="absolute right-3 bottom-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-xl bg-white/95 backdrop-blur-md shadow-md hover:bg-white text-slate-700 hover:text-orange-600 transition-all cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
              title="Edit product"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* CARD CONTENT */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm text-slate-900 tracking-tight truncate group-hover:text-orange-600 transition-colors">
              {product.name}
            </h3>
            <ArrowUpRight className="size-3.5 text-slate-300 group-hover:text-orange-500 shrink-0 transition-colors" />
          </div>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[32px]">
            {product.description || "No description provided."}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-lg font-black tracking-tight text-slate-900">
              ${Number(product.basePrice ?? 0).toFixed(2)}
            </span>
            <StockBadge stock={Number(product.stock ?? 0)} />
          </div>
          <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
            <label htmlFor={`stock-${productId}`} className="text-[11px] font-semibold text-slate-500">Stock</label>
            <input id={`stock-${productId}`} type="number" min="0" value={stock} onChange={(event) => setStock(event.target.value)} className="h-8 min-w-0 flex-1 rounded-lg border border-slate-200 px-2 text-xs font-bold outline-none focus:border-orange-400" />
            {onStockChange && <button type="button" disabled={isUpdatingStock || Number(stock) === Number(product.stock)} onClick={() => onStockChange(productId, Number(stock))} className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white disabled:cursor-not-allowed disabled:opacity-40" aria-label="Save stock"><Save className="size-3.5" /></button>}
          </div>

          {product.sku && (
            <div className="text-[10px] text-slate-400 font-mono tracking-wider">
              SKU: {product.sku}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <span className="rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5">Out of stock</span>;
  }
  if (stock <= 5) {
    return (
      <span className="rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5">
        {stock} left
      </span>
    );
  }
  return (
    <span className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5">
      {stock} in stock
    </span>
  );
}
