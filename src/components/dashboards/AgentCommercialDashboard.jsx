import React from "react";
import RoleDashboardBase from "./RoleDashboardBase";

export default function AgentCommercialDashboard({ onNavigate, can }) {
  return <RoleDashboardBase role="AGENT_COMMERCIAL" summary={{ title: "Espace commercial", description: "Suivez vos clients, ventes et factures depuis un même espace.", cards: [{ label: "Relation", value: "Clients", hint: "Fiches et contacts" }, { label: "Activité", value: "Ventes", hint: "Suivi commercial" }, { label: "Encaissement", value: "Factures", hint: "Échéances et paiements" }] }} actions={[{ id: "clients", label: "Clients", icon: "♧", permission: "CLIENT_READ", description: "Consulter et créer" }, { id: "facturation", label: "Facturation", icon: "▣", permission: "VENTE_READ", description: "Suivre les factures" }, { id: "profile", label: "Mon profil", icon: "◉", description: "Gérer vos informations" }]} onNavigate={onNavigate} can={can} />;
}
