export type AnalyticsRange = "7d" | "30d" | "90d" | "12m";

export interface AnalyticsSummary {
    totalRevenue: number;
    revenueGrowth: number;
    totalOrders: number;
    ordersGrowth: number;
    averageOrderValue: number;
    aovGrowth: number;
    unitsSold: number;
    unitsGrowth: number;
    uniqueCustomers: number;
    repeatCustomers: number;
    repeatCustomerRate: number;
    allPlacedOrdersCount: number;
    cancelledOrders: number;
    cancellationRate: number;
    returnRequests: number;
    resolvedReturnRequests: number;
    returnRate: number;
    refundedAmount: number;
    netRevenue: number;
    fulfillmentRate: number;
    peakDay: {
        label: string;
        revenue: number;
        orders: number;
    };
}

export interface AnalyticsTimelinePoint {
    date: string;
    label: string;
    revenue: number;
    orders: number;
    units: number;
    prevRevenue: number;
    prevOrders: number;
}

export interface OrderPipelineItem {
    stage: string;
    count: number;
    productsCount: number;
    totalAmount: number;
}

export interface CustomerLocationItem {
    location: string;
    count: number;
    percentage: number;
}

export interface OrderStatusBreakdownItem {
    status: string;
    count: number;
    percentage: number;
}

export interface TopProductAnalytics {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    price: number;
    stock: number;
    unitsSold: number;
    totalRevenue: number;
}

export interface CriticalStockItem {
    id: string;
    name: string;
    sku: string;
    stock: number;
    maxCapacity: number;
    price: number;
    image: string | null;
}

export interface InventoryHealth {
    totalProducts: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    healthScore: number;
    criticalItems: CriticalStockItem[];
}

export interface RecentOrderAnalytics {
    id: string;
    customerName: string;
    customerEmail: string;
    location: string;
    totalAmount: number;
    status: string;
    itemsCount: number;
    createdAt: string;
}

export interface ShopAnalyticsData {
    summary: AnalyticsSummary;
    timeline: AnalyticsTimelinePoint[];
    orderPipeline: OrderPipelineItem[];
    customerLocations: CustomerLocationItem[];
    orderStatusBreakdown: OrderStatusBreakdownItem[];
    topProducts: TopProductAnalytics[];
    inventoryHealth: InventoryHealth;
    recentOrders: RecentOrderAnalytics[];
}
