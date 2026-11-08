import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
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
          price: data.price ? String(data.price) : "0",
          stock: Number(data.stock),
          sku: data.sku && data.sku.trim() !== "" ? data.sku.trim() : undefined,
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
      <DialogContent className="sm:max-w-[460px] p-5 rounded-lg border border-slate-200 bg-white shadow-xl">
        <DialogHeader className="space-y-1 pb-2 border-b border-slate-100">
          <DialogTitle className="text-base font-semibold text-slate-900">
            Edit variant
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Update pricing, stock levels, or SKU for this variant.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <label htmlFor="edit-variant-name" className="text-xs font-medium text-slate-700">
              Variant name
            </label>
            <Input
              id="edit-variant-name"
              placeholder="e.g. Pro Max / Blue"
              className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-xs text-rose-500">{errors.name.message as string}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit-variant-price" className="text-xs font-medium text-slate-700">
                Price ($)
              </label>
              <Input
                id="edit-variant-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                {...register("price", { required: "Price is required" })}
              />
              {errors.price && (
                <p className="text-xs text-rose-500">{errors.price.message as string}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-variant-stock" className="text-xs font-medium text-slate-700">
                Stock units
              </label>
              <Input
                id="edit-variant-stock"
                type="number"
                min={0}
                placeholder="0"
                className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                {...register("stock", { required: "Stock is required" })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-variant-sku" className="text-xs font-medium text-slate-700">
              SKU <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <Input
              id="edit-variant-sku"
              placeholder="e.g. SONY-L-BLU"
              className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
              {...register("sku")}
            />
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 px-3 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateVariantMutation.isPending}
              className="h-8 px-4 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg cursor-pointer"
            >
              {updateVariantMutation.isPending && (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
