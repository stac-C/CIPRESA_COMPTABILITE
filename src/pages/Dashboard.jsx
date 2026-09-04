import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import FacturesTable from "../components/FacturesTable";
import PersonalSettings from "../components/PersonalSettings";
import AdminControlCenter from "../components/AdminControlCenter";
import ComptabiliteWorkspace from "../components/ComptabiliteWorkspace";
import AdminDashboard from "../components/dashboards/AdminDashboard";
import GerantDashboard from "../components/dashboards/GerantDashboard";
import ComptableDashboard from "../components/dashboards/ComptableDashboard";
import AgentCommercialDashboard from "../components/dashboards/AgentCommercialDashboard";
import MagasinierDashboard from "../components/dashboards/MagasinierDashboard";
import ConsultantDashboard from "../components/dashboards/ConsultantDashboard";
import { canAccessTab } from "../components/roles/accessMatrix";
import ResourceWorkspace from "../components/resources/ResourceWorkspace";

const NAV_ITEMS = [
  { id: "dashboard", label: "Tableau de bord", icon: "📊" },
  { id: "clients", label: "Clients", icon: "♧", permission: "CLIENT_READ" },
  { id: "fournisseurs", label: "Fournisseurs", icon: "▤", permission: "ACHAT_READ" },
  { id: "achats", label: "Achats", icon: "◫", permission: "ACHAT_READ" },
  { id: "projets", label: "Projets", icon: "⌘", roles: ["ADMIN", "GERANT"] },
  { id: "ventes", label: "Ventes", icon: "◈", permission: "VENTE_READ" },
  { id: "facturation", label: "Facturation", icon: "▣", permission: "VENTE_READ" },
  { id: "inventaire", label: "Inventaire", icon: "▱", permission: "STOCK_READ" },
  { id: "comptabilite", label: "Comptabilité", icon: "🪨", permission: "COMPTA_READ" },
  { id: "bilans", label: "Bilans", icon: "📖", permission: "BILAN_READ" },
  { id: "rapports", label: "Rapports", icon: "🛄", permission: "RAPPORT_READ" },
  { id: "configuration", label: "Configuration", icon: "🏡", roles: ["ADMIN"] },
  { id: "profile", label: "Mon profil", icon: "⚙️" },
];

