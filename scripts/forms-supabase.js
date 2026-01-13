/**
 * OpenTalent - Gestionnaire de Formulaires avec Supabase
 * Version production avec vraie base de données Supabase
 */

import { getDatabase } from './database.js';

class OpenTalentForms {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.isInitialized = false;
        this.maxRetries = 3;
        this.submissionCounts = new Map(); // Rate limiting
        this.securityManager = window.securityManager; // Référence au gestionnaire de sécurité
        this.initializeForms();
    }

    /**
     * Initialisation avec Supabase
     */
    async init() {
        try {
            // Initialisation de la base de données
            this.database = await getDatabase();
            
            // Configuration des formulaires
            this.setupFormHandlers();
            this.setupRealTimeValidation();
            
            // Chargement des statistiques
            await this.updatePublicStats();
            
            console.log('🚀 OpenTalent Forms avec Supabase initialisé');
        } catch (error) {
            console.error('❌ Erreur initialisation:', error);
            // Fallback vers simulation en cas d'échec
            this.fallbackToSimulation();
        }
    }

    /**
     * Configuration des gestionnaires de formulaires
     */
    setupFormHandlers() {
        // Formulaire Beta
        const betaForm = document.querySelector('.beta-form');
        if (betaForm) {
            this.forms.set('beta', betaForm);
            betaForm.addEventListener('submit', (e) => this.handleBetaSubmission(e));
        }

        // Formulaire Contact
        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            this.forms.set('contact', contactForm);
            contactForm.addEventListener('submit', (e) => this.handleContactSubmission(e));
        }
    }

    /**
     * Validation en temps réel des champs
     */
    setupRealTimeValidation() {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => this.validateField(e.target));
            input.addEventListener('blur', (e) => this.validateField(e.target));
        });
    }

    /**
     * Gestion de la soumission du formulaire Beta avec Supabase
     */
    async handleBetaSubmission(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            profile: formData.get('profile'),
            expectations: formData.get('expectations'),
            source: 'landing_page'
        };

        // Validation côté client
        if (!this.validateBetaForm(data)) {
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        try {
            // État de chargement
            this.setLoadingState(submitButton, true);

            // Vérification email existant
            const emailCheck = await this.database.checkEmailExists(data.email, 'beta_signups');
            if (emailCheck.exists) {
                this.showNotification('Cette adresse email est déjà inscrite au programme beta.', 'warning');
                return;
            }

            // Insertion en base de données
            const result = await this.database.insertBetaSignup(data);

            if (result.success) {
                // Succès
                this.handleSubmissionSuccess('beta', form);
                this.showNotification(result.message, 'success');
                
                // Mise à jour des statistiques en temps réel
                await this.updatePublicStats();
                
                // Analytics
                await this.trackFormSubmission('beta', data);
            } else {
                // Erreur métier
                this.showNotification(result.message, 'error');
            }

        } catch (error) {
            console.error('Erreur soumission beta:', error);
            this.showNotification('Une erreur technique est survenue. Veuillez réessayer.', 'error');
        } finally {
            this.setLoadingState(submitButton, false, originalText);
        }
    }

    /**
     * Gestion de la soumission du formulaire Contact avec Supabase
     */
    async handleContactSubmission(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            source: 'landing_page'
        };

        // Validation côté client
        if (!this.validateContactForm(data)) {
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        try {
            // État de chargement
            this.setLoadingState(submitButton, true);

            // Insertion en base de données
            const result = await this.database.insertContact(data);

            if (result.success) {
                // Succès
                this.handleSubmissionSuccess('contact', form);
                this.showNotification(result.message, 'success');
                
                // Mise à jour des statistiques
                await this.updatePublicStats();
                
                // Analytics
                await this.trackFormSubmission('contact', data);
            } else {
                // Erreur métier
                this.showNotification(result.message, 'error');
            }

        } catch (error) {
            console.error('Erreur soumission contact:', error);
            this.showNotification('Une erreur technique est survenue. Veuillez réessayer.', 'error');
        } finally {
            this.setLoadingState(submitButton, false, originalText);
        }
    }

    /**
     * Mise à jour des statistiques publiques affichées
     */
    async updatePublicStats() {
        try {
            const statsResult = await this.database.getPublicStats();
            
            if (statsResult.success) {
                const stats = statsResult.data;
                
                // Mise à jour des compteurs dans la hero section
                const heroStats = document.querySelectorAll('.stat-number');
                if (heroStats.length >= 3) {
                    heroStats[0].textContent = `${stats.beta_signups || 500}+`;
                    heroStats[1].textContent = `${Math.floor((stats.beta_signups || 500) * 0.3)}+`; // Estimation recruteurs
                    heroStats[2].textContent = `${Math.floor((stats.beta_signups || 500) * 0.4)}+`; // Estimation matchs
                }
                
                console.log('📊 Statistiques mises à jour:', stats);
            }
        } catch (error) {
            console.warn('⚠️ Erreur mise à jour stats:', error);
        }
    }

    /**
     * Tracking analytics avec Supabase
     */
    async trackFormSubmission(formType, data) {
        try {
            await this.database.logAnalyticsEvent(`${formType}_form_submit`, {
                form_type: formType,
                user_profile: data.profile || 'contact',
                has_expectations: Boolean(data.expectations),
                message_length: data.message?.length || 0,
                subject: data.subject || null
            });
        } catch (error) {
            console.warn('⚠️ Erreur tracking:', error);
        }
    }

    /**
     * Validation du formulaire Beta
     */
    validateBetaForm(data) {
        const errors = [];

        if (!data.name || data.name.trim().length < 2) {
            errors.push('Le nom doit contenir au moins 2 caractères');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Une adresse email valide est requise');
        }

        if (!data.profile) {
            errors.push('Veuillez sélectionner votre profil');
        }

        if (errors.length > 0) {
            this.showNotification(errors.join('<br>'), 'error');
            return false;
        }

        return true;
    }

    /**
     * Validation du formulaire Contact
     */
    validateContactForm(data) {
        const errors = [];

        if (!data.name || data.name.trim().length < 2) {
            errors.push('Le nom doit contenir au moins 2 caractères');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Une adresse email valide est requise');
        }

        if (!data.subject) {
            errors.push('Veuillez sélectionner un sujet');
        }

        if (!data.message || data.message.trim().length < 10) {
            errors.push('Le message doit contenir au moins 10 caractères');
        }

        if (errors.length > 0) {
            this.showNotification(errors.join('<br>'), 'error');
            return false;
        }

        return true;
    }

    /**
     * Validation d'un champ individuel
     */
    async validateField(field) {
        const value = field.value.trim();
        const name = field.name;
        let isValid = true;
        let errorMessage = '';

        // Suppression des erreurs précédentes
        this.clearFieldError(field);

        // Validation selon le type de champ
        switch (name) {
            case 'name':
                if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Le nom doit contenir au moins 2 caractères';
                } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Le nom ne peut contenir que des lettres';
                }
                break;

            case 'email':
                if (!this.isValidEmail(value)) {
                    isValid = false;
                    errorMessage = 'Veuillez entrer une adresse email valide';
                } else if (value && this.database) {
                    // Vérification en temps réel si l'email existe déjà (beta seulement)
                    const betaForm = field.closest('.beta-form');
                    if (betaForm) {
                        try {
                            const emailCheck = await this.database.checkEmailExists(value, 'beta_signups');
                            if (emailCheck.exists) {
                                isValid = false;
                                errorMessage = 'Cette adresse email est déjà inscrite';
                            }
                        } catch (error) {
                            // Ignore les erreurs de vérification temps réel
                            console.warn('Erreur vérification email temps réel:', error);
                        }
                    }
                }
                break;

            case 'subject':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Veuillez sélectionner un sujet';
                }
                break;

            case 'message':
                if (value.length < 10) {
                    isValid = false;
                    errorMessage = 'Le message doit contenir au moins 10 caractères';
                } else if (value.length > 5000) {
                    isValid = false;
                    errorMessage = 'Le message ne peut pas dépasser 5000 caractères';
                }
                break;
        }

        // Affichage des erreurs
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.showFieldSuccess(field);
        }

        return isValid;
    }

    /**
     * Affichage d'erreur sur un champ
     */
    showFieldError(field, message) {
        field.classList.add('error');
        field.classList.remove('success');
        
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    /**
     * Affichage de succès sur un champ
     */
    showFieldSuccess(field) {
        field.classList.add('success');
        field.classList.remove('error');
        
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Suppression des erreurs d'un champ
     */
    clearFieldError(field) {
        field.classList.remove('error', 'success');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
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
     * Gestion du succès de soumission
     */
    handleSubmissionSuccess(formType, formElement) {
        // Reset du formulaire
        formElement.reset();

        // Suppression des états de validation
        const fields = formElement.querySelectorAll('input, select, textarea');
        fields.forEach(field => this.clearFieldError(field));
    }

    /**
     * État de chargement du bouton
     */
    setLoadingState(button, isLoading, originalText = '') {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.innerHTML = originalText;
            button.classList.remove('loading');
        }
    }

    /**
     * Fallback vers simulation en cas d'échec Supabase
     */
    fallbackToSimulation() {
        console.warn('🔄 Fallback vers simulation - Supabase indisponible');
        this.isProduction = false;
        
        // Charger le gestionnaire de simulation
        import('./forms.js').then(module => {
            window.openTalentFormsFallback = new module.default();
        }).catch(error => {
            console.error('Erreur chargement fallback:', error);
        });
    }

    /**
     * Système de notifications (identique au forms.js original)
     */
    showNotification(message, type = 'info', duration = 5000) {
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <div class="notification-text">${message}</div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '100px',
            right: '20px',
            background: this.getNotificationColor(type),
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            zIndex: '10000',
            maxWidth: '400px',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        });

        document.body.appendChild(notification);

        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        notification.querySelector('.notification-close').onclick = () => {
            this.closeNotification(notification);
        };

        setTimeout(() => {
            if (document.body.contains(notification)) {
                this.closeNotification(notification);
            }
        }, duration);
    }

    closeNotification(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 300);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
        };
        return colors[type] || colors.info;
    }

    /**
     * API publique pour accéder aux statistiques
     */
    async getStats() {
        if (this.database) {
            return await this.database.getPublicStats();
        }
        return { success: false, error: 'Base de données non disponible' };
    }

    /**
     * Vérification du statut de la connexion
     */
    isHealthy() {
        return this.database && this.database.isHealthy();
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.openTalentFormsSupabase = new OpenTalentFormsSupabase();
    } catch (error) {
        console.error('Erreur initialisation OpenTalent Forms:', error);
    }
});

export default OpenTalentFormsSupabase;