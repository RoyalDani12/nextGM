import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

import  { createVariantSchema, type CreateVariantFormValues } from "@/features/product/product.schema";
  // createVariantSchema,
  // type CreateVariantFormValues,
// } from "@/schemas/product.schema";

// import { useCreateVariant } from "@/hooks/useProductVariants";
import { useCreateVariant } from "@/features/product/product.hooks";

// import type { ProductVariant } from "@/types/product.types";
import  { type ProductVariant } from "@/features/product/product.types";

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

  const createVariant = useCreateVariant(
    shopId,
    productId
  );

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

  const onSubmit = async (
    values: CreateVariantFormValues
  ) => {
    try {
      await createVariant.mutateAsync({
        name: values.name.trim(),
        price: values.price,
        stock: values.stock,
        ...(values.sku?.trim()
          ? { sku: values.sku.trim() }
          : {}),
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Edit Variant"
              : "Add Product Variant"}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? "Update the variant information."
              : "Add a variant such as size, color, or another product option."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >
            {/* Variant Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Name</FormLabel>

                  <FormControl>
                    <Input
                      placeholder="e.g. Large / Black"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>

                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 349.99"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Stock */}
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>

                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(event) => {
                        field.onChange(
                          Number(event.target.value)
                        );
                      }}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SKU */}
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    SKU
                    <span className="ml-1 text-muted-foreground">
                      (optional)
                    </span>
                  </FormLabel>

                  <FormControl>
                    <Input
                      placeholder="e.g. SONY-BLK-L"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={createVariant.isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={createVariant.isPending}
              >
                {createVariant.isPending
                  ? "Adding..."
                  : "Add Variant"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};