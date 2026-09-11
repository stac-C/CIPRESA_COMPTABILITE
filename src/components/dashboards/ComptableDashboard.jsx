import React from "react";
import RoleDashboardBase from "./RoleDashboardBase";

export default function ComptableDashboard({ onNavigate, can, stats, loading }) {
  return <RoleDashboardBase role="COMPTABLE" summary={{ title: "Espace comptable", description: "Préparez, contrôlez et suivez les écritures et états financiers." }} stats={stats} loading={loading} actions={[{ id: "comptabilite", label: "Écritures", icon: "▥", permission: "COMPTA_READ", description: "Saisir et valider" }, { id: "bilans", label: "Bilans", icon: "▤", permission: "BILAN_READ", description: "Consulter et générer" }, { id: "rapports", label: "Rapports", icon: "▥", permission: "RAPPORT_READ", description: "Créer un rapport" }, { id: "profile", label: "Mon profil", icon: "◉", description: "Gérer vos informations" }]} onNavigate={onNavigate} can={can} />;
}
