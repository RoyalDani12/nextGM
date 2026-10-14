export interface ProductImageInput {
    url: string;
    isPrimary?: boolean;
}

export interface CreateProductData {
    shopId:      string
    categoryId:  string | null
    platformCategoryId?: string | null
    name:        string
    slug:        string
    description?: string
    sku?:        string
    basePrice:   string
    stock:       number
    type:        "PHYSICAL" | "DIGITAL"
    images?:     ProductImageInput[]
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
    platformCategoryId?: string | null
    sku?:         string
    images?:      (string | ProductImageInput)[]
}

export interface BrowseProductsOptions {
    skip:        number
    take:        number
    sort:        "createdAt" | "basePrice" | "rating" | "name"
    order:       "asc" | "desc"
    shopId?:     string
    categoryId?: string
    categorySlug?: string
    type?:       "PHYSICAL" | "DIGITAL"
    minPrice?:   string
    maxPrice?:   string
    inStockOnly?: boolean
    minRating?: number
    verifiedShopsOnly?: boolean
    search?:     string
}

export interface BrowseProductsQuery {
    page?:       number
    limit?:      number
    sort?:       "createdAt" | "basePrice" | "rating" | "name"
    order?:      "asc" | "desc"
    shopId?:     string
    categoryId?: string
    categorySlug?: string
    type?:       "PHYSICAL" | "DIGITAL"
    minPrice?:   string
    maxPrice?:   string
    inStockOnly?: boolean
    minRating?: number
    verifiedShopsOnly?: boolean
    search?:     string
}
