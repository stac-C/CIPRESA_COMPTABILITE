import React from "react";
import RoleDashboardBase from "./RoleDashboardBase";

export default function ComptableDashboard({ onNavigate }) {
  return <RoleDashboardBase role="COMPTABLE" summary={{ title: "Espace comptable", description: "Préparez, contrôlez et suivez les écritures et états financiers.", cards: [{ label: "Travail", value: "Écritures", hint: "Saisie et validation" }, { label: "États", value: "Bilans", hint: "Génération et consultation" }, { label: "Analyse", value: "Rapports", hint: "Suivi financier" }] }} actions={[{ id: "comptabilite", label: "Écritures", icon: "▥", description: "Saisir et valider" }, { id: "bilans", label: "Bilans", icon: "▤", description: "Consulter et générer" }, { id: "rapports", label: "Rapports", icon: "▥", description: "Créer un rapport" }, { id: "profile", label: "Mon profil", icon: "◉", description: "Gérer vos informations" }]} onNavigate={onNavigate} />;
}
