export const analyticsDocs = {
  "/api/v1/analytics/{shopId}": {
    "get": {
      "tags": ["Analytics"],
      "summary": "Get shop sales & performance analytics",
      "description": "Calculates revenue, orders completed, average order value, conversion rate, top-selling items, and daily chart series over a timeframe.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" }, "description": "Shop CUID" },
        { "name": "period", "in": "query", "schema": { "type": "string", "enum": ["7d", "30d", "90d", "all"], "default": "30d" } }
      ],
      "responses": {
        "200": {
          "description": "Analytics dataset returned.",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "data": {
                    "type": "object",
                    "properties": {
                      "periodRevenue": { "type": "number", "example": 13679.87 },
                      "completedOrders": { "type": "integer", "example": 94 },
                      "avgOrderValue": { "type": "number", "example": 145.53 },
                      "deliverySuccessRate": { "type": "number", "example": 100 },
                      "itemsSold": { "type": "integer", "example": 236 },
                      "revenueGrowthPct": { "type": "number", "example": 100 },
                      "salesSeries": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "date": { "type": "string", "example": "2026-10-31" },
                            "revenue": { "type": "number", "example": 1250.00 },
                            "orders": { "type": "integer", "example": 8 }
                          }
                        }
                      },
                      "topProducts": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "productId": { "type": "string" },
                            "name": { "type": "string" },
                            "unitsSold": { "type": "integer" },
                            "revenue": { "type": "number" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
