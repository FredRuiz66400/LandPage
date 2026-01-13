// Supabase Edge Function pour l'envoi d'emails
// À déployer dans Supabase Dashboard > Edge Functions

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  type: 'beta_signup' | 'contact_received' | 'admin_notification'
  data: {
    name?: string
    message?: string
    email?: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, type, data }: EmailRequest = await req.json()

    // Configuration email (utilise Resend API)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY manquante')
    }

    // Templates d'emails selon le type
    let emailContent = ''
    
    switch (type) {
      case 'beta_signup':
        emailContent = generateBetaSignupEmail(data.name || 'Utilisateur')
        break
      case 'contact_received':
        emailContent = generateContactConfirmationEmail(data.name || 'Utilisateur')
        break
      case 'admin_notification':
        emailContent = generateAdminNotificationEmail(data)
        break
      default:
        throw new Error('Type d\'email non reconnu')
    }

    // Envoi via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OpenTalent <noreply@opentalent.com>',
        to: [to],
        subject: subject,
        html: emailContent,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      throw new Error(`Erreur Resend: ${error}`)
    }

    const result = await emailResponse.json()

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erreur envoi email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Template pour confirmation d'inscription beta
function generateBetaSignupEmail(name: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue dans la beta OpenTalent !</title>
    </head>
    <body style="
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.6;
        color: #0f172a;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #fff7ed;
    ">
        <div style="
            background: linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #f59e0b 100%);
            padding: 40px 20px;
            text-align: center;
            border-radius: 12px 12px 0 0;
            color: white;
        ">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700;">
                🚀 Bienvenue ${name} !
            </h1>
            <p style="margin: 16px 0 0 0; font-size: 18px; opacity: 0.9;">
                Vous faites maintenant partie de la beta OpenTalent
            </p>
        </div>
        
        <div style="
            background: white;
            padding: 40px;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 6px rgba(234, 88, 12, 0.1);
        ">
            <h2 style="color: #ea580c; margin-bottom: 20px;">
                🎉 Félicitations !
            </h2>
            
            <p>
                Merci de votre intérêt pour <strong>OpenTalent</strong>, la plateforme qui révolutionne 
                la rencontre entre jeunes développeurs talentueux et recruteurs innovants.
            </p>
            
            <div style="
                background: #fef7ed;
                border-left: 4px solid #ea580c;
                padding: 20px;
                margin: 24px 0;
                border-radius: 4px;
            ">
                <h3 style="margin-top: 0; color: #ea580c;">
                    🔥 Ce qui vous attend :
                </h3>
                <ul style="margin-bottom: 0;">
                    <li>Accès prioritaire à la plateforme</li>
                    <li>Fonctionnalités exclusives en avant-première</li>
                    <li>Support dédié de notre équipe</li>
                    <li>Influence directe sur le développement du produit</li>
                </ul>
            </div>
            
            <p>
                Nous vous recontacterons très bientôt avec tous les détails pour commencer 
                votre aventure OpenTalent !
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="https://opentalent.com" style="
                    display: inline-block;
                    background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%);
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    box-shadow: 0 4px 6px rgba(234, 88, 12, 0.2);
                ">
                    🌟 Visiter OpenTalent
                </a>
            </div>
            
            <hr style="border: none; height: 1px; background: #fed7aa; margin: 32px 0;">
            
            <p style="font-size: 14px; color: #64748b; text-align: center;">
                L'équipe OpenTalent<br>
                <em>Connecter les talents, créer l'avenir</em>
            </p>
        </div>
    </body>
    </html>
  `
}

// Template pour confirmation de contact
function generateContactConfirmationEmail(name: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message reçu - OpenTalent</title>
    </head>
    <body style="
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.6;
        color: #0f172a;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #fff7ed;
    ">
        <div style="
            background: linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #f59e0b 100%);
            padding: 40px 20px;
            text-align: center;
            border-radius: 12px 12px 0 0;
            color: white;
        ">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">
                📨 Message bien reçu !
            </h1>
        </div>
        
        <div style="
            background: white;
            padding: 40px;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 6px rgba(234, 88, 12, 0.1);
        ">
            <p>Bonjour <strong>${name}</strong>,</p>
            
            <p>
                Merci de nous avoir contactés ! Votre message a bien été reçu par l'équipe OpenTalent.
            </p>
            
            <div style="
                background: #fef7ed;
                border-left: 4px solid #ea580c;
                padding: 20px;
                margin: 24px 0;
                border-radius: 4px;
            ">
                <p style="margin: 0;">
                    ⏱️ <strong>Temps de réponse habituel :</strong> 24-48h<br>
                    📞 <strong>Support urgent :</strong> contact@opentalent.com
                </p>
            </div>
            
            <p>
                Nous revenons vers vous rapidement avec une réponse personnalisée.
            </p>
            
            <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 32px;">
                L'équipe OpenTalent<br>
                <em>Toujours à votre écoute</em>
            </p>
        </div>
    </body>
    </html>
  `
}

// Template pour notifications admin
function generateAdminNotificationEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Nouvelle activité - OpenTalent</title>
    </head>
    <body style="font-family: monospace; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ea580c;">
            <h2 style="color: #ea580c; margin-top: 0;">🔔 Nouvelle activité OpenTalent</h2>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
            
            <p>
                <a href="https://supabase.com/dashboard" 
                   style="color: #ea580c; text-decoration: none;">
                    → Voir dans Supabase Dashboard
                </a>
            </p>
            
            <hr style="margin: 20px 0; border: none; height: 1px; background: #eee;">
            <p style="font-size: 12px; color: #666;">
                OpenTalent Admin • ${new Date().toLocaleString('fr-FR')}
            </p>
        </div>
    </body>
    </html>
  `
}