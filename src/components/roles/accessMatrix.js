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
  "plan-comptable": { permission: "COMPTA_READ" },
  journal: { permission: "COMPTA_READ" },
  "grand-livre": { permission: "COMPTA_READ" },
  balance: { permission: "COMPTA_READ" },
  bilan: { permission: "BILAN_READ" },
  "compte-resultat": { permission: "COMPTA_READ" },
  tresorerie: { permission: "COMPTA_TRESORERIE" },
  rapprochement: { permission: "COMPTA_RAPPROCHEMENT" },
  "tva-taxes": { permission: "COMPTA_FISCALITE" },
  immobilisations: { permission: "COMPTA_IMMOBILISATION" },
  clotures: { permission: "COMPTA_CLOTURE" },
  ecritures: { permission: "COMPTA_READ" },
  bilans: { permission: "BILAN_READ" },
  rapports: { permission: "RAPPORT_READ" },
  configuration: { roles: ["ADMIN"] },
  profile: {},
};

export const CONSULTANT_READ_TABS = ["clients", "fournisseurs", "achats", "projets", "ventes", "facturation", "inventaire"];

export function canAccessTab(tabId, { can, hasRole }) {
  const access = TAB_ACCESS[tabId];
  if (!access) return false;
  if (hasRole("ADMIN")) return true;
  if (hasRole("CONSULTANT") && CONSULTANT_READ_TABS.includes(tabId)) return can(access.permission || "CLIENT_READ");
  if (access.roles && !access.roles.some((role) => hasRole(role))) return false;
  return !access.permission || can(access.permission);
}

export function canAccessAction(action, { can, hasRole }) {
  if (hasRole("ADMIN")) return true;
  if (action.roles && !action.roles.some((role) => hasRole(role))) return false;
  return !action.permission || can(action.permission);
}
