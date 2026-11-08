import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { createVariantSchema, type CreateVariantFormValues } from "@/features/product/product.schema";
import { useCreateVariant } from "@/features/product/product.hooks";
import { type ProductVariant } from "@/features/product/product.types";

interface AddVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  productId: string;
  variant?: ProductVariant | null;
}

export const AddVariantDialog = ({
  open,
  onOpenChange,
  shopId,
  productId,
  variant,
}: AddVariantDialogProps) => {
  const isEditing = Boolean(variant);
  const createVariant = useCreateVariant(shopId, productId);

  const form = useForm<CreateVariantFormValues>({
    resolver: zodResolver(createVariantSchema),
    defaultValues: {
      name: "",
      price: "",
      stock: 0,
      sku: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    if (variant) {
      form.reset({
        name: variant.name,
        price: String(variant.price),
        stock: variant.stock,
        sku: variant.sku ?? "",
      });
    } else {
      form.reset({
        name: "",
        price: "",
        stock: 0,
        sku: "",
      });
    }
  }, [open, variant, form]);

  const onSubmit = async (values: CreateVariantFormValues) => {
    try {
      await createVariant.mutateAsync({
        name: values.name.trim(),
        price: values.price,
        stock: values.stock,
        ...(values.sku?.trim() ? { sku: values.sku.trim() } : {}),
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create variant:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (createVariant.isPending) return;
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-[460px] p-5 rounded-lg border border-slate-200 bg-white shadow-xl">
        <DialogHeader className="space-y-1 pb-2 border-b border-slate-100">
          <DialogTitle className="text-base font-semibold text-slate-900">
            {isEditing ? "Edit variant" : "Add variant"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {isEditing
              ? "Update variant options, pricing, and stock."
              : "Add an option such as size, color, or material."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-3">
            {/* Variant Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-medium text-slate-700">
                    Variant name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Large / Navy Blue"
                      className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            {/* Price & Stock */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-slate-700">
                      Price ($)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-slate-700">
                      Stock units
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-500" />
                  </FormItem>
                )}
              />
            </div>

            {/* SKU */}
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-medium text-slate-700">
                    SKU <span className="text-slate-400 font-normal">(Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. SONY-L-BLU"
                      className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={createVariant.isPending}
                onClick={() => onOpenChange(false)}
                className="h-8 px-3 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createVariant.isPending}
                className="h-8 px-4 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg cursor-pointer"
              >
                {createVariant.isPending && (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                )}
                {isEditing ? "Save changes" : "Add variant"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
