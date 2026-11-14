-- =====================================================================
-- Caisse bar & snack — comptes par commerce (version 1.1)
--
-- Tables SÉPARÉES de celles de BIG Gestion (comptes / membres / donnees),
-- qui restent intactes : un utilisateur BIG Gestion ne peut pas ouvrir la
-- caisse, et la caisse ne peut jamais écrire dans les données BIG Gestion.
--
--   bar_commerces : un commerce (bar, snack…), identifié par son nom
--   bar_membres   : les utilisateurs d'un commerce (nom d'utilisateur, rôle)
--   bar_donnees   : les données de la caisse du commerce (un bloc JSON)
--
-- Les utilisateurs sont de vrais comptes Supabase Auth. Ils sont créés par
-- la fonction serveur « bar-comptes » (clé service), avec une adresse e-mail
-- technique jamais affichée : on se connecte avec
--   nom du commerce + nom d'utilisateur + mot de passe.
--
-- Écritures : uniquement via la fonction serveur (commerces, membres) et via
-- la fonction bar_enregistrer (données, avec contrôle de version).
-- Script idempotent : peut être relancé sans risque.
-- =====================================================================

create extension if not exists "pgcrypto";
create schema if not exists private;

-- Clé de comparaison d'un nom : minuscules, sans accents, espaces et
-- ponctuation réduits. « Le Baobab », « le  baobab » et « LE BAOBAB » donnent
-- la même clé.
create or replace function private.bar_cle(t text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select btrim(regexp_replace(
    lower(translate(coalesce(t, ''),
      'ÀÂÄÁÃÅÇÉÈÊËÍÎÏÌÑÓÔÖÒÕÚÛÜÙÝŸàâäáãåçéèêëíîïìñóôöòõúûüùýÿ',
      'AAAAAACEEEEIIIINOOOOOUUUUYYaaaaaaceeeeiiiinooooouuuuyy')),
    '[^a-z0-9]+', ' ', 'g'));
$$;
-- Utilisée par les colonnes calculées : la fonction serveur (service_role) doit y avoir accès.
grant usage on schema private to service_role;
grant execute on function private.bar_cle(text) to service_role, authenticated, anon;

-- ---------- Tables ----------

create table if not exists public.bar_commerces (
  id        uuid primary key default gen_random_uuid(),
  nom       text not null check (char_length(btrim(nom)) between 2 and 60),
  nom_cle   text generated always as (private.bar_cle(nom)) stored,
  actif     boolean not null default true,
  cree_par  uuid references auth.users(id) on delete set null,
  cree_le   timestamptz not null default now(),
  constraint bar_commerces_nom_cle_unique unique (nom_cle),
  constraint bar_commerces_nom_cle_non_vide check (nom_cle <> '')
);

create table if not exists public.bar_membres (
  commerce_id     uuid not null references public.bar_commerces(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  identifiant     text not null check (char_length(btrim(identifiant)) between 2 and 30),
  identifiant_cle text generated always as (private.bar_cle(identifiant)) stored,
  nom             text not null check (char_length(btrim(nom)) between 1 and 40),
  role            text not null default 'Employé' check (char_length(role) between 1 and 30),
  est_admin       boolean not null default false,
  email           text not null,
  cree_le         timestamptz not null default now(),
  primary key (commerce_id, user_id),
  constraint bar_membres_user_unique unique (user_id),
  constraint bar_membres_identifiant_unique unique (commerce_id, identifiant_cle)
);

create table if not exists public.bar_donnees (
  commerce_id uuid primary key references public.bar_commerces(id) on delete cascade,
  payload     jsonb not null default '{}'::jsonb,
  version     bigint not null default 0,
  maj_le      timestamptz not null default now(),
  maj_par     uuid references auth.users(id) on delete set null
);

-- ---------- Fonctions d'aide (schéma privé, non exposé par l'API) ----------

create or replace function private.bar_mon_commerce(uid uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.commerce_id
    from public.bar_membres m
    join public.bar_commerces c on c.id = m.commerce_id
   where m.user_id = uid and c.actif;
$$;
revoke all on function private.bar_mon_commerce(uuid) from public;
grant execute on function private.bar_mon_commerce(uuid) to authenticated;
grant usage on schema private to authenticated;

-- ---------- RLS ----------
-- Lecture : uniquement son propre commerce. Aucune écriture directe.

alter table public.bar_commerces enable row level security;
alter table public.bar_membres   enable row level security;
alter table public.bar_donnees   enable row level security;

drop policy if exists bar_commerces_select on public.bar_commerces;
create policy bar_commerces_select on public.bar_commerces
  for select to authenticated
  using (id = (select private.bar_mon_commerce(auth.uid())));

drop policy if exists bar_membres_select on public.bar_membres;
create policy bar_membres_select on public.bar_membres
  for select to authenticated
  using (commerce_id = (select private.bar_mon_commerce(auth.uid())));

drop policy if exists bar_donnees_select on public.bar_donnees;
create policy bar_donnees_select on public.bar_donnees
  for select to authenticated
  using (commerce_id = (select private.bar_mon_commerce(auth.uid())));

revoke all on public.bar_commerces, public.bar_membres, public.bar_donnees from anon;
revoke insert, update, delete, truncate on public.bar_commerces, public.bar_membres, public.bar_donnees from authenticated;
grant select on public.bar_commerces, public.bar_membres, public.bar_donnees to authenticated;
grant all on public.bar_commerces, public.bar_membres, public.bar_donnees to service_role;

-- ---------- RPC : connexion ----------
-- Retrouve l'adresse technique d'un utilisateur à partir du nom du commerce
-- et du nom d'utilisateur. Le mot de passe est ensuite vérifié par Supabase Auth.

create or replace function public.bar_email_connexion(p_commerce text, p_identifiant text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.email
    from public.bar_membres m
    join public.bar_commerces c on c.id = m.commerce_id
   where c.nom_cle = private.bar_cle(p_commerce)
     and m.identifiant_cle = private.bar_cle(p_identifiant)
     and c.actif
   limit 1;
$$;
revoke all on function public.bar_email_connexion(text, text) from public;
grant execute on function public.bar_email_connexion(text, text) to anon, authenticated;

-- Le nom de commerce est-il libre ? (affiché pendant la création)
create or replace function public.bar_nom_disponible(p_commerce text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.bar_cle(p_commerce) <> ''
     and not exists (select 1 from public.bar_commerces c where c.nom_cle = private.bar_cle(p_commerce));
$$;
revoke all on function public.bar_nom_disponible(text) from public;
grant execute on function public.bar_nom_disponible(text) to anon, authenticated;

-- ---------- RPC : enregistrement des données ----------
-- Contrôle de version : l'écriture n'est faite que si p_version correspond à
-- la version en base. Sinon la fonction renvoie NULL et l'application
-- fusionne avec la version en base avant de réessayer (rien n'est écrasé).

create or replace function public.bar_enregistrer(p_commerce uuid, p_payload jsonb, p_version bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new bigint;
begin
  if auth.uid() is null or p_commerce is distinct from private.bar_mon_commerce(auth.uid()) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Données invalides' using errcode = '22023';
  end if;

  update public.bar_donnees
     set payload = p_payload, version = version + 1, maj_le = now(), maj_par = auth.uid()
   where commerce_id = p_commerce and version = p_version
  returning version into v_new;

  if v_new is null and p_version = 0 and not exists (select 1 from public.bar_donnees where commerce_id = p_commerce) then
    insert into public.bar_donnees(commerce_id, payload, version, maj_par)
    values (p_commerce, p_payload, 1, auth.uid())
    on conflict (commerce_id) do nothing
    returning version into v_new;
  end if;

  return v_new; -- NULL = conflit de version
end;
$$;
revoke all on function public.bar_enregistrer(uuid, jsonb, bigint) from public;
grant execute on function public.bar_enregistrer(uuid, jsonb, bigint) to authenticated;

-- ---------- BIG Gestion : ne pas créer d'entreprise pour un utilisateur de la caisse ----------
-- Le déclencheur on_auth_user_created (fonction handle_new_user, inchangée)
-- crée une entreprise BIG Gestion pour CHAQUE nouvel utilisateur Supabase.
-- Les utilisateurs de la caisse sont marqués app_metadata.app = 'bar' par la
-- fonction serveur (seule la clé service peut écrire app_metadata) : on
-- recrée le déclencheur à l'identique, avec une condition qui les ignore.
-- Rien ne change pour les utilisateurs BIG Gestion.

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  when (coalesce(new.raw_app_meta_data->>'app', '') <> 'bar')
  execute function public.handle_new_user();
