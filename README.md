# 🎰 Roue de hasard (Full Stack)

Application complète avec backend Node.js/Express + MongoDB et frontend React pour gérer une roue de hasard avec authentification et rôles (admin/user).

## 📦 Fonctionnalités

### Backend (API Express)
- Authentification par nom et mot de passe (accessCode)
- CRUD des entrées de roue (ajout/suppression via admin)
- Tirages aléatoires garantissant qu'un nom n'est pas répété avant épuisement du cycle
- Historique des tirages (avec l'auteur/admin, date/heure)
- Script de seed créant :
  - Admin `djiby` (mot de passe: `admin123` par défaut)
  - Utilisateurs `emem med moctar`, `fatima hamdi`, `fatimetou dah`, `naha sidiya` (mot de passe: `user123` par défaut)

### Frontend (React)
- **Page de connexion** : authentification avec nom et mot de passe
- **Interface Admin** :
  - Ajouter des noms à la roue
  - Supprimer/désactiver des noms
  - Lancer un tirage
  - Voir la liste des participants actifs
- **Interface User** :
  - Visualisation de la roue avec animation
  - Affichage du dernier tirage (nom sélectionné, date/heure, cycle)
  - Mise à jour automatique toutes les 5 secondes

## 🚀 Démarrage

### Backend

```bash
cp env.example .env   # adapter au besoin
npm install
npm run seed          # initialiser les utilisateurs et données
npm run dev           # ou npm run build && npm start en production
```

Le backend démarre sur `http://localhost:4000`

### Frontend

```bash
cd frontend
npm install
npm run dev           # démarre sur http://localhost:5173
```

## 🔑 Identifiants par défaut

Après avoir exécuté `npm run seed` :

- **Admin** :
  - Nom : `djiby`
  - Mot de passe : `admin123` (configurable via `DEFAULT_ADMIN_CODE` dans `.env`)

- **Utilisateurs** :
  - Noms : `emem med moctar`, `fatima hamdi`, `fatimetou dah`, `naha sidiya`
  - Mot de passe : `pinkbellezza` (configurable via `DEFAULT_USER_CODE` dans `.env`)

## 🔌 Endpoints principaux

### Public
| Méthode | URL                | Description                              |
|---------|--------------------|------------------------------------------|
| GET     | `/health`          | Vérifie que l'API tourne.                |
| POST    | `/api/public/login` | Connexion (body `{ name, accessCode }`). |
| GET     | `/api/public/entries` | Liste des noms actifs.               |
| GET     | `/api/public/last-draw` | Dernier tirage + date + admin.     |
| GET     | `/api/public/admins` | Liste des administrateurs connus.    |

### Admin (nécessite adminId)
| Méthode | URL                | Description                              |
|---------|--------------------|------------------------------------------|
| POST    | `/api/admin/wheel` | Ajoute des noms (body `{ adminId, names[] }`). |
| DELETE  | `/api/admin/wheel/:id` | Désactive un nom (body `{ adminId }`). |
| POST    | `/api/admin/draw`  | Lance la roue (body `{ adminId }`).     |

## 🧱 Stack technique

### Backend
- Node.js / TypeScript
- Express, Mongoose, Zod
- MongoDB Atlas (cluster fourni)

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- CSS3 avec animations et design moderne

## ✅ Tests rapides

1. **Backend** : Lancer `npm run dev` dans le dossier racine.
2. **Initialisation** : Exécuter `npm run seed` pour créer les utilisateurs.
3. **Frontend** : Lancer `npm run dev` dans le dossier `frontend`.
4. **Connexion** :
   - Admin : email `djiby@ibtikar-tech.com`, mot de passe `rh1234djiby`
   - User : email `emem.med.moctar@ibtikar-tech.com` (ou autre), mot de passe `pinkbellezza`
5. Tester les fonctionnalités selon le rôle connecté.

## 📁 Structure

```
roue_hasard/
 ├─ src/                # Backend (API Express)
 │  ├─ app.ts           # configuration d'Express
 │  ├─ server.ts        # bootstrap serveur + base
 │  ├─ config/          # env + connexion Mongo
 │  ├─ controllers/     # logique HTTP
 │  ├─ services/        # règles métier (tirage)
 │  ├─ models/          # schémas Mongoose
 │  ├─ routes/          # routes admin/public
 │  └─ scripts/seed.ts  # création admin + utilisateurs
 └─ frontend/           # Frontend (React)
    ├─ src/
    │  ├─ App.tsx       # composant principal avec login/interfaces
    │  ├─ App.css       # styles complets
    │  └─ main.tsx      # point d'entrée
    └─ package.json
```

## 🚀 Déploiement sur Vercel

L'application est prête à être déployée sur Vercel (frontend + backend).

### Prérequis

1. Compte Vercel (gratuit)
2. MongoDB Atlas (déjà configuré)

### Étapes de déploiement

1. **Installer Vercel CLI** (optionnel) :
   ```bash
   npm i -g vercel
   ```

2. **Déployer depuis le terminal** :
   ```bash
   vercel
   ```
   
   Ou connecter le projet depuis le dashboard Vercel.

3. **Configurer les variables d'environnement** sur Vercel :
   - `MONGODB_URI` : votre chaîne de connexion MongoDB
   - `PORT` : (optionnel, Vercel gère automatiquement)
   - `DEFAULT_ADMIN_NAME` : `djiby`
   - `DEFAULT_ADMIN_EMAIL` : `djiby@ibtikar-tech.com`
   - `DEFAULT_ADMIN_CODE` : `rh1234djiby`
   - `DEFAULT_USER_CODE` : `pinkbellezza`

4. **Déployer** :
   ```bash
   vercel --prod
   ```

### Structure Vercel

- **Frontend** : déployé automatiquement depuis `frontend/`
- **Backend** : fonctions serverless dans `api/`
- **Routes** : toutes les routes `/api/*` sont gérées par le backend

### Notes importantes

- La connexion MongoDB est mise en cache entre les appels (optimisation serverless)
- Le frontend utilise automatiquement `/api` en production
- Les variables d'environnement doivent être configurées dans le dashboard Vercel

### Dépannage erreur 404

Si vous obtenez une erreur 404 NOT_FOUND :

1. **Vérifier que le fichier `api/index.ts` existe** à la racine du projet
2. **Vérifier les variables d'environnement** dans le dashboard Vercel
3. **Vérifier les logs de build** dans Vercel pour voir s'il y a des erreurs de compilation
4. **Tester l'endpoint** : `https://votre-domaine.vercel.app/api/health` devrait retourner `{"status":"ok"}`
5. **Redéployer** : parfois un redéploiement résout le problème

Si le problème persiste, vérifier que :
- Le dossier `api/` est bien à la racine (pas dans `src/`)
- Le fichier `vercel.json` est présent à la racine
- Les dépendances sont installées (Vercel le fait automatiquement)

## 🔐 Sécurité & évolutions

- ✅ Authentification par nom/mot de passe implémentée
- ✅ Frontend React complet avec interfaces admin/user
- ✅ Prêt pour déploiement Vercel
- 🔄 Améliorations possibles :
  - Ajouter JWT pour une authentification plus sécurisée
  - Ajouter des tests automatisés (Jest/Supertest)
  - Ajouter un système de sessions côté serveur
  - Améliorer la sécurité des mots de passe (hashing avec bcrypt)

