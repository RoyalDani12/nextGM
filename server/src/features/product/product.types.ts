export interface CreateProductData {
    shopId:      string
    categoryId:  string | null
    name:        string
    slug:        string
    description?: string
    sku?:        string
    basePrice:   string
    stock:       number
    type:        "PHYSICAL" | "DIGITAL"
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