
export type ResourceType = "user_avatar" | "shop_logo" | "shop_banner" | "product_image" | "category_image" | "return_evidence"
 export type MimeType     = "image/jpeg" | "image/png" | "image/webp"
export interface GenerateSignatureInput {
    userId:       string
    resourceType: ResourceType
    resourceId:   string
    mimeType:     MimeType
}
