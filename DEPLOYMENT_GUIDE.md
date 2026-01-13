# 🚀 DÉPLOIEMENT VERCEL - OpenTalent

## 📋 Guide Complet de Déploiement

### 1. Préparation du Repository GitHub

#### Créer le repository :
```bash
# Dans le dossier landPage
git init
git add .
git commit -m "Initial commit - OpenTalent landing page"

# Créer un repo sur GitHub : opentalent-landing
git remote add origin https://github.com/VOTRE-USERNAME/opentalent-landing.git
git branch -M main
git push -u origin main
```

### 2. Configuration Vercel

#### Étapes de déploiement :
1. **Aller sur** [vercel.com](https://vercel.com)
2. **Se connecter** avec GitHub
3. **Import Project** > Choisir `opentalent-landing`
4. **Configure Project** :
   - Framework Preset : `Other`
   - Root Directory : `./`
   - Build Command : (laisser vide)
   - Output Directory : (laisser vide)
   - Install Command : (laisser vide)

### 3. Variables d'Environment Vercel

#### Dans Vercel Dashboard > Settings > Environment Variables :
```bash
# Supabase Configuration
SUPABASE_URL=https://votre-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJI...

# Email Configuration (optionnel, géré côté Supabase)
RESEND_API_KEY=re_your_key_here

# Environment
NODE_ENV=production
```

### 4. Configuration des Scripts de Build

#### Créer package.json (optionnel mais recommandé) :
```json
{
  "name": "opentalent-landing",
  "version": "1.0.0",
  "description": "Landing page OpenTalent - Connecter talents et opportunités",
  "main": "index.html",
  "scripts": {
    "dev": "python -m http.server 8000",
    "build": "echo 'Static site - no build needed'",
    "preview": "python -m http.server 8080"
  },
  "keywords": ["landing-page", "developers", "recruitment", "opentalent"],
  "author": "OpenTalent Team",
  "license": "MIT",
  "dependencies": {},
  "devDependencies": {}
}
```

### 5. Optimisations Performance

#### Configuration des Headers (déjà dans vercel.json) :
- ✅ **Sécurité** : CSP, X-Frame-Options, HSTS
- ✅ **Cache** : CSS/JS mis en cache 1 an
- ✅ **Compression** : Gzip automatique avec Vercel

#### Optimisation des Images :
```javascript
// Si besoin d'optimiser des images plus tard
// Vercel gère automatiquement l'optimisation
```

### 6. Domaine Personnalisé (Optionnel)

#### Configuration DNS :
```bash
# Si vous avez un domaine opentalent.com
# Dans votre registrar DNS :
CNAME www your-project.vercel.app
A @ 76.76.19.61 (IP Vercel)
```

#### Dans Vercel :
1. **Settings** > **Domains**
2. **Add Domain** : `opentalent.com`
3. **Configure DNS** selon les instructions

### 7. Monitoring et Analytics

#### Vercel Analytics (recommandé) :
```javascript
// Ajouter dans index.html avant </head>
<script>
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
</script>
<script defer src="/_vercel/insights/script.js"></script>
```

#### Configuration dans vercel.json :
```json
{
  "analytics": {
    "id": "your-analytics-id"
  },
  "speed-insights": {
    "id": "your-speed-insights-id"
  }
}
```

### 8. Configuration HTTPS et Sécurité

#### Automatic HTTPS :
- ✅ **Certificat SSL** automatique
- ✅ **Redirection HTTP → HTTPS**
- ✅ **HSTS Headers**
- ✅ **CSP configuré**

#### Headers de sécurité (déjà configurés) :
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy
- Strict-Transport-Security

### 9. Tests Pre-Deployment

#### Tester en local avant déploiement :
```bash
# Test local
python -m http.server 8000
# Ou
npx serve .

# Vérifier :
# ✅ Formulaires fonctionnent
# ✅ Supabase connecté
# ✅ Emails envoyés (si configuré)
# ✅ Sécurité active (console dev)
```

### 10. Déploiement Final

#### Commandes de déploiement :
```bash
# Mise à jour du code
git add .
git commit -m "feat: ready for production deployment"
git push

# Vercel déploie automatiquement !
```

#### Vérifications post-déploiement :
- [ ] Site accessible sur https://votre-projet.vercel.app
- [ ] Formulaires fonctionnels
- [ ] Base Supabase connectée
- [ ] Headers de sécurité présents (F12 > Network)
- [ ] Performance correcte (Lighthouse > 90)
- [ ] SSL Grade A+ (ssllabs.com)

### 11. Configuration des Alertes

#### Webhooks Vercel (optionnel) :
```json
{
  "webhooks": [
    {
      "url": "https://your-webhook-url.com/deploy",
      "events": ["deployment.succeeded", "deployment.failed"]
    }
  ]
}
```

## 🎯 Checklist Final de Déploiement

### Pré-déploiement :
- [ ] Repository GitHub créé et pushé
- [ ] Supabase configuré avec vraies clés
- [ ] Emails testés (optionnel)
- [ ] vercel.json configuré
- [ ] Tests locaux passés

### Déploiement :
- [ ] Projet Vercel créé
- [ ] Variables d'environnement configurées
- [ ] Premier déploiement réussi
- [ ] Tests de production passés

### Post-déploiement :
- [ ] Monitoring activé
- [ ] Domaine configuré (si applicable)
- [ ] Analytics en place
- [ ] Sauvegardes programmées

---

## 🚀 **Votre OpenTalent sera en ligne en quelques minutes !**

Les fichiers de configuration sont prêts. Il ne reste plus qu'à :
1. **Configurer Supabase** avec vos vraies clés
2. **Pusher sur GitHub**
3. **Connecter à Vercel**
4. **🎉 Célébrer le lancement !**