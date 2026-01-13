# 🗄️ GUIDE SETUP SUPABASE PRODUCTION - OpenTalent

## 📋 Étapes de Configuration

### 1. Créer le Projet Supabase

1. **Aller sur** [supabase.com](https://supabase.com)
2. **Se connecter** avec GitHub
3. **Créer un nouveau projet** :
   - Nom : `opentalent-production`
   - Database Password : `[générer un mot de passe fort]`
   - Région : `Europe (eu-central-1)` ou `Europe (eu-west-1)`

### 2. Configurer la Base de Données

#### 🔧 Exécuter les scripts SQL dans l'ordre :

```bash
# 1. Dans l'éditeur SQL de Supabase, exécuter dans l'ordre :
# → database/schema.sql (structure de base)
# → database/security.sql (sécurité renforcée)
```

#### 📊 Scripts à exécuter :

**Dans SQL Editor > New Query :**

```sql
-- 1. ACTIVER LES EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. COPIER-COLLER le contenu de database/schema.sql

-- 3. COPIER-COLLER le contenu de database/security.sql
```

### 3. Récupérer les Clés API

**Dans Settings > API :**
- ✅ **Project URL** : `https://[votre-id].supabase.co`
- ✅ **anon public** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- ✅ **service_role** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (pour admin)

### 4. Configurer Row Level Security

**Vérifier dans Table Editor :**
- ✅ `beta_signups` - RLS Enabled ✓
- ✅ `contacts` - RLS Enabled ✓  
- ✅ `analytics_events` - RLS Enabled ✓
- ✅ `security_logs` - RLS Enabled ✓

### 5. Tester la Connection

```sql
-- Test d'insertion manuelle
INSERT INTO beta_signups (name, email) 
VALUES ('Test User', 'test@opentalent.com');

-- Vérifier les politiques
SELECT * FROM beta_signups; -- Devrait fonctionner
```

## 🔐 Configuration des Variables

### Fichier de configuration local :

```javascript
// scripts/supabase-config.js - PRODUCTION
const SUPABASE_URL = 'https://VOTRE-ID-PROJET.supabase.co'
const SUPABASE_ANON_KEY = 'VOTRE-CLE-ANON-PUBLIQUE'

// ⚠️ NE JAMAIS exposer la service_role key côté client !
```

### Variables d'environnement Vercel :
```bash
SUPABASE_URL=https://votre-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Pour admin uniquement
```

## ✅ Checklist de Vérification

- [ ] Projet Supabase créé
- [ ] Database schema.sql exécuté
- [ ] Database security.sql exécuté  
- [ ] RLS activé sur toutes les tables
- [ ] Clés API récupérées
- [ ] Test d'insertion réussi
- [ ] Variables configurées dans le code

---

**🎯 Une fois cette étape terminée, nous passerons à la configuration des emails !**