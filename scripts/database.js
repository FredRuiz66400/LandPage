/**
 * OpenTalent - Module Database Supabase
 * Gestion complète des opérations base de données avec Supabase
 */

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';
import { SUPABASE_CONFIG, getSupabaseConfig } from './supabase-config.js';

class OpenTalentDatabase {
    constructor() {
        this.supabase = null;
        this.isConnected = false;
        this.retryAttempts = 3;
        this.init();
    }

    /**
     * Initialisation de la connexion Supabase
     */
    async init() {
        try {
            const config = getSupabaseConfig();
            
            // Validation de la configuration
            if (!config.url || !config.anonKey) {
                throw new Error('Configuration Supabase manquante. Vérifiez SUPABASE_URL et SUPABASE_ANON_KEY.');
            }

            // Création du client Supabase
            this.supabase = createClient(config.url, config.anonKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                },
                global: {
                    headers: {
                        'X-Client-Info': 'opentalent-landing-page'
                    }
                }
            });

            // Test de connexion
            await this.testConnection();
            this.isConnected = true;
            console.log('✅ Connexion Supabase établie');

        } catch (error) {
            console.error('❌ Erreur connexion Supabase:', error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Test de connexion à Supabase
     */
    async testConnection() {
        try {
            const { data, error } = await this.supabase
                .from('beta_signups')
                .select('count')
                .limit(1);

            if (error) throw error;
            return true;
        } catch (error) {
            console.warn('Test de connexion échoué:', error.message);
            return false;
        }
    }

    /**
     * Insertion d'une inscription Beta
     */
    async insertBetaSignup(data) {
        try {
            // Validation des données
            this.validateBetaData(data);

            // Préparation des données pour Supabase
            const insertData = {
                name: data.name.trim(),
                email: data.email.toLowerCase().trim(),
                profile: data.profile,
                expectations: data.expectations?.trim() || null,
                source: data.source || 'landing_page',
                ip_address: await this.getClientIP(),
                user_agent: navigator.userAgent
            };

            // Insertion dans Supabase
            const { data: result, error } = await this.supabase
                .from(SUPABASE_CONFIG.tables.betaSignups)
                .insert([insertData])
                .select()
                .single();

            if (error) {
                // Gestion des erreurs spécifiques
                if (error.code === '23505') { // Unique violation
                    throw new Error('Cette adresse email est déjà inscrite au programme beta.');
                }
                throw error;
            }

            // Log analytics
            await this.logAnalyticsEvent('beta_signup_success', {
                profile: data.profile,
                has_expectations: Boolean(data.expectations)
            });

            console.log('✅ Inscription beta enregistrée:', result.id);
            return {
                success: true,
                message: 'Inscription au programme beta réussie ! Nous vous contacterons bientôt.',
                data: result
            };

        } catch (error) {
            console.error('❌ Erreur insertion beta:', error);
            
            // Log analytics pour les erreurs
            await this.logAnalyticsEvent('beta_signup_error', {
                error: error.message,
                profile: data.profile
            });

            return {
                success: false,
                message: error.message || 'Erreur lors de l\'inscription. Veuillez réessayer.',
                error: error
            };
        }
    }

    /**
     * Insertion d'un message de contact
     */
    async insertContact(data) {
        try {
            // Validation des données
            this.validateContactData(data);

            // Préparation des données pour Supabase
            const insertData = {
                name: data.name.trim(),
                email: data.email.toLowerCase().trim(),
                subject: data.subject,
                message: data.message.trim(),
                source: data.source || 'landing_page',
                ip_address: await this.getClientIP(),
                user_agent: navigator.userAgent,
                status: 'new'
            };

            // Insertion dans Supabase
            const { data: result, error } = await this.supabase
                .from(SUPABASE_CONFIG.tables.contacts)
                .insert([insertData])
                .select()
                .single();

            if (error) throw error;

            // Log analytics
            await this.logAnalyticsEvent('contact_submit_success', {
                subject: data.subject,
                message_length: data.message.length
            });

            console.log('✅ Message de contact enregistré:', result.id);
            return {
                success: true,
                message: 'Message envoyé avec succès ! Notre équipe vous répondra dans les 24h.',
                data: result
            };

        } catch (error) {
            console.error('❌ Erreur insertion contact:', error);
            
            // Log analytics pour les erreurs
            await this.logAnalyticsEvent('contact_submit_error', {
                error: error.message,
                subject: data.subject
            });

            return {
                success: false,
                message: error.message || 'Erreur lors de l\'envoi. Veuillez réessayer.',
                error: error
            };
        }
    }

    /**
     * Récupération des statistiques publiques
     */
    async getPublicStats() {
        try {
            const { data, error } = await this.supabase
                .from('public_stats')
                .select('*');

            if (error) throw error;

            // Formatage des statistiques
            const stats = {
                beta_signups: 0,
                contacts: 0,
                total: 0,
                weekly: {
                    beta_signups: 0,
                    contacts: 0
                }
            };

            data.forEach(row => {
                if (row.table_name === 'beta_signups') {
                    stats.beta_signups = row.total_count;
                    stats.weekly.beta_signups = row.week_count;
                } else if (row.table_name === 'contacts') {
                    stats.contacts = row.total_count;
                    stats.weekly.contacts = row.week_count;
                }
            });

            stats.total = stats.beta_signups + stats.contacts;

            return {
                success: true,
                data: stats
            };

        } catch (error) {
            console.error('❌ Erreur récupération stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Récupération des statistiques par profil (beta)
     */
    async getBetaStatsByProfile() {
        try {
            const { data, error } = await this.supabase
                .rpc('get_beta_stats_by_profile');

            if (error) throw error;

            return {
                success: true,
                data: data
            };

        } catch (error) {
            console.error('❌ Erreur stats par profil:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Vérification si un email existe déjà
     */
    async checkEmailExists(email, table = 'beta_signups') {
        try {
            const { data, error } = await this.supabase
                .from(table)
                .select('id')
                .eq('email', email.toLowerCase().trim())
                .limit(1);

            if (error) throw error;

            return {
                exists: data && data.length > 0,
                data: data
            };

        } catch (error) {
            console.error('❌ Erreur vérification email:', error);
            return {
                exists: false,
                error: error.message
            };
        }
    }

    /**
     * Log des événements analytics
     */
    async logAnalyticsEvent(eventName, eventData = {}, userFingerprint = null) {
        try {
            if (!userFingerprint) {
                userFingerprint = await this.generateUserFingerprint();
            }

            const analyticsData = {
                event_name: eventName,
                event_data: eventData,
                user_fingerprint: userFingerprint,
                session_id: this.getSessionId(),
                ip_address: await this.getClientIP(),
                user_agent: navigator.userAgent,
                referrer: document.referrer || null,
                page_url: window.location.href
            };

            const { error } = await this.supabase
                .from(SUPABASE_CONFIG.tables.analytics)
                .insert([analyticsData]);

            if (error) {
                console.warn('⚠️ Erreur log analytics:', error);
            }

        } catch (error) {
            console.warn('⚠️ Erreur analytics:', error);
            // Les erreurs analytics ne doivent pas bloquer l'UX
        }
    }

    /**
     * Validation des données Beta
     */
    validateBetaData(data) {
        const errors = [];

        if (!data.name || data.name.trim().length < 2) {
            errors.push('Le nom doit contenir au moins 2 caractères');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Une adresse email valide est requise');
        }

        if (!data.profile || !['developer', 'recruiter', 'both', 'other'].includes(data.profile)) {
            errors.push('Veuillez sélectionner un profil valide');
        }

        if (data.expectations && data.expectations.length > 1000) {
            errors.push('Le message ne peut pas dépasser 1000 caractères');
        }

        if (errors.length > 0) {
            throw new Error(errors.join('. '));
        }
    }

    /**
     * Validation des données Contact
     */
    validateContactData(data) {
        const errors = [];

        if (!data.name || data.name.trim().length < 2) {
            errors.push('Le nom doit contenir au moins 2 caractères');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Une adresse email valide est requise');
        }

        if (!data.subject || data.subject.trim().length === 0) {
            errors.push('Veuillez sélectionner un sujet');
        }

        if (!data.message || data.message.trim().length < 10) {
            errors.push('Le message doit contenir au moins 10 caractères');
        }

        if (data.message && data.message.length > 5000) {
            errors.push('Le message ne peut pas dépasser 5000 caractères');
        }

        if (errors.length > 0) {
            throw new Error(errors.join('. '));
        }
    }

    /**
     * Validation email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Génération d'une empreinte utilisateur (fingerprint)
     */
    async generateUserFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('OpenTalent fingerprint', 2, 2);

            const fingerprint = [
                navigator.userAgent,
                navigator.language,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset(),
                canvas.toDataURL()
            ].join('|');

            // Hash simple du fingerprint
            let hash = 0;
            for (let i = 0; i < fingerprint.length; i++) {
                const char = fingerprint.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }

            return 'fp_' + Math.abs(hash).toString(36);

        } catch (error) {
            // Fallback si canvas fingerprinting échoue
            return 'fp_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
    }

    /**
     * Récupération/génération d'un session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('opentalent_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            sessionStorage.setItem('opentalent_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Récupération de l'IP client (via service externe)
     */
    async getClientIP() {
        try {
            // Service gratuit pour récupérer l'IP (en production, utiliser votre propre service)
            const response = await fetch('https://api.ipify.org?format=json', {
                timeout: 3000
            });
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('Impossible de récupérer l\'IP client:', error);
            return null;
        }
    }

    /**
     * Méthode de retry avec backoff exponentiel
     */
    async executeWithRetry(operation, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Backoff exponentiel: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                console.warn(`Tentative ${attempt}/${maxRetries} échouée, retry dans ${delay}ms:`, error.message);
                
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    }

    /**
     * Nettoyage et fermeture des connexions
     */
    async cleanup() {
        try {
            if (this.supabase) {
                // Supabase se nettoie automatiquement
                this.supabase = null;
                this.isConnected = false;
                console.log('🧹 Connexion Supabase fermée');
            }
        } catch (error) {
            console.error('Erreur lors du nettoyage:', error);
        }
    }

    /**
     * Vérification du statut de la connexion
     */
    isHealthy() {
        return this.isConnected && this.supabase !== null;
    }
}

// Export pour utilisation
export default OpenTalentDatabase;

// Instance globale (singleton)
let dbInstance = null;

export const getDatabase = async () => {
    if (!dbInstance) {
        dbInstance = new OpenTalentDatabase();
        await dbInstance.init();
    }
    return dbInstance;
};