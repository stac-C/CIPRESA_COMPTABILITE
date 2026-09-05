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
import { useDashboardData } from "../hooks/useDashboardData";
import DashboardCharts from "../components/DashboardCharts";
import FacturesDataTable from "../components/FacturesDataTable";

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
  achats: {
    title: "Achats", description: "Créez et suivez les achats fournisseurs autorisés.", table: "achats", nameField: "numero", readPermission: "ACHAT_READ", createPermission: "ACHAT_CREATE", updatePermission: "ACHAT_UPDATE", deletePermission: "ACHAT_UPDATE", generatedNumber: { field: "numero", prefix: "ACH" }, columns: ["id", "numero", "fournisseur_id", "date_achat", "total", "statut"], fields: [{ name: "fournisseur_id", label: "Fournisseur", required: true, relation: { table: "fournisseurs", columns: ["id", "code", "nom"], value: "id", label: "nom" } }, { name: "date_achat", label: "Date", type: "date", required: true }, { name: "sous_total", label: "Sous-total", type: "number", min: "0", step: "0.01", defaultValue: "0" }, { name: "taxe", label: "Taxe", type: "number", min: "0", step: "0.01", defaultValue: "0" }, { name: "total", label: "Total", type: "number", min: "0", step: "0.01", defaultValue: "0" }] },
  projets: {
    title: "Projets", description: "Créez et suivez les projets, leur budget et leur avancement.", table: "projets", nameField: "nom", readPermission: "CLIENT_READ", createPermission: "CLIENT_CREATE", updatePermission: "CLIENT_UPDATE", deletePermission: "CLIENT_DELETE", columns: ["id", "reference", "nom", "client_id", "ville", "budget", "statut", "date_debut"], derivedColumns: [{ name: "actif", label: "Actif", getValue: (row) => row.statut !== "TERMINE" && row.statut !== "SUSPENDU" }], fields: [{ name: "reference", label: "Référence", required: true }, { name: "nom", label: "Nom", required: true }, { name: "client_id", label: "Identifiant client" }, { name: "ville", label: "Ville" }, { name: "budget", label: "Budget", type: "number", min: "0", step: "0.01", defaultValue: "0" }, { name: "date_debut", label: "Date de début", type: "date" }, { name: "date_fin_prevue", label: "Date de fin prévue", type: "date" }] },
  ventes: {
    title: "Ventes", description: "Créez et suivez les ventes avant leur facturation.", table: "ventes", nameField: "numero", readPermission: "VENTE_READ", createPermission: "VENTE_CREATE", updatePermission: "VENTE_UPDATE", deletePermission: "VENTE_DELETE", columns: ["id", "numero", "client_id", "date_vente", "total", "statut"], fields: [{ name: "numero", label: "Numéro", required: true }, { name: "client_id", label: "Identifiant client", required: true }, { name: "date_vente", label: "Date", type: "date", required: true }, { name: "sous_total", label: "Sous-total", type: "number", min: "0", step: "0.01", defaultValue: "0" }, { name: "remise", label: "Remise", type: "number", min: "0", step: "0.01", defaultValue: "0" }, { name: "taxe", label: "Taxe", type: "number", min: "0", step: "0.01", defaultValue: "0" }, { name: "total", label: "Total", type: "number", min: "0", step: "0.01", defaultValue: "0" }] },
  facturation: {
    title: "Facturation", description: "Créez et suivez les factures clients et leurs échéances.", table: "factures", nameField: "numero", readPermission: "VENTE_READ", createPermission: "VENTE_CREATE", updatePermission: "VENTE_UPDATE", deletePermission: "VENTE_DELETE", generatedNumber: { field: "numero", prefix: "FAC" }, columns: ["id", "numero", "vente_id", "client_id", "date_facture", "date_echeance", "montant_ttc", "montant_paye", "reste_a_payer", "statut"], fields: [{ name: "vente_id", label: "Identifiant vente", required: true }, { name: "client_id", label: "Identifiant client", required: true }, { name: "date_facture", label: "Date", type: "date", required: true }, { name: "date_echeance", label: "Échéance", type: "date" }, { name: "montant_ht", label: "Montant HT", type: "number", min: "0", step: "0.01", defaultValue: "0" }, { name: "taxe", label: "Taxe", type: "number", min: "0", step: "0.01", defaultValue: "0" }, { name: "montant_ttc", label: "Montant TTC", type: "number", min: "0", step: "0.01", defaultValue: "0" }, { name: "montant_paye", label: "Montant payé", type: "number", min: "0", step: "0.01", defaultValue: "0" }, { name: "reste_a_payer", label: "Reste à payer", type: "number", min: "0", step: "0.01", defaultValue: "0" }] },
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

