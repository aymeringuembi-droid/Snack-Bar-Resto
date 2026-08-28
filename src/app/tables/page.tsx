"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ConfigNotice } from "@/components/config-notice";
import type { Reservation, RestaurantTable } from "@/types/database";

const statusLabels: Record<RestaurantTable["status"], string> = {
  libre: "Libre",
  occupee: "Occupée",
  reservee: "Réservée",
};

const statusStyles: Record<RestaurantTable["status"], string> = {
  libre: "bg-green-500/10 text-green-700 dark:text-green-300",
  occupee: "bg-red-500/10 text-red-700 dark:text-red-300",
  reservee: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

export default function TablesPage() {
  const configured = isSupabaseConfigured();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);

  const [tableLabel, setTableLabel] = useState("");
  const [tableSeats, setTableSeats] = useState("2");

  const [resName, setResName] = useState("");
  const [resPhone, setResPhone] = useState("");
  const [resPartySize, setResPartySize] = useState("2");
  const [resTime, setResTime] = useState("");
  const [resTableId, setResTableId] = useState("");

  async function loadData() {
    const supabase = createClient();
    const [{ data: tablesData, error: tablesError }, { data: resData, error: resError }] =
      await Promise.all([
        supabase.from("restaurant_tables").select("*").order("label"),
        supabase
          .from("reservations")
          .select("*")
          .order("reservation_time", { ascending: true }),
      ]);
    if (tablesError) setError(tablesError.message);
    else if (resError) setError(resError.message);
    setTables(tablesData ?? []);
    setReservations(resData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (configured) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addTable(e: FormEvent) {
    e.preventDefault();
    if (!tableLabel.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from("restaurant_tables").insert({
      label: tableLabel.trim(),
      seats: Number(tableSeats) || 1,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setTableLabel("");
    setTableSeats("2");
    loadData();
  }

  async function setTableStatus(table: RestaurantTable, status: RestaurantTable["status"]) {
    const supabase = createClient();
    const { error } = await supabase
      .from("restaurant_tables")
      .update({ status })
      .eq("id", table.id);
    if (error) setError(error.message);
    else loadData();
  }

  async function addReservation(e: FormEvent) {
    e.preventDefault();
    if (!resName.trim() || !resTime) return;
    const supabase = createClient();
    const { error } = await supabase.from("reservations").insert({
      customer_name: resName.trim(),
      customer_phone: resPhone.trim() || null,
      party_size: Number(resPartySize) || 1,
      reservation_time: new Date(resTime).toISOString(),
      table_id: resTableId || null,
    });
    if (error) {
      setError(error.message);
      return;
    }
    if (resTableId) {
      await supabase
        .from("restaurant_tables")
        .update({ status: "reservee" })
        .eq("id", resTableId);
    }
    setResName("");
    setResPhone("");
    setResPartySize("2");
    setResTime("");
    setResTableId("");
    loadData();
  }

  async function cancelReservation(reservation: Reservation) {
    const supabase = createClient();
    const { error } = await supabase
      .from("reservations")
      .update({ status: "annulee" })
      .eq("id", reservation.id);
    if (error) setError(error.message);
    else loadData();
  }

  if (!configured) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Tables & Réservations</h1>
        <ConfigNotice />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Tables & Réservations</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Plan de salle et gestion des réservations.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Plan de salle</h2>
        <form
          onSubmit={addTable}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-black/60 dark:text-white/60">
              Nom de la table
            </label>
            <input
              value={tableLabel}
              onChange={(e) => setTableLabel(e.target.value)}
              required
              placeholder="Ex: Table 1"
              className="rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-black/60 dark:text-white/60">
              Places
            </label>
            <input
              type="number"
              min="1"
              value={tableSeats}
              onChange={(e) => setTableSeats(e.target.value)}
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-1.5 text-sm text-white dark:bg-white dark:text-black"
          >
            Ajouter une table
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-black/60 dark:text-white/60">Chargement…</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className="rounded-lg border border-black/10 p-3 dark:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{table.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${statusStyles[table.status]}`}
                  >
                    {statusLabels[table.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-black/60 dark:text-white/60">
                  {table.seats} places
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(["libre", "occupee", "reservee"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setTableStatus(table, status)}
                      disabled={table.status === status}
                      className="rounded-md border border-black/15 px-2 py-0.5 text-xs disabled:opacity-40 dark:border-white/15"
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Réservations</h2>
        <form
          onSubmit={addReservation}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-black/60 dark:text-white/60">
              Client
            </label>
            <input
              value={resName}
              onChange={(e) => setResName(e.target.value)}
              required
              className="rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-black/60 dark:text-white/60">
              Téléphone
            </label>
            <input
              value={resPhone}
              onChange={(e) => setResPhone(e.target.value)}
              className="rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-black/60 dark:text-white/60">
              Nb personnes
            </label>
            <input
              type="number"
              min="1"
              value={resPartySize}
              onChange={(e) => setResPartySize(e.target.value)}
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-black/60 dark:text-white/60">
              Date & heure
            </label>
            <input
              type="datetime-local"
              value={resTime}
              onChange={(e) => setResTime(e.target.value)}
              required
              className="rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-black/60 dark:text-white/60">
              Table (optionnel)
            </label>
            <select
              value={resTableId}
              onChange={(e) => setResTableId(e.target.value)}
              className="rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
            >
              <option value="">—</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-1.5 text-sm text-white dark:bg-white dark:text-black"
          >
            Réserver
          </button>
        </form>

        {reservations.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Aucune réservation.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-left dark:bg-white/5">
                <tr>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Date & heure</th>
                  <th className="px-3 py-2">Personnes</th>
                  <th className="px-3 py-2">Table</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr
                    key={res.id}
                    className="border-t border-black/10 dark:border-white/10"
                  >
                    <td className="px-3 py-2">
                      {res.customer_name}
                      {res.customer_phone ? ` · ${res.customer_phone}` : ""}
                    </td>
                    <td className="px-3 py-2">
                      {new Date(res.reservation_time).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-2">{res.party_size}</td>
                    <td className="px-3 py-2">
                      {tables.find((t) => t.id === res.table_id)?.label ?? "—"}
                    </td>
                    <td className="px-3 py-2 capitalize">{res.status}</td>
                    <td className="px-3 py-2">
                      {res.status === "confirmee" && (
                        <button
                          onClick={() => cancelReservation(res)}
                          className="rounded-md border border-black/15 px-2 py-0.5 text-xs dark:border-white/15"
                        >
                          Annuler
                        </button>
                      )}
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
