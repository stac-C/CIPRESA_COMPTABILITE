export const ROLE_ORDER = [
  "ADMIN",
  "GERANT",
  "COMPTABLE",
  "AGENT_COMMERCIAL",
  "MAGASINIER",
  "CONSULTANT",
];

export const ROLE_LABELS = {
  ADMIN: "Administrateur",
  GERANT: "Gérant",
  COMPTABLE: "Comptable",
  AGENT_COMMERCIAL: "Agent commercial",
  MAGASINIER: "Magasinier",
  CONSULTANT: "Consultant",
};

export const TAB_ACCESS = {
  clients: { permission: "CLIENT_READ" },
  fournisseurs: { permission: "ACHAT_READ" },
  achats: { permission: "ACHAT_READ" },
  projets: { roles: ["ADMIN", "GERANT"] },
  ventes: { permission: "VENTE_READ" },
  facturation: { permission: "VENTE_READ" },
  inventaire: { permission: "STOCK_READ" },
  comptabilite: { permission: "COMPTA_READ" },
  bilans: { permission: "BILAN_READ" },
  rapports: { permission: "RAPPORT_READ" },
  configuration: { roles: ["ADMIN"] },
  profile: {},
};

export function canAccessTab(tabId, { can, hasRole }) {
  const access = TAB_ACCESS[tabId];
  if (!access) return false;
  if (hasRole("ADMIN")) return true;
  if (access.roles && !access.roles.some((role) => hasRole(role))) return false;
  return !access.permission || can(access.permission);
}

export function canAccessAction(action, { can, hasRole }) {
  if (hasRole("ADMIN")) return true;
  if (action.roles && !action.roles.some((role) => hasRole(role))) return false;
  return !action.permission || can(action.permission);
}
