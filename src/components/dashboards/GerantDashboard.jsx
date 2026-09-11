import React from "react";
import RoleDashboardBase from "./RoleDashboardBase";

export default function GerantDashboard({ onNavigate, can, stats, loading }) {
  return <RoleDashboardBase role="GERANT" summary={{ title: "Espace gérance", description: "Gardez une vue d'ensemble sur les clients, projets et résultats de l'entreprise." }} stats={stats} loading={loading} actions={[{ id: "clients", label: "Clients", icon: "♧", permission: "CLIENT_READ", description: "Consulter le portefeuille" }, { id: "projets", label: "Projets", description: "Suivre les projets" }, { id: "fournisseurs", label: "Achats", icon: "▤", permission: "ACHAT_READ", description: "Consulter les fournisseurs" }, { id: "rapports", label: "Rapports", icon: "▥", permission: "RAPPORT_READ", description: "Lire les synthèses" }]} onNavigate={onNavigate} can={can} />;
}
