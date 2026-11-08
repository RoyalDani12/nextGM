import { useState, useEffect, useRef } from "react";
import { Loader2, Upload, Star, Trash2, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Product, UpdateProductPayload } from "../product.types";
import { getUploadSignatureRequest, uploadToCloudinary } from "@/features/upload/upload.api";
import { useUpdateProduct } from "@/features/product/product.hooks";
import { useMarketplaceCategories } from "@/features/marketplace/components/marketplace.hooks";

interface ProductEditDialogProps {
  shopId?: string;
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (productId: string, payload: UpdateProductPayload) => Promise<void>;
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
  onSubmit,
}: ProductEditDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stock, setStock] = useState(0);
  const [sku, setSku] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [platformCategoryId, setPlatformCategoryId] = useState("");
  const { data: categories = [] } = useMarketplaceCategories();

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
      setPlatformCategoryId(product.platformCategoryId || "");

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
      if (removedItem?.file && removedItem.url.startsWith("blob:")) {
        URL.revokeObjectURL(removedItem.url);
      }

      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0] = { ...filtered[0], isPrimary: true };
      }
      return filtered;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const productId = product.id || (product as any)._id;
    const activeShopId = product.shopId || shopId;

    if (!productId || !activeShopId) {
      console.error("Missing productId or shopId for update.");
      return;
    }

    setLoading(true);
    setUploadProgress("Uploading images...");

    try {
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

      setUploadProgress("Saving changes...");

      const payload: UpdateProductPayload = {
        name,
        description,
        basePrice,
        stock: Number(stock),
        sku: sku || undefined,
        platformCategoryId: platformCategoryId || null,
        images: processedImages,
      };

      if (onSubmit) {
        await onSubmit(productId, payload);
      } else {
        await updateProduct({ productId, payload });
      }
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
      <DialogContent className="max-h-[90vh] sm:max-w-[560px] overflow-y-auto p-5 rounded-lg border border-slate-200 bg-white shadow-xl">
        <DialogHeader className="space-y-1 pb-2 border-b border-slate-100">
          <DialogTitle className="text-base font-semibold text-slate-900">
            Edit product
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Update product details, pricing, inventory, and gallery.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Product name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wireless Headphones"
              className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Marketplace category</label>
            <select
              value={platformCategoryId}
              onChange={(e) => setPlatformCategoryId(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="">No marketplace category</option>
              {categories
                .flatMap((parent) => [
                  { id: parent.id, label: parent.name },
                  ...parent.children.map((child) => ({
                    id: child.id,
                    label: `${parent.name} > ${child.name}`,
                  })),
                ])
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of your product..."
              rows={3}
              className="text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Base price ($)</label>
              <Input
                type="number"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Stock units</label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              SKU <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. PRD-BLK-001"
              className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
            />
          </div>

          {/* IMAGES */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Images</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Upload size={12} />
                <span>Add images</span>
              </button>
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
            <div>
              {primaryImage ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <img
                    src={primaryImage.url}
                    alt="Main Product"
                    className="size-full object-cover"
                  />
                  <span className="inline-flex items-center gap-1 rounded bg-slate-900/90 text-[10px] font-medium text-white px-2 py-0.5 absolute left-2.5 top-2.5 backdrop-blur-xs">
                    <Check size={11} /> Primary cover
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(images.indexOf(primaryImage))}
                    className="absolute right-2.5 top-2.5 size-7 rounded-md bg-white/90 hover:bg-white text-slate-600 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                    title="Remove primary image"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-[16/9] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                >
                  <ImageIcon className="size-6 text-slate-400" />
                  <p className="mt-1.5 text-xs font-medium text-slate-600">
                    Click to upload primary cover
                  </p>
                  <p className="text-[11px] text-slate-400">PNG, JPG or WEBP</p>
                </div>
              )}
            </div>

            {/* GALLERY THUMBNAILS */}
            {additionalImages.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-slate-500">
                  Gallery ({additionalImages.length})
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {images.map((img, idx) => {
                    if (img.isPrimary) return null;
                    return (
                      <div
                        key={img.url || idx}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                      >
                        <img
                          src={img.url}
                          alt={`Thumbnail ${idx}`}
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(idx)}
                            className="size-6 rounded-md bg-white text-slate-700 hover:text-amber-500 flex items-center justify-center transition-colors cursor-pointer"
                            title="Set as primary cover"
                          >
                            <Star size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="size-6 rounded-md bg-white text-slate-700 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Remove image"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between">
            {uploadProgress ? (
              <span className="text-xs text-slate-500 animate-pulse">
                {uploadProgress}
              </span>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-8 px-3 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="h-8 px-4 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg cursor-pointer"
              >
                {loading && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
