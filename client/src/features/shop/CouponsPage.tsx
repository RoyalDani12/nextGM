import { type FormEvent, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Pencil, Plus, Power, Tag, Trash2, X } from "lucide-react";
import hotToast from "react-hot-toast";
import { useParams } from "react-router-dom";
import type { Coupon, CouponInput } from "./coupons.api";
import { useCoupons, useCreateCoupon, useDeleteCoupon, useUpdateCoupon } from "./coupons.hooks";
import { useShopProducts } from "../product/product.hooks";
import { toast } from "@/components/ui/toast";

type TargetMode = "ALL" | "SELECTED";

/**
 * Converts any date or ISO string into the HTML5 datetime-local format: YYYY-MM-DDTHH:mm
 */
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
  const raw = error?.response?.data?.message || error?.message || "Could not save the coupon";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any) => item.message || item.field).join(". ");
    }
  } catch {
    // raw is not a JSON string, keep it as-is
  }
  return raw;
};

export default function CouponsPage() {
  const { shopId = "" } = useParams<{ shopId: string }>();
  const { data: coupons = [], isLoading } = useCoupons(shopId);
  const { data: productsResponse } = useShopProducts(shopId, { status: "ACTIVE", limit: 100 });
  const products = productsResponse?.data?.products ?? [];

  const createCoupon = useCreateCoupon(shopId);
  const updateCoupon = useUpdateCoupon(shopId);
  const deleteCoupon = useDeleteCoupon(shopId);

  const [form, setForm] = useState<CouponInput>(emptyCoupon);
  const [targetMode, setTargetMode] = useState<TargetMode>("ALL");
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [open, setOpen] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string; details?: string } | null>(null);

  const busy = createCoupon.isPending || updateCoupon.isPending;

  const reset = () => {
    setForm(emptyCoupon());
    setTargetMode("ALL");
    setEditing(null);
    setOpen(false);
  };

  const edit = (coupon: Coupon) => {
    const productIds = coupon.products?.map((entry) => entry.productId) ?? [];
    setEditing(coupon);
    setTargetMode(productIds.length ? "SELECTED" : "ALL");
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      minOrderAmount: coupon.minOrderAmount === null ? null : Number(coupon.minOrderAmount),
      maxUses: coupon.maxUses,
      expiresAt: toLocalInputValue(coupon.expiresAt),
      isActive: coupon.isActive,
      productIds,
    });
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBanner(null);

    const productIds = targetMode === "SELECTED" ? form.productIds ?? [] : [];
    if (targetMode === "SELECTED" && !productIds.length) {
      const msg = "Select at least one product, or choose 'All products'.";
      setBanner({ type: "error", message: "Incomplete selection", details: msg });
      toast.add({ title: "Product selection required", description: msg, type: "warning" });
      hotToast.error(msg);
      return;
    }

    // Convert local datetime to UTC ISO string if set
    let expiresAtIso: string | null = null;
    if (form.expiresAt && form.expiresAt.trim()) {
      const dateObj = new Date(form.expiresAt);
      if (isNaN(dateObj.getTime())) {
        const msg = "Please provide a valid expiration date and time.";
        setBanner({ type: "error", message: "Invalid date", details: msg });
        return;
      }
      if (dateObj.getTime() <= Date.now() - 60_000) {
        const msg = "Expiration date must be in the future.";
        setBanner({ type: "error", message: "Invalid date", details: msg });
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
      minOrderAmount: form.minOrderAmount !== null && form.minOrderAmount !== undefined && !isNaN(Number(form.minOrderAmount)) ? Number(form.minOrderAmount) : null,
      maxUses: form.maxUses !== null && form.maxUses !== undefined && !isNaN(Number(form.maxUses)) ? Number(form.maxUses) : null,
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

        const successTitle = `Coupon "${payload.code}" updated successfully!`;
        const successDesc = "Changes to your discount configuration have been saved.";
        setBanner({ type: "success", message: successTitle, details: successDesc });
        toast.add({ title: "Coupon updated", description: successDesc, type: "success" });
        hotToast.success(successTitle);
      } else {
        await createCoupon.mutateAsync(payload);

        const successTitle = `Coupon "${payload.code}" created successfully!`;
        const successDesc = "Your new coupon is now live and can be redeemed by customers at checkout.";
        setBanner({ type: "success", message: successTitle, details: successDesc });
        toast.add({ title: "Coupon created", description: successDesc, type: "success" });
        hotToast.success(successTitle);
      }

      reset();
    } catch (error: any) {
      const errorMsg = extractErrorMessage(error);
      setBanner({
        type: "error",
        message: editing ? "Failed to update coupon" : "Failed to create coupon",
        details: errorMsg,
      });
      toast.add({ title: "Error saving coupon", description: errorMsg, type: "error" });
      hotToast.error(errorMsg);
    }
  };

  const toggle = async (coupon: Coupon) => {
    try {
      await updateCoupon.mutateAsync({ couponId: coupon.id, input: { isActive: !coupon.isActive } });
      const msg = coupon.isActive ? `Coupon ${coupon.code} paused.` : `Coupon ${coupon.code} activated.`;
      toast.add({ title: "Status updated", description: msg, type: "info" });
      hotToast.success(msg);
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      toast.add({ title: "Error", description: msg, type: "error" });
      hotToast.error(msg);
    }
  };

  const remove = async (coupon: Coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon ${coupon.code}?`)) return;
    try {
      await deleteCoupon.mutateAsync(coupon.id);
      const msg = `Coupon ${coupon.code} was deleted successfully.`;
      setBanner({ type: "success", message: msg });
      toast.add({ title: "Coupon deleted", description: msg, type: "success" });
      hotToast.success(msg);
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      setBanner({ type: "error", message: "Could not delete coupon", details: msg });
      toast.add({ title: "Delete failed", description: msg, type: "error" });
      hotToast.error(msg);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">Promotions</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Coupons & discounts</h1>
          <p className="mt-1 text-sm text-slate-500">Build offers for your entire shop or for particular products.</p>
        </div>
        <button
          onClick={() => {
            reset();
            setBanner(null);
            setOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
        >
          <Plus className="size-4" /> Create coupon
        </button>
      </header>

      {/* Prominent Dismissible Banner Alert */}
      {banner && (
        <div
          role="alert"
          className={`flex items-start justify-between rounded-2xl border p-4 shadow-sm transition-all duration-300 ${
            banner.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-start gap-3">
            {banner.type === "success" ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="size-5 shrink-0 text-rose-600 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-bold">{banner.message}</p>
              {banner.details && (
                <p
                  className={`mt-0.5 text-xs ${
                    banner.type === "success" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {banner.details}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setBanner(null)}
            className={`rounded-lg p-1 transition ${
              banner.type === "success" ? "text-emerald-600 hover:bg-emerald-100" : "text-rose-600 hover:bg-rose-100"
            }`}
            aria-label="Dismiss alert"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Create / Edit Form */}
      {open && (
        <form
          onSubmit={submit}
          className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white p-5 shadow-sm md:p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">{editing ? `Edit ${editing.code}` : "New coupon"}</h2>
              <p className="mt-1 text-sm text-slate-500">Set the value, duration, and exactly where customers can use it.</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Close form"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Coupon Code */}
            <label className="text-sm font-medium text-slate-700">
              Coupon code <span className="text-rose-500">*</span>
              <input
                required
                disabled={Boolean(editing)}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, "") })}
                placeholder="WELCOME10"
                className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-mono uppercase outline-none focus:border-orange-500 disabled:bg-slate-100 text-sm"
              />
              <span className="mt-1 block text-[11px] text-slate-400">Letters, numbers, dashes and underscores</span>
            </label>

            {/* Discount Type */}
            <label className="text-sm font-medium text-slate-700">
              Discount type <span className="text-rose-500">*</span>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CouponInput["type"] })}
                className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
              >
                <option value="PERCENTAGE">Percentage off (%)</option>
                <option value="FIXED_AMOUNT">Fixed amount off ($)</option>
              </select>
            </label>

            {/* Discount Value */}
            <label className="text-sm font-medium text-slate-700">
              {form.type === "PERCENTAGE" ? "Percentage (%)" : "Amount ($)"} <span className="text-rose-500">*</span>
              <input
                required
                min="0.01"
                max={form.type === "PERCENTAGE" ? 100 : undefined}
                step="0.01"
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
              />
            </label>

            {/* Minimum Order */}
            <label className="text-sm font-medium text-slate-700">
              Minimum order ($) <span className="font-normal text-slate-400">optional</span>
              <input
                min="0"
                step="0.01"
                type="number"
                placeholder="No minimum"
                value={form.minOrderAmount ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minOrderAmount: e.target.value !== "" ? Number(e.target.value) : null,
                  })
                }
                className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
              />
            </label>

            {/* Maximum Uses */}
            <label className="text-sm font-medium text-slate-700">
              Maximum total uses <span className="font-normal text-slate-400">optional</span>
              <input
                min="1"
                type="number"
                placeholder="Unlimited"
                value={form.maxUses ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxUses: e.target.value !== "" ? parseInt(e.target.value, 10) : null,
                  })
                }
                className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
              />
            </label>

            {/* Expiration Date & Time */}
            <label className="text-sm font-medium text-slate-700">
              Expires on <span className="font-normal text-slate-400">optional</span>
              <input
                type="datetime-local"
                min={toLocalInputValue(new Date())}
                value={form.expiresAt ?? ""}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value || null })}
                className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
              />
              <span className="mt-1 block text-[11px] text-slate-400">Leave blank for no expiration date</span>
            </label>
          </div>

          <fieldset className="mt-6">
            <legend className="font-semibold text-slate-900">Where should this coupon apply?</legend>
            <p className="mt-1 text-sm text-slate-500">This controls checkout eligibility and which offers appear to customers.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  targetMode === "ALL"
                    ? "border-orange-500 bg-orange-50 ring-1 ring-orange-200"
                    : "bg-white hover:border-slate-300"
                }`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="targetMode"
                  checked={targetMode === "ALL"}
                  onChange={() => setTargetMode("ALL")}
                />
                <span className="font-bold text-slate-900">All products</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">Use this code with any eligible item in your shop.</span>
              </label>

              <label
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  targetMode === "SELECTED"
                    ? "border-orange-500 bg-orange-50 ring-1 ring-orange-200"
                    : "bg-white hover:border-slate-300"
                }`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="targetMode"
                  checked={targetMode === "SELECTED"}
                  onChange={() => setTargetMode("SELECTED")}
                />
                <span className="font-bold text-slate-900">Selected products</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">Show this offer only on products you pick below.</span>
              </label>
            </div>

            {targetMode === "SELECTED" && (
              <div className="mt-4 rounded-2xl border bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Tag className="size-4 text-orange-600" /> Select products ({form.productIds?.length ?? 0} chosen)
                </div>
                <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                  {products.length === 0 ? (
                    <p className="text-sm text-slate-500">No active products are available yet.</p>
                  ) : (
                    products.map((product: any) => (
                      <label
                        key={product.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={form.productIds?.includes(product.id) ?? false}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              productIds: e.target.checked
                                ? [...(form.productIds ?? []), product.id]
                                : (form.productIds ?? []).filter((id) => id !== product.id),
                            })
                          }
                        />
                        <span className="truncate">{product.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </fieldset>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              disabled={busy}
              className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {busy ? "Saving..." : editing ? "Save changes" : "Create coupon"}
            </button>
          </div>
        </form>
      )}

      {/* Coupons List Section */}
      <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="grid grid-cols-[1.3fr_.9fr_.9fr_.9fr_auto] gap-3 border-b bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
          <span>Coupon</span>
          <span>Discount</span>
          <span>Usage</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        {isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-600">No coupons yet.</p>
            <p className="mt-1 text-xs text-slate-400">Click &quot;Create coupon&quot; above to offer discounts to your buyers.</p>
          </div>
        ) : (
          coupons.map((coupon) => {
            const expired = Boolean(coupon.expiresAt && new Date(coupon.expiresAt) <= new Date());
            const productCount = coupon.products?.length ?? 0;
            return (
              <div
                key={coupon.id}
                className="grid grid-cols-[1.3fr_.9fr_.9fr_.9fr_auto] items-center gap-3 border-b px-5 py-4 last:border-0 hover:bg-slate-50/50 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{coupon.code}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(coupon.code);
                        toast.add({ title: "Copied", description: `Code ${coupon.code} copied to clipboard`, type: "info" });
                        hotToast.success("Code copied");
                      }}
                      title="Copy code"
                      className="text-slate-400 hover:text-slate-700 transition"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {productCount ? `${productCount} selected product${productCount === 1 ? "" : "s"}` : "All shop products"}
                  </p>
                  {coupon.expiresAt && (
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Expires {new Date(coupon.expiresAt).toLocaleDateString()} {new Date(coupon.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>

                <span className="font-medium text-slate-900">
                  {coupon.type === "PERCENTAGE" ? `${Number(coupon.value)}% off` : `$${Number(coupon.value).toFixed(2)} off`}
                  {coupon.minOrderAmount && (
                    <span className="block text-[11px] font-normal text-slate-400">
                      Min. ${Number(coupon.minOrderAmount).toFixed(2)}
                    </span>
                  )}
                </span>

                <span className="text-sm text-slate-600">
                  {coupon.usedCount}
                  {coupon.maxUses ? ` / ${coupon.maxUses}` : " uses"}
                </span>

                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                    coupon.isActive && !expired
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {expired ? "Expired" : coupon.isActive ? "Active" : "Paused"}
                </span>

                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => edit(coupon)}
                    title="Edit coupon"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    disabled={expired}
                    onClick={() => toggle(coupon)}
                    title={coupon.isActive ? "Pause coupon" : "Activate coupon"}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition"
                  >
                    <Power className="size-4" />
                  </button>
                  <button
                    onClick={() => remove(coupon)}
                    title="Delete coupon"
                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
