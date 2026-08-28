-- Snack-Bar-Resto: schema initial
-- Modules: menu, stock, tables/reservations, commandes, caisse

create extension if not exists "pgcrypto";

-- ========== MENU ==========

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

-- ========== STOCK ==========

create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  unit text not null default 'unite', -- kg, g, l, ml, unite...
  quantity numeric(10,2) not null default 0,
  low_stock_threshold numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recette: lien produit <-> ingredients consommes
create table if not exists product_ingredients (
  product_id uuid not null references products(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  quantity numeric(10,2) not null check (quantity > 0),
  primary key (product_id, ingredient_id)
);

-- ========== TABLES / RESERVATIONS ==========

create table if not exists restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  label text not null unique, -- ex: "Table 1"
  seats int not null default 2,
  status text not null default 'libre' check (status in ('libre', 'occupee', 'reservee')),
  created_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references restaurant_tables(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  party_size int not null default 1,
  reservation_time timestamptz not null,
  status text not null default 'confirmee' check (status in ('confirmee', 'annulee', 'terminee')),
  notes text,
  created_at timestamptz not null default now()
);

-- ========== COMMANDES ==========

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references restaurant_tables(id) on delete set null,
  status text not null default 'en_cours' check (status in ('en_cours', 'pret', 'servi', 'annulee')),
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null, -- copie au moment de la commande
  unit_price numeric(10,2) not null,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

-- ========== CAISSE / FACTURATION ==========

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  method text not null default 'especes' check (method in ('especes', 'carte', 'mobile')),
  paid_at timestamptz not null default now()
);

-- ========== INDEXES ==========

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_reservations_time on reservations(reservation_time);
create index if not exists idx_payments_order on payments(order_id);
