import React from "react";

function formatMetric(value, type = "count", loading = false) {
  if (loading) return "…";
  if (type === "money") return `${Number(value || 0).toLocaleString("fr-FR")} XAF`;
  return Number(value || 0).toLocaleString("fr-FR");
}

function metricsForRole(role, stats, loading) {
  const definitions = {
    ADMIN: [["Clients visibles", stats.clients, "Lignes autorisées par RLS"], ["Fournisseurs", stats.fournisseurs, "Référentiel accessible"], ["Projets", stats.projets, "Portefeuille accessible"], ["Ventes", stats.ventes, "Transactions visibles"], ["Factures", stats.factures, "Documents accessibles"], ["Chiffre d’affaires", stats.chiffreAffaires, "Total des ventes visibles", "money"]],
    GERANT: [["Clients", stats.clients, "Portefeuille accessible"], ["Projets", stats.projets, "Projets suivis"], ["Ventes", stats.ventes, "Activité commerciale"], ["Créances", stats.resteAPayer, "Montant à recouvrer", "money"]],
    AGENT_COMMERCIAL: [["Clients", stats.clients, "Fiches accessibles"], ["Ventes", stats.ventes, "Transactions suivies"], ["Factures", stats.factures, "Factures clients"], ["Créances", stats.resteAPayer, "Échéances à suivre", "money"]],
    COMPTABLE: [["Écritures", stats.ecritures, "Écritures accessibles"], ["Bilans", stats.bilans, "États disponibles"], ["Rapports", stats.rapports, "Rapports financiers"], ["Créances", stats.resteAPayer, "Montant à contrôler", "money"]],
    MAGASINIER: [["Produits", stats.produits, "Catalogue accessible"], ["Achats", stats.achats, "Opérations fournisseurs"], ["Ventes", stats.ventes, "Sorties commerciales"]],
    CONSULTANT: [["Clients", stats.clients, "Données accessibles"], ["Projets", stats.projets, "Suivi disponible"], ["Factures", stats.factures, "Documents consultables"]],
  };
  return (definitions[role] || definitions.CONSULTANT).map(([label, value, hint, type]) => ({ label, value: formatMetric(value, type, loading), hint }));
}

export default function RoleDashboard({ role, summary, actions, onNavigate, can, stats, loading }) {
  const visibleActions = actions.filter((action) => !action.permission || can(action.permission));
  const cards = metricsForRole(role, stats || {}, loading);

  return (
    <div className="role-dashboard">
      <section className="role-hero">
        <div>
          <p className="section-kicker">Espace personnalisé</p>
          <h2>{summary.title}</h2>
          <p>{summary.description}</p>
        </div>
        <span className="role-code">{role}</span>
      </section>
      <div className="role-dashboard-grid">
        {cards.map((card) => (
          <article className="content-panel role-focus-card" key={card.label}>
            <span className="stat-label">{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.hint}</p>
          </article>
        ))}
      </div>
      <section className="content-panel role-actions-panel">
        <div className="section-heading"><div><p className="section-kicker">Accès rapides</p><h2>Vos modules</h2></div></div>
        <div className="quick-actions">
          {visibleActions.map((action) => (
            <button className="quick-action" type="button" key={action.id} onClick={() => onNavigate(action.id)}>
              <span>{action.icon}</span><strong>{action.label}</strong><small>{action.description}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
