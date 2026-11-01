# Guide de Déploiement et Connexion Supabase
### MAHER STOCK – COMPLEXE MAHER

Ce guide détaille pas à pas la configuration de la base de données de production sur **Supabase** et le déploiement sur **Vercel**.

---

## 1. Création du Projet Supabase

1. Rendez-vous sur [https://supabase.com](https://supabase.com) et connectez-vous.
2. Cliquez sur **"New Project"**.
3. Renseignez les paramètres du projet :
   - **Name** : `Maher-Stock`
   - **Database Password** : Générez un mot de passe fort et conservez-le en lieu sûr.
   - **Region** : Choisissez une région proche du Maroc (ex: `eu-west-3` Paris ou `eu-central-1` Francfort).
4. Cliquez sur **"Create new project"** et patientez 2 minutes le temps de l'initialisation.

---

## 2. Déploiement des Tables et Fonctions SQL

Dans votre tableau de bord Supabase :
1. Rendez-vous dans le menu **"SQL Editor"** (icône terminal dans la barre latérale gauche).
2. Cliquez sur **"New Query"**.
3. Ouvrez le fichier consolidé présent dans ce dépôt :
   `supabase/schema.sql` (ou exécutez dans l'ordre les fichiers du dossier `supabase/migrations/`) :
   - `001_initial_schema.sql` : Création des 17 tables relationnelles et index.
   - `002_functions_and_triggers.sql` : Fonctions transactionnelles PostgreSQL (calcul PMP, réservation, décrément à la livraison).
   - `003_rls_policies.sql` : Politiques Row Level Security (RLS) étanches pour les 3 rôles.
   - `004_seed_data.sql` : Données de démarrage (rayons, fournisseurs, départements).
4. Collez le contenu dans l'éditeur SQL et cliquez sur **"Run"**.
5. Vous devez voir le message de confirmation : `Success. No rows returned`.

---

## 3. Configuration des Variables d'Environnement

1. Dans votre tableau de bord Supabase, allez dans **Project Settings** > **API**.
2. Récupérez les deux valeurs suivantes :
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **Project API Keys** > `anon public` (la clé publique anonyme sécurisée pour le client).
3. Ouvrez le fichier `.env.local` à la racine du projet et mettez à jour les variables :

```env
# Clés Supabase officielles
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_publique_ici

# Paramètres établissement
NEXT_PUBLIC_APP_NAME="MAHER STOCK"
NEXT_PUBLIC_ORGANIZATION_NAME="COMPLEXE MAHER – RESTAURANT ET PISCINE"
NEXT_PUBLIC_DEFAULT_CURRENCY="MAD"
```

> ⚠️ **Sécurité** : Ne committez JAMAIS la clé secrète `service_role` dans votre code source ou votre dépôt Git.

---

## 4. Création des Utilisateurs dans Supabase Auth

Pour inviter le personnel sans permettre d'inscription publique non autorisée :
1. Dans Supabase, allez dans **Authentication** > **Users**.
2. Cliquez sur **"Invite User"** ou **"Add User"** :
   - Propriétaire / Admin : `admin@complexe-maher.ma`
   - Responsable Économat : `economat@complexe-maher.ma`
   - Employés : `chef.ahmed@complexe-maher.ma`, `barista.omar@complexe-maher.ma`, etc.
3. Définissez les mots de passe initiaux.
4. Dans le **Table Editor** > table `profiles`, attribuez le rôle correspondant (`ADMIN`, `RESPONSABLE`, `EMPLOYEE`) et le service pour chaque employé.

---

## 5. Déploiement sur Vercel

1. Poussez votre code sur votre compte GitHub / GitLab / Bitbucket :
   ```bash
   git init
   git add .
   git commit -m "feat: complete maher-stock application ready for production"
   git remote add origin https://github.com/votre-compte/maher-stock.git
   git push -u origin main
   ```
2. Rendez-vous sur [https://vercel.com](https://vercel.com) et connectez votre compte Git.
3. Cliquez sur **"Add New Project"** et sélectionnez le dépôt `maher-stock`.
4. Dans la section **Environment Variables**, ajoutez les clés définies à l'étape 3 :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Cliquez sur **"Deploy"**.
6. En moins de 2 minutes, votre application sera accessible mondialement en HTTPS avec mise en cache CDN ultra-rapide.

---

## 6. Vérification Locale de la Compilation

Avant tout déploiement, vous pouvez exécuter :
```bash
npm run build
```
Cette commande vérifie l'ensemble des types TypeScript, compile les 32 routes Next.js et génère les pages statiques optimisées.
