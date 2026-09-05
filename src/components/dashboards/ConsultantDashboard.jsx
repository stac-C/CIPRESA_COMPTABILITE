import React from "react";
import RoleDashboardBase from "./RoleDashboardBase";

export default function ConsultantDashboard({ onNavigate, can, stats, loading }) {
  return <RoleDashboardBase role="CONSULTANT" summary={{ title: "Espace consultation", description: "Consultez les informations auxquelles votre rôle vous donne accès." }} stats={stats} loading={loading} actions={[{ id: "profile", label: "Mon profil", icon: "◉", description: "Consulter vos informations" }]} onNavigate={onNavigate} can={can} />;
}
