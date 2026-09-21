import { useEffect, useState } from "react";
import {
  ImagePlus,
  Loader2,
  Pencil,
  Upload,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { useUpdateShopProfile,useShopImageUpload } from "@/features/shop/shop.hooks";
import type {
  Shop,
  UpdateShopProfilePayload,
} from "@/features/shop/shop.types";

interface ShopProfileEditDialogProps {
  shop: Shop;
}

export const ShopProfileEditDialog = ({
  shop,
}: ShopProfileEditDialogProps) => {
  const updateProfile = useUpdateShopProfile();

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<UpdateShopProfilePayload>({
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: "",
    website: "",
  });
  const uploadImage = useShopImageUpload();

  // Populate form from the real API shop data
  useEffect(() => {
    if (!shop) return;

    setForm({
      name: shop.profile?.name ?? "",
      description: shop.profile?.description ?? "",
      phone: shop.profile?.phone ?? "",
      email: shop.profile?.email ?? "",
      address: shop.profile?.address ?? "",
      city: shop.profile?.city ?? "",
      country: shop.profile?.country ?? "",
      website: shop.profile?.website ?? "",
    });
  }, [shop]);

  const handleChange = (
    field: keyof UpdateShopProfilePayload,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  const payload = Object.fromEntries(
    Object.entries(form).filter(
      ([_, value]) => value !== undefined && value !== null && value.trim() !== ""
    )
  );

  updateProfile.mutate(
    {
      shopId: shop.id,
      payload,
    },
    {
      onSuccess: () => {
        setOpen(false);
      },
    }
  );
};

 const handleLogoUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  try {
    const url = await uploadImage.mutateAsync({
      file,
      shopId: shop.id,
      resourceType: "shop_logo",
    });

    setForm((prev) => ({
      ...prev,
      logo: url,
    }));
  } catch (error) {
    console.error("Logo upload failed:", error);
  }
};  
const handleBannerUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  try {
    const url = await uploadImage.mutateAsync({
      file,
      shopId: shop.id,
      resourceType: "shop_banner",
    });

    setForm((prev) => ({
      ...prev,
      banner: url,
    }));
  } catch (error) {
    console.error("Banner upload failed:", error);
  }
};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>

      {/* Dialog */}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Shop Profile</DialogTitle>

          <DialogDescription>
            Update your shop information. These changes will be
            reflected across your storefront.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 pt-2"
        >
          {/* BASIC INFORMATION */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Basic Information
              </h3>

              <p className="text-xs text-muted-foreground">
                Information customers see about your shop.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shop-name">
                Shop Name
              </Label>

              <Input
                id="shop-name"
                value={form.name ?? ""}
                onChange={(e) =>
                  handleChange("name", e.target.value)
                }
                placeholder="Enter shop name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shop-description">
                Description
              </Label>

              <Textarea
                id="shop-description"
                value={form.description ?? ""}
                onChange={(e) =>
                  handleChange(
                    "description",
                    e.target.value
                  )
                }
                placeholder="Tell customers about your shop..."
                rows={4}
              />
            </div>
          </section>

          <Separator />

          {/* CONTACT */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Contact Information
              </h3>

              <p className="text-xs text-muted-foreground">
                How customers can contact your shop.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shop-phone">
                  Phone
                </Label>

                <Input
                  id="shop-phone"
                  value={form.phone ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "phone",
                      e.target.value
                    )
                  }
                  placeholder="+251..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop-email">
                  Email
                </Label>

                <Input
                  id="shop-email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "email",
                      e.target.value
                    )
                  }
                  placeholder="shop@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shop-website">
                Website
              </Label>

              <Input
                id="shop-website"
                value={form.website ?? ""}
                onChange={(e) =>
                  handleChange(
                    "website",
                    e.target.value
                  )
                }
                placeholder="https://example.com"
              />
            </div>
          </section>

          <Separator />

          {/* LOCATION */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Location
              </h3>

              <p className="text-xs text-muted-foreground">
                Where your shop is located.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shop-address">
                Address
              </Label>

              <Input
                id="shop-address"
                value={form.address ?? ""}
                onChange={(e) =>
                  handleChange(
                    "address",
                    e.target.value
                  )
                }
                placeholder="Street address"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shop-city">
                  City
                </Label>

                <Input
                  id="shop-city"
                  value={form.city ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "city",
                      e.target.value
                    )
                  }
                  placeholder="Addis Ababa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop-country">
                  Country
                </Label>

                <Input
                  id="shop-country"
                  value={form.country ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "country",
                      e.target.value
                    )
                  }
                  placeholder="Ethiopia"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* MEDIA */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Shop Media
              </h3>

              <p className="text-xs text-muted-foreground">
                Manage your shop logo and banner.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* LOGO */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" />

                  <span className="text-sm font-medium">
                    Shop Logo
                  </span>
                </div>

                {shop.profile?.logo ? (
                  <img
                    src={shop.profile.logo}
                    alt="Shop logo"
                    className="h-20 w-20 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full border border-dashed flex items-center justify-center text-muted-foreground">
                    <Upload className="h-5 w-5" />
                  </div>
                )}

                {/* Upload endpoint will be connected separately */}
               <input
  id="shop-logo"
  type="file"
  accept="image/jpeg,image/png,image/webp"
  className="hidden"
  onChange={handleLogoUpload}
/>

<Button
  type="button"
  variant="outline"
  size="sm"
  className="w-full"
  disabled={uploadImage.isPending}
  onClick={() =>
    document.getElementById("shop-logo")?.click()
  }
>
  {uploadImage.isPending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Uploading...
    </>
  ) : (
    <>
      <Upload className="mr-2 h-4 w-4" />
      Upload Logo
    </>
  )}
</Button>
              </div>

              {/* BANNER */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" />

                  <span className="text-sm font-medium">
                    Shop Banner
                  </span>
                </div>

                {shop.profile?.banner ? (
                  <img
                    src={shop.profile.banner}
                    alt="Shop banner"
                    className="h-20 w-full rounded-xl object-cover border"
                  />
                ) : (
                  <div className="h-20 w-full rounded-xl border border-dashed flex items-center justify-center text-muted-foreground">
                    <Upload className="h-5 w-5" />
                  </div>
                )}

                {/* Upload endpoint will be connected separately */}
              <input
  id="shop-banner"
  type="file"
  accept="image/jpeg,image/png,image/webp"
  className="hidden"
  onChange={handleBannerUpload}
/>

<Button
  type="button"
  variant="outline"
  size="sm"
  className="w-full"
  disabled={uploadImage.isPending}
  onClick={() =>
    document.getElementById("shop-banner")?.click()
  }
>
  {uploadImage.isPending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Uploading...
    </>
  ) : (
    <>
      <Upload className="mr-2 h-4 w-4" />
      Upload Banner
    </>
  )}
</Button>
              </div>
            </div>
          </section>

          {/* ACTIONS */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateProfile.isPending}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {updateProfile.isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};