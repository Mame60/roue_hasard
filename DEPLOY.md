# Guide de déploiement Vercel

## ✅ Configuration actuelle

L'application est configurée pour Vercel avec :
- **Frontend** : React buildé dans `frontend/dist/`
- **Backend** : Fonction serverless dans `api/[...].ts` qui gère toutes les routes `/api/*`

## 🚀 Déploiement

### 1. Préparer le repository

Assurez-vous que tous les fichiers sont commités et pushés sur GitHub :
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Déployer sur Vercel

**Option A : Via le dashboard Vercel**
1. Aller sur https://vercel.com
2. Cliquer sur "New Project"
3. Importer le repository GitHub `Mame60/roue_hasard`
4. Vercel détectera automatiquement la configuration

**Option B : Via CLI**
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 3. Configurer les variables d'environnement

Dans le dashboard Vercel → Settings → Environment Variables, ajouter :

```
MONGODB_URI=mongodb+srv://Emama:N8F7kSlWoJpZ0bIk@cluster0.1czao7m.mongodb.net/roue_hasard?retryWrites=true&w=majority&appName=Cluster0
PORT=4000
DEFAULT_ADMIN_NAME=djiby
DEFAULT_ADMIN_EMAIL=djiby@ibtikar-tech.com
DEFAULT_ADMIN_CODE=rh1234djiby
DEFAULT_USER_CODE=pinkbellezza
```

### 4. Tester après déploiement

1. **Test API** : `https://roue-hasard.vercel.app/api/test`
   - Devrait retourner : `{"message": "API fonctionne!", ...}`

2. **Test Health** : `https://roue-hasard.vercel.app/api/health`
   - Devrait retourner : `{"status":"ok"}`

3. **Test Frontend** : `https://roue-hasard.vercel.app`
   - Devrait afficher la page de connexion

4. **Test Login** :
   - Email : `djiby@ibtikar-tech.com`
   - Mot de passe : `rh1234djiby`

## 🔧 Structure des fichiers

```
roue_hasard/
├── api/
│   └── [...].ts          # Catch-all pour toutes les routes /api/*
├── frontend/
│   ├── dist/             # Build output (généré)
│   └── src/              # Code source React
├── src/                  # Code source backend
├── vercel.json           # Configuration Vercel
└── package.json          # Dépendances backend
```

## ⚠️ Dépannage

Si vous obtenez une erreur 404 :
1. Vérifier que `api/[...].ts` existe
2. Vérifier les variables d'environnement
3. Vérifier les logs de build dans Vercel
4. Redéployer : `vercel --prod`

Si l'API ne répond pas :
1. Vérifier la connexion MongoDB dans les logs
2. Tester `/api/test` pour voir si la fonction est appelée
3. Vérifier les logs de fonction dans Vercel

