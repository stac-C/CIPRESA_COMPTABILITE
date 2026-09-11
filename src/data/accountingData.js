export const accountClasses = [
  'Classe 1 - Ressources durables',
  'Classe 2 - Immobilisations',
  'Classe 3 - Stocks',
  'Classe 4 - Comptes de tiers',
  'Classe 5 - Trésorerie',
  'Classe 6 - Charges',
  'Classe 7 - Produits',
];

export const chartOfAccounts = [
  { code: '101300', label: 'Capital social souscrit, appelé et versé', nature: 'Capitaux propres', status: 'Actif', usage: 'Capital libéré de la SARL' },
  { code: '111000', label: 'Réserve légale', nature: 'Capitaux propres', status: 'Actif', usage: 'Affectation annuelle du résultat' },
  { code: '121000', label: 'Report à nouveau créditeur', nature: 'Capitaux propres', status: 'Actif', usage: 'Bénéfices antérieurs non distribués' },
  { code: '131000', label: 'Résultat net — bénéfice', nature: 'Résultat', status: 'Actif', usage: 'Compte de centralisation' },
  { code: '168600', label: 'Emprunts et dettes contractés auprès de personnes physiques', nature: 'Dette financière', status: 'Actif', usage: 'Principal des prêts reçus de tiers' },
  { code: '213100', label: 'Logiciels de comptabilité et de gestion', nature: 'Immobilisation incorporelle', status: 'Actif', usage: 'Logiciels contrôlés et utilisés durablement' },
  { code: '232200', label: "Bâtiments agricoles sur sol d'autrui", nature: 'Immobilisation corporelle', status: 'À confirmer', usage: 'Constructions sur terrains loués' },
  { code: '234200', label: 'Installations complexes spécialisées sur sol d’autrui', nature: 'Immobilisation corporelle', status: 'Actif', usage: 'Réseaux fixes et installations techniques' },
  { code: '401101', label: 'Fournisseurs — achats locaux', nature: 'Tiers', status: 'Actif', usage: 'Factures locales' },
  { code: '411xxx', label: 'Clients', nature: 'Tiers', status: 'Actif', usage: 'Créances clients' },
  { code: '41910x', label: 'Avances reçues des clients', nature: 'Tiers', status: 'Actif', usage: 'Préfinancements clients' },
  { code: '422000', label: 'Personnel — rémunérations dues', nature: 'Tiers', status: 'Actif', usage: 'Paie mensuelle' },
  { code: '431xxx', label: 'Organismes sociaux', nature: 'Tiers', status: 'Actif', usage: 'Charges sociales' },
  { code: '481200', label: 'Fournisseurs étrangers / transit', nature: 'Tiers', status: 'Actif', usage: 'Importations' },
  { code: '552101', label: 'MTN Mobile Money', nature: 'Trésorerie', status: 'Actif', usage: 'Encaissements et paiements' },
  { code: '552102', label: 'Orange Money', nature: 'Trésorerie', status: 'Actif', usage: 'Encaissements et paiements' },
  { code: '585000', label: 'Virements internes', nature: 'Trésorerie', status: 'Actif', usage: 'Transferts banque-caisse' },
  { code: '601101', label: 'Achats de marchandises', nature: 'Charge', status: 'Actif', usage: 'Achats locaux' },
  { code: '602101', label: 'Intrants de pépinière', nature: 'Charge', status: 'Actif', usage: 'Semences et consommables' },
  { code: '621101', label: 'Sous-traitance', nature: 'Charge', status: 'Actif', usage: 'Prestations sous-traitées' },
  { code: '622101', label: 'Loyers de terrains', nature: 'Charge', status: 'Actif', usage: 'Locations' },
  { code: '656000', label: 'Pertes de change commerciales', nature: 'Charge', status: 'Actif', usage: 'Écarts de change' },
  { code: '661xxx', label: 'Rémunérations du personnel', nature: 'Charge', status: 'Actif', usage: 'Salaires' },
  { code: '681300', label: 'Dotations aux amortissements', nature: 'Charge', status: 'Actif', usage: 'Amortissements' },
  { code: '701100', label: 'Ventes de marchandises', nature: 'Produit', status: 'Actif', usage: 'Ventes comptoir' },
  { code: '702101', label: 'Ventes de plants produits', nature: 'Produit', status: 'Actif', usage: 'Pépinière' },
  { code: '705101', label: 'Travaux de plantation / irrigation', nature: 'Produit', status: 'Actif', usage: 'Prestations livrées' },
  { code: '734100', label: 'Production stockée — en-cours pépinière', nature: 'Produit', status: 'Actif', usage: 'Lots en production' },
];