function AdminAccessView({ roles, rolePermissions, can }) {
  const [users, setUsers] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingUser, setSavingUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({});

  useEffect(() => {
    let isMounted = true;
    async function loadAdministration() {
      const [profilesResult, rolesResult, availableRolesResult] = await Promise.all([
        supabase.from("profiles").select("id, nom, prenom, telephone, actif, created_at").order("created_at", { ascending: true }),
        supabase.from("user_roles").select("user_id, role:roles(code, nom)"),
        supabase.from("roles").select("id, code, nom").order("nom"),
      ]);
      if (!isMounted) return;
      if (profilesResult.error || rolesResult.error || availableRolesResult.error) setError((profilesResult.error || rolesResult.error || availableRolesResult.error).message);
      setUsers(profilesResult.data || []);
      setUserRoles(rolesResult.data || []);
      setAvailableRoles(availableRolesResult.data || []);
      setLoading(false);
    }
    loadAdministration();
    return () => { isMounted = false; };
  }, []);

  const rolesForUser = (userId) => userRoles.filter((item) => item.user_id === userId).map((item) => item.role?.nom).filter(Boolean).join(", ") || "Aucun rôle";

  async function toggleUser(user) {
    if (!can("USER_MANAGE")) return;
    setSavingUser(user.id);
    const { error: updateError } = await supabase.from("profiles").update({ actif: !user.actif }).eq("id", user.id);
    setSavingUser(null);
    if (updateError) setError(updateError.message);
    else setUsers((current) => current.map((item) => item.id === user.id ? { ...item, actif: !user.actif } : item));
  }

  async function assignRole(userId) {
    const roleId = selectedRoles[userId];
    if (!roleId || !can("USER_MANAGE")) return;
    setError(null);
    const { error: insertError } = await supabase.from("user_roles").insert({ user_id: userId, role_id: roleId });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    const role = availableRoles.find((item) => item.id === roleId);
    setUserRoles((current) => [...current, { user_id: userId, role: role || null }]);
    setSelectedRoles((current) => ({ ...current, [userId]: "" }));
  }

  async function removeRole(userId, roleCode) {
    if (!can("USER_MANAGE")) return;
    const role = availableRoles.find((item) => item.code === roleCode);
    if (!role) return;
    setError(null);
    const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role_id", role.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setUserRoles((current) => current.filter((item) => !(item.user_id === userId && item.role?.code === roleCode)));
  }

  return (
    <div className="admin-grid">
      <section className="content-panel admin-users-panel">
        <div className="section-heading"><div><p className="section-kicker">Administration · USER_READ / USER_MANAGE</p><h2>Utilisateurs & rôles</h2><p className="panel-description">Consultez les comptes, leurs rôles et leur statut d’activité. Les changements de rôle restent soumis aux règles de sécurité Supabase.</p></div><span className="record-count">{users.length} profil{users.length > 1 ? "s" : ""}</span></div>
        <div className="policy-note"><strong>Lecture sécurisée</strong><span>Les profils et rôles affichés proviennent de Supabase. L’attribution reste contrôlée par les policies RLS existantes.</span></div>
        {error && <p className="message error">Erreur de lecture : {error}</p>}
        {loading ? <p className="empty">Chargement…</p> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Utilisateur</th><th>Contact</th><th>Rôle</th><th>Statut</th>{can("USER_MANAGE") && <th>Opérations</th>}</tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{`${user.prenom || ""} ${user.nom || ""}`.trim() || "Profil sans nom"}</strong><small>{user.id}</small></td><td>{displayValue(user.telephone)}</td><td><div className="role-assignment">{userRoles.filter((item) => item.user_id === user.id && item.role).map((item) => <button className="role-badge" type="button" key={item.role.code} title="Retirer ce rôle" onClick={() => removeRole(user.id, item.role.code)}>{item.role.nom} ×</button>)}{!rolesForUser(user.id) && <span className="muted">Aucun rôle</span>}{can("USER_MANAGE") && <div className="role-assignment-controls"><select value={selectedRoles[user.id] || ""} onChange={(event) => setSelectedRoles((current) => ({ ...current, [user.id]: event.target.value }))}><option value="">Ajouter un rôle</option>{availableRoles.filter((role) => !userRoles.some((item) => item.user_id === user.id && item.role?.code === role.code)).map((role) => <option value={role.id} key={role.id}>{role.nom}</option>)}</select><button className="link-button" type="button" onClick={() => assignRole(user.id)}>Attribuer</button></div>}</div></td><td><span className={`status-dot ${user.actif ? "is-active" : "is-inactive"}`}>{user.actif ? "Actif" : "Inactif"}</span></td>{can("USER_MANAGE") && <td><button className="link-button" type="button" disabled={savingUser === user.id} onClick={() => toggleUser(user)}>{user.actif ? "Désactiver" : "Activer"}</button></td>}</tr>)}</tbody></table></div>}
      </section>
      <section className="content-panel permissions-panel"><div className="section-heading"><div><p className="section-kicker">Référentiel Supabase</p><h2>Privilèges par rôle</h2></div></div><div className="role-list">{[...roles].sort((a, b) => ROLE_ORDER.indexOf(a.code) - ROLE_ORDER.indexOf(b.code)).map((role) => <article className="role-card" key={role.id}><div><span className="role-code">{role.code}</span><h3>{role.nom}</h3><p>{role.description || "Aucune description"}</p></div><div className="permission-list">{(rolePermissions[role.id] || []).length ? rolePermissions[role.id].map((permission) => <span key={permission.code} title={permission.description}>{permission.nom}</span>) : <span className="muted">Aucun privilège enregistré dans la base.</span>}</div></article>)}</div></section>
    </div>
  );
}

