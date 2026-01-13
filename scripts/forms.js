/**
 * OpenTalent - Gestionnaire de Formulaires avec Simulation Back-end
 * Ce fichier gère tous les formulaires de la landing page avec une simulation d'API back-end
 */

class OpenTalentFormManager {
    constructor() {
        this.apiUrl = 'https://api.opentalent.fr'; // URL fictive pour simulation
        this.forms = new Map();
        this.submissions = new Map(); // Stockage local des soumissions
        this.init();
    }

    /**
     * Initialisation du gestionnaire de formulaires
     */
    init() {
        this.setupFormHandlers();
        this.loadStoredSubmissions();
        console.log('🚀 OpenTalent Form Manager initialized');
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

        // Validation en temps réel
        this.setupRealTimeValidation();
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
     * Validation d'un champ individuel
     */
    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
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
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Veuillez entrer une adresse email valide';
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
                } else if (value.length > 1000) {
                    isValid = false;
                    errorMessage = 'Le message ne peut pas dépasser 1000 caractères';
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
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }

    /**
     * Affichage de succès sur un champ
     */
    showFieldSuccess(field) {
        field.classList.add('success');
        field.classList.remove('error');
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
     * Gestion de la soumission du formulaire Beta
     */
    async handleBetaSubmission(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const data = {
            type: 'beta_signup',
            name: formData.get('name') || form.querySelector('input[type="text"]').value,
            email: formData.get('email') || form.querySelector('input[type="email"]').value,
            profile: formData.get('profile') || form.querySelector('select').value,
            expectations: formData.get('expectations') || form.querySelector('textarea').value,
            timestamp: new Date().toISOString(),
            source: 'landing_page'
        };

        // Validation complète
        if (!this.validateBetaForm(data)) {
            return;
        }

        // Soumission avec feedback utilisateur
        await this.submitForm('beta', data, form);
    }

    /**
     * Gestion de la soumission du formulaire Contact
     */
    async handleContactSubmission(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const data = {
            type: 'contact',
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            timestamp: new Date().toISOString(),
            source: 'landing_page'
        };

        // Validation complète
        if (!this.validateContactForm(data)) {
            return;
        }

        // Soumission avec feedback utilisateur
        await this.submitForm('contact', data, form);
    }

    /**
     * Validation du formulaire Beta
     */
    validateBetaForm(data) {
        const errors = [];

        if (!data.name || data.name.length < 2) {
            errors.push('Le nom est requis (min. 2 caractères)');
        }

        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
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

        if (!data.name || data.name.length < 2) {
            errors.push('Le nom est requis (min. 2 caractères)');
        }

        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Une adresse email valide est requise');
        }

        if (!data.subject) {
            errors.push('Veuillez sélectionner un sujet');
        }

        if (!data.message || data.message.length < 10) {
            errors.push('Le message doit contenir au moins 10 caractères');
        }

        if (errors.length > 0) {
            this.showNotification(errors.join('<br>'), 'error');
            return false;
        }

        return true;
    }

    /**
     * Soumission générique d'un formulaire
     */
    async submitForm(formType, data, formElement) {
        const submitButton = formElement.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        try {
            // État de chargement
            this.setLoadingState(submitButton, true);

            // Simulation d'appel API
            const response = await this.simulateApiCall(formType, data);

            if (response.success) {
                // Succès
                this.handleSubmissionSuccess(formType, data, formElement);
                this.showNotification(response.message, 'success');
                
                // Analytics fictifs
                this.trackFormSubmission(formType, data);
            } else {
                // Erreur
                this.showNotification(response.message, 'error');
            }

        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            this.showNotification('Une erreur technique est survenue. Veuillez réessayer.', 'error');
        } finally {
            // Restauration du bouton
            this.setLoadingState(submitButton, false, originalButtonText);
        }
    }

    /**
     * Simulation d'appel API back-end
     */
    async simulateApiCall(formType, data) {
        // Simulation de latence réseau
        await this.delay(1500 + Math.random() * 1000);

        // Simulation de différents scénarios
        const scenarios = this.getApiScenarios(formType);
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        // Stockage local des données
        this.storeSubmission(formType, data);

        return scenario;
    }