export const journals = [
  { code: 'AN', label: 'À-nouveaux', operations: "Soldes d'ouverture validés" },
  { code: 'ACH-L', label: 'Achats locaux', operations: 'Factures de marchandises, intrants et services locaux' },
  { code: 'ACH-I', label: 'Achats importés', operations: 'Fournisseurs étrangers, douane, fret et transit' },
  { code: 'VTE-N', label: 'Ventes Nomayos', operations: 'Factures et ventes comptoir du siège' },
  { code: 'VTE-O', label: 'Ventes Otele', operations: 'Ventes pépinière et magasin' },
  { code: 'VTE-D', label: 'Ventes Dschang', operations: 'Ventes pépinière et magasin' },
  { code: 'BQ', label: 'Banque', operations: 'Mouvements bancaires' },
  { code: 'MM-MTN', label: 'MTN Mobile Money', operations: 'Encaissements et paiements MTN' },
  { code: 'MM-ORA', label: 'Orange Money', operations: 'Encaissements et paiements Orange' },
  { code: 'STK', label: 'Stocks', operations: 'Entrées, sorties, production et inventaires' },
  { code: 'IMM', label: 'Immobilisations', operations: 'Acquisitions, mises en service, amortissements et cessions' },
  { code: 'PAI', label: 'Paie', operations: 'Salaires, retenues et charges sociales' },
  { code: 'OD', label: 'Opérations diverses', operations: 'Régularisations, provisions, change et clôture' },
];

export const journalEntries = [
  { date: '15/10/2025', number: 'VE-2025-0052', journal: 'VTE-N', label: 'Vente café — Coopérative Boundiali', account: '411100', debit: 4200000, credit: 0, status: 'Validée' },
  { date: '15/10/2025', number: 'VE-2025-0052', journal: 'VTE-N', label: 'Vente café — Coopérative Boundiali', account: '701100', debit: 0, credit: 3500000, status: 'Validée' },
  { date: '15/10/2025', number: 'VE-2025-0052', journal: 'VTE-N', label: 'TVA / ajustement commercial', account: '411100', debit: 0, credit: 700000, status: 'Validée' },
  { date: '11/10/2025', number: 'HA-2025-0112', journal: 'ACH-L', label: "Achat engrais d'essai — Azito Agro", account: '601101', debit: 1250000, credit: 0, status: 'Validée' },
  { date: '11/10/2025', number: 'HA-2025-0112', journal: 'ACH-L', label: "Achat engrais d'essai — Azito Agro", account: '401101', debit: 0, credit: 1250000, status: 'Validée' },
  { date: '10/10/2025', number: 'OD-2025-0089', journal: 'OD', label: 'Salaires siège — Septembre 2025', account: '661xxx', debit: 12400000, credit: 0, status: 'Validée' },
  { date: '10/10/2025', number: 'OD-2025-0089', journal: 'OD', label: 'Salaires siège — Septembre 2025', account: '422000', debit: 0, credit: 12400000, status: 'Validée' },
  { date: '08/10/2025', number: 'BQ-2025-0312', journal: 'BQ', label: 'Virement reçu — Ministère Agriculture', account: '521000', debit: 15000000, credit: 0, status: 'Validée' },
  { date: '08/10/2025', number: 'BQ-2025-0312', journal: 'BQ', label: 'Virement reçu — Ministère Agriculture', account: '41910x', debit: 0, credit: 15000000, status: 'Validée' },
  { date: '05/10/2025', number: 'VE-2025-0046', journal: 'VTE-O', label: 'Audit de sol — Groupement Boundiali', account: '705101', debit: 0, credit: 4200000, status: 'Brouillon' },
];

export const trialBalance = [
  ['101300', 'Capital social', 0, 50000000],
  ['213100', 'Logiciels de comptabilité et gestion', 3500000, 0],
  ['401101', 'Fournisseurs achats locaux', 0, 1250000],
  ['411100', 'Clients', 4200000, 700000],
  ['422000', 'Personnel', 0, 12400000],
  ['521000', 'Banque', 15000000, 0],
  ['601101', 'Achats marchandises', 1250000, 0],
  ['661xxx', 'Rémunérations', 12400000, 0],
  ['701100', 'Ventes marchandises', 0, 3500000],
  ['705101', 'Prestations', 0, 4200000],
];

export const fixedAssets = [
  { code: 'IMM-001', label: 'Logiciel comptable CIPRESA', category: 'Incorporelle', date: '15/01/2025', amount: 3500000, life: 3, method: 'Linéaire', status: 'En service' },
  { code: 'IMM-002', label: 'Pompe d’irrigation site Otele', category: 'Corporelle', date: '12/03/2025', amount: 8500000, life: 5, method: 'Linéaire', status: 'En service' },
  { code: 'IMM-003', label: 'Aménagement pépinière Dschang', category: 'Corporelle', date: '30/06/2025', amount: 6200000, life: 10, method: 'Linéaire', status: 'En service' },
];
