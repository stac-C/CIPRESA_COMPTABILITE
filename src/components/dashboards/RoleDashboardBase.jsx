import React from "react";

export default function RoleDashboardBase({ role, summary, actions, onNavigate }) {
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
        {summary.cards.map((card) => (
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
          {actions.map((action) => (
            <button className="quick-action" type="button" key={action.id} onClick={() => onNavigate(action.id)}>
              <span>{action.icon}</span><strong>{action.label}</strong><small>{action.description}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
