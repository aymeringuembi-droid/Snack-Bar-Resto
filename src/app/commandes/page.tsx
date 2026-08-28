"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ConfigNotice } from "@/components/config-notice";
import type {
  Order,
  OrderItem,
  OrderStatus,
  Product,
  RestaurantTable,
} from "@/types/database";

const statusFlow: OrderStatus[] = ["en_cours", "pret", "servi"];
const statusLabels: Record<OrderStatus, string> = {
  en_cours: "En cours",
  pret: "Prêt",
  servi: "Servi",
  annulee: "Annulée",
};
const statusStyles: Record<OrderStatus, string> = {
  en_cours: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  pret: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  servi: "bg-green-500/10 text-green-700 dark:text-green-300",
  annulee: "bg-red-500/10 text-red-700 dark:text-red-300",
};

type Cart = Record<string, number>; // product_id -> quantity

export default function CommandesPage() {
  const configured = isSupabaseConfigured();
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("0");

  const [cart, setCart] = useState<Cart>({});
  const [orderTableId, setOrderTableId] = useState("");

  async function loadData() {
    const supabase = createClient();
    const [
      { data: productsData, error: productsError },
      { data: tablesData },
      { data: ordersData, error: ordersError },
      { data: itemsData },
    ] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("restaurant_tables").select("*").order("label"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("order_items").select("*"),
    ]);
    if (productsError) setError(productsError.message);
    else if (ordersError) setError(ordersError.message);
    setProducts(productsData ?? []);
    setTables(tablesData ?? []);
    setOrders(ordersData ?? []);
    setItems(itemsData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (configured) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addProduct(e: FormEvent) {
    e.preventDefault();
    if (!productName.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from("products").insert({
      name: productName.trim(),
      price: Number(productPrice) || 0,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setProductName("");
    setProductPrice("0");
    loadData();
  }

  function addToCart(productId: string) {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const next = { ...prev };
      if (!next[productId]) return next;
      next[productId] -= 1;
      if (next[productId] <= 0) delete next[productId];
      return next;
    });
  }

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((sum, [productId, qty]) => {
      const product = products.find((p) => p.id === productId);
      return sum + (product ? product.price * qty : 0);
    }, 0);
  }, [cart, products]);

  async function submitOrder() {
    const entries = Object.entries(cart);
    if (entries.length === 0) return;
    const supabase = createClient();
    setError(null);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        table_id: orderTableId || null,
        total: cartTotal,
        status: "en_cours",
      })
      .select()
      .single();

    if (orderError || !order) {
      setError(orderError?.message ?? "Erreur lors de la création de la commande");
      return;
    }

    const orderItems = entries.map(([productId, qty]) => {
      const product = products.find((p) => p.id === productId)!;
      return {
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: qty,
      };
    });

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      setError(itemsError.message);
      return;
    }

    if (orderTableId) {
      await supabase
        .from("restaurant_tables")
        .update({ status: "occupee" })
        .eq("id", orderTableId);
    }

    setCart({});
    setOrderTableId("");
    loadData();
  }

  async function advanceStatus(order: Order) {
    const idx = statusFlow.indexOf(order.status);
    const next = statusFlow[idx + 1];
    if (!next) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    if (error) setError(error.message);
    else loadData();
  }

  async function cancelOrder(order: Order) {
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: "annulee", updated_at: new Date().toISOString() })
      .eq("id", order.id);
    if (error) setError(error.message);
    else loadData();
  }

  if (!configured) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Commandes</h1>
        <ConfigNotice />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Commandes</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Prise de commande et suivi du statut.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Menu</h2>
        <form
          onSubmit={addProduct}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-black/60 dark:text-white/60">
              Nom du produit
            </label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              placeholder="Ex: Burger classique"
              className="rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-black/60 dark:text-white/60">
              Prix (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-1.5 text-sm text-white dark:bg-white dark:text-black"
          >
            Ajouter au menu
          </button>
        </form>

        {!loading && products.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Aucun produit au menu. Ajoutes-en un ci-dessus pour commencer à
            prendre des commandes.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p.id)}
                className="flex flex-col items-start rounded-lg border border-black/10 p-3 text-left hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-black/60 dark:text-white/60">
                  {p.price.toFixed(2)} €
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Nouvelle commande</h2>
        {Object.keys(cart).length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Clique sur un produit du menu pour l&apos;ajouter à la commande.
          </p>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10">
            {Object.entries(cart).map(([productId, qty]) => {
              const product = products.find((p) => p.id === productId);
              if (!product) return null;
              return (
                <div key={productId} className="flex items-center justify-between text-sm">
                  <span>{product.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeFromCart(productId)}
                      className="rounded-md border border-black/15 px-2 dark:border-white/15"
                    >
                      -
                    </button>
                    <span>{qty}</span>
                    <button
                      onClick={() => addToCart(productId)}
                      className="rounded-md border border-black/15 px-2 dark:border-white/15"
                    >
                      +
                    </button>
                    <span className="w-16 text-right">
                      {(product.price * qty).toFixed(2)} €
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-3 dark:border-white/10">
              <div className="flex items-center gap-2 text-sm">
                <label className="text-black/60 dark:text-white/60">Table</label>
                <select
                  value={orderTableId}
                  onChange={(e) => setOrderTableId(e.target.value)}
                  className="rounded-md border border-black/15 px-2 py-1 dark:border-white/15 dark:bg-transparent"
                >
                  <option value="">À emporter</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">Total: {cartTotal.toFixed(2)} €</span>
                <button
                  onClick={submitOrder}
                  className="rounded-md bg-black px-4 py-1.5 text-sm text-white dark:bg-white dark:text-black"
                >
                  Valider la commande
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Commandes en cours</h2>
        {loading ? (
          <p className="text-sm text-black/60 dark:text-white/60">Chargement…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Aucune commande.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const orderItems = items.filter((i) => i.order_id === order.id);
              const table = tables.find((t) => t.id === order.table_id);
              return (
                <div
                  key={order.id}
                  className="rounded-lg border border-black/10 p-4 dark:border-white/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {table ? table.label : "À emporter"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${statusStyles[order.status]}`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {order.total.toFixed(2)} €
                      </span>
                      {order.status !== "servi" && order.status !== "annulee" && (
                        <>
                          <button
                            onClick={() => advanceStatus(order)}
                            className="rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/15"
                          >
                            Marquer{" "}
                            {statusLabels[statusFlow[statusFlow.indexOf(order.status) + 1]]}
                          </button>
                          <button
                            onClick={() => cancelOrder(order)}
                            className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-700 dark:text-red-300"
                          >
                            Annuler
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <ul className="mt-2 text-sm text-black/70 dark:text-white/70">
                    {orderItems.map((item) => (
                      <li key={item.id}>
                        {item.quantity} × {item.product_name}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
