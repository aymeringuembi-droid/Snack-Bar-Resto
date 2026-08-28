import Link from "next/link";
import { ConfigNotice } from "@/components/config-notice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const modules = [
  {
    href: "/commandes",
    title: "Commandes",
    description: "Prise de commande et suivi du statut (en cours, prêt, servi).",
  },
  {
    href: "/stock",
    title: "Stock",
    description: "Suivi des ingrédients et alertes de rupture.",
  },
  {
    href: "/tables",
    title: "Tables & Réservations",
    description: "Plan de salle et gestion des réservations.",
  },
  {
    href: "/caisse",
    title: "Caisse",
    description: "Encaissement, tickets et rapports de vente.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Système de gestion interne pour Snack-Bar-Resto.
        </p>
      </div>

      {!isSupabaseConfigured() && <ConfigNotice />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="rounded-lg border border-black/10 p-4 transition hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
          >
            <h2 className="font-medium">{mod.title}</h2>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              {mod.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