const RESOURCE_CONFIG = {
  clients: {
    title: "Clients",
    description: "Créez, consultez, modifiez et supprimez les fiches clients autorisées par votre rôle.",
    table: "clients",
    nameField: "nom",
    readPermission: "CLIENT_READ",
    createPermission: "CLIENT_CREATE",
    updatePermission: "CLIENT_UPDATE",
    deletePermission: "CLIENT_DELETE",
    columns: ["id", "code", "nom", "email", "telephone", "ville", "statut"],
    fields: [
      { name: "code", label: "Code client", required: true },
      { name: "nom", label: "Nom", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "telephone", label: "Téléphone" },
      { name: "adresse", label: "Adresse" },
      { name: "ville", label: "Ville" },
      { name: "pays", label: "Pays", defaultValue: "Cameroun" },
      { name: "statut", label: "Statut", defaultValue: "ACTIF" },
      { name: "observation", label: "Observation", type: "textarea" },
    ],
  },
  fournisseurs: {
    title: "Fournisseurs",
    description: "Gérez les coordonnées des fournisseurs selon les permissions d’achat du rôle connecté.",
    table: "fournisseurs",
    nameField: "nom",
    readPermission: "ACHAT_READ",
    createPermission: "ACHAT_CREATE",
    updatePermission: "ACHAT_UPDATE",
    deletePermission: "ACHAT_UPDATE",
    columns: ["id", "code", "nom", "email", "telephone", "ville", "actif"],
    fields: [
      { name: "code", label: "Code fournisseur", required: true },
      { name: "nom", label: "Nom", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "telephone", label: "Téléphone" },
      { name: "adresse", label: "Adresse" },
      { name: "ville", label: "Ville" },
      { name: "pays", label: "Pays" },
      { name: "actif", label: "Actif", type: "checkbox", defaultValue: true },
    ],
  },
  inventaire: {
    title: "Inventaire",
    description: "Gérez le catalogue des produits et leurs prix; les mouvements de stock restent soumis à STOCK_CREATE.",
    table: "produits",
    nameField: "nom",
    readPermission: "STOCK_READ",
    createPermission: "STOCK_CREATE",
    updatePermission: "STOCK_UPDATE",
    deletePermission: "STOCK_UPDATE",
    columns: ["id", "reference", "nom", "unite", "prix_achat", "prix_vente", "actif"],
    fields: [
      { name: "reference", label: "Référence", required: true },
      { name: "nom", label: "Nom du produit", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "unite", label: "Unité", defaultValue: "UNITE", required: true },
      { name: "prix_achat", label: "Prix d’achat", type: "number", min: "0", step: "0.01", defaultValue: "0" },
      { name: "prix_vente", label: "Prix de vente", type: "number", min: "0", step: "0.01", defaultValue: "0" },
      { name: "actif", label: "Actif", type: "checkbox", defaultValue: true },
    ],
  },
  achats: { title: "Achats", description: "Suivez les achats enregistrés, leurs montants et leur état de traitement.", table: "achats", permission: "ACHAT_READ", columns: ["numero", "fournisseur_id", "date_achat", "total", "statut"] },
  projets: { title: "Projets", description: "Suivez les projets, leur budget, leur calendrier et leur état d’avancement.", table: "projets", columns: ["reference", "nom", "ville", "budget", "statut", "date_debut"] },
  ventes: { title: "Ventes", description: "Consultez les ventes et préparez les opérations commerciales avant leur facturation.", table: "ventes", permission: "VENTE_READ", columns: ["numero", "client_id", "date_vente", "total", "statut"] },
  facturation: { title: "Facturation", description: "Consultez les factures clients, les échéances et les montants restant à payer.", table: "factures", columns: ["numero", "date_facture", "montant_ttc", "reste_a_payer", "statut"] },
  comptabilite: { title: "Comptabilité", description: "Saisissez, contrôlez et validez les écritures comptables de l’entreprise.", table: "ecritures_comptables", permission: "COMPTA_READ", columns: ["numero", "date_ecriture", "libelle", "statut"] },
  bilans: { title: "Bilans", description: "Générez et consultez les bilans par exercice comptable.", table: "bilans", permission: "BILAN_READ", columns: ["exercice_id", "date_generation", "total_actif", "total_passif", "resultat", "statut"] },
  rapports: { title: "Rapports financiers", description: "Créez et consultez les rapports financiers sur une période définie.", table: "rapports_financiers", permission: "RAPPORT_READ", columns: ["reference", "nom", "date_debut", "date_fin", "solde_final", "statut"] },
};

const ROLE_ORDER = ["ADMIN", "GERANT", "COMPTABLE", "CONSULTANT", "MAGASINIER", "AGENT_COMMERCIAL"];

const COMPTABLE_TASKS = [
  ["COMPTA_READ", "Consulter comptabilité"],
  ["COMPTA_CREATE", "Créer écriture"],
  ["COMPTA_VALIDATE", "Valider écriture"],
  ["BILAN_READ", "Consulter bilan"],
  ["BILAN_GENERATE", "Générer bilan"],
  ["RAPPORT_READ", "Consulter rapports"],
  ["RAPPORT_CREATE", "Créer rapport"],
];

function displayValue(value) {
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return value.toLocaleString("fr-FR");
  return String(value);
}

