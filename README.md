# MAHER STOCK
### Application Professionnelle de Gestion de l'Économat et des Stocks
**COMPLEXE MAHER – RESTAURANT ET PISCINE (Casablanca, Maroc)**

---

## 📋 Présentation du Projet

**MAHER STOCK** est une application web SaaS complète, sécurisée et bilingue (Français / Arabe RTL) conçue sur-mesure pour la gestion rigoureuse de la chambre économat du **Complexe Maher**. 

Elle élimine le gaspillage, prévient les pertes et les vols, assure une traçabilité immuable de chaque mouvement physique et donne au propriétaire une supervision financière et opérationnelle totale en temps réel.

---

## 🎨 Identité Visuelle et Charte Graphique

- **Logo Officiel** : Logo original Complexe Maher intégré dans l'en-tête, la page de connexion, les étiquettes QR et les exports PDF officiels.
- **Palette de Couleurs** :
  - **Bleu Marine** (`#151936`) : Éléments structurants, barre latérale, navigation principale.
  - **Orange / Or** (`#E99B39`) : Boutons d'action prioritaires, alertes visuelles, accents.
  - **Turquoise** (`#43A9B7`) : Métriques secondaires, liens informatifs, badges interactifs.
  - **Blanc Cassé** (`#F5F5F3`) : Arrière-plans reposants et modernes.
  - **Blanc Pur** (`#FFFFFF`) : Cartes et conteneurs avec ombres subtiles.
- **Monnaie Officielle** : Dirham Marocain (**MAD**).
- **Typographie** : Inter (Français) & Cairo (Arabe avec prise en charge RTL native).

---

## 👥 Rôles et Permissions Strictes

L'application prend en charge 3 profils utilisateurs distincts :

| Fonctionnalité | 👑 Administrateur (Propriétaire) | 🛡️ Responsable Économat | 👨‍🍳 Employé (Cuisine/Café/Piscine) |
| :--- | :---: | :---: | :---: |
| **Tableau de bord financier & KPI** | ✅ Complet (Valeur, Pertes, Marges) | ✅ Opérationnel (Stocks, Alertes) | ✅ Personnel (Mes demandes) |
| **Catalogue Produits** | ✅ CRUD complet, Seuil min, Prix PMP | ✅ Consultation & Création | 👁️ Consultation indicative |
| **Génération / Impression QR Code** | ✅ Oui (Étiquettes officielles) | ✅ Oui (Scanner & Impression) | 🔍 Scanner pour recherche |
| **Réception Marchandise (Entrées)** | ✅ Consultation & Historique | ✅ Enregistrement avec calcul PMP | ❌ Interdit |
| **Demande de Sortie** | ✅ Supervision globale | ❌ Interdit d'auto-valider | ✅ Création multi-produits |
| **Validation / Réservation de Stock** | ✅ Autorisation d'urgence | ✅ Approbation partielle/totale | ❌ Interdit |
| **Remise Physique (Décrément Stock)** | ❌ Rôle de supervision | ✅ **Seul habilité à décrémenter** | ❌ Interdit |
| **Sessions d'Inventaire Physique** | ✅ Consultation & Arbitrage | ✅ Saisie des comptages réels | ❌ Interdit |
| **Validation des Anomalies / Écarts** | ✅ **Seul habilité à valider** | ⚠️ Déclaration avec justification | ❌ Interdit |
| **Gestion des Utilisateurs & Rôles** | ✅ Création, Rôles, Désactivation | ❌ Interdit | ❌ Interdit |
| **Grand Livre & Audit Immuable** | ✅ Export CSV / PDF certifié | 👁️ Consultation | ❌ Interdit |

---

## 🔄 Règle d'Or du Mouvement de Stock (Anti-Vol)

