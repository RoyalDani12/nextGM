import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Store,
  MapPin,
  Mail,
  Phone,
  Globe,
  FileText,
  ShieldCheck,
  Upload,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  ImageIcon,
  Eye,
  AlertCircle,
  X,
  RefreshCw,
  Clock,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

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

type ShopSettingsProfileForm = UpdateShopProfilePayload & { name: string };

const TABS = [
  { key: "general", label: "Profile & branding" },
  { key: "contact", label: "Contact & location" },
  { key: "legal", label: "Legal business" },
  { key: "kyc", label: "Identity & KYC" },
  { key: "readiness", label: "Publishing" },
  { key: "danger", label: "Store status" },
];

export function ShopSettingsPage() {
  const { shopId = "" } = useParams<{ shopId: string }>();
  const { data: shopsData, isLoading: isShopsLoading, refetch: refetchShops } = useMyShops();
  const shop = shopsData?.data?.find((s) => s.id === shopId);

  const updateProfile = useUpdateShopProfile();
  const updateLegalInfo = useUpdateShopLegalInfo();
  const uploadImage = useShopImageUpload();
  const readiness = usePublishReadiness(shopId);
  const publishShop = usePublishShop(shopId);

  const [profileForm, setProfileForm] = useState<ShopSettingsProfileForm>({
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

  const [legalForm, setLegalForm] = useState<UpdateShopLegalInfoPayload>({
    legalBusinessName: "",
    taxId: "",
    entityType: "LLC",
  });

  const [kycForm, setKycForm] = useState({
    ownerIdType: "NATIONAL_ID",
    ownerIdNumber: "",
    ownerIdCardFront: "",
    ownerIdCardBack: "",
  });

  const [activeTab, setActiveTab] = useState<
    "general" | "contact" | "legal" | "kyc" | "readiness" | "danger"
  >("general");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);
  const [legalSuccessMsg, setLegalSuccessMsg] = useState(false);

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
      <div className="flex min-h-[460px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-sm mx-auto text-center py-20 space-y-3">
        <Store className="size-8 text-slate-300 mx-auto" />
        <p className="text-sm font-medium text-slate-700">Store not found</p>
        <p className="text-xs text-slate-400">This workspace may have been closed or moved.</p>
        <Link
          to="/shops"
          className="inline-block text-xs font-medium text-orange-600 hover:text-orange-700"
        >
          Return to My Shops
        </Link>
      </div>
    );
  }

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
      toast.success("Logo updated.");
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
      toast.success("Banner updated.");
    } catch (err: any) {
      toast.error("Banner upload failed: " + (err?.message || "Please try again."));
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(false);

    const { name: _name, ...profileFields } = profileForm;
    const payload = Object.fromEntries(
      Object.entries(profileFields).filter(
        ([_, val]) => val !== undefined && val !== null && String(val).trim() !== ""
      )
    ) as UpdateShopProfilePayload;

    updateProfile.mutate(
      { shopId: shop.id, payload },
      {
        onSuccess: () => {
          setProfileSuccessMsg(true);
          toast.success("Settings saved.");
          setTimeout(() => setProfileSuccessMsg(false), 4000);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to update profile.");
        },
      }
    );
  };

  const handleLegalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLegalSuccessMsg(false);

    updateLegalInfo.mutate(
      { shopId: shop.id, payload: legalForm },
      {
        onSuccess: () => {
          setLegalSuccessMsg(true);
          toast.success("Legal information saved.");
          setTimeout(() => setLegalSuccessMsg(false), 4000);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to save legal details.");
        },
      }
    );
  };

  const handleKycCardUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back"
  ) => {
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

      toast.success(`${side === "front" ? "Front" : "Back"} document scan uploaded.`);
    } catch (err: any) {
      toast.error(`Upload failed: ${err?.message || "Unable to upload document."}`);
    } finally {
      if (side === "front") setIsUploadingFront(false);
      else setIsUploadingBack(false);
      e.target.value = "";
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycForm.ownerIdNumber.trim()) {
      toast.error("Please enter your document ID number.");
      return;
    }
    if (!kycForm.ownerIdCardFront) {
      toast.error("Please upload the front scan of your ID card.");
      return;
    }
    if (kycForm.ownerIdType !== "PASSPORT" && !kycForm.ownerIdCardBack) {
      toast.error("Please upload the back scan of your ID card.");
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
      toast.success("KYC verification submitted.");
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
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          <Link
            to={`/dashboard/shop/${shop.id}`}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={13} /> Back to dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-slate-900">Store Settings</h1>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium ${
                shop.status === "ACTIVE"
                  ? "text-emerald-700"
                  : shop.status === "PAUSED"
                  ? "text-amber-700"
                  : "text-slate-500"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  shop.status === "ACTIVE"
                    ? "bg-emerald-500"
                    : shop.status === "PAUSED"
                    ? "bg-amber-500"
                    : "bg-slate-400"
                }`}
              />
              {shop.status}
            </span>
            {kycStatus === "VERIFIED" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <ShieldCheck size={13} className="text-emerald-600" />
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Manage your store profile, branding, contact info, and legal compliance
          </p>
        </div>

        <div>
          <button
            onClick={() => window.open(`/${shop.slug}`, "_blank")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ExternalLink size={13} />
            View storefront
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-2 border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-orange-500 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile & Branding */}
      {activeTab === "general" && (
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
            <div>
              <h2 className="text-sm font-medium text-slate-800">Brand identity</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Logo and banner images visible on your store page
              </p>
            </div>

            {/* Banner */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Store banner</Label>
              <div className="relative h-36 w-full rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center group hover:border-slate-300 transition-colors">
                {profileForm.banner ? (
                  <img
                    src={profileForm.banner}
                    alt="Banner preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <ImageIcon size={20} className="text-slate-300" />
                    <span className="text-xs">Recommended 1200 × 300px</span>
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm flex items-center gap-1.5">
                    {uploadImage.isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Upload size={13} />
                    )}
                    Upload banner
                  </span>
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

            {/* Logo */}
            <div className="flex items-center gap-4 pt-1">
              <div className="relative size-16 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center group hover:border-slate-300 transition-colors shrink-0">
                {profileForm.logo ? (
                  <img
                    src={profileForm.logo}
                    alt="Logo preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <Store size={20} className="text-slate-300" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload size={14} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadImage.isPending}
                  />
                </label>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700">Store logo</Label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Square image, recommended 400 × 400px
                </p>
              </div>
            </div>

            {/* Store Name & Description */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="storeName" className="text-xs font-medium text-slate-700">
                  Store name
                </Label>
                <Input
                  id="storeName"
                  value={profileForm.name || ""}
                  readOnly
                  className="rounded-lg bg-slate-50 text-slate-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="storeDescription" className="text-xs font-medium text-slate-700">
                  Description
                </Label>
                <Textarea
                  id="storeDescription"
                  rows={3}
                  value={profileForm.description || ""}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, description: e.target.value })
                  }
                  placeholder="Tell buyers about your brand and products…"
                  className="rounded-lg text-sm"
                />
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={13} className="shrink-0" />
                Store settings saved.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="px-4 py-2 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                {updateProfile.isPending && <Loader2 size={13} className="animate-spin" />}
                Save changes
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Contact & Location */}
      {activeTab === "contact" && (
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div>
              <h2 className="text-sm font-medium text-slate-800">Contact & fulfillment</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Public support contact details and shipping origin
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail" className="text-xs font-medium text-slate-700">
                  Support email
                </Label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="contactEmail"
                    type="email"
                    value={profileForm.email || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="support@example.com"
                    className="pl-9 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactPhone" className="text-xs font-medium text-slate-700">
                  Phone number
                </Label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={profileForm.phone || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="pl-9 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="contactAddress" className="text-xs font-medium text-slate-700">
                  Street address
                </Label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="contactAddress"
                    value={profileForm.address || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="123 Commerce St"
                    className="pl-9 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactCity" className="text-xs font-medium text-slate-700">
                  City
                </Label>
                <Input
                  id="contactCity"
                  value={profileForm.city || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  placeholder="New York"
                  className="rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactCountry" className="text-xs font-medium text-slate-700">
                  Country
                </Label>
                <Input
                  id="contactCountry"
                  value={profileForm.country || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                  placeholder="United States"
                  className="rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="contactWebsite" className="text-xs font-medium text-slate-700">
                  Website
                </Label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="contactWebsite"
                    type="url"
                    value={profileForm.website || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    placeholder="https://example.com"
                    className="pl-9 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="shippingPolicy" className="text-xs font-medium text-slate-700">
                  Shipping policy
                </Label>
                <Textarea
                  id="shippingPolicy"
                  rows={2}
                  value={profileForm.shippingPolicy || ""}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, shippingPolicy: e.target.value })
                  }
                  placeholder="Dispatch times, shipping methods, and estimated delivery…"
                  className="rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="returnsPolicy" className="text-xs font-medium text-slate-700">
                  Returns & refunds policy
                </Label>
                <Textarea
                  id="returnsPolicy"
                  rows={2}
                  value={profileForm.returnsPolicy || ""}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, returnsPolicy: e.target.value })
                  }
                  placeholder="Return window, return shipping terms, and conditions…"
                  className="rounded-lg text-sm"
                />
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={13} className="shrink-0" />
                Contact details saved.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="px-4 py-2 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                {updateProfile.isPending && <Loader2 size={13} className="animate-spin" />}
                Save changes
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Legal Business Info */}
      {activeTab === "legal" && (
        <form onSubmit={handleLegalSubmit} className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div>
              <h2 className="text-sm font-medium text-slate-800">Legal business entity</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Registration and tax details for compliance
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="legalBusinessName" className="text-xs font-medium text-slate-700">
                  Legal business name *
                </Label>
                <Input
                  id="legalBusinessName"
                  value={legalForm.legalBusinessName}
                  onChange={(e) =>
                    setLegalForm({ ...legalForm, legalBusinessName: e.target.value })
                  }
                  placeholder="Registered company name"
                  className="rounded-lg text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="taxId" className="text-xs font-medium text-slate-700">
                  Tax ID / EIN / VAT *
                </Label>
                <div className="relative">
                  <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="taxId"
                    value={legalForm.taxId}
                    onChange={(e) => setLegalForm({ ...legalForm, taxId: e.target.value })}
                    placeholder="XX-XXXXXXX"
                    className="pl-9 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="entityType" className="text-xs font-medium text-slate-700">
                  Entity type *
                </Label>
                <select
                  id="entityType"
                  value={legalForm.entityType}
                  onChange={(e) => setLegalForm({ ...legalForm, entityType: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 cursor-pointer"
                >
                  <option value="LLC">Limited Liability Company (LLC)</option>
                  <option value="Corporation">Corporation (Inc / Corp)</option>
                  <option value="Sole Proprietorship">Sole Proprietorship / Individual</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Non-Profit">Non-Profit</option>
                </select>
              </div>
            </div>

            {legalSuccessMsg && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={13} className="shrink-0" />
                Legal information saved.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updateLegalInfo.isPending}
                className="px-4 py-2 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                {updateLegalInfo.isPending && <Loader2 size={13} className="animate-spin" />}
                Save legal details
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 4: Identity & KYC Verification */}
      {activeTab === "kyc" && (
        <form onSubmit={handleKycSubmit} className="space-y-4">
          {/* Status banner */}
          {kycStatus === "VERIFIED" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 flex items-start gap-2.5 text-xs text-emerald-800">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">Identity verified</p>
                <p className="text-emerald-700 mt-0.5">
                  Your merchant identification documents have been approved.
                </p>
                {shop.legalInfo?.ownerKycVerifiedAt && (
                  <p className="text-[11px] text-emerald-600 mt-1">
                    Verified on{" "}
                    {new Date(shop.legalInfo.ownerKycVerifiedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          {kycStatus === "PENDING" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-2.5 text-xs text-amber-800">
              <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Verification in review</p>
                <p className="text-amber-700 mt-0.5">
                  Your identity documents are currently being reviewed by compliance.
                </p>
              </div>
            </div>
          )}

          {kycStatus === "REJECTED" && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 space-y-2 text-xs text-rose-800">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-900">Verification requires attention</p>
                  <p className="text-rose-700 mt-0.5">
                    Your document submission was not approved. Please review feedback and re-upload.
                  </p>
                </div>
              </div>
              {shop.legalInfo?.ownerKycNotes && (
                <div className="rounded border border-rose-200 bg-white p-2.5 text-rose-900">
                  <span className="font-medium text-rose-700 block text-[11px]">Feedback:</span>
                  <p className="mt-0.5">{shop.legalInfo.ownerKycNotes}</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-800">Government ID details</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ensure details match your official identification card
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="idType" className="text-xs font-medium text-slate-700">
                  Document type *
                </Label>
                <select
                  id="idType"
                  value={kycForm.ownerIdType}
                  onChange={(e) => setKycForm({ ...kycForm, ownerIdType: e.target.value })}
                  disabled={kycStatus === "VERIFIED"}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer"
                >
                  <option value="NATIONAL_ID">National Identity Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                  <option value="RESIDENCE_PERMIT">Residence Permit</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="idNumber" className="text-xs font-medium text-slate-700">
                  Document number *
                </Label>
                <div className="relative">
                  <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="idNumber"
                    value={kycForm.ownerIdNumber}
                    onChange={(e) => setKycForm({ ...kycForm, ownerIdNumber: e.target.value })}
                    placeholder="Document number"
                    disabled={kycStatus === "VERIFIED"}
                    className="pl-9 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Document Scans */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-medium text-slate-700">
                Document scans (Front & Back)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Front Side */}
                <div className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">Front side *</span>
                    {kycForm.ownerIdCardFront && (
                      <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-0.5">
                        <Check size={11} /> Uploaded
                      </span>
                    )}
                  </div>

                  <div className="relative h-32 rounded-md border border-dashed border-slate-300 bg-white overflow-hidden flex items-center justify-center group hover:border-slate-400 transition-colors">
                    {kycForm.ownerIdCardFront ? (
                      <div className="relative size-full">
                        <img
                          src={kycForm.ownerIdCardFront}
                          alt="ID Front"
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewZoomUrl(kycForm.ownerIdCardFront)}
                            className="px-2.5 py-1 rounded bg-white text-slate-800 text-xs font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> View
                          </button>
                          {kycStatus !== "VERIFIED" && (
                            <button
                              type="button"
                              onClick={() => frontInputRef.current?.click()}
                              className="px-2.5 py-1 rounded bg-orange-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw size={12} /> Replace
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => frontInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-1 text-slate-400 cursor-pointer size-full p-3"
                      >
                        {isUploadingFront ? (
                          <Loader2 size={16} className="animate-spin text-orange-500" />
                        ) : (
                          <>
                            <Upload size={16} className="text-slate-400" />
                            <span className="text-xs font-medium text-slate-600">
                              Upload front scan
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      ref={frontInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleKycCardUpload(e, "front")}
                      className="hidden"
                      disabled={isUploadingFront || kycStatus === "VERIFIED"}
                    />
                  </div>
                </div>

                {/* Back Side */}
                <div className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      Back side {kycForm.ownerIdType === "PASSPORT" ? "(Optional)" : "*"}
                    </span>
                    {kycForm.ownerIdCardBack && (
                      <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-0.5">
                        <Check size={11} /> Uploaded
                      </span>
                    )}
                  </div>

                  <div className="relative h-32 rounded-md border border-dashed border-slate-300 bg-white overflow-hidden flex items-center justify-center group hover:border-slate-400 transition-colors">
                    {kycForm.ownerIdCardBack ? (
                      <div className="relative size-full">
                        <img
                          src={kycForm.ownerIdCardBack}
                          alt="ID Back"
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewZoomUrl(kycForm.ownerIdCardBack)}
                            className="px-2.5 py-1 rounded bg-white text-slate-800 text-xs font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> View
                          </button>
                          {kycStatus !== "VERIFIED" && (
                            <button
                              type="button"
                              onClick={() => backInputRef.current?.click()}
                              className="px-2.5 py-1 rounded bg-orange-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw size={12} /> Replace
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => backInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-1 text-slate-400 cursor-pointer size-full p-3"
                      >
                        {isUploadingBack ? (
                          <Loader2 size={16} className="animate-spin text-orange-500" />
                        ) : (
                          <>
                            <Upload size={16} className="text-slate-400" />
                            <span className="text-xs font-medium text-slate-600">
                              Upload back scan
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      ref={backInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleKycCardUpload(e, "back")}
                      className="hidden"
                      disabled={isUploadingBack || kycStatus === "VERIFIED"}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              {kycStatus === "VERIFIED" ? (
                <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Verification complete
                </span>
              ) : (
                <button
                  type="submit"
                  disabled={updateLegalInfo.isPending || isUploadingFront || isUploadingBack}
                  className="px-4 py-2 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 inline-flex items-center gap-1.5"
                >
                  {updateLegalInfo.isPending && <Loader2 size={13} className="animate-spin" />}
                  Submit verification
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Tab 5: Publishing Readiness */}
      {activeTab === "readiness" && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-slate-800">Publishing readiness</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Requirements needed before store catalog goes live
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium ${
                isPassed ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${isPassed ? "bg-emerald-500" : "bg-amber-500"}`}
              />
              {isPassed ? "Ready to publish" : "Incomplete"}
            </span>
          </div>

          {checks ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { title: "Store profile created", ok: checks.hasProfile },
                { title: "Store name configured", ok: checks.hasName },
                { title: "Store description added", ok: checks.hasDescription },
                { title: "Store logo uploaded", ok: checks.hasLogo },
                { title: "Support contact details", ok: checks.hasContactInfo },
                { title: "Physical location address", ok: checks.hasAddress },
                { title: "Legal business & tax details", ok: checks.hasLegalInfo },
                { title: "At least 1 active product", ok: checks.hasAtLeastOneActiveProduct },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs"
                >
                  <span className="text-slate-700 font-medium">{item.title}</span>
                  <span
                    className={`font-medium ${item.ok ? "text-emerald-700" : "text-slate-400"}`}
                  >
                    {item.ok ? "Passed" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">Checking status…</p>
          )}

          {canPublish && (
            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-between gap-3 text-xs">
              <span className="text-emerald-800 font-medium">
                All checks passed. You can now publish your storefront.
              </span>
              <button
                onClick={() => publishShop.mutate()}
                disabled={publishShop.isPending}
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              >
                {publishShop.isPending ? "Publishing…" : "Publish store"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Status & Danger Zone */}
      {activeTab === "danger" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div>
              <h2 className="text-sm font-medium text-slate-800">Store status</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pause your store to temporarily hide catalog items
              </p>
            </div>
            <div className="pt-1">
              <ShopStatusToggle shopId={shop.id} status={shop.status} />
            </div>
          </div>

          <div className="bg-white border border-rose-200 rounded-lg p-5 space-y-3">
            <div>
              <h3 className="text-sm font-medium text-rose-900">Close store</h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Permanently deactivate this storefront. This action cannot be undone.
              </p>
            </div>
            <div className="pt-1">
              <CloseShopDialog shop={shop} />
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Preview */}
      {previewZoomUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewZoomUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewZoomUrl(null)}
              className="absolute top-3 right-3 z-10 size-7 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center cursor-pointer"
            >
              <X size={14} />
            </button>
            <img
              src={previewZoomUrl}
              alt="Document preview"
              className="max-h-[80vh] w-auto rounded object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
