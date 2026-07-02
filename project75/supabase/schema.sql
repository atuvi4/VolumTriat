-- Backend Nutrition Pro v1 — esquema Supabase (opcional).
-- Executa'l al SQL editor de Supabase quan vulguis activar la persistència.
-- Res d'això és obligatori: sense Supabase, l'app funciona amb base local.
-- NOTA: RLS recomanat abans d'obrir cap taula al client (anon). El cache
-- i els outcomes els escriu el backend amb la service_role.

create extension if not exists "pgcrypto";

-- Aliments normalitzats (cache de resultats d'API i base pròpia).
create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source text,
  name text not null,
  brand text,
  kcal_per_100g numeric,
  protein_per_100g numeric,
  carbs_per_100g numeric,
  fat_per_100g numeric,
  confidence text,
  created_at timestamptz default now()
);
create index if not exists foods_external_id_idx on foods (external_id);

-- Receptes (futur: sincronitzar RECIPE_POOL / receptes pròpies).
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slot text,
  ingredients jsonb,
  tags text[],
  source text,
  confidence text,
  created_at timestamptz default now()
);

-- Project75 Brain — outcomes (mirall del dataset local, per a aprenentatge futur).
create table if not exists brain_outcomes (
  id text primary key,
  user_id text,
  date text,
  timestamp text,
  slot text,
  meal_name text,
  recipe_id text,
  action text,
  kcal numeric,
  protein numeric,
  source text,
  confidence text,
  appetite text,
  day_mode text,
  training text,
  reason text
);

-- Cache de crides a APIs nutricionals (evita repetir cerques).
create table if not exists api_food_cache (
  cache_key text primary key,
  source text,
  query text,
  payload jsonb,
  created_at timestamptz default now()
);
