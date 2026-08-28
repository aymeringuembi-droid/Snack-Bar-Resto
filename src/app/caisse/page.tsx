"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ConfigNotice } from "@/components/config-notice";
import type { Order, Payment, RestaurantTable } from "@/types/database";

const methodLabels: Record<Payment["method"], string> = {
  especes: "Espèces",
  carte: "Carte",
  mobile: "Mobile",
};

export default function CaissePage() {
  const configured = isSupabaseConfigured();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<Payment["method"]>("especes");

  async function loadData() {
    const supabase = createClient();
    const [{ data: ordersData, error: ordersError }, { data: paymentsData }, { data: tablesData }] =
      await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .neq("status", "annulee")
          .order("created_at", { ascending: false }),
        supabase.from("payments").select("*"),
        supabase.from("restaurant_tables").select("*"),
      ]);
    if (ordersError) setError(ordersError.message);
    setOrders(ordersData ?? []);
    setPayments(paymentsData ?? []);
    setTables(tablesData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (configured) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paidOrderIds = useMemo(
    () => new Set(payments.map((p) => p.order_id)),
    [payments]
  );

  const unpaidOrders = orders.filter(
    (o) => o.status === "servi" && !paidOrderIds.has(o.id)
  );

  const today = new Date().toDateString();
  const todaysPayments = payments.filter(
    (p) => new Date(p.paid_at).toDateString() === today
  );
  const todaysTotal = todaysPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalsByMethod = todaysPayments.reduce<Record<string, number>>((acc, p) => {
    acc[p.method] = (acc[p.method] ?? 0) + p.amount;
    return acc;
  }, {});

  async function encaisser(order: Order) {
    const supabase = createClient();
    setError(null);
    const { error } = await supabase.from("payments").insert({
      order_id: order.id,
      amount: order.total,
      method,
    });
    if (error) {
      setError(error.message);
      return;
    }
    if (order.table_id) {
      await supabase
        .from("restaurant_tables")
        .update({ status: "libre" })
        .eq("id", order.table_id);
    }
    loadData();
  }

  if (!configured) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Caisse</h1>
        <ConfigNotice />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Caisse</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Encaissement et rapport de vente du jour.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-xs text-black/60 dark:text-white/60">Total du jour</p>
          <p className="mt-1 text-xl font-semibold">{todaysTotal.toFixed(2)} €</p>
        </div>
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-xs text-black/60 dark:text-white/60">Tickets encaissés</p>
          <p className="mt-1 text-xl font-semibold">{todaysPayments.length}</p>
        </div>
        {(["especes", "carte", "mobile"] as const).map((m) => (
          <div key={m} className="rounded-lg border border-black/10 p-4 dark:border-white/10">
            <p className="text-xs text-black/60 dark:text-white/60">{methodLabels[m]}</p>
            <p className="mt-1 text-xl font-semibold">
              {(totalsByMethod[m] ?? 0).toFixed(2)} €
            </p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium">Commandes à encaisser</h2>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-black/60 dark:text-white/60">
              Moyen de paiement
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as Payment["method"])}
              className="rounded-md border border-black/15 px-2 py-1 dark:border-white/15 dark:bg-transparent"
            >
              {(["especes", "carte", "mobile"] as const).map((m) => (
                <option key={m} value={m}>
                  {methodLabels[m]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-black/60 dark:text-white/60">Chargement…</p>
        ) : unpaidOrders.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Aucune commande servie en attente d&apos;encaissement.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-left dark:bg-white/5">
                <tr>
                  <th className="px-3 py-2">Table</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {unpaidOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-black/10 dark:border-white/10"
                  >
                    <td className="px-3 py-2">
                      {tables.find((t) => t.id === order.table_id)?.label ??
                        "À emporter"}
                    </td>
                    <td className="px-3 py-2">{order.total.toFixed(2)} €</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => encaisser(order)}
                        className="rounded-md bg-black px-3 py-1 text-xs text-white dark:bg-white dark:text-black"
                      >
                        Encaisser
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
