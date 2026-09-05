import React from "react";
import RoleDashboardBase from "./RoleDashboardBase";

export default function AdminDashboard({ onNavigate, can, stats, loading }) {
  return <RoleDashboardBase role="ADMIN" summary={{ title: "Pilotage administrateur", description: "Supervisez les utilisateurs, les droits et l'ensemble des activités CIPRESA." }} stats={stats} loading={loading} actions={[{ id: "clients", label: "Clients", icon: "♧", permission: "CLIENT_READ", description: "Créer et gérer les clients" }, { id: "ventes", label: "Ventes", icon: "◈", permission: "VENTE_READ", description: "Créer et gérer les ventes" }, { id: "achats", label: "Achats", icon: "◫", permission: "ACHAT_READ", description: "Créer et suivre les achats" }, { id: "inventaire", label: "Stock", icon: "▱", permission: "STOCK_READ", description: "Consulter et modifier le stock" }, { id: "comptabilite", label: "Comptabilité", icon: "▥", permission: "COMPTA_READ", description: "Écritures et validation" }, { id: "configuration", label: "Administration", icon: "⚙", permission: "USER_READ", description: "Utilisateurs et rôles" }]} onNavigate={onNavigate} can={can} />;
}
