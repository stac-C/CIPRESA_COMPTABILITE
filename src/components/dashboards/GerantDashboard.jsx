import React from "react";
import RoleDashboardBase from "./RoleDashboardBase";

export default function GerantDashboard({ onNavigate, can }) {
  return <RoleDashboardBase role="GERANT" summary={{ title: "Espace gérance", description: "Gardez une vue d'ensemble sur les clients, projets et résultats de l'entreprise.", cards: [{ label: "Périmètre", value: "Gestion", hint: "Clients, achats et stocks" }, { label: "Suivi", value: "Activité", hint: "Projets et facturation" }, { label: "Décision", value: "Synthèse", hint: "Rapports disponibles" }] }} actions={[{ id: "clients", label: "Clients", icon: "♧", permission: "CLIENT_READ", description: "Consulter le portefeuille" }, { id: "projets", label: "Projets", description: "Suivre les projets" }, { id: "fournisseurs", label: "Achats", icon: "▤", permission: "ACHAT_READ", description: "Consulter les fournisseurs" }, { id: "rapports", label: "Rapports", icon: "▥", permission: "RAPPORT_READ", description: "Lire les synthèses" }]} onNavigate={onNavigate} can={can} />;
}