function titleForColumn(column) {
  return column.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function RoleDashboard({ roles, onNavigate, can }) {
  const hasRole = (role) => roles.some(({ code }) => code === role);
  if (hasRole("ADMIN")) return <AdminDashboard onNavigate={onNavigate} can={can} />;
  if (hasRole("GERANT")) return <GerantDashboard onNavigate={onNavigate} can={can} />;
  if (hasRole("COMPTABLE")) return <ComptableDashboard onNavigate={onNavigate} can={can} />;
  if (hasRole("AGENT_COMMERCIAL")) return <AgentCommercialDashboard onNavigate={onNavigate} can={can} />;
  if (hasRole("MAGASINIER")) return <MagasinierDashboard onNavigate={onNavigate} can={can} />;
  return <ConsultantDashboard onNavigate={onNavigate} can={can} />;
}

function getTabFromPath() {
  return window.location.pathname.replace(/^\/+|\/+$/g, "") || "dashboard";
}

function ComptableTaskPanel({ can }) {
  return (
    <section className="task-panel">
      <div><p className="section-kicker">Droits du rôle actif</p><h2>Actions comptables autorisées</h2><p>Les droits sont lus depuis <strong>role_permissions</strong>. Supabase reste l’autorité lors de chaque opération.</p></div>
      <div className="task-list">{COMPTABLE_TASKS.map(([code, label]) => <span className={can(code) ? "task-item allowed" : "task-item denied"} key={code}><i>{can(code) ? "✓" : "–"}</i>{label}</span>)}</div>
    </section>
  );
}

function ResourceView({ resource, onReload, can }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadRows() {
      setLoading(true);
      const { data, error: requestError } = await supabase
        .from(resource.table)
        .select(resource.columns.join(", "))
        .order("created_at", { ascending: false })
        .limit(50);
      if (!isMounted) return;
      setRows(data || []);
      setError(requestError?.message || null);
      setLoading(false);
    }
    loadRows();
    return () => { isMounted = false; };
  }, [resource, onReload]);

  return (
    <>
    {resource.table === "ecritures_comptables" && <ComptableTaskPanel can={can} />}
    <section className="content-panel">
      <div className="section-heading">
        <div><p className="section-kicker">Données Supabase · {resource.permission || "ACCÈS RÔLE"}</p><h2>{resource.title}</h2><p className="panel-description">{resource.description}</p></div>
        <span className="record-count">{rows.length} affiché{rows.length > 1 ? "s" : ""}</span>
      </div>
      <div className="resource-guide"><strong>À quoi sert cet onglet ?</strong><span>{resource.guide || resource.description}</span></div>
      {error && <p className="message error">Erreur de lecture : {error}</p>}
      {loading ? <p className="empty">Chargement…</p> : rows.length === 0 ? <p className="empty">Aucune donnée accessible pour ce rôle.</p> : (
        <div className="table-scroll"><table className="data-table"><thead><tr>{resource.columns.map((column) => <th key={column}>{titleForColumn(column)}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id || row.numero || row.reference}>{resource.columns.map((column) => <td key={column}>{displayValue(row[column])}</td>)}</tr>)}</tbody>
        </table></div>
      )}
    </section>
    </>
  );
}

function AdminAccessView({ roles, rolePermissions }) {
  const [users, setUsers] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAdministration() {
      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("id, nom, prenom, telephone, actif, created_at").order("created_at", { ascending: true }),
        supabase.from("user_roles").select("user_id, role:roles(code, nom)"),
      ]);
      if (!isMounted) return;
      if (profilesResult.error || rolesResult.error) setError((profilesResult.error || rolesResult.error).message);
      setUsers(profilesResult.data || []);
      setUserRoles(rolesResult.data || []);
      setLoading(false);
    }
    loadAdministration();
    return () => { isMounted = false; };
  }, []);

  const rolesForUser = (userId) => userRoles.filter((item) => item.user_id === userId).map((item) => item.role?.nom).filter(Boolean).join(", ") || "Aucun rôle";

  return (
    <div className="admin-grid">
      <section className="content-panel admin-users-panel">
        <div className="section-heading"><div><p className="section-kicker">Administration · USER_READ / USER_MANAGE</p><h2>Utilisateurs & rôles</h2><p className="panel-description">Consultez les comptes, leurs rôles et leur statut d’activité. Les changements de rôle restent soumis aux règles de sécurité Supabase.</p></div><span className="record-count">{users.length} profil{users.length > 1 ? "s" : ""}</span></div>
        <div className="policy-note"><strong>Lecture sécurisée</strong><span>Les profils et rôles affichés proviennent de Supabase. L’attribution reste contrôlée par les policies RLS existantes.</span></div>
        {error && <p className="message error">Erreur de lecture : {error}</p>}
        {loading ? <p className="empty">Chargement…</p> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Utilisateur</th><th>Contact</th><th>Rôle</th><th>Statut</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{`${user.prenom || ""} ${user.nom || ""}`.trim() || "Profil sans nom"}</strong><small>{user.id}</small></td><td>{displayValue(user.telephone)}</td><td><span className="role-badge">{rolesForUser(user.id)}</span></td><td><span className={`status-dot ${user.actif ? "is-active" : "is-inactive"}`}>{user.actif ? "Actif" : "Inactif"}</span></td></tr>)}</tbody></table></div>}
      </section>
      <section className="content-panel permissions-panel"><div className="section-heading"><div><p className="section-kicker">Référentiel Supabase</p><h2>Privilèges par rôle</h2></div></div><div className="role-list">{[...roles].sort((a, b) => ROLE_ORDER.indexOf(a.code) - ROLE_ORDER.indexOf(b.code)).map((role) => <article className="role-card" key={role.id}><div><span className="role-code">{role.code}</span><h3>{role.nom}</h3><p>{role.description || "Aucune description"}</p></div><div className="permission-list">{(rolePermissions[role.id] || []).length ? rolePermissions[role.id].map((permission) => <span key={permission.code} title={permission.description}>{permission.nom}</span>) : <span className="muted">Aucun privilège enregistré dans la base.</span>}</div></article>)}</div></section>
    </div>
  );
}

