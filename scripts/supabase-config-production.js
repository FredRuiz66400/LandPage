/**
 * Configuration Supabase Production - OpenTalent
 * 
 * ⚠️ IMPORTANT : Remplacez ces valeurs par vos vraies clés de production
 * 
 * Pour obtenir vos clés :
 * 1. Aller sur https://supabase.com/dashboard
 * 2. Sélectionner votre projet OpenTalent
 * 3. Settings > API
 * 4. Copier Project URL et anon public key
 */

// 🔧 CONFIGURATION À MODIFIER AVEC VOS VRAIES CLÉS
const SUPABASE_URL = 'https://REMPLACER-PAR-VOTRE-ID.supabase.co'
const SUPABASE_ANON_KEY = 'REMPLACER-PAR-VOTRE-CLE-PUBLIQUE'

// 🚀 Initialisation du client Supabase
const { createClient } = supabase;

// Vérification des configurations
if (SUPABASE_URL.includes('REMPLACER') || SUPABASE_ANON_KEY.includes('REMPLACER')) {
    console.error('🚨 CONFIGURATION MANQUANTE : Veuillez configurer vos clés Supabase dans supabase-config.js');
    
    // Affichage d'un message d'aide à l'utilisateur
    document.addEventListener('DOMContentLoaded', function() {
        const helpMessage = document.createElement('div');
        helpMessage.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                border: 2px solid #fca5a5;
                color: #dc2626;
                padding: 16px;
                border-radius: 12px;
                z-index: 10000;
                max-width: 400px;
                font-family: 'Inter', sans-serif;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            ">
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">🔧 Configuration requise</h3>
                <p style="margin: 0 0 12px 0; font-size: 14px;">
                    Veuillez configurer vos clés Supabase dans 
                    <code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 4px;">scripts/supabase-config.js</code>
                </p>
                <p style="margin: 0; font-size: 12px; opacity: 0.8;">
                    Consultez le fichier SETUP_SUPABASE.md pour les instructions détaillées.
                </p>
            </div>
        `;
        document.body.appendChild(helpMessage);
        
        // Masquer après 10 secondes
        setTimeout(() => {
            helpMessage.remove();
        }, 10000);
    });
}

// Export des configurations (disponible globalement)
window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    isConfigured: !SUPABASE_URL.includes('REMPLACER') && !SUPABASE_ANON_KEY.includes('REMPLACER')
};

// Test de connexion (uniquement si configuré)
if (window.SUPABASE_CONFIG.isConfigured) {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test simple de connexion
    supabaseClient
        .from('beta_signups')
        .select('count')
        .then(result => {
            if (result.error) {
                console.warn('⚠️ Connexion Supabase échouée:', result.error.message);
            } else {
                console.log('✅ Supabase connecté avec succès !');
            }
        });
        
    // Exposer le client globalement
    window.supabase = supabaseClient;
} else {
    console.log('⏳ En attente de la configuration Supabase...');
}