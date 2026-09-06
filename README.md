# Notifications Push et appareils

Le site utilise `public/sw.js` pour recevoir les notifications même lorsque l’onglet est fermé. Pour activer l’envoi hors ligne dans Supabase :

1. Générer une paire de clés VAPID et placer la clé publique dans `VITE_VAPID_PUBLIC_KEY`.
2. Déployer `supabase/functions/send-push-notification`.
3. Ajouter dans les secrets de la fonction `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` et `VAPID_SUBJECT`.
4. Créer un Database Webhook Supabase sur `public.notifications`, événement `INSERT`, qui appelle cette fonction.
5. Exécuter `BD_SUPABASE.sql` pour créer les tables, les policies RLS et la publication Realtime.

Les appareils et abonnements Push sont isolés par `user_id`. La révocation depuis Profil désactive l’appareil et supprime son abonnement Push. Le navigateur doit avoir reçu l’autorisation de notifications ; iOS nécessite l’installation du site sur l’écran d’accueil pour le Push Web.
# COMPTA-CIPRESA — App React

Application React (Vite + JavaScript) connectée à la base Supabase
**COMPTA-CIPRESA**, avec authentification et un tableau de bord de
démarrage (clients, factures, comptes de trésorerie).

## 1. Installer les dépendances

```bash
npm install
```

## 2. Configurer la connexion à Supabase

```bash
cp .env.example .env
```

Puis complète `.env` :

```
VITE_SUPABASE_URL=https://xivropjvahlnecoyfjst.supabase.co
VITE_SUPABASE_ANON_KEY=<ta clé publique>
```

La clé publique (anon / publishable) se récupère dans le tableau de
bord Supabase : **Project Settings → API → Project API keys**. Elle
n'a pas pu être récupérée automatiquement ici (autorisation
requise) — copie-la manuellement.

## 3. Lancer l'application en développement

```bash
npm run dev
```

L'app est servie sur `http://localhost:5173`.

## 4. Connexion et inscription

L'écran permet de se connecter avec `supabase.auth.signInWithPassword`,
de créer un compte avec `supabase.auth.signUp` et de demander un lien
de réinitialisation du mot de passe. Si la confirmation d'adresse est
activée dans Supabase, l'utilisateur doit cliquer sur le lien reçu avant
sa première connexion.

Le trigger `on_auth_user_created` du fichier `BD_SUPABASE.sql` crée
automatiquement le profil associé à partir des champs d'inscription
`nom`, `prenom` et `telephone`. Vérifie que ce script a bien été exécuté
dans le projet Supabase.

## Structure du projet

```
src/
  lib/supabaseClient.js     → client Supabase (URL + clé depuis .env)
  context/AuthContext.jsx   → session, profil utilisateur, signIn/signOut
  pages/Login.jsx           → écran de connexion
  pages/Dashboard.jsx       → tableau de bord (stats + dernières factures)
  components/StatCard.jsx   → carte de statistique réutilisable
  components/FacturesTable.jsx → tableau des factures
  index.css                 → styles de l'application
```

## Ce que le tableau de bord affiche déjà

- Nombre total de clients
- Nombre total de factures
- Reste à payer cumulé sur les 10 dernières factures
- Nombre de comptes de trésorerie (caisse / banque / mobile money)
- Table des 10 dernières factures avec statut (payée, en retard, etc.)

## Pour aller plus loin

Le schéma Supabase couvre bien plus que ce point de départ :
ventes, achats, fournisseurs, écritures comptables, journaux,
balances, bilans, rapports financiers, audit_logs, notifications.
Chaque nouvelle page suit le même schéma que `Dashboard.jsx` :
une requête `supabase.from("table").select(...)`, un composant
d'affichage dédié.

⚠️ Toutes les tables ont `RLS` (Row Level Security) activé : les
requêtes ne renverront des données que si des policies adaptées au
rôle de l'utilisateur connecté existent côté Supabase.
