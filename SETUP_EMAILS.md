# 📧 CONFIGURATION EMAILS - OpenTalent

## 🚀 Setup Emails Automatiques

### 1. Configuration Resend (Service Email)

#### Créer un compte Resend :
1. **Aller sur** [resend.com](https://resend.com)
2. **S'inscrire** avec GitHub
3. **Vérifier le domaine** ou utiliser sandbox
4. **Récupérer la clé API**

#### Variables Supabase :
```bash
# Dans Supabase Dashboard > Settings > Environment Variables
RESEND_API_KEY=re_your_api_key_here
```

### 2. Déployer la Edge Function

#### Via Supabase CLI :
```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Lier le projet
supabase link --project-ref VOTRE-ID-PROJET

# Déployer la fonction email
supabase functions deploy send-email
```

#### Via Dashboard (plus simple) :
1. **Aller dans** Supabase Dashboard > Edge Functions
2. **Créer une nouvelle fonction** : `send-email`
3. **Copier-coller** le contenu de `supabase/functions/send-email/index.ts`
4. **Déployer**

### 3. Tester les Emails

#### Test depuis Supabase :
```sql
-- Tester l'envoi d'email beta
SELECT functions.send_email(
  to_email => 'test@example.com',
  email_type => 'beta_signup',
  user_name => 'Test User'
);
```

#### Test depuis le site :
```javascript
// Test direct de la fonction
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'test@example.com',
    subject: 'Test OpenTalent',
    type: 'beta_signup',
    data: { name: 'Test User' }
  }
})
```

## 📨 Types d'Emails Configurés

### 1. Confirmation Inscription Beta
- **Trigger** : Inscription au programme beta
- **Destinataire** : Utilisateur qui s'inscrit
- **Contenu** : Bienvenue + infos sur la beta

### 2. Confirmation Contact
- **Trigger** : Envoi du formulaire contact
- **Destinataire** : Utilisateur qui contacte
- **Contenu** : Confirmation réception + délai réponse

### 3. Notification Admin
- **Trigger** : Nouvelle inscription/contact
- **Destinataire** : Admin (vous)
- **Contenu** : Détails de l'activité

## ⚙️ Intégration avec les Formulaires

La fonction email sera automatiquement appelée par `forms-supabase.js` :

```javascript
// Après insertion réussie en base
const emailResult = await supabase.functions.invoke('send-email', {
  body: {
    to: userData.email,
    subject: 'Bienvenue dans la beta OpenTalent !',
    type: 'beta_signup',
    data: { name: userData.name }
  }
})
```

## 🔧 Configuration Alternative (si Resend indisponible)

### Option A : SendGrid
```typescript
// Remplacer dans index.ts
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: 'noreply@opentalent.com' },
    subject: subject,
    content: [{ type: 'text/html', value: emailContent }]
  })
})
```

### Option B : Mailgun
```typescript
// Configuration Mailgun
const MAILGUN_API_KEY = Deno.env.get('MAILGUN_API_KEY')
const MAILGUN_DOMAIN = Deno.env.get('MAILGUN_DOMAIN')

const formData = new FormData()
formData.append('from', 'OpenTalent <noreply@opentalent.com>')
formData.append('to', to)
formData.append('subject', subject)
formData.append('html', emailContent)

const emailResponse = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`
  },
  body: formData
})
```

## ✅ Checklist Emails

- [ ] Compte Resend créé
- [ ] Clé API configurée dans Supabase
- [ ] Edge Function déployée
- [ ] Test d'envoi réussi
- [ ] Templates validés
- [ ] Intégration formulaires OK

---

**🎯 Une fois les emails configurés, on passe au déploiement Vercel !**