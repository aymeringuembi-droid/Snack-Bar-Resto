# Snack-Bar-Resto

Système de gestion interne pour un snack-bar / restaurant : commandes, stock,
tables & réservations, et caisse.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- [Supabase](https://supabase.com) (base de données Postgres, client via
  `@supabase/ssr`)

## Modules

- **Commandes** (`/commandes`) — menu, prise de commande, suivi du statut
  (en cours → prêt → servi)
- **Stock** (`/stock`) — suivi des ingrédients, alertes de rupture
- **Tables & Réservations** (`/tables`) — plan de salle, réservations
- **Caisse** (`/caisse`) — encaissement, rapport de vente du jour

## Démarrage

1. Copier `.env.example` vers `.env.local` et renseigner les clés Supabase :

   ```bash
   cp .env.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

2. Appliquer le schéma SQL du dossier [`supabase/migrations`](./supabase/migrations)
   sur ton projet Supabase (via le SQL Editor du dashboard, ou la CLI
   Supabase).

3. Installer les dépendances et lancer le serveur de développement :

   ```bash
   npm install
   npm run dev
   ```

   Ouvrir [http://localhost:3000](http://localhost:3000).

Tant que les variables Supabase ne sont pas configurées, chaque module
affiche un message d'avertissement au lieu de planter.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run lint` — vérification ESLint
