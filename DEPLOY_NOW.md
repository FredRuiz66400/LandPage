# 🚀 COMMANDES DE DÉPLOIEMENT VERCEL

## Installation de Vercel CLI (une seule fois)

```bash
npm i -g vercel
```

## Déploiement Étape par Étape

### 1. Se connecter à Vercel
```bash
vercel login
```

### 2. Configurer les variables d'environnement (une seule fois)
```bash
# Ajouter SUPABASE_URL
vercel env add SUPABASE_URL production
# Coller: https://jxgcpdgbtrhcltqrzxus.supabase.co

# Ajouter SUPABASE_ANON_KEY
vercel env add SUPABASE_ANON_KEY production
# Coller: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4Z2NwZGdidHJoY2x0cXJ6eHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyOTIxNDcsImV4cCI6MjA4Mzg2ODE0N30.xfsohISfH5epo62ydbrLg9MYLsH3LNCoCY6pVCUotNU
```

### 3. Déploiement Preview (test)
```bash
vercel
```

### 4. Déploiement Production
```bash
vercel --prod
```

## Commandes Rapides

```bash
# Vérifier avant de déployer
./pre-deploy-vercel.sh

# Déployer en production directement
vercel --prod

# Voir les déploiements
vercel ls

# Voir les logs
vercel logs

# Voir les variables d'environnement
vercel env ls
```

## Après le premier déploiement

### Configurer CORS dans Supabase
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Settings → API → CORS
4. Ajouter vos URLs Vercel :
   - `https://votre-projet.vercel.app`
   - `https://votre-projet-*.vercel.app`

## Guide Complet

Pour plus de détails, consultez **VERCEL_DEPLOYMENT.md**
