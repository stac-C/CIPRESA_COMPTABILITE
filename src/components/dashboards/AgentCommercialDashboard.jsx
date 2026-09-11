import React from "react";
import RoleDashboardBase from "./RoleDashboardBase";

export default function AgentCommercialDashboard({ onNavigate, can, stats, loading }) {
  return <RoleDashboardBase role="AGENT_COMMERCIAL" summary={{ title: "Espace commercial", description: "Suivez vos clients, ventes et factures depuis un même espace." }} stats={stats} loading={loading} actions={[{ id: "clients", label: "Clients", icon: "♧", permission: "CLIENT_READ", description: "Consulter et créer" }, { id: "facturation", label: "Facturation", icon: "▣", permission: "VENTE_READ", description: "Suivre les factures" }, { id: "profile", label: "Mon profil", icon: "◉", description: "Gérer vos informations" }]} onNavigate={onNavigate} can={can} />;
}
