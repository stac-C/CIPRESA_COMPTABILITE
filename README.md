# COMPTA-CIPRESA

Application de gestion comptable et commerciale construite avec React, Vite et Supabase. Elle fournit un espace de travail adapte aux roles de l'entreprise: clients, fournisseurs, achats, ventes, facturation, stock, comptabilite, rapports et administration.

## Fonctionnalites

- Authentification Supabase: connexion, inscription et reinitialisation du mot de passe.
- Profils utilisateurs avec coordonnees, photo, theme clair/sombre et appareils connectes.
- Creation d'un compte utilisateur par un administrateur depuis son profil.
- Attribution d'un role initial lors de la creation d'un utilisateur.
- Tableau de bord adapte aux roles `ADMIN`, `GERANT`, `COMPTABLE`, `AGENT_COMMERCIAL`, `MAGASINIER` et `CONSULTANT`.
- Gestion des clients, fournisseurs, achats, ventes, factures, produits et projets.
- Espaces comptables pour les ecritures, bilans et rapports financiers.
- Permissions et acces controles par les roles Supabase et les policies RLS.
- Notifications temps reel et notifications Push Web.
- Previsualisation PDF pour les documents concernes.
- Fenetres de confirmation centrees, au premier plan, avec fond floute et fermeture au clic exterieur.

## Prerequis

- Node.js 18 ou plus recent.
- Un projet Supabase.
- Supabase CLI pour deployer les Edge Functions et les migrations manuellement.

## Installation locale

```bash
npm install
copy .env.example .env
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

Pour produire le bundle de production:

```bash
npm run build
npm run preview
```

## Variables d'environnement

Le fichier `.env` a la racine doit contenir les variables publiques utilisees par Vite:

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-ou-publishable
VITE_VAPID_PUBLIC_KEY=votre-cle-publique-vapid
```

La cle `VITE_SUPABASE_ANON_KEY` peut etre exposee dans le navigateur. Ne placez jamais une cle `service_role` ou une cle privee VAPID dans `.env` cote frontend.

## Initialiser Supabase

Le schema complet se trouve dans [BD_SUPABASE.sql](BD_SUPABASE.sql). Il cree notamment:

- `profiles`, `roles`, `permissions`, `user_roles` et `role_permissions`;
- les tables metier et les journaux d'audit;
- les policies Row Level Security;
- le trigger `on_auth_user_created`, qui cree automatiquement le profil apres creation d'un utilisateur Auth;
- la publication Realtime pour les notifications.

Executez le script dans l'editeur SQL Supabase, puis verifiez que les roles, permissions et attributions initiales sont presents.

## Creer un utilisateur depuis le profil administrateur

Un administrateur voit la section **Creer un utilisateur** dans son profil. Le formulaire demande:

- prenom et nom;
- adresse email;
- telephone facultatif;
- mot de passe et confirmation;
- role initial.

La creation est realisee par l'Edge Function `admin-create-user`. Elle verifie le JWT de l'appelant et son role `ADMIN`, cree l'utilisateur via l'API Auth avec email confirme, puis attribue le role selectionne. Le mot de passe ne passe jamais dans `profiles` et n'est jamais enregistre par l'application.

Configurer le secret serveur dans Supabase, puis deployer la fonction:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="votre-cle-service-role"
supabase functions deploy admin-create-user
```

La fonction utilise aussi automatiquement `SUPABASE_URL`, fourni par l'environnement Supabase. Ne copiez jamais `SUPABASE_SERVICE_ROLE_KEY` dans le frontend.

## Notifications Push

Le service worker [public/sw.js](public/sw.js) permet de recevoir des notifications lorsque l'onglet n'est plus actif.

1. Generer une paire de cles VAPID.
2. Placer la cle publique dans `VITE_VAPID_PUBLIC_KEY`.
3. Configurer les secrets de la fonction:

```bash
supabase secrets set VAPID_PUBLIC_KEY="votre-cle-publique"
supabase secrets set VAPID_PRIVATE_KEY="votre-cle-privee"
supabase secrets set VAPID_SUBJECT="mailto:support@cipresa.com"
```

4. Deployer la fonction d'envoi:

```bash
supabase functions deploy send-push-notification
```

5. Creer dans Supabase un Database Webhook sur `public.notifications`, evenement `INSERT`, qui appelle `send-push-notification`.

Le navigateur doit autoriser les notifications. Sur iOS, l'application doit etre installee sur l'ecran d'accueil pour beneficier du Push Web.

## Modales et notifications dans l'interface

- Les confirmations et previsualisations utilisent `.modal-backdrop`.
- Le backdrop est fixe, centre, au-dessus du contenu et applique `backdrop-filter: blur(...)`.
- Un clic sur le fond exterieur ferme la fenetre.
- Un clic a l'interieur de la fenetre est conserve et n'entraine pas sa fermeture.
- Les popovers du centre de notifications et de l'aide se ferment lorsqu'un clic est effectue hors de `.platform-tools`.

## Architecture principale

```text
src/
  App.jsx                         Point d'entree et controle de session
  context/AuthContext.jsx         Session, profil, roles et permissions
  pages/Login.jsx                 Connexion et inscription
  pages/Dashboard.jsx             Navigation et rendu des espaces
  components/PersonalSettings.jsx Profil, securite et creation admin
  components/NotificationCenter.jsx Notifications temps reel et Push
  components/resources/           Workspaces CRUD generiques
  components/dashboards/          Tableaux de bord par role
  hooks/                          Donnees dashboard, Realtime et Push
  lib/supabaseClient.js           Client Supabase navigateur
  index.css                       Styles generaux
  components/PageStyles.css       Styles des modules et modales
supabase/functions/
  admin-create-user/              Creation securisee des comptes Auth
  send-push-notification/         Envoi des notifications Push
```

## Controle qualite

```bash
npm run build
```

Le build peut signaler que le bundle JavaScript depasse 500 kB apres minification. Il s'agit actuellement d'un avertissement Vite, pas d'une erreur de compilation.

## Securite

- Toutes les tables applicatives doivent rester protegees par RLS.
- Les droits d'acces sont controles cote interface pour l'ergonomie et cote Supabase pour la securite reelle.
- Les operations privilegiees, notamment la creation d'utilisateurs Auth, doivent passer par une Edge Function controlee.
- Ne jamais committer `.env`, les cles privees VAPID ou `SUPABASE_SERVICE_ROLE_KEY`.