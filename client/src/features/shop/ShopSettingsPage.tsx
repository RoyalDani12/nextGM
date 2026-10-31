import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Store,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Loader2,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  ArrowLeft,
  Save,
  BadgeCheck,
  ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useMyShops,
  useUpdateShopProfile,
  useUpdateShopLegalInfo,
  useShopImageUpload,
  usePublishReadiness,
  usePublishShop,
} from "./shop.hooks";
import { ShopStatusToggle } from "./components/ShopStatusToggle";
import { CloseShopDialog } from "./components/CloseShopDialog";
import type { UpdateShopProfilePayload, UpdateShopLegalInfoPayload } from "./shop.types";

export function ShopSettingsPage() {
  const { shopId = "" } = useParams<{ shopId: string }>();
  const { data: shopsData, isLoading: isShopsLoading } = useMyShops();
  const shop = shopsData?.data?.find((s) => s.id === shopId);

  const updateProfile = useUpdateShopProfile();
  const updateLegalInfo = useUpdateShopLegalInfo();
  const uploadImage = useShopImageUpload();
  const readiness = usePublishReadiness(shopId);
  const publishShop = usePublishShop(shopId);

  // Profile Form State
  const [profileForm, setProfileForm] = useState<UpdateShopProfilePayload>({
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: "",
    website: "",
    logo: "",
    banner: "",
    shippingPolicy: "",
    returnsPolicy: "",
  });

  // Legal Info Form State
  const [legalForm, setLegalForm] = useState<UpdateShopLegalInfoPayload>({
    legalBusinessName: "",
    taxId: "",
    entityType: "LLC",
  });

  const [activeTab, setActiveTab] = useState<"general" | "contact" | "legal" | "readiness" | "danger">("general");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);
  const [legalSuccessMsg, setLegalSuccessMsg] = useState(false);

  useEffect(() => {
    if (shop) {
      setProfileForm({
        name: shop.profile?.name ?? "",
        description: shop.profile?.description ?? "",
        phone: shop.profile?.phone ?? "",
        email: shop.profile?.email ?? "",
        address: shop.profile?.address ?? "",
        city: shop.profile?.city ?? "",
        country: shop.profile?.country ?? "",
        website: shop.profile?.website ?? "",
        logo: shop.profile?.logo ?? "",
        banner: shop.profile?.banner ?? "",
        shippingPolicy: shop.profile?.shippingPolicy ?? "",
        returnsPolicy: shop.profile?.returnsPolicy ?? "",
      });

      if (shop.legalInfo) {
        setLegalForm({
          legalBusinessName: shop.legalInfo.legalBusinessName || "",
          taxId: shop.legalInfo.taxId || "",
          entityType: shop.legalInfo.entityType || "LLC",
        });
      }
    }
  }, [shop]);

  if (isShopsLoading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="size-8 animate-spin text-orange-500" />
          <p className="text-sm font-semibold">Loading shop settings...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto mt-16 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Store className="size-12 mx-auto text-slate-400" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">Shop Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">
          We couldn't locate this store workspace. It may have been closed or moved.
        </p>
        <Link
          to="/shops"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
        >
          Return to My Shops
        </Link>
      </div>
    );
  }

  // Handle Logo & Banner upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage.mutateAsync({
        file,
        shopId: shop.id,
        resourceType: "shop_logo",
      });
      setProfileForm((prev) => ({ ...prev, logo: url }));
      // Auto-save logo
      updateProfile.mutate({
        shopId: shop.id,
        payload: { logo: url },
      });
    } catch (err) {
      console.error("Logo upload failed:", err);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage.mutateAsync({
        file,
        shopId: shop.id,
        resourceType: "shop_banner",
      });
      setProfileForm((prev) => ({ ...prev, banner: url }));
      // Auto-save banner
      updateProfile.mutate({
        shopId: shop.id,
        payload: { banner: url },
      });
    } catch (err) {
      console.error("Banner upload failed:", err);
    }
  };

  // Submit Profile Form
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(false);

    const payload = Object.fromEntries(
      Object.entries(profileForm).filter(
        ([_, val]) => val !== undefined && val !== null && String(val).trim() !== ""
      )
    );

    updateProfile.mutate(
      { shopId: shop.id, payload },
      {
        onSuccess: () => {
          setProfileSuccessMsg(true);
          setTimeout(() => setProfileSuccessMsg(false), 4000);
        },
      }
    );
  };

  // Submit Legal Info Form
  const handleLegalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLegalSuccessMsg(false);

    updateLegalInfo.mutate(
      { shopId: shop.id, payload: legalForm },
      {
        onSuccess: () => {
          setLegalSuccessMsg(true);
          setTimeout(() => setLegalSuccessMsg(false), 4000);
        },
      }
    );
  };

  const checks = readiness.data?.checks;
  const isPassed = readiness.data?.passed ?? false;
  const canPublish = isPassed && shop.status === "PENDING";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 md:px-8">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            to={`/dashboard/shop/${shop.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Store Settings
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                shop.status === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-800"
                  : shop.status === "PENDING"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {shop.status}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Manage your store branding, public contact info, legal business compliance, and lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-1.5 text-xs font-bold"
            onClick={() => window.open(`/${shop.slug}`, "_blank")}
          >
            <ExternalLink className="size-3.5" /> View Public Storefront
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { key: "general", label: "Branding & Profile", icon: Store },
          { key: "contact", label: "Contact & Location", icon: MapPin },
          { key: "legal", label: "Legal & Compliance", icon: ShieldCheck },
          { key: "readiness", label: "Publishing Readiness", icon: BadgeCheck },
          { key: "danger", label: "Status & Danger Zone", icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/20"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General Branding & Profile */}
      {activeTab === "general" && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Brand Identity</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your storefront logo and banner seen by marketplace customers.
              </p>
            </div>

            {/* Banner Section */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Store Banner</Label>
              <div className="relative h-44 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center group hover:border-orange-300 transition-colors">
                {profileForm.banner ? (
                  <img
                    src={profileForm.banner}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <ImageIcon className="size-8 stroke-1 text-slate-300" />
                    <span className="text-xs font-medium">Recommended: 1200 x 300px JPG or PNG</span>
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-md flex items-center gap-2">
                    {uploadImage.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    <span>Change Banner</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                    disabled={uploadImage.isPending}
                  />
                </label>
              </div>
            </div>

            {/* Logo Section */}
            <div className="flex items-center gap-5">
              <div className="relative size-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center group shrink-0">
                {profileForm.logo ? (
                  <img
                    src={profileForm.logo}
                    alt="Logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Store className="size-7 text-slate-300" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="size-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadImage.isPending}
                  />
                </label>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900">Store Logo / Icon</p>
                <p className="text-xs text-slate-500">
                  Click the avatar to upload a square logo (at least 256x256px).
                </p>
                {uploadImage.isPending && (
                  <p className="text-[11px] text-orange-600 font-semibold animate-pulse">
                    Uploading image to Cloudinary...
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 pt-2">
              <div className="space-y-2">
                <Label htmlFor="shopName" className="text-xs font-bold text-slate-700">
                  Store Public Name *
                </Label>
                <Input
                  id="shopName"
                  value={profileForm.name || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="e.g. Acme Studio"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopSlug" className="text-xs font-bold text-slate-700">
                  Store Slug (Read-only)
                </Label>
                <Input
                  id="shopSlug"
                  value={shop.slug}
                  disabled
                  className="rounded-xl bg-slate-50 font-mono text-xs text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopDescription" className="text-xs font-bold text-slate-700">
                Store Description *
              </Label>
              <Textarea
                id="shopDescription"
                rows={3}
                value={profileForm.description || ""}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                placeholder="Describe your brand, craftsmanship, and products..."
                className="rounded-xl text-sm"
              />
              <p className="text-[11px] text-slate-400">
                A good description helps customers find your store in search results and is required for store publishing.
              </p>
            </div>

            {profileSuccessMsg && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-2.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                Store profile settings saved successfully!
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="rounded-full bg-slate-900 px-6 font-bold text-white hover:bg-slate-800 gap-2"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save Branding & Profile
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Contact & Location */}
      {activeTab === "contact" && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Customer Support & Location</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide public contact channels and physical address for order receipts and dispatch.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="text-xs font-bold text-slate-700">
                  Support Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="contactEmail"
                    type="email"
                    value={profileForm.email || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="support@brand.com"
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-xs font-bold text-slate-700">
                  Contact Phone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={profileForm.phone || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+1234567890"
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contactAddress" className="text-xs font-bold text-slate-700">
                  Street Address *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="contactAddress"
                    value={profileForm.address || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="123 Commerce Blvd, Suite 400"
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactCity" className="text-xs font-bold text-slate-700">
                  City *
                </Label>
                <Input
                  id="contactCity"
                  value={profileForm.city || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  placeholder="New York"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactCountry" className="text-xs font-bold text-slate-700">
                  Country *
                </Label>
                <Input
                  id="contactCountry"
                  value={profileForm.country || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                  placeholder="United States"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contactWebsite" className="text-xs font-bold text-slate-700">
                  Official Website (Optional)
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="contactWebsite"
                    type="url"
                    value={profileForm.website || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    placeholder="https://acmestudio.com"
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="shippingPolicy" className="text-xs font-bold text-slate-700">Shipping policy</Label>
                <Textarea id="shippingPolicy" rows={3} value={profileForm.shippingPolicy || ""} onChange={(e) => setProfileForm({ ...profileForm, shippingPolicy: e.target.value })} placeholder="Dispatch times, delivery regions, and pickup instructions…" className="rounded-xl text-sm" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="returnsPolicy" className="text-xs font-bold text-slate-700">Returns & refunds policy</Label>
                <Textarea id="returnsPolicy" rows={3} value={profileForm.returnsPolicy || ""} onChange={(e) => setProfileForm({ ...profileForm, returnsPolicy: e.target.value })} placeholder="Return window, condition requirements, and refund handling…" className="rounded-xl text-sm" />
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-2.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                Contact and location information updated successfully!
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="rounded-full bg-slate-900 px-6 font-bold text-white hover:bg-slate-800 gap-2"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save Contact Details
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Legal & Compliance */}
      {activeTab === "legal" && (
        <form onSubmit={handleLegalSubmit} className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Legal Business Information</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Required by platform financial regulations and store publishing readiness check.
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <ShieldCheck className="size-5" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="legalName" className="text-xs font-bold text-slate-700">
                  Registered Legal Business Name *
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="legalName"
                    value={legalForm.legalBusinessName}
                    onChange={(e) =>
                      setLegalForm({ ...legalForm, legalBusinessName: e.target.value })
                    }
                    placeholder="Acme International LLC"
                    className="pl-10 rounded-xl"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Must match your company registration or official tax filing name.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId" className="text-xs font-bold text-slate-700">
                  Tax Identification Number (EIN / VAT / SSN) *
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="taxId"
                    value={legalForm.taxId}
                    onChange={(e) => setLegalForm({ ...legalForm, taxId: e.target.value })}
                    placeholder="XX-XXXXXXX"
                    className="pl-10 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entityType" className="text-xs font-bold text-slate-700">
                  Business Entity Type *
                </Label>
                <select
                  id="entityType"
                  value={legalForm.entityType}
                  onChange={(e) => setLegalForm({ ...legalForm, entityType: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="LLC">Limited Liability Company (LLC)</option>
                  <option value="Corporation">Corporation (Inc / Corp)</option>
                  <option value="Sole Proprietorship">Sole Proprietorship / Individual</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Non-Profit">Non-Profit Organization</option>
                </select>
              </div>
            </div>

            {legalSuccessMsg && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-2.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                Legal information saved and verified with compliance!
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={updateLegalInfo.isPending}
                className="rounded-full bg-slate-900 px-6 font-bold text-white hover:bg-slate-800 gap-2"
              >
                {updateLegalInfo.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save Legal Information
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 4: Publishing Readiness */}
      {activeTab === "readiness" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Publishing Readiness Verification</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  All 8 requirements below are checked by the backend before your store can go live.
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  isPassed
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {isPassed ? (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-600" /> Ready to Publish
                  </>
                ) : (
                  <>
                    <CircleDashed className="size-4 text-amber-600 animate-spin" /> Incomplete Setup
                  </>
                )}
              </span>
            </div>

            {checks ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    key: "hasProfile",
                    title: "Store Profile Exists",
                    ok: checks.hasProfile,
                  },
                  {
                    key: "hasName",
                    title: "Public Store Name",
                    ok: checks.hasName,
                  },
                  {
                    key: "hasDescription",
                    title: "Store Description",
                    ok: checks.hasDescription,
                  },
                  {
                    key: "hasLogo",
                    title: "Storefront Logo Uploaded",
                    ok: checks.hasLogo,
                  },
                  {
                    key: "hasContactInfo",
                    title: "Support Contact (Email/Phone)",
                    ok: checks.hasContactInfo,
                  },
                  {
                    key: "hasAddress",
                    title: "Physical Location (Address, City, Country)",
                    ok: checks.hasAddress,
                  },
                  {
                    key: "hasLegalInfo",
                    title: "Legal & Tax Details (EIN/Name)",
                    ok: checks.hasLegalInfo,
                  },
                  {
                    key: "hasAtLeastOneActiveProduct",
                    title: "At Least 1 Active Product",
                    ok: checks.hasAtLeastOneActiveProduct,
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <span className="text-xs font-bold text-slate-800">{item.title}</span>
                    {item.ok ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle2 className="size-4" /> Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                        <CircleDashed className="size-4" /> Missing
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Checking readiness status...
              </div>
            )}

            {canPublish && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">Your store is 100% ready!</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Click the button to publish and make your catalog visible across the entire marketplace.
                  </p>
                </div>
                <Button
                  onClick={() => publishShop.mutate()}
                  disabled={publishShop.isPending}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-sm shadow-emerald-600/20"
                >
                  {publishShop.isPending ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="size-4 mr-2" />
                  )}
                  Publish Store Now
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Status & Danger Zone */}
      {activeTab === "danger" && (
        <div className="space-y-6">
          {/* Pause / Resume store */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Store Status Control</h2>
            <p className="text-xs text-slate-500">
              Temporarily pause operations during inventory replenishment or vacations. Paused stores cannot receive new orders.
            </p>
            <div className="pt-2">
              <ShopStatusToggle shopId={shop.id} status={shop.status} />
            </div>
          </div>

          {/* Close Store Danger Zone */}
          <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-6 md:p-8 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-rose-950">Danger Zone: Close Storefront</h3>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Permanently deactivates this store, archives all listed products, and halts payouts. This action cannot be reversed.
                </p>
              </div>
            </div>

            <div className="pt-3">
              <CloseShopDialog shop={shop} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
