-- ============================================================
-- CIPRESA
-- BASE DE DONNEES COMPLETE - SUPABASE
-- PostgreSQL / Supabase
-- ============================================================

BEGIN;

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 2. ENUMERATIONS
-- ============================================================

DO $$
BEGIN

    CREATE TYPE public.projet_statut AS ENUM (
        'EN_COURS',
        'EN_ATTENTE',
        'SUSPENDU',
        'TERMINE'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.vente_statut AS ENUM (
        'BROUILLON',
        'VALIDEE',
        'ANNULEE'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.facture_statut AS ENUM (
        'BROUILLON',
        'EMISE',
        'PARTIELLEMENT_PAYEE',
        'PAYEE',
        'EN_RETARD',
        'ANNULEE'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.achat_statut AS ENUM (
        'BROUILLON',
        'VALIDE',
        'ANNULE'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.mode_paiement AS ENUM (
        'ESPECES',
        'VIREMENT',
        'MOBILE_MONEY',
        'CHEQUE',
        'CARTE'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.paiement_statut AS ENUM (
        'EN_ATTENTE',
        'VALIDE',
        'ANNULE'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.transfert_statut AS ENUM (
        'EN_ATTENTE',
        'VALIDE',
        'ANNULE'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.compte_type AS ENUM (
        'CAISSE',
        'BANQUE',
        'MOBILE_MONEY',
        'AUTRE'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.ecriture_statut AS ENUM (
        'BROUILLON',
        'EN_VALIDATION',
        'VALIDEE',
        'REJETEE',
        'ANNULEE'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.exercice_statut AS ENUM (
        'OUVERT',
        'CLOTURE'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.journal_type AS ENUM (
        'VENTE',
        'ACHAT',
        'BANQUE',
        'CAISSE',
        'OD'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.compte_nature AS ENUM (
        'ACTIF',
        'PASSIF',
        'CHARGE',
        'PRODUIT',
        'TRESORERIE'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.bilan_statut AS ENUM (
        'BROUILLON',
        'GENERE',
        'VALIDE'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.bilan_section AS ENUM (
        'ACTIF',
        'PASSIF'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN

    CREATE TYPE public.rapport_statut AS ENUM (
        'BROUILLON',
        'EN_VALIDATION',
        'VALIDE',
        'REJETE'
    );

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 3. AUTHENTIFICATION / UTILISATEURS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (

    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    nom TEXT,
    prenom TEXT,
    telephone TEXT,
    photo_url TEXT,
    adresse TEXT,
    ville TEXT,

    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    actif BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;


-- ============================================================
-- 4. ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.roles (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code TEXT NOT NULL UNIQUE,
    nom TEXT NOT NULL,
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.permissions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code TEXT NOT NULL UNIQUE,
    nom TEXT NOT NULL,
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.user_roles (

    user_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    role_id UUID NOT NULL
        REFERENCES public.roles(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, role_id)

);


CREATE TABLE IF NOT EXISTS public.role_permissions (

    role_id UUID NOT NULL
        REFERENCES public.roles(id)
        ON DELETE CASCADE,

    permission_id UUID NOT NULL
        REFERENCES public.permissions(id)
        ON DELETE CASCADE,

    PRIMARY KEY (role_id, permission_id)

);


-- ============================================================
-- 5. CLIENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.clients (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code TEXT NOT NULL UNIQUE,

    type TEXT NOT NULL DEFAULT 'PARTICULIER',

    nom TEXT NOT NULL,

    email TEXT,

    telephone TEXT,

    adresse TEXT,

    ville TEXT,

    pays TEXT,

    numero_contribuable TEXT,

    a_risque BOOLEAN NOT NULL DEFAULT FALSE,

    statut TEXT NOT NULL DEFAULT 'ACTIF',

    observation TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.contacts_clients (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    client_id UUID NOT NULL
        REFERENCES public.clients(id)
        ON DELETE CASCADE,

    nom TEXT NOT NULL,
    prenom TEXT,

    fonction TEXT,

    telephone TEXT,
    email TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.dossiers_clients (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    client_id UUID NOT NULL UNIQUE
        REFERENCES public.clients(id)
        ON DELETE CASCADE,

    reference TEXT NOT NULL UNIQUE,

    statut TEXT NOT NULL DEFAULT 'ACTIF',

    date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.documents_clients (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dossier_id UUID NOT NULL
        REFERENCES public.dossiers_clients(id)
        ON DELETE CASCADE,

    type TEXT NOT NULL,

    nom TEXT NOT NULL,

    fichier_url TEXT,

    date_upload TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


-- ============================================================
-- 6. PROJETS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.projets (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reference TEXT NOT NULL UNIQUE,

    nom TEXT NOT NULL,

    client_id UUID
        REFERENCES public.clients(id)
        ON DELETE SET NULL,

    description TEXT,

    ville TEXT,

    localisation TEXT,

    budget NUMERIC(18,2) NOT NULL DEFAULT 0
        CHECK (budget >= 0),

    date_debut DATE,

    date_fin_prevue DATE,

    date_fin_reelle DATE,

    statut public.projet_statut NOT NULL
        DEFAULT 'EN_ATTENTE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.projets_equipes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    projet_id UUID NOT NULL
        REFERENCES public.projets(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    fonction TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(projet_id, user_id)

);


CREATE TABLE IF NOT EXISTS public.projets_depenses (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    projet_id UUID NOT NULL
        REFERENCES public.projets(id)
        ON DELETE CASCADE,

    designation TEXT NOT NULL,

    montant NUMERIC(18,2) NOT NULL
        CHECK (montant >= 0),

    date_depense DATE NOT NULL DEFAULT CURRENT_DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.projets_recettes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    projet_id UUID NOT NULL
        REFERENCES public.projets(id)
        ON DELETE CASCADE,

    designation TEXT NOT NULL,

    montant NUMERIC(18,2) NOT NULL
        CHECK (montant >= 0),

    date_recette DATE NOT NULL DEFAULT CURRENT_DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


-- ============================================================
-- 7. PRODUITS / PEPINIERE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.categories_produits (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nom TEXT NOT NULL UNIQUE,

    description TEXT,

    actif BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.produits (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reference TEXT NOT NULL UNIQUE,

    nom TEXT NOT NULL,

    description TEXT,

    categorie_id UUID
        REFERENCES public.categories_produits(id)
        ON DELETE SET NULL,

    unite TEXT NOT NULL DEFAULT 'UNITE',

    prix_achat NUMERIC(18,2) NOT NULL DEFAULT 0
        CHECK (prix_achat >= 0),

    prix_vente NUMERIC(18,2) NOT NULL DEFAULT 0
        CHECK (prix_vente >= 0),

    actif BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.varietes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    produit_id UUID NOT NULL
        REFERENCES public.produits(id)
        ON DELETE CASCADE,

    nom TEXT NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(produit_id, nom)

);


CREATE TABLE IF NOT EXISTS public.stocks (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    produit_id UUID NOT NULL UNIQUE
        REFERENCES public.produits(id)
        ON DELETE CASCADE,

    quantite NUMERIC(18,3) NOT NULL DEFAULT 0,

    stock_minimum NUMERIC(18,3) NOT NULL DEFAULT 0,

    emplacement TEXT,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (quantite >= 0),
    CHECK (stock_minimum >= 0)

);


CREATE TABLE IF NOT EXISTS public.mouvements_stock (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    produit_id UUID NOT NULL
        REFERENCES public.produits(id)
        ON DELETE RESTRICT,

    type TEXT NOT NULL,

    quantite NUMERIC(18,3) NOT NULL
        CHECK (quantite > 0),

    motif TEXT,

    reference TEXT,

    date_mouvement TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL

);


CREATE TABLE IF NOT EXISTS public.sorties_pepiniere (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reference TEXT NOT NULL UNIQUE,

    date_sortie DATE NOT NULL DEFAULT CURRENT_DATE,

    user_id UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    observation TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.lignes_sorties_pepiniere (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sortie_id UUID NOT NULL
        REFERENCES public.sorties_pepiniere(id)
        ON DELETE CASCADE,

    produit_id UUID NOT NULL
        REFERENCES public.produits(id)
        ON DELETE RESTRICT,

    quantite NUMERIC(18,3) NOT NULL
        CHECK (quantite > 0)

);


-- ============================================================
-- 8. VENTES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ventes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    numero TEXT NOT NULL UNIQUE,

    client_id UUID NOT NULL
        REFERENCES public.clients(id)
        ON DELETE RESTRICT,

    projet_id UUID
        REFERENCES public.projets(id)
        ON DELETE SET NULL,

    date_vente DATE NOT NULL DEFAULT CURRENT_DATE,

    sous_total NUMERIC(18,2) NOT NULL DEFAULT 0,

    remise NUMERIC(18,2) NOT NULL DEFAULT 0,

    taxe NUMERIC(18,2) NOT NULL DEFAULT 0,

    total NUMERIC(18,2) NOT NULL DEFAULT 0,

    statut public.vente_statut NOT NULL
        DEFAULT 'BROUILLON',

    created_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (sous_total >= 0),
    CHECK (remise >= 0),
    CHECK (taxe >= 0),
    CHECK (total >= 0)

);


CREATE TABLE IF NOT EXISTS public.lignes_ventes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vente_id UUID NOT NULL
        REFERENCES public.ventes(id)
        ON DELETE CASCADE,

    produit_id UUID NOT NULL
        REFERENCES public.produits(id)
        ON DELETE RESTRICT,

    quantite NUMERIC(18,3) NOT NULL
        CHECK (quantite > 0),

    prix_unitaire NUMERIC(18,2) NOT NULL
        CHECK (prix_unitaire >= 0),

    remise NUMERIC(18,2) NOT NULL DEFAULT 0,

    total NUMERIC(18,2) NOT NULL DEFAULT 0

);


CREATE TABLE IF NOT EXISTS public.factures (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    numero TEXT NOT NULL UNIQUE,

    vente_id UUID NOT NULL UNIQUE
        REFERENCES public.ventes(id)
        ON DELETE RESTRICT,

    client_id UUID NOT NULL
        REFERENCES public.clients(id)
        ON DELETE RESTRICT,

    date_facture DATE NOT NULL DEFAULT CURRENT_DATE,

    date_echeance DATE,

    montant_ht NUMERIC(18,2) NOT NULL DEFAULT 0,

    taxe NUMERIC(18,2) NOT NULL DEFAULT 0,

    montant_ttc NUMERIC(18,2) NOT NULL DEFAULT 0,

    montant_paye NUMERIC(18,2) NOT NULL DEFAULT 0,

    reste_a_payer NUMERIC(18,2) NOT NULL DEFAULT 0,

    statut public.facture_statut NOT NULL
        DEFAULT 'BROUILLON',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (montant_ht >= 0),
    CHECK (taxe >= 0),
    CHECK (montant_ttc >= 0),
    CHECK (montant_paye >= 0),
    CHECK (reste_a_payer >= 0)

);


-- ============================================================
-- 9. FOURNISSEURS / ACHATS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fournisseurs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code TEXT NOT NULL UNIQUE,

    nom TEXT NOT NULL,

    email TEXT,

    telephone TEXT,

    adresse TEXT,

    ville TEXT,

    pays TEXT,

    numero_contribuable TEXT,

    actif BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

ALTER TABLE public.fournisseurs
    ADD COLUMN IF NOT EXISTS observation TEXT;


CREATE TABLE IF NOT EXISTS public.achats (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    numero TEXT NOT NULL UNIQUE,

    fournisseur_id UUID NOT NULL
        REFERENCES public.fournisseurs(id)
        ON DELETE RESTRICT,

    date_achat DATE NOT NULL DEFAULT CURRENT_DATE,

    sous_total NUMERIC(18,2) NOT NULL DEFAULT 0,

    taxe NUMERIC(18,2) NOT NULL DEFAULT 0,

    total NUMERIC(18,2) NOT NULL DEFAULT 0,

    statut public.achat_statut NOT NULL
        DEFAULT 'BROUILLON',

    created_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.lignes_achats (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    achat_id UUID NOT NULL
        REFERENCES public.achats(id)
        ON DELETE CASCADE,

    produit_id UUID NOT NULL
        REFERENCES public.produits(id)
        ON DELETE RESTRICT,

    quantite NUMERIC(18,3) NOT NULL
        CHECK (quantite > 0),

    prix_unitaire NUMERIC(18,2) NOT NULL
        CHECK (prix_unitaire >= 0),

    total NUMERIC(18,2) NOT NULL DEFAULT 0

);


CREATE TABLE IF NOT EXISTS public.factures_fournisseurs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    achat_id UUID NOT NULL UNIQUE
        REFERENCES public.achats(id)
        ON DELETE RESTRICT,

    numero TEXT NOT NULL UNIQUE,

    date_facture DATE NOT NULL DEFAULT CURRENT_DATE,

    date_echeance DATE,

    montant NUMERIC(18,2) NOT NULL DEFAULT 0,

    montant_paye NUMERIC(18,2) NOT NULL DEFAULT 0,

    reste NUMERIC(18,2) NOT NULL DEFAULT 0,

    statut TEXT NOT NULL DEFAULT 'IMPAYEE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


-- ============================================================
-- 10. CAISSE / BANQUE / PAIEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.comptes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    numero TEXT NOT NULL UNIQUE,

    nom TEXT NOT NULL,

    type public.compte_type NOT NULL,

    solde NUMERIC(18,2) NOT NULL DEFAULT 0,

    devise TEXT NOT NULL DEFAULT 'XAF',

    actif BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.paiements (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reference TEXT NOT NULL UNIQUE,

    compte_id UUID NOT NULL
        REFERENCES public.comptes(id)
        ON DELETE RESTRICT,

    facture_id UUID
        REFERENCES public.factures(id)
        ON DELETE RESTRICT,

    facture_fournisseur_id UUID
        REFERENCES public.factures_fournisseurs(id)
        ON DELETE RESTRICT,

    montant NUMERIC(18,2) NOT NULL
        CHECK (montant > 0),

    date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,

    mode public.mode_paiement NOT NULL,

    motif TEXT,

    statut public.paiement_statut NOT NULL
        DEFAULT 'EN_ATTENTE',

    created_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        (facture_id IS NOT NULL AND facture_fournisseur_id IS NULL)
        OR
        (facture_id IS NULL AND facture_fournisseur_id IS NOT NULL)
    )

);


CREATE TABLE IF NOT EXISTS public.transferts (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    compte_source_id UUID NOT NULL
        REFERENCES public.comptes(id)
        ON DELETE RESTRICT,

    compte_destination_id UUID NOT NULL
        REFERENCES public.comptes(id)
        ON DELETE RESTRICT,

    montant NUMERIC(18,2) NOT NULL
        CHECK (montant > 0),

    date_transfert DATE NOT NULL DEFAULT CURRENT_DATE,

    motif TEXT,

    reference TEXT NOT NULL UNIQUE,

    statut public.transfert_statut NOT NULL
        DEFAULT 'EN_ATTENTE',

    created_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (compte_source_id <> compte_destination_id)

);


-- ============================================================
-- 11. COMPTABILITE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.exercices_comptables (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code TEXT NOT NULL UNIQUE,

    annee INTEGER NOT NULL UNIQUE,

    date_debut DATE NOT NULL,

    date_fin DATE NOT NULL,

    statut public.exercice_statut NOT NULL
        DEFAULT 'OUVERT',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (date_fin >= date_debut)

);


CREATE TABLE IF NOT EXISTS public.journaux (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code TEXT NOT NULL UNIQUE,

    libelle TEXT NOT NULL,

    type public.journal_type NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.comptes_comptables (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    numero TEXT NOT NULL UNIQUE,

    libelle TEXT NOT NULL,

    classe TEXT NOT NULL,

    nature public.compte_nature NOT NULL,

    actif BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.ecritures_comptables (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    numero TEXT NOT NULL UNIQUE,

    exercice_id UUID NOT NULL
        REFERENCES public.exercices_comptables(id)
        ON DELETE RESTRICT,

    journal_id UUID NOT NULL
        REFERENCES public.journaux(id)
        ON DELETE RESTRICT,

    date_ecriture DATE NOT NULL DEFAULT CURRENT_DATE,

    libelle TEXT NOT NULL,

    reference_piece TEXT,

    statut public.ecriture_statut NOT NULL
        DEFAULT 'BROUILLON',

    created_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    validated_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    validated_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.lignes_ecritures (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ecriture_id UUID NOT NULL
        REFERENCES public.ecritures_comptables(id)
        ON DELETE CASCADE,

    compte_id UUID NOT NULL
        REFERENCES public.comptes_comptables(id)
        ON DELETE RESTRICT,

    libelle TEXT,

    debit NUMERIC(18,2) NOT NULL DEFAULT 0,

    credit NUMERIC(18,2) NOT NULL DEFAULT 0,

    CHECK (debit >= 0),
    CHECK (credit >= 0),

    CHECK (
        NOT (debit > 0 AND credit > 0)
    ),

    CHECK (
        debit > 0 OR credit > 0
    )

);


CREATE TABLE IF NOT EXISTS public.pieces_comptables (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ecriture_id UUID NOT NULL
        REFERENCES public.ecritures_comptables(id)
        ON DELETE CASCADE,

    type TEXT NOT NULL,

    reference TEXT,

    fichier_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


-- ============================================================
-- 12. LIENS OPERATIONS -> ECRITURES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ecritures_sources (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ecriture_id UUID NOT NULL
        REFERENCES public.ecritures_comptables(id)
        ON DELETE CASCADE,

    type_source TEXT NOT NULL,

    vente_id UUID
        REFERENCES public.ventes(id)
        ON DELETE CASCADE,

    achat_id UUID
        REFERENCES public.achats(id)
        ON DELETE CASCADE,

    paiement_id UUID
        REFERENCES public.paiements(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        num_nonnulls(vente_id, achat_id, paiement_id) = 1
    )

);


-- ============================================================
-- 13. BALANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.balances (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    exercice_id UUID NOT NULL
        REFERENCES public.exercices_comptables(id)
        ON DELETE RESTRICT,

    date_generation DATE NOT NULL DEFAULT CURRENT_DATE,

    total_debit NUMERIC(18,2) NOT NULL DEFAULT 0,

    total_credit NUMERIC(18,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.lignes_balances (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    balance_id UUID NOT NULL
        REFERENCES public.balances(id)
        ON DELETE CASCADE,

    compte_id UUID NOT NULL
        REFERENCES public.comptes_comptables(id)
        ON DELETE RESTRICT,

    total_debit NUMERIC(18,2) NOT NULL DEFAULT 0,

    total_credit NUMERIC(18,2) NOT NULL DEFAULT 0,

    solde_debit NUMERIC(18,2) NOT NULL DEFAULT 0,

    solde_credit NUMERIC(18,2) NOT NULL DEFAULT 0

);


-- ============================================================
-- 14. BILAN
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bilans (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    exercice_id UUID NOT NULL
        REFERENCES public.exercices_comptables(id)
        ON DELETE RESTRICT,

    date_generation DATE NOT NULL DEFAULT CURRENT_DATE,

    total_actif NUMERIC(18,2) NOT NULL DEFAULT 0,

    total_passif NUMERIC(18,2) NOT NULL DEFAULT 0,

    resultat NUMERIC(18,2) NOT NULL DEFAULT 0,

    statut public.bilan_statut NOT NULL
        DEFAULT 'BROUILLON',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.lignes_bilans (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    bilan_id UUID NOT NULL
        REFERENCES public.bilans(id)
        ON DELETE CASCADE,

    compte_id UUID NOT NULL
        REFERENCES public.comptes_comptables(id)
        ON DELETE RESTRICT,

    rubrique TEXT NOT NULL,

    montant NUMERIC(18,2) NOT NULL DEFAULT 0,

    section public.bilan_section NOT NULL

);


-- ============================================================
-- 15. RAPPORTS FINANCIERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rapports_financiers (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reference TEXT NOT NULL UNIQUE,

    nom TEXT NOT NULL,

    date_debut DATE NOT NULL,

    date_fin DATE NOT NULL,

    solde_initial NUMERIC(18,2) NOT NULL DEFAULT 0,

    total_entrees NUMERIC(18,2) NOT NULL DEFAULT 0,

    total_sorties NUMERIC(18,2) NOT NULL DEFAULT 0,

    solde_final NUMERIC(18,2) NOT NULL DEFAULT 0,

    statut public.rapport_statut NOT NULL
        DEFAULT 'BROUILLON',

    created_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (date_fin >= date_debut)

);


CREATE TABLE IF NOT EXISTS public.lignes_rapports (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    rapport_id UUID NOT NULL
        REFERENCES public.rapports_financiers(id)
        ON DELETE CASCADE,

    date_operation DATE NOT NULL,

    designation TEXT NOT NULL,

    entree NUMERIC(18,2) NOT NULL DEFAULT 0,

    sortie NUMERIC(18,2) NOT NULL DEFAULT 0,

    solde NUMERIC(18,2) NOT NULL DEFAULT 0,

    reference TEXT,

    CHECK (entree >= 0),
    CHECK (sortie >= 0)

);


-- ============================================================
-- 16. AUDIT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    service TEXT NOT NULL,

    action TEXT NOT NULL,

    table_name TEXT NOT NULL,

    record_id UUID,

    anciennes_valeurs JSONB,

    nouvelles_valeurs JSONB,

    ip_address INET,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


-- ============================================================
-- 17. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    type TEXT NOT NULL,

    titre TEXT NOT NULL,

    message TEXT NOT NULL,

    lu BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    device_key TEXT,
    subscription JSONB NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions
    ADD COLUMN IF NOT EXISTS device_key TEXT;


CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_key TEXT NOT NULL,
    label TEXT NOT NULL,
    user_agent TEXT,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    UNIQUE(user_id, device_key)
);


-- ============================================================
-- 18. INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_clients_nom
ON public.clients(nom);

CREATE INDEX IF NOT EXISTS idx_clients_email
ON public.clients(email);

CREATE INDEX IF NOT EXISTS idx_clients_ville
ON public.clients(ville);

CREATE INDEX IF NOT EXISTS idx_projets_client
ON public.projets(client_id);

CREATE INDEX IF NOT EXISTS idx_projets_statut
ON public.projets(statut);

CREATE INDEX IF NOT EXISTS idx_produits_categorie
ON public.produits(categorie_id);

CREATE INDEX IF NOT EXISTS idx_mouvements_stock_produit
ON public.mouvements_stock(produit_id);

CREATE INDEX IF NOT EXISTS idx_ventes_client
ON public.ventes(client_id);

CREATE INDEX IF NOT EXISTS idx_ventes_date
ON public.ventes(date_vente);

CREATE INDEX IF NOT EXISTS idx_factures_client
ON public.factures(client_id);

CREATE INDEX IF NOT EXISTS idx_factures_statut
ON public.factures(statut);

CREATE INDEX IF NOT EXISTS idx_achats_fournisseur
ON public.achats(fournisseur_id);

CREATE INDEX IF NOT EXISTS idx_paiements_compte
ON public.paiements(compte_id);

CREATE INDEX IF NOT EXISTS idx_paiements_facture
ON public.paiements(facture_id);

CREATE INDEX IF NOT EXISTS idx_ecritures_exercice
ON public.ecritures_comptables(exercice_id);

CREATE INDEX IF NOT EXISTS idx_ecritures_journal
ON public.ecritures_comptables(journal_id);

CREATE INDEX IF NOT EXISTS idx_lignes_ecritures_compte
ON public.lignes_ecritures(compte_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_user
ON public.audit_logs(user_id);


-- ============================================================
-- 19. FONCTION updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- ============================================================
-- 20. TRIGGERS updated_at
-- ============================================================

DROP TRIGGER IF EXISTS trg_profiles_updated_at
ON public.profiles;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


DROP TRIGGER IF EXISTS trg_clients_updated_at
ON public.clients;

CREATE TRIGGER trg_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


DROP TRIGGER IF EXISTS trg_projets_updated_at
ON public.projets;

CREATE TRIGGER trg_projets_updated_at
BEFORE UPDATE ON public.projets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


DROP TRIGGER IF EXISTS trg_produits_updated_at
ON public.produits;

CREATE TRIGGER trg_produits_updated_at
BEFORE UPDATE ON public.produits
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


DROP TRIGGER IF EXISTS trg_stocks_updated_at
ON public.stocks;

CREATE TRIGGER trg_stocks_updated_at
BEFORE UPDATE ON public.stocks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


DROP TRIGGER IF EXISTS trg_ventes_updated_at
ON public.ventes;

CREATE TRIGGER trg_ventes_updated_at
BEFORE UPDATE ON public.ventes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


DROP TRIGGER IF EXISTS trg_achats_updated_at
ON public.achats;

CREATE TRIGGER trg_achats_updated_at
BEFORE UPDATE ON public.achats
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


DROP TRIGGER IF EXISTS trg_comptes_updated_at
ON public.comptes;

CREATE TRIGGER trg_comptes_updated_at
BEFORE UPDATE ON public.comptes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


DROP TRIGGER IF EXISTS trg_ecritures_updated_at
ON public.ecritures_comptables;

CREATE TRIGGER trg_ecritures_updated_at
BEFORE UPDATE ON public.ecritures_comptables
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- 21. CREATION AUTOMATIQUE DU PROFIL APRES INSCRIPTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

    INSERT INTO public.profiles (
        id,
        nom,
        prenom,
        telephone
    )
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'nom',
        NEW.raw_user_meta_data ->> 'prenom',
        NEW.raw_user_meta_data ->> 'telephone'
    );

    RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;

CREATE TRIGGER on_auth_user_created

AFTER INSERT ON auth.users

FOR EACH ROW

EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 22. FONCTION POUR RECUPERER LE ROLE DE L'UTILISATEUR
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_role(
    requested_role TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$

    SELECT EXISTS (

        SELECT 1

        FROM public.user_roles ur

        JOIN public.roles r
            ON r.id = ur.role_id

        WHERE ur.user_id = auth.uid()

        AND r.code = requested_role

    );

$$;


-- ============================================================
-- 23. FONCTION ADMIN
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$

    SELECT public.user_has_role('ADMIN');

$$;


-- ============================================================
-- 24. FONCTION GERANT
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_gerant()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$

    SELECT
        public.user_has_role('ADMIN')
        OR
        public.user_has_role('GERANT');

$$;


-- ============================================================
-- 25. FONCTION COMPTABLE
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_comptable()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$

    SELECT
        public.user_has_role('ADMIN')
        OR
        public.user_has_role('GERANT')
        OR
        public.user_has_role('COMPTABLE');

$$;


-- ============================================================
-- 26. NOTIFICATIONS AUTOMATIQUES PAR PRIVILEGE
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_users_with_permission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    required_permission TEXT;
    operation_label TEXT;
    actor_id UUID;
    affected_id UUID;
BEGIN
    required_permission := CASE TG_TABLE_NAME
        WHEN 'clients' THEN CASE TG_OP WHEN 'INSERT' THEN 'CLIENT_CREATE' ELSE 'CLIENT_UPDATE' END
        WHEN 'fournisseurs' THEN CASE TG_OP WHEN 'INSERT' THEN 'ACHAT_CREATE' ELSE 'ACHAT_UPDATE' END
        WHEN 'achats' THEN CASE TG_OP WHEN 'INSERT' THEN 'ACHAT_CREATE' ELSE 'ACHAT_UPDATE' END
        WHEN 'ventes' THEN CASE TG_OP WHEN 'INSERT' THEN 'VENTE_CREATE' ELSE 'VENTE_UPDATE' END
        WHEN 'factures' THEN CASE TG_OP WHEN 'INSERT' THEN 'VENTE_CREATE' ELSE 'VENTE_UPDATE' END
        WHEN 'produits' THEN CASE TG_OP WHEN 'INSERT' THEN 'STOCK_CREATE' ELSE 'STOCK_UPDATE' END
        WHEN 'ecritures_comptables' THEN CASE TG_OP WHEN 'INSERT' THEN 'COMPTA_CREATE' ELSE 'COMPTA_VALIDATE' END
        WHEN 'bilans' THEN 'BILAN_GENERATE'
        WHEN 'rapports_financiers' THEN 'RAPPORT_CREATE'
        ELSE NULL
    END;

    IF required_permission IS NULL THEN
        RETURN NEW;
    END IF;

    actor_id := auth.uid();
    operation_label := CASE TG_OP WHEN 'INSERT' THEN 'créée' WHEN 'UPDATE' THEN 'modifiée' ELSE 'traitée' END;

    INSERT INTO public.notifications (user_id, type, titre, message)
    SELECT DISTINCT ur.user_id,
        'PLATFORM_OPERATION',
        'Nouvelle opération accessible',
        format('%s %s. Vous disposez de la permission %s.', initcap(replace(TG_TABLE_NAME, '_', ' ')), operation_label, required_permission)
    FROM public.user_roles ur
    JOIN public.role_permissions role_permission ON role_permission.role_id = ur.role_id
    JOIN public.permissions permission ON permission.id = role_permission.permission_id
    WHERE permission.code = required_permission
      AND ur.user_id IS DISTINCT FROM actor_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_clients ON public.clients;
CREATE TRIGGER trg_notify_clients AFTER INSERT OR UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.notify_users_with_permission();
DROP TRIGGER IF EXISTS trg_notify_fournisseurs ON public.fournisseurs;
CREATE TRIGGER trg_notify_fournisseurs AFTER INSERT OR UPDATE ON public.fournisseurs FOR EACH ROW EXECUTE FUNCTION public.notify_users_with_permission();
DROP TRIGGER IF EXISTS trg_notify_achats ON public.achats;
CREATE TRIGGER trg_notify_achats AFTER INSERT OR UPDATE ON public.achats FOR EACH ROW EXECUTE FUNCTION public.notify_users_with_permission();
DROP TRIGGER IF EXISTS trg_notify_ventes ON public.ventes;
CREATE TRIGGER trg_notify_ventes AFTER INSERT OR UPDATE ON public.ventes FOR EACH ROW EXECUTE FUNCTION public.notify_users_with_permission();
DROP TRIGGER IF EXISTS trg_notify_factures ON public.factures;
CREATE TRIGGER trg_notify_factures AFTER INSERT OR UPDATE ON public.factures FOR EACH ROW EXECUTE FUNCTION public.notify_users_with_permission();
DROP TRIGGER IF EXISTS trg_notify_produits ON public.produits;
CREATE TRIGGER trg_notify_produits AFTER INSERT OR UPDATE ON public.produits FOR EACH ROW EXECUTE FUNCTION public.notify_users_with_permission();
DROP TRIGGER IF EXISTS trg_notify_ecritures ON public.ecritures_comptables;
CREATE TRIGGER trg_notify_ecritures AFTER INSERT OR UPDATE ON public.ecritures_comptables FOR EACH ROW EXECUTE FUNCTION public.notify_users_with_permission();
DROP TRIGGER IF EXISTS trg_notify_bilans ON public.bilans;
CREATE TRIGGER trg_notify_bilans AFTER INSERT OR UPDATE ON public.bilans FOR EACH ROW EXECUTE FUNCTION public.notify_users_with_permission();
DROP TRIGGER IF EXISTS trg_notify_rapports ON public.rapports_financiers;
CREATE TRIGGER trg_notify_rapports AFTER INSERT OR UPDATE ON public.rapports_financiers FOR EACH ROW EXECUTE FUNCTION public.notify_users_with_permission();


CREATE OR REPLACE FUNCTION public.notify_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    role_name TEXT;
    actor_id UUID := auth.uid();
BEGIN
    SELECT nom INTO role_name FROM public.roles WHERE id = COALESCE(NEW.role_id, OLD.role_id);

    INSERT INTO public.notifications (user_id, type, titre, message)
    SELECT p.id,
        'ACCESS_CHANGE',
        'Modification de vos accès',
        format('Le rôle %s vous a été %s.', COALESCE(role_name, 'sélectionné'), CASE WHEN TG_OP = 'INSERT' THEN 'attribué' ELSE 'retiré' END)
    FROM public.profiles p
    WHERE p.id = COALESCE(NEW.user_id, OLD.user_id)
      AND p.id IS DISTINCT FROM actor_id;

    IF actor_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, titre, message)
        SELECT DISTINCT ur.user_id,
            'ACCESS_CHANGE',
            'Modification des accès utilisateurs',
            format('Le rôle %s a été %s pour un utilisateur.', COALESCE(role_name, 'sélectionné'), CASE WHEN TG_OP = 'INSERT' THEN 'attribué' ELSE 'retiré' END)
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON rp.role_id = ur.role_id
        JOIN public.permissions permission ON permission.id = rp.permission_id
        WHERE permission.code = 'USER_MANAGE'
          AND ur.user_id IS DISTINCT FROM actor_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_role_insert ON public.user_roles;
CREATE TRIGGER trg_notify_role_insert AFTER INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.notify_role_change();
DROP TRIGGER IF EXISTS trg_notify_role_delete ON public.user_roles;
CREATE TRIGGER trg_notify_role_delete AFTER DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.notify_role_change();


-- ============================================================
-- 26. DONNEES INITIALES - ROLES
-- ============================================================

INSERT INTO public.roles (
    code,
    nom,
    description
)
VALUES

(
    'ADMIN',
    'Administrateur',
    'Accès complet à la plateforme'
),

(
    'GERANT',
    'Gérant',
    'Supervision de la plateforme'
),

(
    'COMPTABLE',
    'Comptable',
    'Gestion comptable et financière'
),

(
    'AGENT_COMMERCIAL',
    'Agent commercial',
    'Gestion des clients, ventes et factures'
),

(
    'MAGASINIER',
    'Magasinier',
    'Gestion des produits et stocks'
),

(
    'CONSULTANT',
    'Consultant',
    'Consultation des données'
)

ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 27. DONNEES INITIALES - PERMISSIONS
-- ============================================================

INSERT INTO public.permissions (
    code,
    nom,
    description
)
VALUES

('CLIENT_READ', 'Consulter clients', 'Consulter les clients'),
('CLIENT_CREATE', 'Créer client', 'Créer un client'),
('CLIENT_UPDATE', 'Modifier client', 'Modifier un client'),
('CLIENT_DELETE', 'Supprimer client', 'Supprimer un client'),

('VENTE_READ', 'Consulter ventes', 'Consulter les ventes'),
('VENTE_CREATE', 'Créer vente', 'Créer une vente'),
('VENTE_UPDATE', 'Modifier vente', 'Modifier une vente'),
('VENTE_DELETE', 'Supprimer vente', 'Supprimer une vente'),

('ACHAT_READ', 'Consulter achats', 'Consulter les achats'),
('ACHAT_CREATE', 'Créer achat', 'Créer un achat'),
('ACHAT_UPDATE', 'Modifier achat', 'Modifier un achat'),

('STOCK_READ', 'Consulter stock', 'Consulter le stock'),
('STOCK_CREATE', 'Mouvement stock', 'Créer un mouvement de stock'),
('STOCK_UPDATE', 'Modifier stock', 'Modifier le stock'),

('COMPTA_READ', 'Consulter comptabilité', 'Consulter les données comptables'),
('COMPTA_CREATE', 'Créer écriture', 'Créer une écriture'),
('COMPTA_VALIDATE', 'Valider écriture', 'Valider une écriture'),

('BILAN_READ', 'Consulter bilan', 'Consulter le bilan'),
('BILAN_GENERATE', 'Générer bilan', 'Générer le bilan'),

('RAPPORT_READ', 'Consulter rapports', 'Consulter les rapports'),
('RAPPORT_CREATE', 'Créer rapport', 'Créer un rapport'),

('USER_READ', 'Consulter utilisateurs', 'Consulter les utilisateurs'),
('USER_MANAGE', 'Gérer utilisateurs', 'Gérer les utilisateurs')

ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 28. ATTRIBUTION DES PERMISSIONS A L'ADMIN
-- ============================================================

INSERT INTO public.role_permissions (
    role_id,
    permission_id
)

SELECT
    r.id,
    p.id

FROM public.roles r
CROSS JOIN public.permissions p

WHERE r.code = 'ADMIN'

ON CONFLICT DO NOTHING;


-- ============================================================
-- 29. PERMISSIONS COMPTABLE
-- ============================================================

INSERT INTO public.role_permissions (
    role_id,
    permission_id
)

SELECT
    r.id,
    p.id

FROM public.roles r

JOIN public.permissions p
ON p.code IN (
    'COMPTA_READ',
    'COMPTA_CREATE',
    'COMPTA_VALIDATE',
    'BILAN_READ',
    'BILAN_GENERATE',
    'RAPPORT_READ',
    'RAPPORT_CREATE'
)

WHERE r.code = 'COMPTABLE'

ON CONFLICT DO NOTHING;


-- ============================================================
-- 30. PERMISSIONS GERANT
-- ============================================================

INSERT INTO public.role_permissions (
    role_id,
    permission_id
)

SELECT
    r.id,
    p.id

FROM public.roles r

JOIN public.permissions p
ON p.code IN (
    'CLIENT_READ',
    'VENTE_READ',
    'ACHAT_READ',
    'STOCK_READ',
    'COMPTA_READ',
    'BILAN_READ',
    'BILAN_GENERATE',
    'RAPPORT_READ'
)

WHERE r.code = 'GERANT'

ON CONFLICT DO NOTHING;


-- ============================================================
-- 31. PERMISSIONS DES ROLES OPERATIONNELS ET CONSULTATION
-- ============================================================

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code IN (
    'CLIENT_READ', 'CLIENT_CREATE', 'CLIENT_UPDATE',
    'VENTE_READ', 'VENTE_CREATE', 'VENTE_UPDATE',
    'ACHAT_READ',
    'RAPPORT_READ'
)
WHERE r.code = 'AGENT_COMMERCIAL'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code IN (
    'STOCK_READ', 'STOCK_CREATE', 'STOCK_UPDATE'
)
WHERE r.code = 'MAGASINIER'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code IN (
    'CLIENT_READ', 'VENTE_READ', 'ACHAT_READ', 'STOCK_READ',
    'COMPTA_READ', 'BILAN_READ', 'RAPPORT_READ'
)
WHERE r.code = 'CONSULTANT'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 32. RLS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossiers_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_clients ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projets_equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projets_depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projets_recettes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.categories_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.varietes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorties_pepiniere ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_sorties_pepiniere ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_achats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factures_fournisseurs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.comptes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.exercices_comptables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comptes_comptables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecritures_comptables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_ecritures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pieces_comptables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecritures_sources ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_balances ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bilans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_bilans ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rapports_financiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_rapports ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;


-- Rend la migration rejouable sans laisser d'anciennes policies bloquer le script.
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I',
            policy_record.policyname,
            policy_record.schemaname,
            policy_record.tablename
        );
    END LOOP;
END $$;


-- ============================================================
-- 32. RLS - PROFILES
-- ============================================================

CREATE POLICY "profile_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR public.is_admin()
);

CREATE POLICY "profile_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
    OR public.is_admin()
)
WITH CHECK (
    id = auth.uid()
    OR public.is_admin()
);


-- ============================================================
-- 33. RLS - ROLES
-- ============================================================

CREATE POLICY "roles_authenticated_read"
ON public.roles
FOR SELECT
TO authenticated
USING (TRUE);


CREATE POLICY "permissions_authenticated_read"
ON public.permissions
FOR SELECT
TO authenticated
USING (TRUE);


CREATE POLICY "user_roles_read"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR public.is_admin()
);


CREATE POLICY "user_roles_admin_insert"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT public.is_admin())
);


CREATE POLICY "user_roles_admin_delete"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
    (SELECT public.is_admin())
);


CREATE POLICY "role_permissions_read"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (TRUE);


-- ============================================================
-- 34. RLS - DONNEES METIER
-- ============================================================

CREATE POLICY "clients_authenticated_access"
ON public.clients
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "contacts_clients_authenticated_access"
ON public.contacts_clients
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "dossiers_clients_authenticated_access"
ON public.dossiers_clients
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "documents_clients_authenticated_access"
ON public.documents_clients
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "projets_authenticated_access"
ON public.projets
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "projets_equipes_authenticated_access"
ON public.projets_equipes
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "projets_depenses_authenticated_access"
ON public.projets_depenses
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "projets_recettes_authenticated_access"
ON public.projets_recettes
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "categories_produits_authenticated_access"
ON public.categories_produits
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "produits_authenticated_access"
ON public.produits
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "varietes_authenticated_access"
ON public.varietes
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "stocks_authenticated_access"
ON public.stocks
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "mouvements_stock_authenticated_access"
ON public.mouvements_stock
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "sorties_pepiniere_authenticated_access"
ON public.sorties_pepiniere
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "lignes_sorties_pepiniere_authenticated_access"
ON public.lignes_sorties_pepiniere
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "ventes_authenticated_access"
ON public.ventes
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "lignes_ventes_authenticated_access"
ON public.lignes_ventes
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "factures_authenticated_access"
ON public.factures
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "fournisseurs_authenticated_access"
ON public.fournisseurs
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "achats_authenticated_access"
ON public.achats
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "lignes_achats_authenticated_access"
ON public.lignes_achats
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "factures_fournisseurs_authenticated_access"
ON public.factures_fournisseurs
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "comptes_authenticated_access"
ON public.comptes
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "paiements_authenticated_access"
ON public.paiements
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


CREATE POLICY "transferts_authenticated_access"
ON public.transferts
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);


-- ============================================================
-- 35. RLS - COMPTABILITE
-- ============================================================

CREATE POLICY "exercices_comptables_access"
ON public.exercices_comptables
FOR ALL
TO authenticated
USING (
    public.is_comptable()
)
WITH CHECK (
    public.is_comptable()
);


CREATE POLICY "journaux_access"
ON public.journaux
FOR ALL
TO authenticated
USING (
    public.is_comptable()
)
WITH CHECK (
    public.is_comptable()
);


CREATE POLICY "comptes_comptables_access"
ON public.comptes_comptables
FOR ALL
TO authenticated
USING (
    public.is_comptable()
)
WITH CHECK (
    public.is_comptable()
);


CREATE POLICY "ecritures_access"
ON public.ecritures_comptables
FOR ALL
TO authenticated
USING (
    public.is_comptable()
)
WITH CHECK (
    public.is_comptable()
);


CREATE POLICY "lignes_ecritures_access"
ON public.lignes_ecritures
FOR ALL
TO authenticated
USING (
    public.is_comptable()
)
WITH CHECK (
    public.is_comptable()
);


CREATE POLICY "pieces_comptables_access"
ON public.pieces_comptables
FOR ALL
TO authenticated
USING (
    public.is_comptable()
)
WITH CHECK (
    public.is_comptable()
);


CREATE POLICY "ecritures_sources_access"
ON public.ecritures_sources
FOR ALL
TO authenticated
USING (
    public.is_comptable()
)
WITH CHECK (
    public.is_comptable()
);


CREATE POLICY "balances_access"
ON public.balances
FOR ALL
TO authenticated
USING (
    public.is_comptable()
)
WITH CHECK (
    public.is_comptable()
);


CREATE POLICY "lignes_balances_access"
ON public.lignes_balances
FOR ALL
TO authenticated
USING (
    public.is_comptable()
)
WITH CHECK (
    public.is_comptable()
);


CREATE POLICY "bilans_access"
ON public.bilans
FOR ALL
TO authenticated
USING (
    public.is_comptable()
)
WITH CHECK (
    public.is_comptable()
);


CREATE POLICY "lignes_bilans_access"
ON public.lignes_bilans
FOR ALL
TO authenticated
USING (
    public.is_comptable()
)
WITH CHECK (
    public.is_comptable()
);


-- ============================================================
-- 36. RLS - RAPPORTS
-- ============================================================

CREATE POLICY "rapports_authenticated_access"
ON public.rapports_financiers
FOR ALL
TO authenticated
USING (
    public.is_gerant()
    OR public.is_comptable()
)
WITH CHECK (
    public.is_gerant()
    OR public.is_comptable()
);


CREATE POLICY "lignes_rapports_authenticated_access"
ON public.lignes_rapports
FOR ALL
TO authenticated
USING (
    public.is_gerant()
    OR public.is_comptable()
)
WITH CHECK (
    public.is_gerant()
    OR public.is_comptable()
);


-- ============================================================
-- 37. RLS - AUDIT
-- ============================================================

CREATE POLICY "audit_read_admin"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    public.is_admin()
);


CREATE POLICY "notifications_own"
ON public.notifications
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);

CREATE POLICY "notifications_update_own"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "push_subscriptions_own"
ON public.push_subscriptions
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_devices_own"
ON public.user_devices
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- ============================================================
-- 38. GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public
TO authenticated;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public
TO authenticated;


-- ============================================================
-- 38.1. STOCKAGE DES PHOTOS DE PROFIL
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_delete" ON storage.objects;

CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_user_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_user_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_user_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================================
-- 39. VUES POUR LE DASHBOARD
-- ============================================================

CREATE OR REPLACE VIEW public.vue_dashboard
WITH (security_invoker = true)
AS

SELECT

    (SELECT COUNT(*) FROM public.clients) AS nombre_clients,

    (SELECT COUNT(*) FROM public.projets) AS nombre_projets,

    (SELECT COUNT(*) FROM public.produits) AS nombre_produits,

    (SELECT COUNT(*) FROM public.ventes) AS nombre_ventes,

    (SELECT COUNT(*) FROM public.factures) AS nombre_factures,

    (SELECT COALESCE(SUM(total), 0)
     FROM public.ventes
     WHERE statut = 'VALIDEE') AS chiffre_affaires,

    (SELECT COALESCE(SUM(solde), 0)
     FROM public.comptes
     WHERE actif = TRUE) AS tresorerie;


-- ============================================================
-- 40. VUE FACTURES CLIENTS
-- ============================================================

CREATE OR REPLACE VIEW public.vue_factures_clients
WITH (security_invoker = true)
AS

SELECT

    f.id,
    f.numero,
    f.date_facture,
    f.date_echeance,

    c.id AS client_id,
    c.code AS client_code,
    c.nom AS client_nom,

    f.montant_ht,
    f.taxe,
    f.montant_ttc,
    f.montant_paye,
    f.reste_a_payer,
    f.statut

FROM public.factures f

JOIN public.clients c
    ON c.id = f.client_id;


-- ============================================================
-- 41. VUE BALANCE COMPTABLE
-- ============================================================

CREATE OR REPLACE VIEW public.vue_balance_comptable
WITH (security_invoker = true)
AS

SELECT

    cc.id AS compte_id,

    cc.numero,

    cc.libelle,

    cc.classe,

    cc.nature,

    COALESCE(SUM(le.debit), 0) AS total_debit,

    COALESCE(SUM(le.credit), 0) AS total_credit,

    GREATEST(
        COALESCE(SUM(le.debit), 0)
        -
        COALESCE(SUM(le.credit), 0),
        0
    ) AS solde_debit,

    GREATEST(
        COALESCE(SUM(le.credit), 0)
        -
        COALESCE(SUM(le.debit), 0),
        0
    ) AS solde_credit

FROM public.comptes_comptables cc

LEFT JOIN public.lignes_ecritures le
    ON le.compte_id = cc.id

LEFT JOIN public.ecritures_comptables ec
    ON ec.id = le.ecriture_id
    AND ec.statut = 'VALIDEE'

GROUP BY

    cc.id,
    cc.numero,
    cc.libelle,
    cc.classe,
    cc.nature;


-- ============================================================
-- 42. VUE TRESORERIE
-- ============================================================

CREATE OR REPLACE VIEW public.vue_tresorerie
WITH (security_invoker = true)
AS

SELECT

    id,
    numero,
    nom,
    type,
    devise,
    solde,
    actif

FROM public.comptes

WHERE actif = TRUE;


-- ============================================================
-- 43. VUE BILAN
-- ============================================================

CREATE OR REPLACE VIEW public.vue_bilan
WITH (security_invoker = true)
AS

SELECT

    b.id AS bilan_id,

    b.exercice_id,

    ec.annee,

    b.date_generation,

    b.total_actif,

    b.total_passif,

    b.resultat,

    b.statut

FROM public.bilans b

JOIN public.exercices_comptables ec

    ON ec.id = b.exercice_id;


GRANT SELECT
ON public.vue_dashboard,
   public.vue_factures_clients,
   public.vue_balance_comptable,
   public.vue_tresorerie,
   public.vue_bilan
TO authenticated;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;


-- ============================================================
-- FIN
-- ============================================================

COMMIT;

