"use client";

import { useEffect, useState } from "react";
import { Search, Phone, Truck, Navigation, ExternalLink, Settings2, PlusCircle, Pencil } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SteadfastBookingModal } from "@/components/dashboard/SteadfastBookingModal";
import { SteadfastTrackModal } from "@/components/dashboard/SteadfastTrackModal";
import { CreateOrderModal } from "@/components/dashboard/CreateOrderModal";
import { EditOrderModal } from "@/components/dashboard/EditOrderModal";
import { useSteadfast } from "@/context/SteadfastContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/lib/hooks/useOrders";
import { getProducts } from "@/lib/api/products";
import type { Product as ApiProduct } from "@/lib/types/product";
import { formatBDT, timeAgo } from "@/lib/utils";
import type { Order, OrderStatus, Product, SteadfastConsignment } from "@/lib/types";

// Real-API Product (lib/types/product.ts) → legacy Product shape consumed by
// CreateOrderModal + Order list (lib/types.ts). Drop this once the modal is
// migrated to the real type.
function adaptProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.title,
    price: p.price,
    stock: p.stock,
    category: p.category,
    status: p.status,
    imageHue: 0,
    createdAt: p.createdAt
  };
}

const STATUS_TONES: Record<OrderStatus, "warning" | "primary" | "success" | "danger"> = {
  pending: "warning",
  confirmed: "primary",
  shipped: "primary",
  delivered: "success",
  cancelled: "danger"
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

export default function OrdersPage() {
  const { toast } = useToast();
  const { hasCredentials, getConsignment } = useSteadfast();

  const { orders, setOrders } = useOrders();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");

  // Pull the real product catalog scoped to this user. `perPage: 200` covers
  // most catalogs without pagination — for larger catalogs we'd need a search
  // inside CreateOrderModal. Re-fetches when the authenticated user changes
  // so signing into a different account doesn't show the previous user's
  // products.
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setProducts([]);
      return;
    }
    setProductsLoading(true);
    getProducts({ perPage: 200 })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data.map(adaptProduct));
      })
      .catch((err) => {
        if (cancelled) return;
        toast(err instanceof Error ? err.message : "Could not load products.", "error");
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, toast]);

  // Create order modal state
  const [createOpen, setCreateOpen] = useState(false);

  // Edit order modal state
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  // Steadfast modal state
  const [bookingOrder, setBookingOrder] = useState<Order | null>(null);
  const [trackOrder, setTrackOrder] = useState<{ order: Order; consignment: SteadfastConsignment } | null>(null);

  const filtered = orders.filter((o) => {
    const matchesQ =
      o.customer.toLowerCase().includes(query.toLowerCase()) ||
      o.id.toLowerCase().includes(query.toLowerCase()) ||
      o.product.toLowerCase().includes(query.toLowerCase());
    const matchesS = status === "all" || o.status === status;
    return matchesQ && matchesS;
  });

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length
  };

  function advance(o: Order) {
    const next: Record<OrderStatus, OrderStatus> = {
      pending: "confirmed",
      confirmed: "confirmed", // "confirmed" stays until Steadfast is booked
      shipped: "delivered",
      delivered: "delivered",
      cancelled: "cancelled"
    };
    const newStatus = next[o.status];
    if (newStatus === o.status && o.status !== "pending") {
      toast("Order is already finalized.", "info");
      return;
    }
    if (o.status === "pending") {
      setOrders((prev) =>
        prev.map((x) => (x.id === o.id ? { ...x, status: "confirmed" } : x))
      );
      toast(`${o.id} confirmed.`, "success");
      return;
    }
    if (o.status === "shipped") {
      setOrders((prev) =>
        prev.map((x) => (x.id === o.id ? { ...x, status: "delivered" } : x))
      );
      toast(`${o.id} marked as Delivered.`, "success");
    }
  }

  function nextOrderId(): string {
    const nums = orders
      .map((o) => parseInt(o.id.replace("ORD-", ""), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 1042;
    return `ORD-${max + 1}`;
  }

  function handleOrderCreated(
    order: Order,
    _consignment: SteadfastConsignment | null,
    productId: string,
    qty: number
  ) {
    setOrders((prev) => [order, ...prev]);
    // Deduct stock for the ordered product
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, stock: Math.max(0, p.stock - qty), status: p.stock - qty <= 0 ? "out_of_stock" : p.status }
          : p
      )
    );
  }

  function handleBooked(orderId: string, consignment: SteadfastConsignment) {
    setOrders((prev) =>
      prev.map((x) =>
        x.id === orderId
          ? {
              ...x,
              status: "shipped",
              courier: "Steadfast",
              consignmentId: consignment.consignmentId,
              trackingCode: consignment.trackingCode,
              steadfastStatus: consignment.status,
              deliveryAddress: consignment.deliveryAddress
            }
          : x
      )
    );
  }

  function handleOrderSaved(updated: Order) {
    setOrders((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  }

  function openTrack(o: Order) {
    const c = getConsignment(o.id);
    if (!c) return;
    setTrackOrder({ order: o, consignment: c });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Orders</h1>
          <p className="text-sm text-ink-muted">
            {orders.length} total orders · {counts.pending} pending action.
          </p>
        </div>

        <Button
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={() => setCreateOpen(true)}
          disabled={productsLoading || products.length === 0}
          title={
            productsLoading
              ? "Loading your products…"
              : products.length === 0
                ? "Add a product before creating orders"
                : undefined
          }
        >
          Create Order
        </Button>

        {/* Credential status strip */}
        {!hasCredentials && (
          <Link href="/integrations">
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-warning/60 bg-warning/5 px-3 py-2 text-xs">
              <Settings2 className="h-3.5 w-3.5 text-warning" />
              <span className="text-ink-muted">
                Add Steadfast credentials in{" "}
                <span className="font-semibold text-ink">Settings</span> to book deliveries.
              </span>
              <ExternalLink className="h-3 w-3 text-ink-subtle" />
            </div>
          </Link>
        )}
      </div>

      {/* No-products guidance — show only after the catalog has actually loaded
          to avoid flashing during the initial fetch. */}
      {!productsLoading && products.length === 0 && (
        <Link href="/products">
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-xs">
            <PlusCircle className="h-3.5 w-3.5 text-primary" />
            <span className="text-ink-muted">
              Add at least one product before creating orders.{" "}
              <span className="font-semibold text-ink">Go to Products →</span>
            </span>
          </div>
        </Link>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          ["all", "All"],
          ["pending", "Pending"],
          ["confirmed", "Confirmed"],
          ["shipped", "Shipped"],
          ["delivered", "Delivered"],
          ["cancelled", "Cancelled"]
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatus(key as typeof status)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              status === key
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-ink-muted hover:border-primary/40 hover:text-ink"
            }`}
          >
            {label}{" "}
            <span className="ml-1 opacity-70">{counts[key as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by customer, order ID, or product…"
              leftIcon={<Search className="h-4 w-4" />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="sm:w-44">
            <Select
              value={status}
              onChange={(e) => setStatus((e.target as HTMLSelectElement).value as typeof status)}
              options={[
                { label: "All status", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Confirmed", value: "confirmed" },
                { label: "Shipped", value: "shipped" },
                { label: "Delivered", value: "delivered" },
                { label: "Cancelled", value: "cancelled" }
              ]}
            />
          </div>
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden lg:block">
          <table className="w-full text-sm">
            <thead className="bg-bg/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Courier / Tracking</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => {
                const consignment = getConsignment(o.id);
                return (
                  <tr key={o.id} className="transition hover:bg-bg/40">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">{o.id}</p>
                      <p className="line-clamp-1 max-w-[200px] text-xs text-ink-muted">{o.product}</p>
                      <p className="text-[11px] text-ink-subtle">{timeAgo(o.createdAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-ink">{o.customer}</p>
                      <p className="text-xs text-ink-muted">{o.phone}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-ink">{formatBDT(o.amount)}</td>
                    <td className="px-5 py-4">
                      <Badge tone={STATUS_TONES[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      {consignment ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-semibold text-ink">Steadfast</span>
                          </div>
                          <button
                            onClick={() => openTrack(o)}
                            className="mt-0.5 font-mono text-xs tracking-widest text-primary hover:underline"
                          >
                            {consignment.trackingCode}
                          </button>
                        </div>
                      ) : o.courier !== "—" ? (
                        <span className="inline-flex items-center gap-1 text-ink-muted">
                          <Truck className="h-3.5 w-3.5" /> {o.courier}
                        </span>
                      ) : (
                        <span className="text-ink-subtle">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => setEditOrder(o)}
                          className="rounded-lg p-1.5 text-ink-subtle transition hover:bg-border hover:text-ink"
                          title="Edit order"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        {/* Confirm pending */}
                        {o.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => advance(o)}>
                            Confirm
                          </Button>
                        )}

                        {/* Book Steadfast for confirmed orders */}
                        {o.status === "confirmed" && (
                          <Button
                            size="sm"
                            leftIcon={<Truck className="h-3.5 w-3.5" />}
                            onClick={() => setBookingOrder(o)}
                          >
                            Book Steadfast
                          </Button>
                        )}

                        {/* Track for shipped orders with consignment */}
                        {o.status === "shipped" && consignment && (
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<Navigation className="h-3.5 w-3.5" />}
                            onClick={() => openTrack(o)}
                          >
                            Track
                          </Button>
                        )}

                        {/* Mark delivered */}
                        {o.status === "shipped" && (
                          <Button size="sm" variant="outline" onClick={() => advance(o)}>
                            Delivered
                          </Button>
                        )}

                        {(o.status === "delivered" || o.status === "cancelled") && (
                          <span className="text-xs text-ink-subtle">Done</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Mobile + tablet cards ── */}
        <div className="space-y-3 p-4 lg:hidden">
          {filtered.map((o) => {
            const consignment = getConsignment(o.id);
            return (
              <div key={o.id} className="rounded-xl border border-border bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{o.id}</p>
                    <p className="text-[11px] text-ink-subtle">{timeAgo(o.createdAt)}</p>
                  </div>
                  <Badge tone={STATUS_TONES[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                </div>

                <p className="mt-2 line-clamp-1 text-sm text-ink">{o.product}</p>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                  <span className="font-medium text-ink">{o.customer}</span>
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {o.phone}
                  </span>
                </div>

                {/* Tracking pill for mobile */}
                {consignment && (
                  <button
                    onClick={() => openTrack(o)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                  >
                    <Truck className="h-3 w-3" />
                    {consignment.trackingCode}
                    <Navigation className="h-3 w-3" />
                  </button>
                )}

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{formatBDT(o.amount)}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setEditOrder(o)}
                      className="rounded-lg p-1.5 text-ink-subtle transition hover:bg-border hover:text-ink"
                      title="Edit order"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {o.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => advance(o)}>
                        Confirm
                      </Button>
                    )}
                    {o.status === "confirmed" && (
                      <Button
                        size="sm"
                        leftIcon={<Truck className="h-3.5 w-3.5" />}
                        onClick={() => setBookingOrder(o)}
                      >
                        Book
                      </Button>
                    )}
                    {o.status === "shipped" && consignment && (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Navigation className="h-3.5 w-3.5" />}
                        onClick={() => openTrack(o)}
                      >
                        Track
                      </Button>
                    )}
                    {o.status === "shipped" && (
                      <Button size="sm" variant="outline" onClick={() => advance(o)}>
                        Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-ink-muted">No orders match your filters.</p>
          </div>
        )}
      </Card>

      {/* Edit order modal */}
      <EditOrderModal
        open={!!editOrder}
        onClose={() => setEditOrder(null)}
        order={editOrder}
        onSaved={handleOrderSaved}
      />

      {/* Create order modal */}
      <CreateOrderModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleOrderCreated}
        nextOrderId={nextOrderId()}
        products={products}
      />

      {/* Steadfast booking modal */}
      {bookingOrder && (
        <SteadfastBookingModal
          order={bookingOrder}
          open={!!bookingOrder}
          onClose={() => setBookingOrder(null)}
          onBooked={(orderId, consignment) => {
            handleBooked(orderId, consignment);
            setBookingOrder(null);
          }}
        />
      )}

      {/* Steadfast tracking modal */}
      {trackOrder && (
        <SteadfastTrackModal
          orderId={trackOrder.order.id}
          consignment={trackOrder.consignment}
          open={!!trackOrder}
          onClose={() => setTrackOrder(null)}
        />
      )}
    </div>
  );
}
