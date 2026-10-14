import { useNavigate } from "react-router-dom";
import { Image as ImageIcon, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Product, ProductStatus } from "@/features/product/product.types";

interface ProductCardProps {
  product: Product;
  shopId: string;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string, productName: string) => void;
  onStatusChange?: (productId: string, status: ProductStatus) => void;
  isDeleting?: boolean;
  isUpdatingStatus?: boolean;
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

  return (
    <Card 
      onClick={handleNavigateToDetail}
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
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
          <div className="flex h-full items-center justify-center bg-muted/50">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        {product.type && (
          <div className="absolute left-3 top-3 z-10">
            <Badge variant="secondary" className="bg-background/80 font-medium backdrop-blur-md shadow-sm">
              {product.type}
            </Badge>
          </div>
        )}

        <div className="absolute right-3 top-3 z-10">
          <Badge 
            variant={product.status === "ACTIVE" ? "default" : "secondary"} 
            className="bg-background/80 backdrop-blur-md shadow-sm text-[10px]"
          >
            {product.status || "DRAFT"}
          </Badge>
        </div>

        {onEdit && (
          <div className="absolute right-3 bottom-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-md shadow-md hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* CARD CONTENT - ONLY NAME, DESCRIPTION, PRICE, STOCK */}
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 min-h-[32px] leading-relaxed">
            {product.description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <span className="text-xl font-bold tracking-tight text-foreground">
            ${Number(product.basePrice ?? 0).toFixed(2)}
          </span>
          <StockBadge stock={Number(product.stock ?? 0)} />
        </div>

        {product.sku && (
          <div className="text-[11px] text-muted-foreground/70 font-mono tracking-wider pt-0.5">
            SKU: {product.sku}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge variant="destructive" className="text-[10px] px-2 py-0.5">Out of stock</Badge>;
  }
  if (stock <= 5) {
    return (
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 font-medium">
        {stock} left
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 font-medium">
      {stock} in stock
    </Badge>
  );
}