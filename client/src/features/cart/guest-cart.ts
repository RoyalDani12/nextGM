import type { AddToCartPayload } from "./cart.types";

const GUEST_CART_KEY = "guest_cart";

export interface GuestCartItem {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string | null;
  price: number;
  quantity: number;
  stock: number;
  image?: string | null;
  shopId?: string;
  shopSlug?: string;
  shopName?: string;
}

interface GuestProductVariant {
  id: string;
  name: string;
  price: number | string;
  stock: number;
}

interface GuestProduct {
  id: string;
  name: string;
  basePrice: number | string;
  stock: number;
  variants?: GuestProductVariant[];
  images?: Array<{ url: string } | string>;
  shopId?: string;
  shop?: { id?: string; slug?: string; profile?: { name?: string } | null };
}

const readGuestCart = (): GuestCartItem[] => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items: GuestCartItem[]) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("guest_cart_updated"));
};

export const getGuestCartItems = () => readGuestCart();

export const addGuestCartItem = (
  product: GuestProduct,
  payload: AddToCartPayload,
) => {
  const variant = product.variants?.find((item) => item.id === payload.variantId);
  const key = `${payload.productId}:${payload.variantId ?? "standard"}`;
  const items = readGuestCart();
  const existing = items.find((item) => item.id === key);
  const stock = Number(variant?.stock ?? product.stock ?? 0);
  const item: GuestCartItem = {
    id: key,
    productId: payload.productId,
    ...(payload.variantId ? { variantId: payload.variantId } : {}),
    productName: product.name,
    variantName: variant?.name ?? null,
    price: Number(variant?.price ?? product.basePrice),
    quantity: Math.min((existing?.quantity ?? 0) + payload.quantity, stock, 100),
    stock,
    image: typeof product.images?.[0] === "string" ? product.images[0] : product.images?.[0]?.url ?? null,
    shopId: product.shopId ?? product.shop?.id,
    shopSlug: product.shop?.slug,
    shopName: product.shop?.profile?.name ?? product.shop?.slug,
  };

  writeGuestCart(existing ? items.map((value) => value.id === key ? item : value) : [...items, item]);
  return item;
};

export const updateGuestCartItem = (id: string, quantity: number) => {
  const items = readGuestCart().map((item) =>
    item.id === id
      ? { ...item, quantity: Math.min(Math.max(0, quantity), item.stock, 100) }
      : item,
  );
  writeGuestCart(items);
};

export const removeGuestCartItem = (id: string) => {
  writeGuestCart(readGuestCart().filter((item) => item.id !== id));
};

export const clearGuestCart = () => {
  writeGuestCart([]);
};

export const getGuestCartResponse = () => {
  const items = readGuestCart();
  const groups = new Map<string, { shopName: string; items: any[]; subtotal: number }>();

  for (const item of items) {
    const groupKey = item.shopId ?? item.shopSlug ?? "unknown-shop";
    const group = groups.get(groupKey) ?? {
      shopName: item.shopName ?? "Verified Supplier",
      items: [],
      subtotal: 0,
    };
    const lineTotal = item.price * item.quantity;
    group.items.push({
      ...item,
      lineToal: lineTotal.toFixed(2),
      isAvailable: item.stock >= item.quantity,
    });
    group.subtotal += lineTotal;
    groups.set(groupKey, group);
  }

  const groupedBy = [...groups.values()].map((group) => ({
    ...group,
    subtotal: group.subtotal.toFixed(2),
  }));

  return {
    data: {
      items: items.length,
      groupedBy,
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      totalPrice: groupedBy
        .reduce((total, group) => total + Number(group.subtotal), 0)
        .toFixed(2),
    },
  };
};
