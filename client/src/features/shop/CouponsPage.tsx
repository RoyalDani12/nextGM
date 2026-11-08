import { type FormEvent, useState } from "react";
import {
  Copy,
  Pencil,
  Plus,
  Power,
  Tag,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";
import hotToast from "react-hot-toast";
import { useParams } from "react-router-dom";
import type { Coupon, CouponInput } from "./coupons.api";
import {
  useCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
} from "./coupons.hooks";
import { useShopProducts } from "../product/product.hooks";
import { toast } from "@/components/ui/toast";
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

type TargetMode = "ALL" | "SELECTED";

const toLocalInputValue = (dateInput?: string | Date | null): string => {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyCoupon = (): CouponInput => ({
  code: "",
  type: "PERCENTAGE",
  value: 10,
  minOrderAmount: null,
  maxUses: null,
  expiresAt: null,
  isActive: true,
  productIds: [],
});

const extractErrorMessage = (error: any): string => {
  const raw =
    error?.response?.data?.message ||
    error?.message ||
    "Could not save coupon.";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any) => item.message || item.field).join(". ");
    }
  } catch {
    // not JSON
  }
  return raw;
};

export default function CouponsPage() {
  const { shopId = "" } = useParams<{ shopId: string }>();
  const { data: coupons = [], isLoading } = useCoupons(shopId);
  const { data: productsResponse } = useShopProducts(shopId, {
    status: "ACTIVE",
    limit: 100,
  });
  const products = productsResponse?.data?.products ?? [];

  const createCoupon = useCreateCoupon(shopId);
  const updateCoupon = useUpdateCoupon(shopId);
  const deleteCoupon = useDeleteCoupon(shopId);

  const [form, setForm] = useState<CouponInput>(emptyCoupon);
  const [targetMode, setTargetMode] = useState<TargetMode>("ALL");
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const busy = createCoupon.isPending || updateCoupon.isPending;

  const resetForm = () => {
    setForm(emptyCoupon());
    setTargetMode("ALL");
    setEditing(null);
    setModalOpen(false);
  };

  const handleEdit = (coupon: Coupon) => {
    const productIds = coupon.products?.map((entry) => entry.productId) ?? [];
    setEditing(coupon);
    setTargetMode(productIds.length ? "SELECTED" : "ALL");
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      minOrderAmount:
        coupon.minOrderAmount === null ? null : Number(coupon.minOrderAmount),
      maxUses: coupon.maxUses,
      expiresAt: toLocalInputValue(coupon.expiresAt),
      isActive: coupon.isActive,
      productIds,
    });
    setModalOpen(true);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
    toast.add({
      title: "Code copied",
      description: `${code} copied to clipboard.`,
      type: "info",
    });
    hotToast.success("Code copied");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const productIds = targetMode === "SELECTED" ? form.productIds ?? [] : [];
    if (targetMode === "SELECTED" && !productIds.length) {
      const msg = "Select at least one product or choose all products.";
      toast.add({
        title: "Product selection required",
        description: msg,
        type: "warning",
      });
      hotToast.error(msg);
      return;
    }

    let expiresAtIso: string | null = null;
    if (form.expiresAt && form.expiresAt.trim()) {
      const dateObj = new Date(form.expiresAt);
      if (isNaN(dateObj.getTime())) {
        toast.add({
          title: "Invalid date",
          description: "Please specify a valid expiration date.",
          type: "error",
        });
        return;
      }
      if (dateObj.getTime() <= Date.now() - 60_000) {
        const msg = "Expiration date must be in the future.";
        toast.add({ title: "Invalid date", description: msg, type: "error" });
        hotToast.error(msg);
        return;
      }
      expiresAtIso = dateObj.toISOString();
    }

    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      expiresAt: expiresAtIso,
      minOrderAmount:
        form.minOrderAmount !== null &&
        form.minOrderAmount !== undefined &&
        !isNaN(Number(form.minOrderAmount))
          ? Number(form.minOrderAmount)
          : null,
      maxUses:
        form.maxUses !== null &&
        form.maxUses !== undefined &&
        !isNaN(Number(form.maxUses))
          ? parseInt(String(form.maxUses), 10)
          : null,
      productIds,
    };

    try {
      if (editing) {
        await updateCoupon.mutateAsync({
          couponId: editing.id,
          input: {
            type: payload.type,
            value: payload.value,
            minOrderAmount: payload.minOrderAmount,
            maxUses: payload.maxUses,
            expiresAt: payload.expiresAt,
            isActive: payload.isActive,
            productIds,
          },
        });
        toast.add({
          title: "Coupon updated",
          description: `Coupon ${payload.code} has been saved.`,
          type: "success",
        });
        hotToast.success(`Coupon ${payload.code} updated.`);
      } else {
        await createCoupon.mutateAsync(payload);
        toast.add({
          title: "Coupon created",
          description: `Coupon ${payload.code} is now active.`,
          type: "success",
        });
        hotToast.success(`Coupon ${payload.code} created.`);
      }
      resetForm();
    } catch (error: any) {
      const errorMsg = extractErrorMessage(error);
      toast.add({
        title: "Error saving coupon",
        description: errorMsg,
        type: "error",
      });
      hotToast.error(errorMsg);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      await updateCoupon.mutateAsync({
        couponId: coupon.id,
        input: { isActive: !coupon.isActive },
      });
      const msg = coupon.isActive
        ? `Coupon ${coupon.code} paused.`
        : `Coupon ${coupon.code} activated.`;
      toast.add({ title: "Status updated", description: msg, type: "info" });
      hotToast.success(msg);
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      toast.add({ title: "Error", description: msg, type: "error" });
      hotToast.error(msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!couponToDelete) return;
    try {
      await deleteCoupon.mutateAsync(couponToDelete.id);
      const msg = `Coupon ${couponToDelete.code} was deleted.`;
      toast.add({ title: "Coupon deleted", description: msg, type: "success" });
      hotToast.success(msg);
      setCouponToDelete(null);
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      toast.add({ title: "Delete failed", description: msg, type: "error" });
      hotToast.error(msg);
    }
  };

  // Metrics summary
  const totalActive = coupons.filter((c) => {
    const isExpired = c.expiresAt && new Date(c.expiresAt) <= new Date();
    return c.isActive && !isExpired;
  }).length;

  const totalRedemptions = coupons.reduce(
    (acc, curr) => acc + (curr.usedCount ?? 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5">
      {/* HEADER */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-900">
            Discounts & coupons
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage promotional codes, percentage discounts, and redemptions.
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="h-8 px-3.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-none self-start sm:self-auto"
        >
          <Plus size={13} />
          <span>Create coupon</span>
        </Button>
      </header>

      {/* KPI STAT CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500 block">
            Active coupons
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-slate-900 tabular-nums">
              {totalActive}
            </span>
            <span className="text-xs text-slate-400">
              of {coupons.length} total
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500 block">
            Total redemptions
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-slate-900 tabular-nums">
              {totalRedemptions}
            </span>
            <span className="text-xs text-slate-400">times used</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500 block">
            Active product offers
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-slate-900 tabular-nums">
              {
                coupons.filter(
                  (c) => c.products && c.products.length > 0 && c.isActive
                ).length
              }
            </span>
            <span className="text-xs text-slate-400">targeted codes</span>
          </div>
        </div>
      </section>

      {/* COUPONS TABLE */}
      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Loader2 className="mx-auto size-5 animate-spin text-slate-400 mb-2" />
            <p>Loading coupons…</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Tag className="mx-auto size-6 text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">No coupons created yet</p>
            <p className="text-slate-400 mt-0.5">
              Create promotional discount codes for your customers to apply at checkout.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-medium text-slate-500">
                  <th className="py-2.5 px-4 font-medium">Coupon code</th>
                  <th className="py-2.5 px-4 font-medium">Discount</th>
                  <th className="py-2.5 px-4 font-medium">Redemptions</th>
                  <th className="py-2.5 px-4 font-medium">Eligibility</th>
                  <th className="py-2.5 px-4 font-medium">Expiration</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {coupons.map((coupon) => {
                  const isExpired = Boolean(
                    coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()
                  );
                  const productCount = coupon.products?.length ?? 0;
                  const isCopied = copiedCode === coupon.code;

                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-slate-900 tracking-wide">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.code)}
                            title="Copy coupon code"
                            className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900">
                          {coupon.type === "PERCENTAGE"
                            ? `${Number(coupon.value)}% off`
                            : `$${Number(coupon.value).toFixed(2)} off`}
                        </span>
                        {coupon.minOrderAmount && (
                          <span className="block text-[11px] text-slate-400 font-normal">
                            Min order ${Number(coupon.minOrderAmount).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-3 px-4 text-slate-700 tabular-nums">
                        {coupon.usedCount}
                        <span className="text-slate-400 font-normal">
                          {coupon.maxUses ? ` / ${coupon.maxUses}` : " uses"}
                        </span>
                      </td>

                      {/* Scope */}
                      <td className="py-3 px-4 text-slate-600">
                        {productCount > 0 ? (
                          <span className="text-slate-700">
                            {productCount} selected {productCount === 1 ? "product" : "products"}
                          </span>
                        ) : (
                          <span className="text-slate-500">All products</span>
                        )}
                      </td>

                      {/* Expiration */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {coupon.expiresAt ? (
                          <span>
                            {new Date(coupon.expiresAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400">Never</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span
                            className={`size-1.5 rounded-full ${
                              isExpired
                                ? "bg-slate-400"
                                : coupon.isActive
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                          <span
                            className={
                              isExpired
                                ? "text-slate-500"
                                : coupon.isActive
                                ? "text-emerald-700"
                                : "text-amber-700"
                            }
                          >
                            {isExpired
                              ? "Expired"
                              : coupon.isActive
                              ? "Active"
                              : "Paused"}
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(coupon)}
                            title="Edit coupon"
                            className="size-7 rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={isExpired}
                            onClick={() => handleToggle(coupon)}
                            title={coupon.isActive ? "Pause coupon" : "Activate coupon"}
                            className="size-7 rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Power size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCouponToDelete(coupon)}
                            title="Delete coupon"
                            className="size-7 rounded-md border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CREATE / EDIT DIALOG MODAL */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto p-5 rounded-lg border border-slate-200 bg-white shadow-xl">
          <DialogHeader className="space-y-1 pb-2 border-b border-slate-100">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {editing ? `Edit coupon ${editing.code}` : "Create coupon"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure discount rate, usage limits, and product eligibility.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Coupon code <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                disabled={Boolean(editing)}
                value={form.code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    code: e.target.value.toUpperCase().replace(/\s+/g, ""),
                  })
                }
                placeholder="e.g. SUMMER20"
                className="h-9 text-xs rounded-lg border-slate-200 font-mono uppercase text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500 disabled:bg-slate-50"
              />
              <span className="text-[11px] text-slate-400">
                Letters, numbers, and dashes only
              </span>
            </div>

            {/* Type & Value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Discount type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as CouponInput["type"],
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  <option value="PERCENTAGE">Percentage off (%)</option>
                  <option value="FIXED_AMOUNT">Fixed amount off ($)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  {form.type === "PERCENTAGE" ? "Percentage (%)" : "Amount ($)"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  min="0.01"
                  max={form.type === "PERCENTAGE" ? 100 : undefined}
                  step="0.01"
                  type="number"
                  value={form.value}
                  onChange={(e) =>
                    setForm({ ...form, value: Number(e.target.value) })
                  }
                  className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>
            </div>

            {/* Min order & Max uses */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Minimum order ($){" "}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  min="0"
                  step="0.01"
                  type="number"
                  placeholder="No minimum"
                  value={form.minOrderAmount ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minOrderAmount:
                        e.target.value !== "" ? Number(e.target.value) : null,
                    })
                  }
                  className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Total usage limit{" "}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  min="1"
                  type="number"
                  placeholder="Unlimited"
                  value={form.maxUses ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxUses:
                        e.target.value !== ""
                          ? parseInt(e.target.value, 10)
                          : null,
                    })
                  }
                  className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>
            </div>

            {/* Expiration date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Expiration date{" "}
                <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                type="datetime-local"
                min={toLocalInputValue(new Date())}
                value={form.expiresAt ?? ""}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value || null })
                }
                className="h-9 text-xs rounded-lg border-slate-200 text-slate-900 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
              />
              <span className="text-[11px] text-slate-400">
                Leave empty for no expiration
              </span>
            </div>

            {/* Scope / Eligibility */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-medium text-slate-700">
                Product eligibility
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTargetMode("ALL")}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    targetMode === "ALL"
                      ? "border-orange-500 bg-orange-50/50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-900 block">
                    All products
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Valid across all catalog items
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetMode("SELECTED")}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    targetMode === "SELECTED"
                      ? "border-orange-500 bg-orange-50/50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-900 block">
                    Selected products
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Restrict to specific products
                  </span>
                </button>
              </div>

              {targetMode === "SELECTED" && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span>Choose items ({form.productIds?.length ?? 0} selected)</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-slate-100">
                    {products.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">
                        No active products found.
                      </p>
                    ) : (
                      products.map((product: any) => (
                        <label
                          key={product.id}
                          className="flex items-center gap-2 py-1.5 px-1 text-xs text-slate-800 hover:bg-white rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={
                              form.productIds?.includes(product.id) ?? false
                            }
                            onChange={(e) =>
                              setForm({
                                ...form,
                                productIds: e.target.checked
                                  ? [...(form.productIds ?? []), product.id]
                                  : (form.productIds ?? []).filter(
                                      (id) => id !== product.id
                                    ),
                              })
                            }
                            className="rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                          />
                          <span className="truncate">{product.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetForm}
                className="h-8 px-3 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={busy}
                className="h-8 px-4 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg cursor-pointer shadow-none"
              >
                {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                {editing ? "Save changes" : "Create coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog
        open={Boolean(couponToDelete)}
        onOpenChange={(open) => !open && setCouponToDelete(null)}
      >
        <DialogContent className="sm:max-w-md rounded-lg bg-white p-5 shadow-xl border border-slate-200">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Delete coupon
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete coupon{" "}
              <strong className="text-slate-800">
                "{couponToDelete?.code}"
              </strong>
              ? Customers will no longer be able to redeem this code at checkout.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setCouponToDelete(null)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteCoupon.isPending}
              onClick={handleDeleteConfirm}
              className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {deleteCoupon.isPending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
