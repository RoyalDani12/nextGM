import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useUpdateVariant } from "@/features/product/product.hooks";

interface ProductVariantEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  productId: string;
  variant: any;
}

export function ProductVariantEditDialog({
  open,
  onOpenChange,
  shopId,
  productId,
  variant,
}: ProductVariantEditDialogProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      price: "",
      stock: 0,
      sku: "",
    },
  });

  useEffect(() => {
    if (variant) {
      reset({
        name: variant.name || "",
        price: variant.price || "",
        stock: variant.stock ?? 0,
        sku: variant.sku || "",
      });
    }
  }, [variant, reset]);

  const updateVariantMutation = useUpdateVariant(shopId, productId);

 const onSubmit = (data: any) => {
    if (!variant) return;
    updateVariantMutation.mutate(
      {
        variantId: variant.id || variant._id,
        payload: {
          ...data,
          price: data.price ? String(data.price) : "0", // Backend expects string
          stock: Number(data.stock),
          sku: data.sku && data.sku.trim() !== "" ? data.sku : undefined, // Avoid null values if backend expects string or optional
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Product Variant</DialogTitle>
          <DialogDescription>
            Update pricing, stock levels, or attributes for this variant.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-variant-name">Variant Name</Label>
            <Input
              id="edit-variant-name"
              placeholder="e.g. Pro Max / Blue"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-variant-price">Price ($)</Label>
              <Input
                id="edit-variant-price"
                type="number"
                step="0.01"
                {...register("price", { required: "Price is required" })}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-variant-stock">Stock Count</Label>
              <Input
                id="edit-variant-stock"
                type="number"
                {...register("stock", { required: "Stock is required" })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-variant-sku">SKU (Optional)</Label>
            <Input id="edit-variant-sku" {...register("sku")} />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateVariantMutation.isPending}>
              {updateVariantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}