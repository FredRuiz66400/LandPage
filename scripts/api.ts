/**
 * OpenTalent - Gestionnaire TypeScript pour API Back-end
 * Version TypeScript moderne pour la gestion des formulaires avec types stricts
 */

// Types et interfaces
interface BaseFormData {
    name: string;
    email: string;
    type: string;
    timestamp: string;
    source: string;
}

interface BetaFormData extends BaseFormData {
    profile: 'developer' | 'recruiter' | 'both' | 'other';
    expectations?: string;
    type: 'beta_signup';
}

interface ContactFormData extends BaseFormData {
    subject: string;
    message: string;
    type: 'contact';
}

interface ApiResponse {
    success: boolean;
    message: string;
    code: number;
    data?: any;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

interface FormSubmissionStats {
    beta: number;
    contact: number;
    total: number;
}

// Configuration de l'API
const API_CONFIG = {
    baseUrl: 'https://api.opentalent.fr',
    endpoints: {
        beta: '/beta/signup',
        contact: '/contact/submit',
        analytics: '/analytics/track'
    },
    timeout: 10000,
    retryAttempts: 3
} as const;

/**
 * Classe principale pour la gestion des formulaires avec TypeScript
 */
class OpenTalentAPIManager {
    private readonly apiUrl: string;
    private submissions: Map<string, Array<BetaFormData | ContactFormData>>;
    private retryAttempts: number;

    constructor() {
        this.apiUrl = API_CONFIG.baseUrl;
        this.submissions = new Map();
        this.retryAttempts = API_CONFIG.retryAttempts;
        this.init();
    }

    /**
     * Initialisation avec gestion des erreurs TypeScript
     */
    private init(): void {
        try {
            this.loadStoredSubmissions();
            this.setupEventListeners();
            console.log('🚀 OpenTalent API Manager (TypeScript) initialized');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
        }
    }