export default function Dashboard() {
  const { profile, roles, permissions, rolePermissions, hasRole, can, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(getTabFromPath);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ clients: 0, factures: 0, resteAPayer: 0, comptes: 0, ecritures: 0, bilans: 0, rapports: 0 });
  const [factures, setFactures] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      const isAccountingUser = hasRole("COMPTABLE") && !hasRole("ADMIN") && !hasRole("GERANT");
      const results = isAccountingUser
        ? await Promise.all([
            supabase.from("ecritures_comptables").select("*", { count: "exact", head: true }),
            supabase.from("bilans").select("*", { count: "exact", head: true }),
            supabase.from("rapports_financiers").select("*", { count: "exact", head: true }),
          ])
        : await Promise.all([
            supabase.from("clients").select("*", { count: "exact", head: true }),
            supabase.from("factures").select("*", { count: "exact", head: true }),
            supabase.from("factures").select("id, numero, date_facture, montant_ttc, reste_a_payer, statut").order("date_facture", { ascending: false }).limit(10),
            supabase.from("comptes").select("*", { count: "exact", head: true }),
          ]);

      if (isAccountingUser) {
        const [entriesResult, balancesResult, reportsResult] = results;
        const accountingError = entriesResult.error || balancesResult.error || reportsResult.error;
        if (accountingError) {
          if (isMounted) setError(accountingError.message);
        } else if (isMounted) {
          setStats({ clients: 0, factures: 0, resteAPayer: 0, comptes: 0, ecritures: entriesResult.count ?? 0, bilans: balancesResult.count ?? 0, rapports: reportsResult.count ?? 0 });
          setFactures([]);
        }
        if (isMounted) setLoading(false);
        return;
      }

      const [
        { count: clientsCount, error: clientsErr },
        { count: facturesCount, error: facturesCountErr },
        { data: facturesData, error: facturesErr },
        { count: comptesCount, error: comptesErr },
      ] = results;

      const firstError = clientsErr || facturesCountErr || facturesErr || comptesErr;
      if (firstError) {
        if (isMounted) setError(firstError.message);
      } else if (isMounted) {
        const resteAPayer = (facturesData || []).reduce(
          (sum, f) => sum + Number(f.reste_a_payer || 0),
          0
        );
        setStats({
          clients: clientsCount ?? 0,
          factures: facturesCount ?? 0,
          resteAPayer,
          comptes: comptesCount ?? 0,
          ecritures: 0,
          bilans: 0,
          rapports: 0,
        });
        setFactures(facturesData || []);
      }
      if (isMounted) setLoading(false);
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [hasRole]);

  const visibleNav = NAV_ITEMS.filter((item) => item.id === "dashboard" || canAccessTab(item.id, { can, hasRole }));

  useEffect(() => {
    function syncTab() {
      setActiveTab(getTabFromPath());
    }
    window.addEventListener("popstate", syncTab);
    return () => window.removeEventListener("popstate", syncTab);
  }, []);

  useEffect(() => {
    if (!visibleNav.some((item) => item.id === activeTab)) {
      window.history.replaceState({}, "", "/dashboard");
      setActiveTab("dashboard");
    }
  }, [activeTab, visibleNav]);

  function navigateToTab(tabId) {
    if (tabId === activeTab) return;
    window.history.pushState({}, "", `/${tabId}`);
    setActiveTab(tabId);
  }

  function renderContent() {
    if (activeTab === "dashboard") return <><RoleDashboard roles={roles} onNavigate={navigateToTab} can={can} /><DashboardOverview loading={loading} error={error} stats={stats} factures={factures} isAccountingUser={hasRole("COMPTABLE") && !hasRole("ADMIN") && !hasRole("GERANT")} /></>;
    if (activeTab === "profile") return <PersonalSettings profile={profile} roles={roles} />;
    if (activeTab === "configuration" && hasRole("ADMIN")) return <><AdminControlCenter can={can} onNavigate={navigateToTab} /><AdminAccessView roles={roles} rolePermissions={rolePermissions} /></>;
    if (["comptabilite", "bilans", "rapports"].includes(activeTab)) return <ComptabiliteWorkspace section={activeTab} session={{ user: { id: profile?.id } }} can={can} />;
    const resource = RESOURCE_CONFIG[activeTab];
    const currentNavItem = NAV_ITEMS.find((item) => item.id === activeTab);
    const hasTabAccess = currentNavItem && canAccessTab(activeTab, { can, hasRole }) && (!resource?.permission || can(resource.permission));
    if (resource && hasTabAccess) {
      if (resource.fields) return <ResourceWorkspace resource={resource} can={can} />;
      return <ResourceView resource={resource} onReload={activeTab} can={can} />;
    }
    return <section className="content-panel"><p className="empty">Cette rubrique n’est pas disponible pour votre rôle.</p></section>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar"><div className="brand"><span className="brand-mark-small">C</span><div><strong>CIPRESA</strong><small>Plateforme Comptable</small></div></div><nav aria-label="Navigation principale">{visibleNav.map((item) => <button className={activeTab === item.id ? "nav-item active" : "nav-item"} type="button" aria-current={activeTab === item.id ? "page" : undefined} key={item.id} onClick={() => navigateToTab(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}</nav><div className="sidebar-user"><span className="avatar">{(profile?.prenom || profile?.nom || "U").charAt(0).toUpperCase()}</span><div><strong>{`${profile?.prenom || ""} ${profile?.nom || ""}`.trim() || "Utilisateur"}</strong><small>{roles.map(({ nom }) => nom).join(" · ")}</small></div></div></aside>
      <main className="main-area"><header className="topbar"><div className="search-box">⌕ <span>Rechercher...</span></div><div className="topbar-actions"><button className="icon-button" title="Notifications">♧</button><button className="icon-button" title="Aide">?</button><button className="profile-button" onClick={signOut}>Profil <span className="avatar avatar-small">{(profile?.prenom || profile?.nom || "U").charAt(0).toUpperCase()}</span></button></div></header><div className="page-content"><div className="page-title"><div><p className="section-kicker">Données en temps réel · v_tableau_bord</p><h1>{activeTab === "dashboard" ? "Aperçu financier" : NAV_ITEMS.find((item) => item.id === activeTab)?.label}</h1><p className="subtitle">{roles.map(({ nom }) => nom).join(", ")} · {permissions.length} permission{permissions.length > 1 ? "s" : ""}</p></div><div className="page-actions"><button className="outline-button">▣ Ce mois</button>{can("RAPPORT_CREATE") && <button className="primary-button">Générer Rapport</button>}</div></div>{renderContent()}</div></main>
    </div>
  );
}