    /**
     * Scénarios de réponse API
     */
    getApiScenarios(formType) {
        const baseScenarios = [
            {
                success: true,
                message: formType === 'beta' 
                    ? 'Inscription à la beta enregistrée ! Nous vous contacterons très bientôt.' 
                    : 'Message envoyé avec succès ! Nous vous répondrons dans les 24h.',
                code: 200
            },
            // Simulation d'erreurs occasionnelles
            ...(Math.random() < 0.1 ? [{
                success: false,
                message: 'Service temporairement indisponible. Veuillez réessayer dans quelques minutes.',
                code: 503
            }] : [])
        ];

        return baseScenarios;
    }

    /**
     * Gestion du succès de soumission
     */
    handleSubmissionSuccess(formType, data, formElement) {
        // Reset du formulaire
        formElement.reset();

        // Suppression des états de validation
        const fields = formElement.querySelectorAll('input, select, textarea');
        fields.forEach(field => this.clearFieldError(field));

        // Mise à jour des compteurs (si applicable)
        this.updateSubmissionCounters(formType);
    }

    /**
     * Mise à jour des compteurs de soumissions
     */
    updateSubmissionCounters(formType) {
        const counters = {
            beta: document.querySelector('.stat-number:first-child'),
            contact: document.querySelector('.contact-counter')
        };

        if (counters[formType]) {
            const currentValue = parseInt(counters[formType].textContent.replace(/\D/g, ''));
            counters[formType].textContent = (currentValue + 1) + '+';
        }
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
     * Stockage local des soumissions
     */
    storeSubmission(formType, data) {
        const key = `opentalent_${formType}_submissions`;
        let submissions = JSON.parse(localStorage.getItem(key) || '[]');
        
        submissions.push({
            ...data,
            id: this.generateId(),
            submittedAt: new Date().toISOString()
        });

        // Limitation à 100 soumissions par type
        if (submissions.length > 100) {
            submissions = submissions.slice(-100);
        }

        localStorage.setItem(key, JSON.stringify(submissions));
        this.submissions.set(formType, submissions);
    }

    /**
     * Chargement des soumissions stockées
     */
    loadStoredSubmissions() {
        ['beta', 'contact'].forEach(formType => {
            const key = `opentalent_${formType}_submissions`;
            const stored = localStorage.getItem(key);
            if (stored) {
                this.submissions.set(formType, JSON.parse(stored));
            }
        });
    }

    /**
     * Tracking analytique fictif
     */
    trackFormSubmission(formType, data) {
        // Simulation de Google Analytics ou autre outil de tracking
        console.log(`📊 Analytics: ${formType} form submitted`, {
            type: formType,
            userProfile: data.profile || 'contact',
            timestamp: data.timestamp
        });

        // Simulation d'événement personnalisé
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                form_type: formType,
                user_profile: data.profile || 'unknown'
            });
        }
    }

    /**
     * Système de notifications
     */
    showNotification(message, type = 'info', duration = 5000) {
        // Suppression des notifications existantes
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

        // Styles
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

        // Animation d'entrée
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        // Fermeture manuelle
        notification.querySelector('.notification-close').onclick = () => {
            this.closeNotification(notification);
        };

        // Fermeture automatique
        setTimeout(() => {
            if (document.body.contains(notification)) {
                this.closeNotification(notification);
            }
        }, duration);
    }

    /**
     * Fermeture de notification
     */
    closeNotification(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 300);
    }

    /**
     * Icônes des notifications
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Couleurs des notifications
     */
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
     * Utilitaires
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * API publique pour accéder aux données
     */
    getSubmissions(formType) {
        return this.submissions.get(formType) || [];
    }

    getSubmissionStats() {
        return {
            beta: this.getSubmissions('beta').length,
            contact: this.getSubmissions('contact').length,
            total: this.getSubmissions('beta').length + this.getSubmissions('contact').length
        };
    }
}

// Styles CSS pour les validations de champs
const formStyles = `
    .field-error {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .field-error::before {
        content: '⚠️';
    }
    
    input.error,
    select.error,
    textarea.error {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
    
    input.success,
    select.success,
    textarea.success {
        border-color: #10b981 !important;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
    }
    
    button.loading {
        cursor: not-allowed;
        opacity: 0.7;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .notification-text {
        flex: 1;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    }
    
    .notification-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
`;

// Injection des styles
const styleSheet = document.createElement('style');
styleSheet.textContent = formStyles;
document.head.appendChild(styleSheet);

// Initialisation automatique quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.openTalentForms = new OpenTalentFormManager();
});

// Export pour usage en module (optionnel)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenTalentFormManager;
}