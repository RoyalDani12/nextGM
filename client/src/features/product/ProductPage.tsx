import { useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  useShopProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUpdateProductStatus,
} from "./product.hooks";
import type {
  CreateProductPayload,
  UpdateProductPayload,
  ProductsResponse,
  Product,
  ProductStatus,
} from "./product.types";

import ProductCard from "./components/ProductCard";
import ProductEditDialog from "./components/ProductEditDialog";
import ProductAddDialog from "./components/ProductAddDialog";
import {
  ProductPageHeader,
  ProductPageStats,
  ProductSearch,
  ProductPagination,
  EmptyProducts,
  ProductsLoading,
} from "./components/ProductPageControls";

const STOCK_TABS: { value: "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"; label: string }[] = [
  { value: "ALL", label: "All products" },
  { value: "IN_STOCK", label: "In stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
];

export default function ProductPage() {
  const { shopId } = useParams<{ shopId: string }>();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");

  const [createOpen, setCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  if (!shopId) {
    return (
      <div className="py-20 text-center text-xs text-rose-500">
        Shop ID is missing.
      </div>
    );
  }

  return (
    <ProductPageContent
      shopId={shopId}
      search={search}
      setSearch={setSearch}
      page={page}
      setPage={setPage}
      limit={limit}
      setLimit={setLimit}
      stockFilter={stockFilter}
      setStockFilter={setStockFilter}
      createOpen={createOpen}
      setCreateOpen={setCreateOpen}
      editingProduct={editingProduct}
      setEditingProduct={setEditingProduct}
    />
  );
}

interface ProductPageContentProps {
  shopId: string;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
  stockFilter: "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  setStockFilter: React.Dispatch<React.SetStateAction<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">>;
  createOpen: boolean;
  setCreateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingProduct: Product | null;
  setEditingProduct: React.Dispatch<React.SetStateAction<Product | null>>;
}

function ProductPageContent({
  shopId,
  search,
  setSearch,
  page,
  setPage,
  limit,
  setLimit,
  stockFilter,
  setStockFilter,
  createOpen,
  setCreateOpen,
  editingProduct,
  setEditingProduct,
}: ProductPageContentProps) {
  const { data, isLoading, isFetching, isError, refetch } = useShopProducts(shopId, {
    page,
    limit,
    search: search.trim() || undefined,
    stockFilter,
  });

  const createProduct = useCreateProduct(shopId);
  const updateProduct = useUpdateProduct(shopId);
  const deleteProduct = useDeleteProduct(shopId);
  const updateProductStatus = useUpdateProductStatus(shopId);

  const responseData = (data as ProductsResponse)?.data;
  const products = responseData?.products ?? [];
  const pagination = responseData?.pagination ?? {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleCreateProduct = async (payload: CreateProductPayload) => {
    await createProduct.mutateAsync(payload);
  };

  const handleUpdateProduct = async (productId: string, payload: UpdateProductPayload) => {
    await updateProduct.mutateAsync({ productId, payload });
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
  };

  const handleStatusChange = (productId: string, status: ProductStatus) => {
    updateProductStatus.mutate({ productId, status });
  };

  const handleStockChange = async (productId: string, stock: number) => {
    if (!Number.isInteger(stock) || stock < 0) return;
    await updateProduct.mutateAsync({ productId, payload: { stock } });
  };

  if (isLoading) return <ProductsLoading />;

  if (isError) {
    return (
      <div className="max-w-sm mx-auto text-center py-20 space-y-3">
        <AlertCircle className="size-8 text-slate-300 mx-auto" />
        <p className="text-sm font-medium text-slate-700">Couldn't load products</p>
        <p className="text-xs text-slate-400">Check your connection and try again.</p>
        <button
          onClick={() => refetch()}
          className="text-xs font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1200px]">
      <ProductPageHeader onAdd={() => setCreateOpen(true)} total={pagination.total} />

      {/* CREATE DIALOG */}
      <ProductAddDialog
        shopId={shopId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateProduct}
      />

      {/* EDIT DIALOG */}
      <ProductEditDialog
        product={editingProduct}
        open={!!editingProduct}
        shopId={shopId}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onSubmit={handleUpdateProduct}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(productToDelete)}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <DialogContent className="sm:max-w-md rounded-lg bg-white p-5 shadow-xl border border-slate-200">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Delete product
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete{" "}
              <strong className="text-slate-800">"{productToDelete?.name}"</strong>?
              This action cannot be undone and will permanently remove this product and its variants.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setProductToDelete(null)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteProduct.isPending}
              onClick={async () => {
                if (!productToDelete) return;
                try {
                  await deleteProduct.mutateAsync(productToDelete.id);
                  setProductToDelete(null);
                } catch (err) {
                  console.error("Failed to delete product:", err);
                }
              }}
              className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {deleteProduct.isPending ? (
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

      <ProductPageStats products={products} total={pagination.total} />

      {/* Tabs & Search */}
      <div className="space-y-3">
        {/* Inventory Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
          {STOCK_TABS.map((tab) => {
            const isActive = stockFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStockFilter(tab.value);
                  setPage(1);
                }}
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

        {/* Search */}
        <div className="flex gap-2.5">
          <ProductSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
        </div>
      </div>

      {pagination.total === 0 && !search ? (
        <EmptyProducts onAdd={() => setCreateOpen(true)} />
      ) : products.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-lg">
          <p className="text-sm font-medium text-slate-700">No products found</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? `No products match "${search}".` : "Try selecting a different inventory tab."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 transition-opacity ${
              isFetching ? "opacity-60" : "opacity-100"
            }`}
          >
            {products.map((product) => (
              <ProductCard
                key={product.id || (product as any)._id}
                product={product}
                shopId={shopId}
                onEdit={setEditingProduct}
                onDelete={handleDeleteProduct}
                onStatusChange={handleStatusChange}
                onStockChange={handleStockChange}
                isDeleting={deleteProduct.isPending}
                isUpdatingStatus={updateProductStatus.isPending}
                isUpdatingStock={updateProduct.isPending}
              />
            ))}
          </div>

          <ProductPagination
            pagination={pagination}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            isFetching={isFetching}
          />
        </div>
      )}
    </div>
  );
}
