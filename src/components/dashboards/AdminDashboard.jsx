import React from "react";
import RoleDashboardBase from "./RoleDashboardBase";

export default function AdminDashboard({ onNavigate }) {
  return <RoleDashboardBase role="ADMIN" summary={{ title: "Pilotage administrateur", description: "Supervisez les utilisateurs, les droits et l'ensemble des activités CIPRESA.", cards: [{ label: "Périmètre", value: "Global", hint: "Toutes les fonctions métier" }, { label: "Droits", value: "Accès complet", hint: "Les policies Supabase restent actives" }, { label: "Priorité", value: "Contrôle", hint: "Utilisateurs et opérations" }] }} actions={[{ id: "clients", label: "Clients", icon: "♧", description: "Créer et gérer les clients" }, { id: "ventes", label: "Ventes", icon: "◈", description: "Créer et gérer les ventes" }, { id: "achats", label: "Achats", icon: "◫", description: "Créer et suivre les achats" }, { id: "inventaire", label: "Stock", icon: "▱", description: "Consulter et modifier le stock" }, { id: "comptabilite", label: "Comptabilité", icon: "▥", description: "Écritures et validation" }, { id: "configuration", label: "Administration", icon: "⚙", description: "Utilisateurs et rôles" }]} onNavigate={onNavigate} />;
}
