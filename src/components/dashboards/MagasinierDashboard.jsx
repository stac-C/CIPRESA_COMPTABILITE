import React from "react";
import RoleDashboardBase from "./RoleDashboardBase";

export default function MagasinierDashboard({ onNavigate, can }) {
  return <RoleDashboardBase role="MAGASINIER" summary={{ title: "Espace magasinier", description: "Contrôlez les produits et les mouvements de stock au quotidien.", cards: [{ label: "Catalogue", value: "Produits", hint: "Références et prix" }, { label: "Opérations", value: "Mouvements", hint: "Entrées et sorties" }, { label: "Alerte", value: "Stock", hint: "Surveillez les seuils" }] }} actions={[{ id: "inventaire", label: "Inventaire", icon: "▱", permission: "STOCK_READ", description: "Gérer les produits" }, { id: "profile", label: "Mon profil", icon: "◉", description: "Gérer vos informations" }]} onNavigate={onNavigate} can={can} />;
}
