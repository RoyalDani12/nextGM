export interface CreateProductRepositoryInput {
  shopId: string;
  categoryId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  sku?: string | null;
  basePrice: string | number;
  stock: number;
  type?: "PHYSICAL" | "DIGITAL";
  images?: string[]; // Cloudinary HTTPS URLs sent from frontend
}

export interface GetShopProductsOptions {
    shopId:  string
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED"
    skip:    number
    take:    number
    sort:    string
    order:   "asc" | "desc"
}

export interface GetShopProductsQuery {
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED"
    page?:   number
    limit?:  number
    sort?:   string
    order?:  "asc" | "desc"
}

export interface UpdateProductInput {
    name?:        string
    description?: string
    basePrice?:   string
    stock?:       number
    categoryId?:  string
    sku?:         string
    images?:string
}

export interface BrowseProductsOptions {
    skip:        number
    take:        number
    sort:        string
    order:       "asc" | "desc"
    shopId?:     string
    categoryId?: string
    type?:       "PHYSICAL" | "DIGITAL"
    minPrice?:   string
    maxPrice?:   string
    search?:     string
}

export interface BrowseProductsQuery {
    page?:       number
    limit?:      number
    sort?:       string
    order?:      "asc" | "desc"
    shopId?:     string
    categoryId?: string
    type?:       "PHYSICAL" | "DIGITAL"
    minPrice?:   string
    maxPrice?:   string
    search?:     string
}