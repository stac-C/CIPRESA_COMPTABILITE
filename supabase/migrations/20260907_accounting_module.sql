-- Module comptabilite : objets complementaires pour le role COMPTABLE.
-- Migration idempotente a executer dans Supabase apres BD_SUPABASE.sql.

create table if not exists public.rapprochements_bancaires (
  id uuid primary key default gen_random_uuid(),
  compte_id uuid not null references public.comptes(id) on delete restrict,
  reference text not null,
  libelle text not null,
  montant numeric(18,2) not null check (montant >= 0),
  date_operation date not null default current_date,
  statut text not null default 'A_CONTROLER' check (statut in ('A_CONTROLER', 'RAPPROCHE', 'ECART')),
  commentaire text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.declarations_fiscales (
  id uuid primary key default gen_random_uuid(),
  nature text not null,
  periode text not null,
  base numeric(18,2) not null default 0 check (base >= 0),
  montant numeric(18,2) not null default 0 check (montant >= 0),
  statut text not null default 'A_CONTROLER' check (statut in ('BROUILLON', 'A_CONTROLER', 'CONFORME', 'TRANSMISE')),
  date_limite date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.immobilisations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  libelle text not null,
  categorie text not null,
  date_acquisition date not null,
  valeur_origine numeric(18,2) not null check (valeur_origine >= 0),
  duree_annees numeric(6,2) not null check (duree_annees > 0),
  statut text not null default 'EN_SERVICE' check (statut in ('EN_SERVICE', 'SORTIE', 'A_AMORTIR')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.clotures_comptables (
  id uuid primary key default gen_random_uuid(),
  exercice_id uuid not null references public.exercices_comptables(id) on delete restrict,
  periode text not null,
  balance_validee boolean not null default false,
  rapprochement_valide boolean not null default false,
  fiscalite_verifiee boolean not null default false,
  statut text not null default 'OUVERTE' check (statut in ('OUVERTE', 'CONTROLES_EN_COURS', 'PRE_CLOTURE', 'CLOTUREE')),
  responsable uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (exercice_id, periode)
);

alter table public.bilans add column if not exists periode_type text not null default 'annuelle' check (periode_type in ('journaliere', 'hebdomadaire', 'mensuelle', 'trimestrielle', 'annuelle', 'pluriannuelle'));
alter table public.bilans add column if not exists periode_debut date;
alter table public.bilans add column if not exists periode_fin date;

alter table public.rapprochements_bancaires enable row level security;
alter table public.declarations_fiscales enable row level security;
alter table public.immobilisations enable row level security;
alter table public.clotures_comptables enable row level security;

drop policy if exists rapprochements_comptables_access on public.rapprochements_bancaires;
create policy rapprochements_comptables_access on public.rapprochements_bancaires for all to authenticated using (public.is_comptable()) with check (public.is_comptable());
drop policy if exists declarations_fiscales_comptables_access on public.declarations_fiscales;
create policy declarations_fiscales_comptables_access on public.declarations_fiscales for all to authenticated using (public.is_comptable()) with check (public.is_comptable());
drop policy if exists immobilisations_comptables_access on public.immobilisations;
create policy immobilisations_comptables_access on public.immobilisations for all to authenticated using (public.is_comptable()) with check (public.is_comptable());
drop policy if exists clotures_comptables_access on public.clotures_comptables;
create policy clotures_comptables_access on public.clotures_comptables for all to authenticated using (public.is_comptable()) with check (public.is_comptable());

insert into public.permissions (code, nom, description) values
  ('COMPTA_PLAN_CREATE', 'Modifier le plan comptable', 'Creer et modifier un compte comptable'),
  ('COMPTA_TRESORERIE', 'Gerer la tresorerie', 'Consulter et enregistrer les mouvements de tresorerie'),
  ('COMPTA_RAPPROCHEMENT', 'Gerer les rapprochements', 'Importer et controler les releves bancaires'),
  ('COMPTA_FISCALITE', 'Gerer la fiscalite', 'Preparer et suivre les declarations fiscales'),
  ('COMPTA_IMMOBILISATION', 'Gerer les immobilisations', 'Suivre les biens et amortissements'),
  ('COMPTA_CLOTURE', 'Gerer les clotures', 'Preparer et valider les controles de cloture')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code in ('COMPTABLE', 'ADMIN', 'GERANT')
  and p.code in ('COMPTA_PLAN_CREATE', 'COMPTA_TRESORERIE', 'COMPTA_RAPPROCHEMENT', 'COMPTA_FISCALITE', 'COMPTA_IMMOBILISATION', 'COMPTA_CLOTURE')
on conflict do nothing;

-- Garantit aussi l'acces en lecture aux onglets standards du module.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code in ('COMPTABLE', 'ADMIN', 'GERANT')
  and p.code in ('COMPTA_READ', 'BILAN_READ', 'RAPPORT_READ')
on conflict do nothing;

create or replace view public.vue_grand_livre with (security_invoker = true) as
select ec.date_ecriture, ec.numero as piece, j.code as journal, cc.numero as compte,
       coalesce(le.libelle, ec.libelle) as libelle, le.debit, le.credit,
       sum(le.debit - le.credit) over (partition by cc.id order by ec.date_ecriture, ec.numero, le.id) as solde,
       ec.statut
from public.lignes_ecritures le
join public.ecritures_comptables ec on ec.id = le.ecriture_id
join public.journaux j on j.id = ec.journal_id
join public.comptes_comptables cc on cc.id = le.compte_id
where ec.statut = 'VALIDEE';

create or replace view public.vue_balance_comptable with (security_invoker = true) as
select cc.id as compte_id, cc.numero, cc.libelle, cc.classe, cc.nature,
       coalesce(sum(le.debit), 0) as total_debit,
       coalesce(sum(le.credit), 0) as total_credit,
       greatest(coalesce(sum(le.debit), 0) - coalesce(sum(le.credit), 0), 0) as solde_debit,
       greatest(coalesce(sum(le.credit), 0) - coalesce(sum(le.debit), 0), 0) as solde_credit
from public.comptes_comptables cc
left join public.lignes_ecritures le on le.compte_id = cc.id
left join public.ecritures_comptables ec on ec.id = le.ecriture_id and ec.statut = 'VALIDEE'
where ec.id is not null or le.id is null
group by cc.id, cc.numero, cc.libelle, cc.classe, cc.nature;

create or replace view public.vue_compte_resultat with (security_invoker = true) as
select cc.nature as poste, cc.numero as compte, cc.libelle,
       coalesce(sum(le.credit), 0) as produits,
       coalesce(sum(le.debit), 0) as charges,
       coalesce(sum(le.credit - le.debit), 0) as montant
from public.comptes_comptables cc
left join public.lignes_ecritures le on le.compte_id = cc.id
left join public.ecritures_comptables ec on ec.id = le.ecriture_id and ec.statut = 'VALIDEE'
where cc.nature in ('CHARGE', 'PRODUIT') and (ec.id is not null or le.id is null)
group by cc.nature, cc.numero, cc.libelle;

create or replace view public.vue_clotures_comptables with (security_invoker = true) as
select c.id, c.periode, c.statut, c.balance_validee, c.rapprochement_valide,
       c.fiscalite_verifiee, p.nom as responsable, e.annee
from public.clotures_comptables c
join public.exercices_comptables e on e.id = c.exercice_id
left join public.profiles p on p.id = c.responsable;

grant select on public.vue_grand_livre, public.vue_balance_comptable, public.vue_compte_resultat, public.vue_clotures_comptables to authenticated;



