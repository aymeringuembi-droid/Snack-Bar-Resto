"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ConfigNotice } from "@/components/config-notice";
import type { Ingredient } from "@/types/database";

export default function StockPage() {
  const configured = isSupabaseConfigured();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("unite");
  const [quantity, setQuantity] = useState("0");
  const [threshold, setThreshold] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  async function loadIngredients() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setIngredients(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (configured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadIngredients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("ingredients").insert({
      name: name.trim(),
      unit,
      quantity: Number(quantity) || 0,
      low_stock_threshold: Number(threshold) || 0,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setName("");
    setQuantity("0");
    setThreshold("0");
    loadIngredients();
  }

  async function adjustQuantity(ingredient: Ingredient, delta: number) {
    const supabase = createClient();
    const newQuantity = Math.max(0, ingredient.quantity + delta);
    const { error } = await supabase
      .from("ingredients")
      .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq("id", ingredient.id);
    if (error) {
      setError(error.message);
      return;
    }
    loadIngredients();
  }

  if (!configured) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Stock</h1>
        <ConfigNotice />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Stock</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Suivi des ingrédients et alertes de rupture.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs text-black/60 dark:text-white/60">
            Ingrédient
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
            placeholder="Ex: Tomates"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-black/60 dark:text-white/60">
            Unité
          </label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-24 rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-black/60 dark:text-white/60">
            Quantité initiale
          </label>
          <input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-28 rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-black/60 dark:text-white/60">
            Seuil d&apos;alerte
          </label>
          <input
            type="number"
            step="0.01"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-28 rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-black px-4 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          Ajouter
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          Chargement…
        </p>
      ) : ingredients.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          Aucun ingrédient enregistré.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left dark:bg-white/5">
              <tr>
                <th className="px-3 py-2">Ingrédient</th>
                <th className="px-3 py-2">Quantité</th>
                <th className="px-3 py-2">Seuil</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Ajuster</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => {
                const low = ing.quantity <= ing.low_stock_threshold;
                return (
                  <tr
                    key={ing.id}
                    className="border-t border-black/10 dark:border-white/10"
                  >
                    <td className="px-3 py-2">{ing.name}</td>
                    <td className="px-3 py-2">
                      {ing.quantity} {ing.unit}
                    </td>
                    <td className="px-3 py-2">
                      {ing.low_stock_threshold} {ing.unit}
                    </td>
                    <td className="px-3 py-2">
                      {low ? (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-700 dark:text-red-300">
                          Stock bas
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-700 dark:text-green-300">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => adjustQuantity(ing, -1)}
                          className="rounded-md border border-black/15 px-2 py-0.5 dark:border-white/15"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => adjustQuantity(ing, 1)}
                          className="rounded-md border border-black/15 px-2 py-0.5 dark:border-white/15"
                        >
                          +1
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