export default function Dashboard() {
  const { profile, roles, permissions, rolePermissions, hasRole, can, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(getTabFromPath);
  const isAccountingUser = hasRole("COMPTABLE") && !hasRole("ADMIN") && !hasRole("GERANT");
  const { data: dashboardData, isLoading: loading, error: queryError } = useDashboardData(isAccountingUser);
  const stats = dashboardData?.stats || { clients: 0, factures: 0, resteAPayer: 0, comptes: 0, ecritures: 0, bilans: 0, rapports: 0 };
  const factures = dashboardData?.factures || [];
  const error = queryError?.message || null;

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
    if (activeTab === "dashboard") return <><RoleDashboard roles={roles} onNavigate={navigateToTab} can={can} /><DashboardOverview loading={loading} error={error} stats={stats} factures={factures} isAccountingUser={isAccountingUser} /></>;
    if (activeTab === "profile") return <PersonalSettings profile={profile} roles={roles} />;
    if (activeTab === "configuration" && hasRole("ADMIN")) return <><AdminControlCenter can={can} onNavigate={navigateToTab} /><AdminAccessView roles={roles} rolePermissions={rolePermissions} can={can} /></>;
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
  return <>{error && <p className="message error">Erreur de chargement : {error}</p>}{loading ? <p className="empty">Chargement des données…</p> : <><section className="stats-grid"><StatCard label="Clients actifs" value={stats.clients.toLocaleString("fr-FR")} hint="Base clients Supabase" /><StatCard label="Factures totales" value={stats.factures.toLocaleString("fr-FR")} hint="Données factures" /><StatCard label="Créances clients" value={`${stats.resteAPayer.toLocaleString("fr-FR")} XAF`} hint="Factures récentes" /><StatCard label="Comptes trésorerie" value={stats.comptes.toLocaleString("fr-FR")} hint="Comptes actifs" /></section><DashboardCharts invoices={factures} /><FacturesDataTable factures={factures} /></>}</>;
}
