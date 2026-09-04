import React from "react";
import RoleDashboardBase from "./RoleDashboardBase";

export default function ConsultantDashboard({ onNavigate, can }) {
  return <RoleDashboardBase role="CONSULTANT" summary={{ title: "Espace consultation", description: "Consultez les informations auxquelles votre rôle vous donne accès.", cards: [{ label: "Mode", value: "Lecture", hint: "Données contrôlées par Supabase" }, { label: "Accès", value: "Synthèse", hint: "Tableau de bord" }, { label: "Profil", value: "Personnel", hint: "Vos informations restent accessibles" }] }} actions={[{ id: "profile", label: "Mon profil", icon: "◉", description: "Consulter vos informations" }]} onNavigate={onNavigate} can={can} />;
}
