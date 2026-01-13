# 📝 Aide-Mémoire - Commandes OpenTalent

## 🔍 Vérification

### Vérifier la configuration complète
```bash
./check-config.sh
```

### Vérifier que .env est protégé
```bash
git status --ignored
# .env doit apparaître dans les fichiers ignorés
```

### Vérifier la syntaxe des fichiers SQL
```bash
# Dans Supabase SQL Editor, utiliser "Validate" avant "Run"
```

---

## 🧪 Tests Locaux

### Démarrer un serveur local

**Node.js (recommandé)** :
```bash
npx http-server -p 8000
```

**Python 3** :
```bash
python3 -m http.server 8000
```

**Python 2** :
```bash
python -m SimpleHTTPServer 8000
```

**PHP** :
```bash
php -S localhost:8000
```

### Ouvrir dans le navigateur
```bash
open http://localhost:8000  # macOS
# ou
# Ouvrir manuellement http://localhost:8000
```

### Vérifier la connexion Supabase (dans la console navigateur)
```javascript
// Vérifier la santé du système
console.log(window.openTalentFormsSupabase?.isHealthy());

// Tester une insertion
await window.openTalentDatabase?.insertBetaSignup({
  name: "Test User",
  email: "test@example.com",
  profile: "developer",
  expectations: "Test"
});
```

---

## 🚀 Déploiement

### Vercel

**Installation** :
```bash
npm i -g vercel
```

**Configuration** :
```bash
# Ajouter les variables d'environnement
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY

# Lister les variables
vercel env ls

# Supprimer une variable
vercel env rm VARIABLE_NAME
```

**Déploiement** :
```bash
# Preview
vercel

# Production
vercel --prod
```

### Netlify

**Installation** :
```bash
npm i -g netlify-cli
```

**Déploiement** :
```bash
# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

---

## 🗄️ Base de Données Supabase

### Exécuter les scripts SQL
```bash
# Ouvrir Supabase Dashboard → SQL Editor
# Copier-coller le contenu de :
# 1. database/schema.sql
# 2. database/security.sql
```

### Vérifier les tables
```sql
-- Lister toutes les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Compter les inscriptions beta
SELECT COUNT(*) FROM beta_signups;

-- Voir les dernières inscriptions
SELECT * FROM beta_signups 
ORDER BY created_at DESC 
LIMIT 10;
```

### Export des données
```sql
-- Dans SQL Editor
COPY (SELECT * FROM beta_signups) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM contacts) TO STDOUT WITH CSV HEADER;
```

### Nettoyage des données de test
```sql
-- ⚠️ ATTENTION : Supprime les données !
DELETE FROM beta_signups WHERE email LIKE '%test%';
DELETE FROM contacts WHERE email LIKE '%test%';
```

---

## 🔐 Sécurité

### Vérifier les politiques RLS
```sql
-- Voir toutes les politiques
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Vérifier si RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Tester les permissions
```sql
-- Tester en tant qu'utilisateur anonyme
SET ROLE anon;
SELECT * FROM beta_signups;  -- Devrait échouer
INSERT INTO beta_signups (name, email, profile) 
VALUES ('Test', 'test@test.com', 'developer');  -- Devrait réussir
RESET ROLE;
```

---

## 🔧 Dépannage

### Problème de connexion Supabase
```bash
# Vérifier les variables d'environnement
cat .env

# Tester la connexion avec curl
curl -X GET "https://VOTRE-PROJET.supabase.co/rest/v1/" \
  -H "apikey: VOTRE-ANON-KEY"
```

### Réinitialiser la configuration
```bash
# Restaurer .env depuis l'exemple
cp .env.example .env
# Puis éditer .env avec vos vraies clés
```

### Voir les logs en temps réel
```bash
# Dans Supabase Dashboard
# Logs → Realtime
# Sélectionner le niveau de log souhaité
```

---

## 📊 Monitoring

### Vérifier l'utilisation
```bash
# Dans Supabase Dashboard → Settings → Usage
# Vérifier :
# - Database size
# - Bandwidth
# - Number of requests
```

### Analytics des formulaires
```sql
-- Statistiques des inscriptions beta
SELECT 
  profile,
  COUNT(*) as count,
  MIN(created_at) as first_signup,
  MAX(created_at) as last_signup
FROM beta_signups
GROUP BY profile;

-- Inscriptions par jour
SELECT 
  DATE(created_at) as date,
  COUNT(*) as signups
FROM beta_signups
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🔄 Git

### Commandes courantes
```bash
# Vérifier le statut (s'assurer que .env n'apparaît pas)
git status

# Voir les fichiers ignorés
git status --ignored

# Commit des changements
git add .
git commit -m "Configuration Supabase terminée"
git push origin main
```

### Si .env a été accidentellement commité
```bash
# Supprimer du cache Git (mais garder le fichier local)
git rm --cached .env
git commit -m "Remove .env from tracking"
git push origin main

# Ensuite, changer IMMÉDIATEMENT vos clés Supabase !
```

---

## 📞 Aide Rapide

| Problème | Commande |
|----------|----------|
| Configuration incomplète | `./check-config.sh` |
| Tester localement | `npx http-server -p 8000` |
| Voir les logs Supabase | Dashboard → Logs |
| Réinitialiser .env | `cp .env.example .env` |
| Vérifier les tables | SQL: `SELECT * FROM information_schema.tables` |

---

## 📚 Ressources

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs

---

*Dernière mise à jour : 13 janvier 2026*
