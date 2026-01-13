# 🚀 Démarrage Rapide - OpenTalent avec Supabase

## ✅ Ce qui a été fait pour vous

### Fichiers créés automatiquement :
- ✅ `.env` - Configuration des clés Supabase
- ✅ `.env.example` - Template pour documentation
- ✅ `.gitignore` - Protection des fichiers sensibles
- ✅ `check-config.sh` - Script de vérification automatique
- ✅ `CONFIGURATION_STATUS.md` - Guide complet de configuration

### Structure déjà en place :
- ✅ Scripts Supabase intégrés dans `index.html`
- ✅ Base de données SQL prête (`database/schema.sql` + `security.sql`)
- ✅ Formulaires connectés à Supabase (`forms-supabase.js`)
- ✅ Sécurité configurée (RLS, CORS, CSP)
- ✅ Configuration de déploiement (`vercel.json`)

---

## 🎯 Ce qu'il vous reste à faire (3 étapes simples)

### Étape 1: Obtenir vos clés Supabase (5 min)

1. **Aller sur** [supabase.com](https://supabase.com) et se connecter
2. **Créer un nouveau projet** ou sélectionner un existant
3. **Aller dans** Settings → API
4. **Copier ces 3 valeurs** :
   - Project URL
   - anon public (clé publique)
   - service_role (clé privée)

### Étape 2: Configurer votre projet (2 min)

1. **Ouvrir le fichier `.env`** à la racine du projet
2. **Remplacer les valeurs** :
   ```env
   SUPABASE_URL=https://VOTRE-PROJET-ID.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOi... (votre vraie clé)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (votre vraie clé)
   ```
3. **Sauvegarder** le fichier

### Étape 3: Créer les tables (3 min)

1. **Retourner sur** Supabase Dashboard
2. **Aller dans** SQL Editor
3. **Ouvrir** le fichier `database/schema.sql` de ce projet
4. **Copier tout son contenu** et le coller dans SQL Editor
5. **Cliquer sur "Run"**
6. **Répéter** avec `database/security.sql`

---

## ✅ Vérification

Vérifiez que tout est configuré correctement :

```bash
./check-config.sh
```

Si vous voyez "Configuration complète", vous êtes prêt ! 🎉

---

## 🧪 Test Local

### Démarrer un serveur local :

**Option 1 - Node.js** :
```bash
npx http-server -p 8000
```

**Option 2 - Python** :
```bash
python3 -m http.server 8000
```

**Option 3 - PHP** :
```bash
php -S localhost:8000
```

### Ouvrir dans le navigateur :
```
http://localhost:8000
```

### Tester :
1. Ouvrir la console développeur (F12)
2. Vérifier les messages de connexion Supabase
3. Remplir le formulaire Beta
4. Vérifier dans Supabase Dashboard → Table Editor que les données apparaissent

---

## 🚀 Déploiement en Production

### Option A: Vercel (Recommandé)

```bash
# Installer Vercel CLI si nécessaire
npm i -g vercel

# Configurer les variables d'environnement
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY

# Déployer
vercel deploy --prod
```

### Option B: Netlify

1. **Aller sur** [netlify.com](https://netlify.com)
2. **Glisser-déposer** votre dossier de projet
3. **Site Settings → Environment Variables**
4. **Ajouter** `SUPABASE_URL` et `SUPABASE_ANON_KEY`
5. **Redéployer**

### Option C: GitHub Pages

⚠️ Attention : GitHub Pages ne supporte pas les variables d'environnement.  
Pour GitHub Pages, vous devez hardcoder les clés dans `supabase-config-production.js` (pas recommandé pour les clés sensibles).

---

## 📚 Documentation Complète

Pour plus de détails, consultez :

| Document | Contenu |
|----------|---------|
| **CONFIGURATION_STATUS.md** | État complet de la configuration |
| **DEPLOYMENT.md** | Guide de déploiement détaillé |
| **SETUP_SUPABASE.md** | Configuration Supabase pas à pas |
| **README.md** | Documentation générale du projet |

---

## 🆘 Problèmes Fréquents

### ❌ "Configuration Supabase manquante"
**Solution** : Vérifiez que `.env` contient vos vraies clés (pas les valeurs "votre-projet...")

### ❌ "CORS policy blocking"
**Solution** : Ajoutez votre domaine dans Supabase → Settings → API → CORS

### ❌ Formulaires ne soumettent pas
**Solution** : 
1. Vérifiez que `schema.sql` a été exécuté
2. Ouvrez la console (F12) pour voir les erreurs
3. Vérifiez la connexion Supabase dans les logs

### ❌ "row violates row-level security policy"
**Solution** : Exécutez `database/security.sql` dans Supabase SQL Editor

---

## 📞 Aide

- **Problème de configuration** : Relire `CONFIGURATION_STATUS.md`
- **Erreur Supabase** : Consulter [docs.supabase.com](https://supabase.com/docs)
- **Erreur de déploiement** : Voir `DEPLOYMENT.md`

---

## 🎉 C'est Parti !

Vous êtes maintenant prêt à lancer OpenTalent. Suivez les 3 étapes ci-dessus et votre landing page sera opérationnelle ! 

**Bonne chance ! 🚀**

---

*Dernière mise à jour : 13 janvier 2026*