    /**
     * Configuration des écouteurs d'événements
     */
    private setupEventListeners(): void {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupFormHandlers();
        });
    }

    /**
     * Configuration des gestionnaires de formulaires
     */
    private setupFormHandlers(): void {
        const betaForm = document.querySelector('.beta-form') as HTMLFormElement;
        const contactForm = document.querySelector('.contact-form') as HTMLFormElement;

        if (betaForm) {
            betaForm.addEventListener('submit', this.handleBetaSubmission.bind(this));
        }

        if (contactForm) {
            contactForm.addEventListener('submit', this.handleContactSubmission.bind(this));
        }
    }

    /**
     * Validation des données Beta avec types stricts
     */
    private validateBetaData(data: Partial<BetaFormData>): ValidationResult {
        const errors: string[] = [];

        if (!data.name || data.name.length < 2) {
            errors.push('Le nom doit contenir au moins 2 caractères');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Une adresse email valide est requise');
        }

        if (!data.profile || !['developer', 'recruiter', 'both', 'other'].includes(data.profile)) {
            errors.push('Veuillez sélectionner un profil valide');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validation des données Contact avec types stricts
     */
    private validateContactData(data: Partial<ContactFormData>): ValidationResult {
        const errors: string[] = [];

        if (!data.name || data.name.length < 2) {
            errors.push('Le nom doit contenir au moins 2 caractères');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Une adresse email valide est requise');
        }

        if (!data.subject) {
            errors.push('Veuillez sélectionner un sujet');
        }

        if (!data.message || data.message.length < 10) {
            errors.push('Le message doit contenir au moins 10 caractères');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validation email avec regex TypeScript
     */
    private isValidEmail(email: string): boolean {
        const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Gestionnaire de soumission Beta
     */
    private async handleBetaSubmission(event: Event): Promise<void> {
        event.preventDefault();
        
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        const data: BetaFormData = {
            type: 'beta_signup',
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            profile: formData.get('profile') as 'developer' | 'recruiter' | 'both' | 'other',
            expectations: formData.get('expectations') as string || '',
            timestamp: new Date().toISOString(),
            source: 'landing_page'
        };

        const validation = this.validateBetaData(data);
        if (!validation.isValid) {
            this.showErrorNotification(validation.errors.join('<br>'));
            return;
        }

        await this.submitWithRetry('beta', data, form);
    }

    /**
     * Gestionnaire de soumission Contact
     */
    private async handleContactSubmission(event: Event): Promise<void> {
        event.preventDefault();
        
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        const data: ContactFormData = {
            type: 'contact',
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            subject: formData.get('subject') as string,
            message: formData.get('message') as string,
            timestamp: new Date().toISOString(),
            source: 'landing_page'
        };

        const validation = this.validateContactData(data);
        if (!validation.isValid) {
            this.showErrorNotification(validation.errors.join('<br>'));
            return;
        }

        await this.submitWithRetry('contact', data, form);
    }

    /**
     * Soumission avec retry automatique
     */
    private async submitWithRetry(
        formType: string, 
        data: BetaFormData | ContactFormData, 
        form: HTMLFormElement,
        attempt: number = 1
    ): Promise<void> {
        try {
            const response = await this.submitToAPI(formType, data);
            
            if (response.success) {
                this.handleSuccess(formType, data, form);
                this.showSuccessNotification(response.message);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            if (attempt < this.retryAttempts) {
                console.warn(`Tentative ${attempt} échouée, retry dans 2s...`);
                await this.delay(2000);
                return this.submitWithRetry(formType, data, form, attempt + 1);
            } else {
                console.error('Toutes les tentatives ont échoué:', error);
                this.showErrorNotification('Impossible de soumettre le formulaire. Veuillez réessayer plus tard.');
            }
        }
    }

    /**
     * Appel API réel ou simulé
     */
    private async submitToAPI(
        formType: string, 
        data: BetaFormData | ContactFormData
    ): Promise<ApiResponse> {
        const endpoint = formType === 'beta' ? API_CONFIG.endpoints.beta : API_CONFIG.endpoints.contact;
        const url = `${this.apiUrl}${endpoint}`;

        try {
            // En production, remplacer par un vrai appel fetch
            return await this.simulateAPICall(data);
            
            /* Version production :
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(API_CONFIG.timeout)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json() as ApiResponse;
            */
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    }

    /**
     * Simulation d'appel API pour développement
     */
    private async simulateAPICall(data: BetaFormData | ContactFormData): Promise<ApiResponse> {
        await this.delay(1000 + Math.random() * 2000);

        // Simulation d'erreurs occasionnelles
        if (Math.random() < 0.05) {
            throw new Error('Erreur réseau simulée');
        }

        // Stockage local
        this.storeSubmission(data.type, data);

        const messages = {
            beta_signup: 'Inscription à la beta enregistrée avec succès ! Nous vous contacterons bientôt.',
            contact: 'Message envoyé avec succès ! Notre équipe vous répondra dans les 24h.'
        };

        return {
            success: true,
            message: messages[data.type as keyof typeof messages] || 'Soumission réussie',
            code: 200,
            data: { id: this.generateId(), timestamp: data.timestamp }
        };
    }

    /**
     * Gestion du succès avec types stricts
     */
    private handleSuccess(
        formType: string, 
        data: BetaFormData | ContactFormData, 
        form: HTMLFormElement
    ): void {
        form.reset();
        this.trackAnalytics(formType, data);
        this.updateUICounters(formType);
    }

    /**
     * Tracking analytique typé
     */
    private trackAnalytics(
        formType: string, 
        data: BetaFormData | ContactFormData
    ): void {
        const analyticsData = {
            event: 'form_submission',
            form_type: formType,
            user_profile: 'profile' in data ? data.profile : 'contact',
            timestamp: data.timestamp,
            source: data.source
        };

        console.log('📊 Analytics:', analyticsData);

        // Integration avec Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                custom_parameter_1: formType,
                custom_parameter_2: 'profile' in data ? data.profile : 'contact'
            });
        }
    }

    /**
     * Mise à jour des compteurs UI
     */
    private updateUICounters(formType: string): void {
        const stats = this.getSubmissionStats();
        
        // Mise à jour du compteur dans la hero section
        const heroStats = document.querySelectorAll('.stat-number');
        if (heroStats.length >= 3) {
            if (formType === 'beta') {
                heroStats[0].textContent = `${500 + stats.beta}+`;
            }
        }
    }

    /**
     * Stockage typé des soumissions
     */
    private storeSubmission(
        formType: string, 
        data: BetaFormData | ContactFormData
    ): void {
        const key = `opentalent_${formType}_submissions`;
        let submissions = this.submissions.get(formType) || [];
        
        submissions.push({
            ...data,
            id: this.generateId()
        } as BetaFormData | ContactFormData);

        // Limitation du stockage
        if (submissions.length > 100) {
            submissions = submissions.slice(-100);
        }

        this.submissions.set(formType, submissions);
        localStorage.setItem(key, JSON.stringify(submissions));
    }

    /**
     * Chargement des soumissions stockées
     */
    private loadStoredSubmissions(): void {
        ['beta_signup', 'contact'].forEach(formType => {
            const key = `opentalent_${formType}_submissions`;
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const data = JSON.parse(stored) as Array<BetaFormData | ContactFormData>;
                    this.submissions.set(formType, data);
                } catch (error) {
                    console.warn(`Erreur lors du chargement de ${formType}:`, error);
                }
            }
        });
    }

    /**
     * Notifications typées
     */
    private showSuccessNotification(message: string): void {
        this.showNotification(message, 'success');
    }

    private showErrorNotification(message: string): void {
        this.showNotification(message, 'error');
    }

    private showNotification(
        message: string, 
        type: 'success' | 'error' | 'warning' | 'info' = 'info',
        duration: number = 5000
    ): void {
        // Implémentation similaire au JavaScript mais avec types stricts
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <div class="notification-text">${message}</div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Styles et animations (identiques au JS)
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

        const closeBtn = notification.querySelector('.notification-close') as HTMLButtonElement;
        closeBtn.onclick = () => this.closeNotification(notification);

        setTimeout(() => {
            if (document.body.contains(notification)) {
                this.closeNotification(notification);
            }
        }, duration);
    }

    private closeNotification(notification: HTMLElement): void {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 300);
    }

    private getNotificationIcon(type: string): string {
        const icons: Record<string, string> = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    private getNotificationColor(type: string): string {
        const colors: Record<string, string> = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
        };
        return colors[type] || colors.info;
    }

    /**
     * API publique typée
     */
    public getSubmissionStats(): FormSubmissionStats {
        const beta = this.submissions.get('beta_signup')?.length || 0;
        const contact = this.submissions.get('contact')?.length || 0;
        
        return {
            beta,
            contact,
            total: beta + contact
        };
    }

    public getSubmissions(formType: string): Array<BetaFormData | ContactFormData> {
        return this.submissions.get(formType) || [];
    }

    /**
     * Utilitaires privés
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Déclaration globale pour TypeScript
declare global {
    interface Window {
        openTalentAPI: OpenTalentAPIManager;
        gtag?: (...args: any[]) => void;
    }
    
    function gtag(...args: any[]): void;
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    window.openTalentAPI = new OpenTalentAPIManager();
});

// Export pour modules ES6
export default OpenTalentAPIManager;
export type { BetaFormData, ContactFormData, ApiResponse, FormSubmissionStats };