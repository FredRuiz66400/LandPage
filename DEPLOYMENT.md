# Instructions de Déploiement - OpenTalent avec Supabase

Ce guide vous accompagne pour déployer OpenTalent avec une vraie base de données Supabase.

## 🚀 Étapes de Déploiement

### 1. Configuration Supabase

#### A. Créer un projet Supabase
1. Aller sur [supabase.com](https://supabase.com)
2. Créer un compte et un nouveau projet
3. Choisir une région proche de vos utilisateurs
4. Noter les credentials fournis

#### B. Configurer la base de données
1. Dans Supabase Dashboard → SQL Editor
2. Copier-coller le contenu de `database/schema.sql`
3. Exécuter le script pour créer les tables

#### C. Configurer les credentials
1. Ouvrir `scripts/supabase-config.js`
2. Remplacer les valeurs par défaut :
```javascript
const SUPABASE_CONFIG = {
    url: 'https://VOTRE-PROJET-ID.supabase.co',
    anonKey: 'VOTRE-ANON-KEY-ICI'
};
```

### 2. Intégration des Scripts

#### A. Mise à jour du HTML
Remplacer dans `index.html` :
```html
<!-- Ancien -->
<script src="scripts/forms.js"></script>

<!-- Nouveau pour Supabase -->
<script type="module" src="scripts/forms-supabase.js"></script>
```

#### B. Scripts requis
Ajouter avant la fermeture `</body>` :
```html
<script src="https://cdn.skypack.dev/@supabase/supabase-js@2"></script>
<script type="module" src="scripts/database.js"></script>
<script type="module" src="scripts/forms-supabase.js"></script>
```

### 3. Variables d'Environnement (Production)

#### A. Créer un fichier `.env` (root du projet)
```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

#### B. Configurer votre hébergeur
**Vercel :**
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

**Netlify :**
Site Settings → Environment Variables

**Autres hébergeurs :**
Consulter leur documentation pour les variables d'environnement

### 4. Sécurité RLS (Row Level Security)

Les politiques sont déjà configurées dans `schema.sql` :
- ✅ **Insertion** : Autorisée pour tous (formulaires publics)
- ✅ **Lecture** : Restreinte aux admins authentifiés
- ✅ **Modification** : Restreinte aux admins

### 5. Configuration CORS

Dans Supabase Dashboard → Settings → API :
1. **Allowed origins** : Ajouter votre domaine
```
https://votre-domaine.com
https://www.votre-domaine.com
```

2. **Headers** : Garder les valeurs par défaut

### 6. Test de Fonctionnement

#### A. Test local
1. Servir le site localement (Live Server, http-server, etc.)
2. Ouvrir la console développeur
3. Vérifier les messages :
   - ✅ "Connexion Supabase établie"
   - ✅ "OpenTalent Forms avec Supabase initialisé"

#### B. Test des formulaires
1. Remplir le formulaire Beta
2. Vérifier dans Supabase Dashboard → Table Editor
3. Les données doivent apparaître dans `beta_signups`

### 7. Monitoring et Analytics

#### A. Dashboard Supabase
- **Logs** : Voir les requêtes en temps réel
- **Usage** : Surveiller la consommation
- **Performance** : Métriques de la DB

#### B. Notifications d'erreurs (optionnel)
Intégrer Sentry ou LogRocket pour le monitoring :
```html
<script src="https://js.sentry-cdn.com/YOUR-DSN.min.js"></script>
```

### 8. Déploiement

#### A. Hébergement statique recommandé
- **Vercel** (recommandé pour la simplicité)
- **Netlify** (bon pour les formulaires)
- **GitHub Pages** (gratuit)
- **Firebase Hosting**

#### B. Configuration Vercel
```json
// vercel.json
{
  "functions": {
    "api/**.js": {
      "runtime": "@vercel/node"
    }
  },
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

### 9. Optimisations Post-Déploiement

#### A. Performance
- Activer la compression gzip
- Optimiser les images
- Utiliser un CDN pour les assets

#### B. SEO
- Configurer les meta tags
- Ajouter un sitemap.xml
- Configurer Google Analytics

#### C. Sécurité
- Forcer HTTPS
- Ajouter des headers de sécurité
- Configurer CSP (Content Security Policy)

### 10. Maintenance

#### A. Backups automatiques
Supabase fait des backups automatiques, mais vous pouvez :
- Exporter régulièrement les données
- Utiliser les webhooks pour la synchronisation

#### B. Monitoring
- Surveiller les logs d'erreurs
- Vérifier les métriques d'utilisation
- Optimiser les requêtes lentes

## 🔧 Scripts Utiles

### Vérification de la configuration
```javascript
// Dans la console du navigateur
console.log(window.openTalentFormsSupabase.isHealthy());
```

### Export des données
```sql
-- Dans Supabase SQL Editor
COPY (SELECT * FROM beta_signups) TO STDOUT WITH CSV HEADER;
```

### Nettoyage des données de test
```sql
-- Attention : supprime toutes les données !
DELETE FROM beta_signups WHERE email LIKE '%test%';
DELETE FROM contacts WHERE email LIKE '%test%';
```

## 🆘 Dépannage

### Erreur de connexion Supabase
1. Vérifier les credentials dans `supabase-config.js`
2. Vérifier la configuration CORS
3. Vérifier les politiques RLS

### Formulaires qui ne fonctionnent pas
1. Ouvrir la console développeur
2. Vérifier les erreurs JavaScript
3. Tester avec le mode simulation (fallback)

### Performance lente
1. Vérifier les indices dans la base
2. Optimiser les requêtes
3. Utiliser un CDN

---

**Votre landing page est maintenant prête pour la production avec Supabase !** 🚀

Pour toute question : [Documentation Supabase](https://supabase.com/docs)