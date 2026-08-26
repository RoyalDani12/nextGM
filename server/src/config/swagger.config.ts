import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { authDocs } from "../features/auth/auth.docs.js";
import { shopDocs } from "../features/shop/shop.docs.js";
import { productDocs } from "../features/product/product.docs.js";
import { uploadDocs } from "../features/uploads/upload.docs.js";
import { userDocs } from "../features/users/user.docs.js";
import { cartDocs } from "../features/cart/cart.docs.js";
import { orderDocs } from "../features/orders/orders.docs.js";

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "NXEIO Core Multi-Vendor Platform API",
    version: "1.0.0",
    description: "Production grade engineering architecture endpoints document registry layer."
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Development Environment"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    ...authDocs,
    ...uploadDocs,
    ...userDocs,
    ...shopDocs,
    ...productDocs,
    ...cartDocs,
    ...orderDocs
  }
};
export const setupSwagger = (app: Express): void => {
  // Express v5 absolute clean array routing
  app.use(
    ["/api-docs", "/api-docs/"], 
    swaggerUi.serve, 
    swaggerUi.setup(swaggerDocument)
  );
};