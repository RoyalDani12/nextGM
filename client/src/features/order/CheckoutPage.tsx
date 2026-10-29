import { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCountries, getCountryCallingCode, type Country } from "react-phone-number-input";
import PhoneInput from "react-phone-number-input/input";
import flags from "react-phone-number-input/flags";
import en from "react-phone-number-input/locale/en.json";
import "react-phone-number-input/style.css";

import { useCheckout } from "./order.hooks";
import type { ShippingMethod } from "./order.types";
import { useCart } from "../cart/cart.hook";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  LockKeyhole,
  MapPin,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "@/components/ui/toast";

interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

interface CountrySelectorProps {
  country: Country;
  onChange: (country: Country) => void;
}

function CountrySelector({ country, onChange }: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = getCountries().filter((item) => {
    const countryName = en[item as keyof typeof en] ?? item;
    const callingCode = getCountryCallingCode(item);
    const query = search.toLowerCase();
    return countryName.toLowerCase().includes(query) || item.toLowerCase().includes(query) || callingCode.includes(query);
  });

  const Flag = flags[country];

  return (
    <div ref={dropdownRef} className="relative w-[170px] shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-full min-h-[52px] w-full items-center gap-2.5 rounded-l-lg border-r bg-white px-3 text-left outline-none hover:bg-gray-50"
      >
        {Flag ? <span className="h-5 w-7 shrink-0 rounded-sm overflow-hidden inline-flex items-center justify-center"><Flag title={en[country]} /></span> : <div className="h-5 w-7 rounded-sm bg-gray-200" />}
        <span className="font-medium text-gray-700">+{getCountryCallingCode(country)}</span>
        <svg className={`ml-auto h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[290px] overflow-hidden rounded-xl border bg-white shadow-xl">
          <div className="border-b bg-white p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              autoFocus
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto p-1">
            {filteredCountries.map((item) => {
              const itemCountry = item as Country;
              const ItemFlag = flags[itemCountry];
              const countryName = en[itemCountry as keyof typeof en] ?? itemCountry;
              const callingCode = getCountryCallingCode(itemCountry);
              const selected = itemCountry === country;

              return (
                <button
                  type="button"
                  key={itemCountry}
                  onClick={() => { onChange(itemCountry); setOpen(false); setSearch(""); }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${selected ? "bg-gray-100 font-medium" : "hover:bg-gray-50"}`}
                >
                  {ItemFlag ? <span className="h-5 w-7 shrink-0 rounded-sm overflow-hidden inline-flex items-center justify-center"><ItemFlag title={countryName} /></span> : <div className="h-5 w-7 rounded-sm bg-gray-200" />}
                  <span className="flex-1 truncate text-gray-700">{countryName}</span>
                  <span className="text-gray-500">+{callingCode}</span>
                </button>
              );
            })}
            {filteredCountries.length === 0 && <div className="py-6 text-center text-sm text-gray-500">No country found.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCanceled = searchParams.get("canceled") === "true";

  const { data: cartResponse, isLoading: isCartLoading } = useCart();
  const checkoutMutation = useCheckout();

  const [phoneCountry, setPhoneCountry] = useState<Country>("ET");
  const [rememberMe, setRememberMe] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCodes, setCouponCodes] = useState<Record<string, string>>({});
  const [shippingMethods, setShippingMethods] = useState<Record<string, ShippingMethod>>({});
  
  const isSubmittingRef = useRef(false);
  const goBackToCart = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/cart");
  };

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "", phone: "", address: "", city: "", country: "ET", postalCode: "",
  });

  useEffect(() => {
    const savedRemember = localStorage.getItem("checkout_remember_me") === "true";
    setRememberMe(savedRemember);

    if (savedRemember) {
      const savedAddress = localStorage.getItem("checkout_shipping_address");
      if (savedAddress) {
        try {
          const parsed: ShippingAddress = JSON.parse(savedAddress);
          setShippingAddress(parsed);
          if (parsed.country) {
            setPhoneCountry(parsed.country as Country);
          }
        } catch (e) {
          console.error("Failed to parse saved shipping address:", e);
        }
      }
    }
  }, []);

  const cartData = cartResponse?.data;
  const groupedBy = cartData?.groupedBy ?? [];
  const totalItems = cartData?.totalItems ?? 0;
  const unavailableItems = groupedBy.flatMap((group: any) =>
    group.items.filter((item: any) => !item.isAvailable),
  );
  const itemsTotal = Number(cartData?.totalPrice ?? 0);
  const shippingFeeFor = (shopId: string) => {
    const method = shippingMethods[shopId] ?? "STANDARD";
    return method === "EXPRESS" ? 15 : method === "STANDARD" ? 5 : 0;
  };
  const shippingTotal = groupedBy.reduce((sum: number, group: any) => sum + shippingFeeFor(group.shop.id), 0);
  const grandTotal = itemsTotal + shippingTotal;

  const handleCountryChange = (country: Country) => {
    setPhoneCountry(country);
    setShippingAddress((prev) => {
      const updated = { ...prev, country };
      if (rememberMe) {
        localStorage.setItem("checkout_shipping_address", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => {
      const updated = { ...prev, [name]: value };
      if (rememberMe) {
        localStorage.setItem("checkout_shipping_address", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handlePhoneChange = (value?: string) => {
    const phoneVal = value ?? "";
    setShippingAddress((prev) => {
      const updated = { ...prev, phone: phoneVal };
      if (rememberMe) {
        localStorage.setItem("checkout_shipping_address", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setRememberMe(checked);
    localStorage.setItem("checkout_remember_me", String(checked));
    if (checked) {
      localStorage.setItem("checkout_shipping_address", JSON.stringify(shippingAddress));
    } else {
      localStorage.removeItem("checkout_shipping_address");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.phone || isSubmittingRef.current) return;
    if (unavailableItems.length > 0) {
      toast.add({
        title: "Items unavailable",
        description: "Remove unavailable products or adjust their quantities before checkout.",
        type: "error",
      });
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
     const codes = Object.fromEntries(Object.entries(couponCodes).filter(([, code]) => code.trim()));
     const checkoutResult = await checkoutMutation.mutateAsync({ shippingAddress, couponCodes: codes, shippingMethods });

      if (rememberMe) {
        localStorage.setItem("checkout_remember_me", "true");
        localStorage.setItem("checkout_shipping_address", JSON.stringify(shippingAddress));
      } else {
        localStorage.removeItem("checkout_remember_me");
        localStorage.removeItem("checkout_shipping_address");
      }

      setShowSuccessAlert(true);

      const checkoutId = checkoutResult.data.checkoutId;
      if (!checkoutId) throw new Error("No checkoutId was returned.");

      // Single redirect - backend handles all orders under one Stripe PaymentIntent
      navigate(`/payment/${checkoutId}`);
      
    } catch (error) {
      console.error("Checkout failed:", error);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (isCartLoading) return <div className="flex min-h-[60vh] items-center justify-center">Loading checkout...</div>;

  // Allow rendering even if cart is empty IF the user just returned from a canceled stripe session
  if ((totalItems === 0 || groupedBy.length === 0) && !isCanceled) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-16 text-center text-white">
        <button
          type="button"
          onClick={() => navigate("/cart")}
          className="mx-auto mb-12 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
        >
          <ArrowLeft className="size-4" /> Back to cart
        </button>
        <div className="mx-auto max-w-3xl">
          <PackageCheck className="mx-auto size-12 text-orange-400" />
          <h1 className="mt-5 text-3xl font-bold">Your cart is empty</h1>
          <p className="mt-3 text-slate-400">Add something you love, then come back here to finish securely.</p>
          <button onClick={() => navigate("/")} className="mt-8 rounded-full bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-400">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={goBackToCart}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <ArrowLeft className="size-4" /> Back to cart
          </button>
          <div className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-950">
            <span className="flex size-8 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Sparkles className="size-4" />
            </span>
            NextG checkout
          </div>
          <div className="hidden items-center gap-1.5 text-xs font-semibold text-emerald-700 sm:flex">
            <LockKeyhole className="size-3.5" /> Secure checkout
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Almost there</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Complete your order</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">A few details and your order will be on its way.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="flex size-7 items-center justify-center rounded-full bg-orange-500 text-white">1</span>
            <span className="h-px w-8 bg-slate-300" />
            <span className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-white">2</span>
            <span className="h-px w-8 bg-slate-300" />
            <span className="flex size-7 items-center justify-center rounded-full border border-slate-300 bg-white">3</span>
            <span className="hidden sm:inline">Payment</span>
          </div>
        </div>

        {/* Shadcn Alert for Canceled Payment */}
        {isCanceled && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Canceled</AlertTitle>
            <AlertDescription>
              Your payment session was canceled. Your cart may have already been processed into an order. You can check your orders or add items back to check out again.
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {showSuccessAlert && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 shadow-sm transition-all">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <div>
              <h5 className="font-semibold leading-tight">Order placed successfully!</h5>
              <p className="mt-1 text-sm text-emerald-700">Redirecting you to secure payment...</p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
            {unavailableItems.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
                <p className="font-semibold">Some items cannot be checked out</p>
                <p className="mt-1">Remove or reduce these items before continuing:</p>
                <ul className="mt-2 list-disc pl-5">
                  {unavailableItems.map((item: any) => (
                    <li key={item.id}>
                      {item.productName}{item.variantName ? ` (${item.variantName})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><MapPin className="size-4" /></span>
                  <div>
                    <h2 className="text-lg font-bold">Shipping address</h2>
                    <p className="text-xs text-slate-500">Where should we deliver your order?</p>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={handleRememberMeChange}
                    className="h-4 w-4 rounded border-gray-300 text-black accent-black focus:ring-black"
                  />
                  Remember me
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Full name</label>
                  <input name="fullName" value={shippingAddress.fullName} onChange={handleChange} placeholder="Full name" required className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Phone number</label>
                  <div className="flex min-h-[52px] rounded-lg border bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                    <CountrySelector country={phoneCountry} onChange={handleCountryChange} />
                    <div className="flex min-w-0 flex-1 items-center px-4">
                      <PhoneInput country={phoneCountry} value={shippingAddress.phone} onChange={handlePhoneChange} placeholder="Phone number" className="w-full border-0 bg-transparent text-base outline-none" />
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">Select country and enter phone number.</p>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Street address</label>
                  <input name="address" value={shippingAddress.address} onChange={handleChange} placeholder="Street address" required className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">City</label>
                  <input name="city" value={shippingAddress.city} onChange={handleChange} placeholder="City" required className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Country</label>
                  <div className="flex h-[50px] items-center gap-3 rounded-lg border bg-gray-50 px-4">
                    {flags[phoneCountry] && (() => {
                      const Flag = flags[phoneCountry];
                      return <span className="h-5 w-7 rounded-sm overflow-hidden inline-flex items-center justify-center"><Flag title={en[phoneCountry as keyof typeof en]} /></span>;
                    })()}
                    <span className="font-medium text-gray-700">{en[phoneCountry as keyof typeof en]}</span>
                    <span className="text-sm text-gray-400">({phoneCountry})</span>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">Auto-synced from phone code.</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Postal code</label>
                  <input name="postalCode" value={shippingAddress.postalCode} onChange={handleChange} placeholder="Postal code (optional)" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black" />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">2</span>
                <h2 className="text-lg font-bold">Delivery options</h2>
              </div>
              <p className="mb-5 text-sm text-gray-500">Choose a delivery speed for each shop. Orders from different shops may arrive separately.</p>
              <div className="space-y-5">
                {groupedBy.map((group: any) => {
                  const selected = shippingMethods[group.shop.id] ?? "STANDARD";
                  const options: Array<{ value: ShippingMethod; title: string; detail: string; fee: number }> = [
                    { value: "STANDARD", title: "Standard delivery", detail: "Estimated in 5–7 business days", fee: 5 },
                    { value: "EXPRESS", title: "Express delivery", detail: "Estimated in 2–3 business days", fee: 15 },
                    { value: "PICKUP", title: "Store pickup", detail: "Ready in 1–2 business days", fee: 0 },
                  ];
                  return (
                    <section key={group.shop.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <h3 className="mb-3 text-sm font-bold text-slate-900">{group.shop.name}</h3>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {options.map((option) => (
                          <label key={option.value} className={`cursor-pointer rounded-lg border p-3 transition ${selected === option.value ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                            <input type="radio" name={`shipping-${group.shop.id}`} checked={selected === option.value} onChange={() => setShippingMethods((current) => ({ ...current, [group.shop.id]: option.value }))} className="sr-only" />
                            <div className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900"><span>{option.title}</span><span>{option.fee === 0 ? "Free" : `$${option.fee}`}</span></div>
                            <p className="mt-1 text-xs text-slate-500">{option.detail}</p>
                          </label>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={checkoutMutation.isPending || isSubmitting || showSuccessAlert || !shippingAddress.phone || unavailableItems.length > 0}
              className="w-full rounded-2xl bg-slate-950 px-6 py-4 font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkoutMutation.isPending || isSubmitting ? "Preparing secure checkout..." : `Proceed to Payment — $${grandTotal.toFixed(2)}`}
            </button>

            {checkoutMutation.isError && <p className="text-sm text-red-600">Unable to create your order. Please try again.</p>}
          </form>

          <div className="h-fit space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Your selection</p>
                <h2 className="mt-1 text-xl font-bold">Order summary</h2>
              </div>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><Check className="size-5" /></span>
            </div>
            <div className="space-y-6">
              {groupedBy.map((group: any, idx: number) => (
                <div key={idx} className="space-y-3">
                  <div className="border-b pb-1 text-xs font-bold uppercase tracking-wider text-gray-500">{group.shop.name}</div>
                  <div className="space-y-4">
                    {group.items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {item.image && <img src={item.image} alt={item.productName} className="size-12 rounded-lg border object-cover" />}
                          <div>
                            <p className="text-sm font-medium">{item.productName}</p>
                            {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="text-sm font-medium">${Number(item.lineToal).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={couponCodes[group.shop.id] ?? ""}
                      onChange={(e) => setCouponCodes((current) => ({ ...current, [group.shop.id]: e.target.value.toUpperCase() }))}
                      placeholder="Coupon code"
                      aria-label={`Coupon code for ${group.shop.name}`}
                      className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm uppercase outline-none focus:border-black"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{(shippingMethods[group.shop.id] ?? "STANDARD").toLowerCase().replace(/^./, (letter: string) => letter.toUpperCase())} delivery</span>
                    <span>{shippingFeeFor(group.shop.id) === 0 ? "Free" : `$${shippingFeeFor(group.shop.id).toFixed(2)}`}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t" />
            <div className="flex justify-between text-sm text-slate-600"><span>Items</span><span>${itemsTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-slate-600"><span>Delivery</span><span>{shippingTotal === 0 ? "Free" : `$${shippingTotal.toFixed(2)}`}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-4 text-xl font-extrabold">
              <span>Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <LockKeyhole className="size-3.5 text-emerald-600" /> Your payment details are encrypted and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
