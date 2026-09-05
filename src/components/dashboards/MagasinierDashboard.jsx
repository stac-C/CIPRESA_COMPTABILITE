import React from "react";
import RoleDashboardBase from "./RoleDashboardBase";

export default function MagasinierDashboard({ onNavigate, can, stats, loading }) {
  return <RoleDashboardBase role="MAGASINIER" summary={{ title: "Espace magasinier", description: "Contrôlez les produits et les mouvements de stock au quotidien." }} stats={stats} loading={loading} actions={[{ id: "inventaire", label: "Inventaire", icon: "▱", permission: "STOCK_READ", description: "Gérer les produits" }, { id: "profile", label: "Mon profil", icon: "◉", description: "Gérer vos informations" }]} onNavigate={onNavigate} can={can} />;
}
