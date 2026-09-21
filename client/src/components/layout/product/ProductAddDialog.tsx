import { useState, useRef } from "react";
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

import type { CreateProductPayload ,ProductType} from "@/features/product/product.types";
import { getUploadSignatureRequest, uploadToCloudinary } from "@/api/upload.api";

interface ImageItem {
  url: string;
  isPrimary: boolean;
  file?: File;
}

interface ProductAddDialogProps {
  shopId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateProductPayload) => Promise<void>;
}

export default function ProductAddDialog({
  shopId,
  open,
  onOpenChange,
  onSubmit,
}: ProductAddDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stock, setStock] = useState(0);
  const [sku, setSku] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [type, setType] = useState<ProductType>("PHYSICAL");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setBasePrice("");
    setStock(0);
    setSku("");
    setType("PHYSICAL");
    images.forEach((img) => {
      if (img.url.startsWith("blob:")) URL.revokeObjectURL(img.url);
    });
    setImages([]);
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) resetForm();
    onOpenChange(newOpen);
  };

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
    if (!shopId) return;

    setLoading(true);
    setUploadProgress("Uploading images...");

    try {
      const processedImages = await Promise.all(
        images.map(async (img) => {
          if (img.file) {
            const signatureData = await getUploadSignatureRequest(
              "product_image",
              shopId,
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

      setUploadProgress("Creating product...");

      const payload: CreateProductPayload = {
        name,
        description,
        basePrice,
        type,
        stock: Number(stock),
        sku: sku || undefined,
        images: processedImages.map((image) => image.url),
      };

      await onSubmit(payload);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create product:", error);
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  };

  const primaryImage = images.find((img) => img.isPrimary);
  const additionalImages = images.filter((img) => !img.isPrimary);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] sm:max-w-[620px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
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
              onClick={() => handleClose(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}