Pour garantir une intégrité absolue :
1. **Création de la demande** : L'employé soumet sa liste d'articles. Aucun stock n'est débité ni réservé.
2. **Approbation par l'économat** : Le responsable valide les quantités autorisées. Le stock est **réservé** (`reserved_stock`), ce qui bloque les autres demandes simultanées pour éviter toute rupture imprévue. **Le stock physique en chambre froide / réserve NE diminue pas encore.**
3. **Préparation physique** : Le responsable prépare les colis et marque la commande "Prête".
4. **Remise physique réelle au comptoir** : Lorsque l'employé se présente pour récupérer ses produits, le responsable confirme la remise dans l'interface (`/manager/deliveries`). **C'est UNIQUEMENT à cet instant précis que le stock physique (`physical_stock`) est décrémenté** et que la réservation est levée.
5. **Inventaire et Anomalies** : Tout écart constaté lors d'un inventaire nécessite une justification écrite du responsable. L'ajustement du stock physique est bloqué en attente d'arbitrage par l'Administrateur.

---

## 🛠️ Stack Technique

- **Frontend** : Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Backend & Données** : 
  - Mode hors-ligne / Démo immédiate : `StockDatabaseService` avec persistance `localStorage` réactive et 100% conforme aux règles SQL.
  - Mode Production : Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security, Triggers & Fonctions SQL).
- **Exports & QR Code** : `jspdf`, `jspdf-autotable`, `xlsx`, `qrcode.react`, `html5-qrcode`.
- **PWA** : Prise en charge mobile/tablette complète (`manifest.json`, icônes tactiles).

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancement en mode développement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### 3. Comptes Démo Préconfigurés
Vous pouvez vous connecter instantanément ou utiliser le **sélecteur rapide d'utilisateur** dans la barre de navigation :

- **Administrateur** : `admin@complexe-maher.ma` (M. Maher)
- **Responsable Économat** : `economat@complexe-maher.ma` (Rachid)
- **Chef de Cuisine** : `chef.ahmed@complexe-maher.ma` (Ahmed)
- **Chef Barista** : `barista.omar@complexe-maher.ma` (Omar)
- **Responsable Piscine** : `piscine.karim@complexe-maher.ma` (Karim)

---

## 📦 Structure des 32 Routes App Router

```
src/app/
├── (auth)
│   ├── login/                  # Page de connexion professionnelle
│   └── forgot-password/        # Réinitialisation de mot de passe
├── admin/                      # Espace Administrateur (Propriétaire)
│   ├── dashboard/              # 8 KPI, graphiques d'évolution, alertes
│   ├── products/               # CRUD produits, prix PMP, stock min, QR
│   ├── requests/               # Supervision de toutes les demandes
│   ├── entries/                # Réceptions fournisseurs & factures
│   ├── movements/              # Grand livre immuable des flux
│   ├── inventory/              # Sessions d'inventaire
│   ├── anomalies/              # Décision sur les écarts constatés
│   ├── categories/             # Gestion des rayons & catégories
│   ├── suppliers/              # Fiches fournisseurs
│   ├── employees/              # Gestion des comptes & droits
│   ├── reports/                # Rapports financiers & valorisation
│   ├── audit-logs/             # Journal d'audit légal immuable
│   └── settings/               # Paramètres & réinitialisation démo
├── manager/                    # Espace Responsable Économat
│   ├── dashboard/              # Pilotage opérationnel & raccourci scanner
│   ├── requests/               # Validation des demandes & réservations
│   ├── deliveries/             # Remise physique (décrément effectif)
│   ├── entries/                # Réception des livraisons fournisseurs
│   ├── inventory/              # Comptage physique & déclaration écarts
│   ├── products/               # Consultation catalogue & QR Codes
│   ├── movements/              # Journal des flux magasin
│   └── alerts/                 # Alertes ruptures & seuils critiques
└── employee/                   # Espace Employé (Cuisine, Café, Piscine)
    ├── dashboard/              # Accueil, synthèse & notifications
    ├── new-request/            # Formulaire de demande multi-produits
    ├── my-requests/            # Suivi des demandes avec annulation
    ├── products/               # Catalogue indicatif & recherche QR
    └── notifications/          # Centre de notifications en direct
```

---

## 🗄️ Connexion à Supabase en Production

Consultez le fichier [`SETUP.md`](./SETUP.md) pour les instructions complètes de déploiement de la base de données PostgreSQL et de la configuration des clés secrètes.
