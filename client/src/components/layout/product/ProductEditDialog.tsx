import { useState, useEffect, useRef } from "react";
import { Loader2, Upload, Star, Trash2, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Product, UpdateProductPayload } from "../../../features/product/product.types";
import { getUploadSignatureRequest, uploadToCloudinary } from "@/api/upload.api";
import { useUpdateProduct } from "@/features/product/product.hooks";

interface ProductEditDialogProps {
  shopId?: string;
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (productId: string, payload: UpdateProductPayload) => Promise<void>;
}

export interface ImageItem {
  url: string;
  isPrimary: boolean;
  file?: File;
}

export default function ProductEditDialog({
  shopId,
  product,
  open,
  onOpenChange,
  // onSubmit,
}: ProductEditDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stock, setStock] = useState(0);
  const [sku, setSku] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const { mutateAsync: updateProduct } = useUpdateProduct(shopId!);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize state with product prop
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setDescription(product.description || "");
      setBasePrice(String(product.basePrice ?? ""));
      setStock(Number(product.stock ?? 0));
      setSku(product.sku || "");

      if (product.images && Array.isArray(product.images)) {
        const rawImages: ImageItem[] = product.images.map((img: any) => {
          if (typeof img === "string") {
            return { url: img, isPrimary: false };
          }
          return {
            url: img.url || "",
            isPrimary: Boolean(img.isPrimary),
          };
        });

        // Ensure at least one primary image exists if list is not empty
        const hasPrimary = rawImages.some((img) => img.isPrimary);
        const initialImages = rawImages.map((img, idx) => ({
          ...img,
          isPrimary: hasPrimary ? img.isPrimary : idx === 0,
        }));

        setImages(initialImages);
      } else {
        setImages([]);
      }
    }
  }, [product]);

  // Handle local file selection
  const handleFileBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: ImageItem[] = Array.from(files).map((file, idx) => ({
      url: URL.createObjectURL(file),
      file,
      isPrimary: images.length === 0 && idx === 0,
    }));

    setImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isPrimary: idx === indexToPrimary,
      }))
    );
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => {
      const removedItem = prev[indexToRemove];
      // Clean up memory if it was a blob URL
      if (removedItem?.file && removedItem.url.startsWith("blob:")) {
        URL.revokeObjectURL(removedItem.url);
      }

      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      
      // Immutable update for fallback primary selection
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0] = { ...filtered[0], isPrimary: true };
      }
      return filtered;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    // Handle MongoDB _id vs id fallback
    const productId = product.id || (product as any)._id;
    const activeShopId = product.shopId || shopId;

    if (!productId || !activeShopId) {
      console.error("Missing productId or shopId for update.");
      return;
    }

    setLoading(true);
    setUploadProgress("Uploading new images...");

    try {
      // 1. Upload new File instances to Cloudinary
      const processedImages = await Promise.all(
        images.map(async (img) => {
          if (img.file) {
            const signatureData = await getUploadSignatureRequest(
              "product_image",
              activeShopId,
              img.file.type
            );

            const cloudRes = await uploadToCloudinary(img.file, signatureData);

            return {
              url: cloudRes.secure_url || cloudRes.url,
              isPrimary: img.isPrimary,
            };
          }

          return {
            url: img.url,
            isPrimary: img.isPrimary,
          };
        })
      );

      setUploadProgress("Saving product update...");

      // 2. Send payload to API
      const payload: UpdateProductPayload = {
        name,
        description,
        basePrice,
        stock: Number(stock),
        sku: sku || undefined,
        images: processedImages,
      };

      await updateProduct({ productId, payload,});
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update product:", error);
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  };

  const primaryImage = images.find((img) => img.isPrimary);
  const additionalImages = images.filter((img) => !img.isPrimary);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-[620px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Product Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wireless Headphones"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Base Price ($)</label>
              <Input
                type="number"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Stock</label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">SKU (Optional)</label>
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. SONY-1001"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Product Images</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" /> Add Images
              </Button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileBrowse}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* MAIN IMAGE */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Main Display Image
              </span>
              {primaryImage ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-primary bg-card">
                  <img
                    src={primaryImage.url}
                    alt="Main Product"
                    className="h-full w-full object-cover"
                  />
                  <Badge className="absolute left-2 top-2 gap-1 bg-primary text-xs text-primary-foreground">
                    <Check className="h-3.5 w-3.5" /> Main Image
                  </Badge>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full opacity-90 hover:opacity-100"
                    onClick={() => handleRemoveImage(images.indexOf(primaryImage))}
                    title="Remove Main Image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/80 bg-muted/20 transition-all hover:bg-muted/40"
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    No primary image selected. Click to browse.
                  </p>
                </div>
              )}
            </div>

            {/* GALLERY IMAGES */}
            {additionalImages.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Additional Gallery Images ({additionalImages.length})
                </span>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((img, idx) => {
                    if (img.isPrimary) return null;
                    return (
                      <div
                        key={img.url || idx}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-card"
                      >
                        <img
                          src={img.url}
                          alt={`Gallery preview ${idx}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7 rounded-full bg-background/90"
                            onClick={() => handleSetPrimary(idx)}
                            title="Set as Main Image"
                          >
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleRemoveImage(idx)}
                            title="Remove Image"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3">
            {uploadProgress && (
              <span className="mr-auto animate-pulse text-xs text-muted-foreground">
                {uploadProgress}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}