function DashboardOverview({ loading, error, stats, factures }) {
  return <>{error && <p className="message error">Erreur de chargement : {error}</p>}{loading ? <p className="empty">Chargement des données…</p> : <><section className="stats-grid"><StatCard label="Clients actifs" value={stats.clients.toLocaleString("fr-FR")} hint="Base clients Supabase" /><StatCard label="Factures totales" value={stats.factures.toLocaleString("fr-FR")} hint="Données factures" /><StatCard label="Créances clients" value={`${stats.resteAPayer.toLocaleString("fr-FR")} XAF`} hint="10 dernières factures" /><StatCard label="Comptes trésorerie" value={stats.comptes.toLocaleString("fr-FR")} hint="Comptes actifs" /></section><div className="overview-grid"><section className="content-panel chart-panel"><div className="section-heading"><div><p className="section-kicker">Activité</p><h2>Tendances des revenus</h2></div><button className="more-button">⋮</button></div><div className="fake-chart"><div className="chart-grid"><span /><span /><span /><span /></div><div className="bars">{[35, 49, 40, 61, 56, 82].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><strong className="chart-label">84K XAF</strong></div></section><section className="content-panel transactions-panel"><div className="section-heading"><h2>Transactions récentes</h2><button className="link-button">Voir tout</button></div><FacturesTable factures={factures.slice(0, 5)} /></section></div></>}</>;
}
