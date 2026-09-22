import { useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";

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
// import { ProductPageHeader } from "./components/ProductPageControls";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ProductPage() {
  const { shopId } = useParams<{ shopId: string }>();

   const [search, setSearch] = useState("");
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(20);

   // DIALOG STATES
   const [createOpen, setCreateOpen] = useState(false);
   const [editingProduct, setEditingProduct] = useState<Product | null>(null);

   if (!shopId) {
      return (
         <div className="p-6">
            <Card className="border-destructive/30">
               <CardContent className="flex items-center gap-3 p-6">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                     <p className="font-semibold">Shop ID is missing</p>
                     <p className="text-sm text-muted-foreground">
                        Please open products from a specific shop.
                     </p>
                  </div>
               </CardContent>
            </Card>
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
   createOpen,
   setCreateOpen,
   editingProduct,
   setEditingProduct,
}: ProductPageContentProps) {
   const { data, isLoading, isFetching, isError, refetch } = useShopProducts(shopId, {
      page,
      limit,
      search: search.trim() || undefined,
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

   const handleCreateProduct = async (payload: CreateProductPayload) => {
      await createProduct.mutateAsync(payload);
   };

   const handleUpdateProduct = async (productId: string, payload: UpdateProductPayload) => {
      await updateProduct.mutateAsync({ productId, payload });
   };

   const handleDeleteProduct = (productId: string, productName: string) => {
      const confirmed = window.confirm(`Are you sure you want to delete "${productName}"?`);

      if (!confirmed) return;

      deleteProduct.mutate(productId);
   };
   const handleStatusChange = (productId: string, status: ProductStatus) => {
      updateProductStatus.mutate({
         productId,
         status,
      });
   };

   if (isLoading) return <ProductsLoading />;

   if (isError) {
      return (
         <div className="p-4 md:p-6">
            <Card className="border-destructive/20">
               <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="h-6 w-6 text-destructive mb-3" />
                  <h2 className="font-semibold">Failed to load products</h2>
                  <Button
                     variant="outline"
                     size="sm"
                     className="mt-4 gap-2"
                     onClick={() => refetch()}
                  >
                     <RefreshCw className="h-4 w-4" /> Try again
                  </Button>
               </CardContent>
            </Card>
         </div>
      );
   }

   return (
      <div className="w-full p-4 md:p-6 space-y-6">
         <ProductPageHeader onAdd={() => setCreateOpen(true)} />

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

         <ProductPageStats products={products} total={pagination.total} />
         <ProductSearch
            value={search}
            onChange={(v) => {
               setSearch(v);
               setPage(1);
            }}
         />

         {pagination.total === 0 && !search ? (
            <EmptyProducts onAdd={() => setCreateOpen(true)} />
         ) : products.length === 0 ? (
            <Card>
               <CardContent className="p-12 text-center text-muted-foreground">
                  No products match "{search}".
               </CardContent>
            </Card>
         ) : (
            <div className="space-y-6">
               <div
                  className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
               >
                  {products.map((product) => (
                     <ProductCard
                        key={product.id || product._id}
                        product={product}
                        shopId={shopId}
                        onEdit={setEditingProduct}
                        onDelete={handleDeleteProduct}
                        onStatusChange={handleStatusChange}
                        isDeleting={deleteProduct.isPending}
                        isUpdatingStatus={updateProductStatus.isPending}
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
