/**
 * Configuration Supabase pour OpenTalent
 * Fichier de configuration pour la base de données Supabase
 */

// Configuration Supabase
const SUPABASE_CONFIG = {
    // À remplacer par vos vraies credentials Supabase
    url: 'https://jxgcpdgbtrhcltqrzxus.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4Z2NwZGdidHJoY2x0cXJ6eHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyOTIxNDcsImV4cCI6MjA4Mzg2ODE0N30.xfsohISfH5epo62ydbrLg9MYLsH3LNCoCY6pVCUotNU',
    
    // Configuration pour le développement local (optionnel)
    local: {
        url: 'http://localhost:54321',
        anonKey: 'votre-local-anon-key'
    },
    
    // Tables de la base de données
    tables: {
        betaSignups: 'beta_signups',
        contacts: 'contacts',
        analytics: 'analytics_events'
    },
    
    // Politiques de sécurité
    rls: {
        enabled: true,
        policies: {
            insert: 'authenticated_or_anon_insert',
            select: 'authenticated_select'
        }
    }
};

// Variables d'environnement (à utiliser en production)
const getSupabaseConfig = () => {
    // En production, utiliser les variables d'environnement
    if (typeof process !== 'undefined' && process.env) {
        return {
            url: process.env.SUPABASE_URL || SUPABASE_CONFIG.url,
            anonKey: process.env.SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey
        };
    }
    
    // En développement, utiliser la config locale ou par défaut
    return {
        url: SUPABASE_CONFIG.url,
        anonKey: SUPABASE_CONFIG.anonKey
    };
};

export { SUPABASE_CONFIG, getSupabaseConfig };