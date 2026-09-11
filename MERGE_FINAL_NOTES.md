# CIPRESA — Merge final

Cette version utilise le codebase principal complet comme base et conserve la couche comptable existante.

## Navigation
- Les modules métier existants restent dans la navigation principale : Clients, Fournisseurs, Achats, Projets, Ventes, Facturation, Inventaire, etc.
- La comptabilité est regroupée sous **Comptabilité**.
- Les sous-rubriques comptables restent accessibles depuis les onglets internes : Plan comptable, Journal, Grand livre, Balance, Bilan, Compte de résultat, Trésorerie, Rapprochement, TVA & Taxes, Immobilisations et Clôtures.
- Le bouton **Admin** est un menu déroulant réservé aux administrateurs et ouvre Configuration.
- Les routes comptables directes restent supportées afin que les boutons « nouvelle écriture », « nouveau compte », etc. puissent naviguer vers les écrans dédiés.

## Supabase / environnement
- `.env` est conservé pour l'exécution locale et reste ignoré par Git.
- `.env.example` est conservé comme modèle.
- `.gitignore` exclut les secrets, `node_modules`, `dist`, logs et fichiers temporaires.

## Vérifications effectuées
- Vérification des imports locaux : aucune cible locale manquante détectée.
- Vérification de la structure du codebase.
- Vérification des routes internes comptables et de la navigation imbriquée.
- Aucun push GitHub n'a été effectué.
- La compilation npm complète n'a pas pu être exécutée dans l'environnement de génération car le registre npm n'était pas accessible dans le délai imparti. À lancer localement avec `npm install` puis `npm run build`.
