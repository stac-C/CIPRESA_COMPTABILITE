import React from "react";

const ADMIN_OPERATIONS = [
  ["CLIENT_READ", "Consulter clients", "clients"], ["CLIENT_CREATE", "Créer client", "clients"], ["CLIENT_UPDATE", "Modifier client", "clients"], ["CLIENT_DELETE", "Supprimer client", "clients"],
  ["VENTE_READ", "Consulter ventes", "ventes"], ["VENTE_CREATE", "Créer vente", "ventes"], ["VENTE_UPDATE", "Modifier vente", "ventes"], ["VENTE_DELETE", "Supprimer vente", "ventes"],
  ["ACHAT_READ", "Consulter achats", "achats"], ["ACHAT_CREATE", "Créer achat", "achats"], ["ACHAT_UPDATE", "Modifier achat", "achats"],
  ["STOCK_READ", "Consulter stock", "inventaire"], ["STOCK_CREATE", "Mouvement stock", "inventaire"], ["STOCK_UPDATE", "Modifier stock", "inventaire"],
  ["COMPTA_READ", "Consulter comptabilité", "comptabilite"], ["COMPTA_CREATE", "Créer écriture", "comptabilite"], ["COMPTA_VALIDATE", "Valider écriture", "comptabilite"],
  ["BILAN_READ", "Consulter bilan", "bilans"], ["BILAN_GENERATE", "Générer bilan", "bilans"], ["RAPPORT_READ", "Consulter rapports", "rapports"], ["RAPPORT_CREATE", "Créer rapport", "rapports"],
  ["USER_READ", "Consulter utilisateurs", "configuration"], ["USER_MANAGE", "Gérer utilisateurs", "configuration"],
];

export default function AdminControlCenter({ can, onNavigate }) {
  return (
    <div className="content-panel admin-operations-panel">
      <div className="section-heading"><div><p className="section-kicker">Droits administrateur</p><h2>Opérations disponibles</h2><p className="panel-description">Chaque action ouvre son module dédié. La validation finale reste protégée par les policies Supabase.</p></div><span className="role-code">ADMIN</span></div>
      <div className="admin-operation-list">{ADMIN_OPERATIONS.map(([code, label, tab]) => <button className="admin-operation" type="button" key={code} disabled={!can(code)} onClick={() => onNavigate(tab)}><span className={can(code) ? "operation-status allowed" : "operation-status"}>{can(code) ? "✓" : "–"}</span><span><strong>{label}</strong><small>{code}</small></span><b>Ouvrir</b></button>)}</div>
      {can("USER_READ") && <button className="primary-button" type="button" onClick={() => onNavigate("configuration")}>Gérer les utilisateurs</button>}
    </div>
  );
}
