import { useState, useEffect, useRef } from "react";
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
  UserCheck,
  Camera,
  Eye,
    AlertCircle,
  X,
  Lock,
  Sparkles,
  RefreshCw,
  Clock,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

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
  const { data: shopsData, isLoading: isShopsLoading, refetch: refetchShops } = useMyShops();
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

  // KYC Form State
  const [kycForm, setKycForm] = useState({
    ownerIdType: "NATIONAL_ID",
    ownerIdNumber: "",
    ownerIdCardFront: "",
    ownerIdCardBack: "",
  });

  const [activeTab, setActiveTab] = useState<"general" | "contact" | "legal" | "kyc" | "readiness" | "danger">("general");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);
  const [legalSuccessMsg, setLegalSuccessMsg] = useState(false);

  // Uploading state for KYC cards
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [previewZoomUrl, setPreviewZoomUrl] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

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

        setKycForm({
          ownerIdType: shop.legalInfo.ownerIdType || "NATIONAL_ID",
          ownerIdNumber: shop.legalInfo.ownerIdNumber || "",
          ownerIdCardFront: shop.legalInfo.ownerIdCardFront || "",
          ownerIdCardBack: shop.legalInfo.ownerIdCardBack || "",
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
      updateProfile.mutate({
        shopId: shop.id,
        payload: { logo: url },
      });
      toast.success("Logo updated successfully!");
    } catch (err: any) {
      toast.error("Logo upload failed: " + (err?.message || "Please try again."));
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
      updateProfile.mutate({
        shopId: shop.id,
        payload: { banner: url },
      });
      toast.success("Store banner updated!");
    } catch (err: any) {
      toast.error("Banner upload failed: " + (err?.message || "Please try again."));
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
          toast.success("Store settings saved!");
          setTimeout(() => setProfileSuccessMsg(false), 4000);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to update profile.");
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
          toast.success("Legal business information saved!");
          setTimeout(() => setLegalSuccessMsg(false), 4000);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to save legal details.");
        },
      }
    );
  };

  // Upload KYC ID Card (Front or Back)
  const handleKycCardUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (side === "front") setIsUploadingFront(true);
      else setIsUploadingBack(true);

      const url = await uploadImage.mutateAsync({
        file,
        shopId: shop.id,
        resourceType: "kyc_document",
      });

      setKycForm((prev) => ({
        ...prev,
        [side === "front" ? "ownerIdCardFront" : "ownerIdCardBack"]: url,
      }));

      toast.success(`${side === "front" ? "Front" : "Back"} ID scan uploaded!`);
    } catch (err: any) {
      toast.error(`Upload failed: ${err?.message || "Unable to upload document scan."}`);
    } finally {
      if (side === "front") setIsUploadingFront(false);
      else setIsUploadingBack(false);
      e.target.value = "";
    }
  };

  // Submit KYC Verification Request to Admin
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycForm.ownerIdNumber.trim()) {
      toast.error("Please enter your Government ID / Document Number.");
      return;
    }
    if (!kycForm.ownerIdCardFront) {
      toast.error("Please upload the FRONT side scan of your ID card.");
      return;
    }
    if (kycForm.ownerIdType !== "PASSPORT" && !kycForm.ownerIdCardBack) {
      toast.error("Please upload the BACK side scan of your ID card.");
      return;
    }

    try {
      await updateLegalInfo.mutateAsync({
        shopId: shop.id,
        payload: {
          ...legalForm,
          ownerIdType: kycForm.ownerIdType,
          ownerIdNumber: kycForm.ownerIdNumber,
          ownerIdCardFront: kycForm.ownerIdCardFront,
          ownerIdCardBack: kycForm.ownerIdCardBack,
          submitForVerification: true,
        },
      });
      toast.success("KYC Verification submitted! Admin will review your documents.");
      refetchShops();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit KYC verification.");
    }
  };

  const kycStatus = shop.legalInfo?.ownerKycStatus || "UNVERIFIED";
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Store Settings & Compliance</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                shop.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : shop.status === "PAUSED"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {shop.status}
            </span>
            {kycStatus === "VERIFIED" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                <ShieldCheck className="size-3 text-emerald-600" />
                Verified Merchant
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Manage your store branding, public contact info, KYC identity verification, and lifecycle.
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
          { key: "legal", label: "Legal Business", icon: Building2 },
          {
            key: "kyc",
            label: "Identity & KYC",
            icon: ShieldCheck,
            badge:
              kycStatus === "VERIFIED"
                ? "Verified"
                : kycStatus === "PENDING"
                ? "In Review"
                : kycStatus === "REJECTED"
                ? "Rejected"
                : "Required",
            badgeColor:
              kycStatus === "VERIFIED"
                ? "bg-emerald-100 text-emerald-800"
                : kycStatus === "PENDING"
                ? "bg-amber-100 text-amber-800 animate-pulse"
                : kycStatus === "REJECTED"
                ? "bg-rose-100 text-rose-800 font-bold"
                : "bg-orange-100 text-orange-800",
          },
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
              {tab.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
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
                    Change Store Banner
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
            <div className="flex items-center gap-6 pt-2">
              <div className="relative size-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center group hover:border-orange-300 transition-colors shrink-0">
                {profileForm.logo ? (
                  <img
                    src={profileForm.logo}
                    alt="Logo preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <Store className="size-8 stroke-1 text-slate-300" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="size-5 text-white" />
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
                <Label className="text-xs font-bold text-slate-700">Store Logo Avatar</Label>
                <p className="text-xs text-slate-500">
                  Recommended: 400 x 400px square image. Click the box to browse and upload.
                </p>
              </div>
            </div>

            {/* Store Name & Description */}
            <div className="grid gap-5 sm:grid-cols-2 pt-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="storeName" className="text-xs font-bold text-slate-700">
                  Store Public Name *
                </Label>
                <Input
                  id="storeName"
                  value={profileForm.name || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="e.g. Nexus Premium Outfitter"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="storeDescription" className="text-xs font-bold text-slate-700">
                  Store Bio / Description
                </Label>
                <Textarea
                  id="storeDescription"
                  rows={4}
                  value={profileForm.description || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  placeholder="Tell buyers what makes your brand, products, and craftsmanship special…"
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-2.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                Store branding information updated successfully!
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="rounded-full bg-slate-900 px-6 font-bold text-white hover:bg-slate-800 gap-2 cursor-pointer"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save Brand Profile
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
              <h2 className="text-lg font-bold text-slate-900">Contact & Fulfillment Location</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Public support contact details and business dispatch origin for delivery calculations.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="text-xs font-bold text-slate-700">
                  Customer Support Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="contactEmail"
                    type="email"
                    value={profileForm.email || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="support@yourbrand.com"
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
                className="rounded-full bg-slate-900 px-6 font-bold text-white hover:bg-slate-800 gap-2 cursor-pointer"
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

      {/* Tab 3: Legal Business Info */}
      {activeTab === "legal" && (
        <form onSubmit={handleLegalSubmit} className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Legal Business Registration</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Corporate entity and tax registration details for commercial compliance.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="size-3.5 text-slate-500" />
                {legalForm.entityType || "Business Entity"}
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="legalBusinessName" className="text-xs font-bold text-slate-700">
                  Registered Legal Business Name *
                </Label>
                <Input
                  id="legalBusinessName"
                  value={legalForm.legalBusinessName}
                  onChange={(e) => setLegalForm({ ...legalForm, legalBusinessName: e.target.value })}
                  placeholder="e.g. Apex Global Retail Enterprises LLC"
                  className="rounded-xl"
                  required
                />
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
                className="rounded-full bg-slate-900 px-6 font-bold text-white hover:bg-slate-800 gap-2 cursor-pointer"
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

      {/* Tab 4: Identity & KYC Verification */}
      {activeTab === "kyc" && (
        <form onSubmit={handleKycSubmit} className="space-y-6">
          {/* KYC STATUS HERO BANNER */}
          {kycStatus === "VERIFIED" && (
            <div className="rounded-3xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50 to-teal-50/50 p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-emerald-950">Identity Verified & Merchant Approved</h2>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200">
                        VERIFIED
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800/80 mt-1 max-w-xl">
                      Your government-issued identification was reviewed and approved by the platform compliance officers. Your storefront proudly carries the official Verified Merchant badge.
                    </p>
                    {shop.legalInfo?.ownerKycVerifiedAt && (
                      <p className="text-[11px] text-emerald-700/70 mt-1.5 flex items-center gap-1">
                        <Clock className="size-3" /> Verified on{" "}
                        {new Date(shop.legalInfo.ownerKycVerifiedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
                    <Sparkles className="size-3.5 text-emerald-500" />
                    Full Payout Authority Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {kycStatus === "PENDING" && (
            <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50/50 p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                    <RefreshCw className="size-6 animate-spin" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-amber-950">KYC Verification Under Review</h2>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-200 animate-pulse">
                        PENDING AUDIT
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/80 mt-1 max-w-xl">
                      Your government ID scans (Front & Back) have been submitted to the platform Super Admin compliance review queue. You can review your scans below or update them if needed.
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-amber-800 border border-amber-200 shadow-2xs">
                    <Clock className="size-3.5 text-amber-600" />
                    Review typically completes in 24 hrs
                  </span>
                </div>
              </div>
            </div>
          )}

          {kycStatus === "REJECTED" && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 sm:p-7 shadow-xs space-y-3">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                  <AlertCircle className="size-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-rose-950">KYC Verification Needs Correction</h2>
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-800 border border-rose-200">
                      REJECTED
                    </span>
                  </div>
                  <p className="text-xs text-rose-900/80 leading-relaxed">
                    The platform compliance team reviewed your submission and requested adjustments. Please see the compliance notes below and re-upload clear photos of your ID.
                  </p>
                </div>
              </div>

              {shop.legalInfo?.ownerKycNotes && (
                <div className="rounded-2xl border border-rose-200 bg-white p-4 text-xs text-rose-900 space-y-1">
                  <span className="font-extrabold uppercase tracking-wider text-[10px] text-rose-700">
                    Compliance Officer Feedback:
                  </span>
                  <p className="font-medium">{shop.legalInfo.ownerKycNotes}</p>
                </div>
              )}
            </div>
          )}

          {kycStatus === "UNVERIFIED" && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                  <UserCheck className="size-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Merchant Identity Verification (KYC)</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    To comply with international merchant payment regulations, prevent impersonation, and unlock the <strong className="text-slate-800">Verified Seller</strong> badge on your marketplace store, please upload scans of your official government-issued ID card.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* MAIN KYC FORM */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs space-y-7">
            <div>
              <h3 className="text-base font-bold text-slate-900">Government Identity Information</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ensure details match the name and information on your legal photo ID card.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="idType" className="text-xs font-bold text-slate-700">
                  ID Document Type *
                </Label>
                <select
                  id="idType"
                  value={kycForm.ownerIdType}
                  onChange={(e) => setKycForm({ ...kycForm, ownerIdType: e.target.value })}
                  disabled={kycStatus === "VERIFIED"}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="NATIONAL_ID">National Identity Card (Government Issued)</option>
                  <option value="PASSPORT">International Passport</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                  <option value="RESIDENCE_PERMIT">Residence Permit / Alien ID</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber" className="text-xs font-bold text-slate-700">
                  Document / ID Card Number *
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="idNumber"
                    value={kycForm.ownerIdNumber}
                    onChange={(e) => setKycForm({ ...kycForm, ownerIdNumber: e.target.value })}
                    placeholder="e.g. A923849102"
                    disabled={kycStatus === "VERIFIED"}
                    className="pl-10 rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>

            {/* DUAL CARD UPLOAD & SCAN SECTION */}
            <div className="space-y-3 pt-2">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Photo Identification Uploads (Front & Back)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import high-resolution image scans or capture photo with your device camera. Accepted formats: JPG, PNG, WEBP.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. FRONT SIDE ID CARD */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="size-4 text-orange-500" /> Front Side of ID Card *
                    </span>
                    {kycForm.ownerIdCardFront && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="size-3" /> Scan Ready
                      </span>
                    )}
                  </div>

                  <div className="relative h-44 rounded-xl border-2 border-dashed border-slate-200 bg-white overflow-hidden flex items-center justify-center group hover:border-orange-400 transition-colors">
                    {kycForm.ownerIdCardFront ? (
                      <div className="relative size-full">
                        <img
                          src={kycForm.ownerIdCardFront}
                          alt="ID Front Scan"
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewZoomUrl(kycForm.ownerIdCardFront)}
                            className="p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="size-3.5" /> Enlarge
                          </button>
                          {kycStatus !== "VERIFIED" && (
                            <button
                              type="button"
                              onClick={() => frontInputRef.current?.click()}
                              className="p-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="size-3.5" /> Replace
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => frontInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 text-slate-400 cursor-pointer size-full p-4"
                      >
                        {isUploadingFront ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="size-8 animate-spin text-orange-500" />
                            <span className="text-xs font-bold text-slate-600">Uploading front scan...</span>
                          </div>
                        ) : (
                          <>
                            <div className="size-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                              <Upload className="size-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 text-center">
                              Click to Import or Scan Front ID
                            </span>
                            <span className="text-[10px] text-slate-400 text-center">
                              Clear color photo showing full name, photo, and ID number
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    <input
                      ref={frontInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleKycCardUpload(e, "front")}
                      className="hidden"
                      disabled={isUploadingFront || kycStatus === "VERIFIED"}
                    />
                  </div>
                </div>

                {/* 2. BACK SIDE ID CARD */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="size-4 text-orange-500" /> Back Side of ID Card
                      {kycForm.ownerIdType === "PASSPORT" ? " (Optional for Passport)" : " *"}
                    </span>
                    {kycForm.ownerIdCardBack && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="size-3" /> Scan Ready
                      </span>
                    )}
                  </div>

                  <div className="relative h-44 rounded-xl border-2 border-dashed border-slate-200 bg-white overflow-hidden flex items-center justify-center group hover:border-orange-400 transition-colors">
                    {kycForm.ownerIdCardBack ? (
                      <div className="relative size-full">
                        <img
                          src={kycForm.ownerIdCardBack}
                          alt="ID Back Scan"
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewZoomUrl(kycForm.ownerIdCardBack)}
                            className="p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="size-3.5" /> Enlarge
                          </button>
                          {kycStatus !== "VERIFIED" && (
                            <button
                              type="button"
                              onClick={() => backInputRef.current?.click()}
                              className="p-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="size-3.5" /> Replace
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => backInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 text-slate-400 cursor-pointer size-full p-4"
                      >
                        {isUploadingBack ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="size-8 animate-spin text-orange-500" />
                            <span className="text-xs font-bold text-slate-600">Uploading back scan...</span>
                          </div>
                        ) : (
                          <>
                            <div className="size-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                              <Upload className="size-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 text-center">
                              Click to Import or Scan Back ID
                            </span>
                            <span className="text-[10px] text-slate-400 text-center">
                              Clear barcode, issue date, or residential endorsement side
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    <input
                      ref={backInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleKycCardUpload(e, "back")}
                      className="hidden"
                      disabled={isUploadingBack || kycStatus === "VERIFIED"}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECURITY & DATA PROTECTION BADGE */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 flex items-center gap-3.5 text-xs text-slate-600">
              <div className="size-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
                <Lock className="size-4" />
              </div>
              <p className="leading-relaxed">
                <strong className="text-slate-900">Encrypted Compliance Vault:</strong> All government document scans are transmitted over TLS 1.3 and encrypted at rest with AES-256. Documents are strictly accessible by authorized Super Admin compliance personnel for regulatory AML/KYC review.
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {kycStatus === "VERIFIED" ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  KYC Verification Active
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={updateLegalInfo.isPending || isUploadingFront || isUploadingBack}
                  className="rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-7 font-bold text-xs h-11 gap-2 shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                >
                  {updateLegalInfo.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                  {kycStatus === "REJECTED"
                    ? "Resubmit KYC Verification Request"
                    : kycStatus === "PENDING"
                    ? "Update & Re-Request Verification"
                    : "Submit KYC Verification Request to Admin"}
                </Button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Tab 5: Publishing Readiness */}
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

      {/* Tab 6: Status & Danger Zone */}
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

      {/* IMAGE ZOOM PREVIEW MODAL */}
      {previewZoomUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewZoomUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewZoomUrl(null)}
              className="absolute top-4 right-4 z-10 size-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <img
              src={previewZoomUrl}
              alt="KYC ID Full Preview"
              className="max-h-[82vh] w-auto rounded-2xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
