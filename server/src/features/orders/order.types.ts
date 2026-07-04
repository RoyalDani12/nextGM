import {Prisma } from "@prisma/client"
import { OrderStatus } from "@prisma/client";
export interface shipAddressInput {
  fullName :  string
  phone :      string
  address :     string
  city :       string
  country :    string
  postalCode : string
}

export interface ccartItemForCheckOut {
   id:          string
   quantity:    Number
   productId:   string
   variantId:   string | null
   product:{
    id:         string
    name:       string
    basePrice:  Prisma.Decimal  
    stock:      number
    shopId:     string
    shop: {
      slug: string
      status: string
      profile :{ logo:string |null ,name: string } | null
    }      
   }
   variant: {
    id:string
    price:Prisma.Decimal  
    stock:number
   } | null
}
export interface shopGroup {
  shopId:   string
  shopSlug:  string
  items:  ccartItemForCheckOut[]
}

export interface GetCustomerOrdersOptions {
  customerId : string
  status?:  OrderStatus
  skip:   number
  take:   number
}

export interface GetOrdersQuery {
    status?: OrderStatus
    page?:   number
    limit?:  number
}