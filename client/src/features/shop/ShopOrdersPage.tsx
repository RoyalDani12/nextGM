import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Eye,
  Package,
  RefreshCw,
  CheckCircle2,
  XCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { useShopOrders } from "./shop.hooks";

export const ShopOrdersPage = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  // 1. ALL HOOKS MUST BE DECLARED FIRST
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { data, isLoading, isError, refetch } = useShopOrders(shopId ?? "");

  // Safe data parsing prior to memoization
  const responseData = data?.data ?? data;
  const rawOrders = useMemo(() => {
    if (!responseData) return [];
    return responseData?.orders ?? (Array.isArray(data) ? data : []);
  }, [data, responseData]);

  const pagination = responseData?.pagination ?? {
    total: rawOrders.length,
    page: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Compute metrics and SVG geometry safely in hooks
  const { totalRevenue, confirmedCount, expiredCount, confirmedLen, expiredLen, circumference } = useMemo(() => {
    let revenue = 0;
    let confirmed = 0;
    let expired = 0;

    rawOrders.forEach((order: any) => {
      const amount = parseFloat(order.totalAmount || "0");
      if (order.status === "CONFIRMED") {
        revenue += amount;
        confirmed++;
      } else if (order.status === "EXPIRED") {
        expired++;
      }
    });

    const total = rawOrders.length || 1;
    const radius = 60;
    const circ = 2 * Math.PI * radius;
    const cLen = (confirmed / total) * circ;
    const eLen = (expired / total) * circ;

    return {
      totalRevenue: revenue.toFixed(2),
      confirmedCount: confirmed,
      expiredCount: expired,
      confirmedLen: cLen,
      expiredLen: eLen,
      circumference: circ,
    };
  }, [rawOrders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return rawOrders;
    return rawOrders.filter((order: any) => order.status === statusFilter);
  }, [rawOrders, statusFilter]);

  // 2. EARLY RETURNS PLACED AFTER ALL HOOK DECLARATIONS
  if (!shopId) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Shop ID is missing.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading orders dashboard...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-sm text-destructive">Failed to load shop orders.</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  // 3. MAIN COMPONENT RENDER
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <style>{`
        @keyframes spin-in {
          0% { transform: scale(0.5) rotate(-180deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-spin-in {
          animation: spin-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shop Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time analytics, order status fulfillment, and revenue history.
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="self-start">
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync Orders
        </Button>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Confirmed Revenue
                </p>
                <h3 className="text-3xl font-bold mt-2">${totalRevenue}</h3>
              </div>
              <div className="rounded-full p-3 bg-green-500/10 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Orders
                </p>
                <h3 className="text-3xl font-bold mt-2">{rawOrders.length}</h3>
              </div>
              <div className="rounded-full p-3 bg-primary/10 text-primary">
                <Package className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Confirmed
                </p>
                <h3 className="text-3xl font-bold mt-2">{confirmedCount}</h3>
              </div>
              <div className="rounded-full p-3 bg-blue-500/10 text-blue-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Expired
                </p>
                <h3 className="text-3xl font-bold mt-2">{expiredCount}</h3>
              </div>
              <div className="rounded-full p-3 bg-amber-500/10 text-amber-600">
                <XCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Animated Donut Chart */}
        <Card className="flex flex-col justify-between items-center p-6">
          <div className="w-full flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Order Breakdown</h3>
            <Badge variant="secondary">Live Data</Badge>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 drop-shadow-md">
              <g className="origin-center animate-spin-in">
                {confirmedCount > 0 && (
                  <circle
                    cx="80" cy="80" r="60"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="24"
                    strokeDasharray={`${confirmedLen} ${circumference}`}
                    strokeDashoffset="0"
                    className="origin-center transition-transform duration-300 hover:scale-110 cursor-pointer"
                  />
                )}
                {expiredCount > 0 && (
                  <circle
                    cx="80" cy="80" r="60"
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="24"
                    strokeDasharray={`${expiredLen} ${circumference}`}
                    strokeDashoffset={-confirmedLen}
                    className="origin-center transition-transform duration-300 hover:scale-110 cursor-pointer"
                  />
                )}
              </g>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-2xl font-bold">{rawOrders.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#2563eb]" />
              <span className="text-muted-foreground">Confirmed ({confirmedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Expired ({expiredCount})</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Table */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filter by status:</span>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val ?? "ALL");
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredOrders.length}</span> entries
        </div>
      </div>

      {/* Table */}
      {filteredOrders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed py-16">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">No orders found</CardTitle>
          <CardDescription className="mt-1">
            No orders match the selected filter.
          </CardDescription>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[120px]">Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order: any) => (
                <TableRow key={order.id} className="group">
                  <TableCell className="font-mono text-xs font-medium">
                    #{order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.shipTo?.fullName ?? "N/A"}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.shipTo?.city}, {order.shipTo?.country}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${order.totalAmount}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={order.status === "CONFIRMED" ? "default" : "destructive"}
                      className={`
                        ${order.status === "CONFIRMED" ? "bg-green-500/15 text-green-700 hover:bg-green-500/25 dark:text-green-400" : ""}
                        ${order.status === "EXPIRED" ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-400" : ""}
                      `}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dashboard/shop/${shopId}/orders/${order.id}`)}
                      className=" group-hover:opacity-100  cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/10">
            <div className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{pagination.page}</span> of{" "}
              <span className="font-medium text-foreground">{pagination.totalPages || 1}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPrevPage && currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!pagination.hasNextPage && currentPage >= (pagination.totalPages || 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};