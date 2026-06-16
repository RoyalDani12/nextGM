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