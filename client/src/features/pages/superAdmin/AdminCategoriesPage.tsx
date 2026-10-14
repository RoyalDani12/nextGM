import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { getUploadSignatureRequest, uploadToCloudinary } from "@/features/upload/upload.api";
type Category = {
   id: string;
   name: string;
   path: string;
   parentId?: string | null;
   imageUrl?: string | null;
   icon?: string | null;
   isActive: boolean;
   productCount: number;
};
export function AdminCategoriesPage() {
   const client = useQueryClient();
   const [editing, setEditing] = useState<Category | null>(null);
   const [name, setName] = useState("");
   const [parentId, setParentId] = useState("");
   const [icon, setIcon] = useState("");
   const [imageUrl, setImageUrl] = useState("");
   const { data: categories = [] } = useQuery({
      queryKey: ["admin-categories"],
      queryFn: async () =>
         (await api.get("/categories/flat?includeInactive=true")).data.data as Category[],
   });
   const save = async (event: React.FormEvent) => {
      event.preventDefault();
      const payload = {
         name,
         parentId: parentId || null,
         icon: icon || null,
         imageUrl: imageUrl || null,
      };
      if (editing) await api.put(`/categories/${editing.id}`, payload);
      else await api.post("/categories", payload);
      setEditing(null);
      setName("");
      setParentId("");
      setIcon("");
      setImageUrl("");
      client.invalidateQueries({ queryKey: ["admin-categories"] });
      client.invalidateQueries({ queryKey: ["marketplace-categories"] });
   };
   const upload = async (file?: File) => {
      if (!file) return;
      const signature = await getUploadSignatureRequest("category_image", "category", file.type);
      const response = await uploadToCloudinary(file, signature);
      setImageUrl(response.secure_url || response.url);
   };
   return (
      <div className="mx-auto max-w-5xl space-y-6">
         <div>
            <h1 className="text-2xl font-bold">Marketplace Categories</h1>
            <p className="text-sm text-muted-foreground">
               Manage the platform taxonomy used by every tenant.
            </p>
         </div>
         <form onSubmit={save} className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-4">
            <input
               required
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="Category name"
               className="rounded border px-3 py-2"
            />
            <select
               value={parentId}
               onChange={(e) => setParentId(e.target.value)}
               className="rounded border px-3 py-2"
            >
               <option value="">Top-level category</option>
               {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                     {item.path}
                  </option>
               ))}
            </select>
            <input
               value={icon}
               onChange={(e) => setIcon(e.target.value)}
               placeholder="Icon / emoji"
               className="rounded border px-3 py-2"
            />
            <label className="rounded border px-3 py-2 text-sm">
               Upload image
               <input
                  type="file"
                  accept="image/*"
                  className="ml-2"
                  onChange={(e) => upload(e.target.files?.[0])}
               />
            </label>
            {imageUrl && <img src={imageUrl} className="h-12 w-12 rounded object-cover" />}
            <button className="rounded bg-primary px-4 py-2 text-primary-foreground">
               {editing ? "Save category" : "Add category"}
            </button>
            {editing && (
               <button
                  type="button"
                  onClick={() => {
                     setEditing(null);
                     setName("");
                  }}
                  className="rounded border px-4 py-2"
               >
                  Cancel
               </button>
            )}
         </form>
         <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
               <thead className="bg-muted text-left">
                  <tr>
                     <th className="p-3">Category</th>
                     <th>Products</th>
                     <th>Status</th>
                     <th />
                  </tr>
               </thead>
               <tbody>
                  {categories.map((category) => (
                     <tr key={category.id} className="border-t">
                        <td className="p-3">
                           {category.imageUrl && (
                              <img
                                 src={category.imageUrl}
                                 className="mr-2 inline h-8 w-8 rounded object-cover"
                              />
                           )}
                           {category.icon} {category.path}
                        </td>
                        <td>{category.productCount}</td>
                        <td>{category.isActive ? "Active" : "Hidden"}</td>
                        <td>
                           <button
                              onClick={() => {
                                 setEditing(category);
                                 setName(category.name);
                                 setParentId(category.parentId || "");
                                 setIcon(category.icon || "");
                                 setImageUrl(category.imageUrl || "");
                              }}
                              className="text-primary"
                           >
                              Edit
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
}
