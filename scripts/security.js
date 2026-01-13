// Configuration de sécurité renforcée pour OpenTalent
// Ce fichier contient toutes les mesures de sécurité côté client

export class SecurityManager {
    constructor() {
        this.maxRetries = 3;
        this.rateLimits = new Map(); // Pour le rate limiting côté client
        this.suspiciousActivity = {
            rapidClicks: 0,
            lastClickTime: 0,
            formSubmissions: 0
        };
        
        this.initSecurityMeasures();
    }

    initSecurityMeasures() {
        // Protection contre les attaques par force brute
        this.setupRateLimiting();
        
        // Détection d'activité suspecte
        this.detectSuspiciousActivity();
        
        // Protection CSRF
        this.setupCSRFProtection();
        
        // Sanitisation des inputs
        this.setupInputSanitization();
        
        // Protection contre les bots
        this.setupBotDetection();
    }

    // 1. RATE LIMITING CÔTÉ CLIENT
    setupRateLimiting() {
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = function(url, options = {}) {
            const key = `${options.method || 'GET'}_${url}`;
            const now = Date.now();
            
            if (!self.rateLimits.has(key)) {
                self.rateLimits.set(key, { count: 0, lastReset: now });
            }
            
            const rateData = self.rateLimits.get(key);
            
            // Reset counter chaque minute
            if (now - rateData.lastReset > 60000) {
                rateData.count = 0;
                rateData.lastReset = now;
            }
            
            // Limiter les requêtes
            if (rateData.count >= 10) {
                console.warn('Rate limit atteint pour:', key);
                return Promise.reject(new Error('Trop de requêtes. Veuillez patienter.'));
            }
            
            rateData.count++;
            return originalFetch.call(this, url, options);
        };
    }

    // 2. DÉTECTION D'ACTIVITÉ SUSPECTE
    detectSuspiciousActivity() {
        // Détecter les clics rapides
        document.addEventListener('click', (e) => {
            const now = Date.now();
            if (now - this.suspiciousActivity.lastClickTime < 100) {
                this.suspiciousActivity.rapidClicks++;
                if (this.suspiciousActivity.rapidClicks > 10) {
                    this.logSuspiciousActivity('rapid_clicking', {
                        element: e.target.tagName,
                        className: e.target.className
                    });
                }
            } else {
                this.suspiciousActivity.rapidClicks = 0;
            }
            this.suspiciousActivity.lastClickTime = now;
        });

        // Détecter les tentatives de manipulation du DOM
        if (window.MutationObserver) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 5) {
                        this.logSuspiciousActivity('dom_manipulation', {
                            addedNodes: mutation.addedNodes.length
                        });
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    // 3. PROTECTION CSRF
    setupCSRFProtection() {
        // Générer un token CSRF unique par session
        if (!sessionStorage.getItem('csrf_token')) {
            const token = this.generateSecureToken();
            sessionStorage.setItem('csrf_token', token);
        }
        
        // Ajouter le token à tous les formulaires
        document.querySelectorAll('form').forEach(form => {
            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = 'csrf_token';
            tokenInput.value = sessionStorage.getItem('csrf_token');
            form.appendChild(tokenInput);
        });
    }

    // 4. SANITISATION DES INPUTS
    setupInputSanitization() {
        const sanitizeInput = (input) => {
            let value = input.value;
            
            // Supprimer les caractères dangereux
            value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            value = value.replace(/<[^>]*>/g, '');
            value = value.replace(/javascript:/gi, '');
            value = value.replace(/on\w+\s*=/gi, '');
            
            // Limiter la longueur selon le type d'input
            const maxLengths = {
                'text': 100,
                'email': 320,
                'textarea': 5000
            };
            
            const maxLength = maxLengths[input.type] || maxLengths[input.tagName.toLowerCase()] || 1000;
            if (value.length > maxLength) {
                value = value.substring(0, maxLength);
                this.showSecurityWarning('Texte tronqué pour des raisons de sécurité');
            }
            
            input.value = value;
        };

        // Appliquer la sanitisation en temps réel
        document.addEventListener('input', (e) => {
            if (e.target.matches('input[type="text"], input[type="email"], textarea')) {
                sanitizeInput(e.target);
            }
        });
    }

    // 5. DÉTECTION DE BOTS
    setupBotDetection() {
        const botIndicators = {
            noMouseMovement: true,
            suspiciousUserAgent: false,
            rapidFormFilling: false,
            noScrolling: true
        };

        // Détecter le mouvement de souris
        let mouseMoved = false;
        document.addEventListener('mousemove', () => {
            if (!mouseMoved) {
                mouseMoved = true;
                botIndicators.noMouseMovement = false;
            }
        }, { once: true });

        // Détecter le scrolling
        let scrolled = false;
        window.addEventListener('scroll', () => {
            if (!scrolled) {
                scrolled = true;
                botIndicators.noScrolling = false;
            }
        }, { once: true });

        // Vérifier l'User Agent
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
            botIndicators.suspiciousUserAgent = true;
        }

        // Détecter le remplissage rapide de formulaires
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            let filledTime = 0;
            
            inputs.forEach(input => {
                if (input.dataset.fillTime) {
                    filledTime += parseInt(input.dataset.fillTime);
                }
            });
            
            // Si rempli en moins de 3 secondes, suspect
            if (filledTime < 3000 && inputs.length > 2) {
                botIndicators.rapidFormFilling = true;
                this.logSuspiciousActivity('rapid_form_filling', {
                    fillTime: filledTime,
                    inputCount: inputs.length
                });
            }
        });

        // Enregistrer le temps de remplissage des inputs
        document.addEventListener('focus', (e) => {
            if (e.target.matches('input, textarea')) {
                e.target.dataset.focusTime = Date.now();
            }
        });

        document.addEventListener('blur', (e) => {
            if (e.target.matches('input, textarea') && e.target.dataset.focusTime) {
                const fillTime = Date.now() - parseInt(e.target.dataset.focusTime);
                e.target.dataset.fillTime = fillTime;
            }
        });

        // Évaluer le score de bot avant soumission
        document.addEventListener('submit', (e) => {
            const botScore = this.calculateBotScore(botIndicators);
            if (botScore > 0.7) {
                e.preventDefault();
                this.showSecurityWarning('Activité suspecte détectée. Veuillez réessayer.');
                this.logSuspiciousActivity('high_bot_score', { score: botScore });
            }
        });
    }

    // 6. CALCUL DU SCORE DE BOT
    calculateBotScore(indicators) {
        let score = 0;
        
        if (indicators.noMouseMovement) score += 0.3;
        if (indicators.suspiciousUserAgent) score += 0.4;
        if (indicators.rapidFormFilling) score += 0.4;
        if (indicators.noScrolling) score += 0.2;
        
        return Math.min(score, 1);
    }

    // 7. VALIDATION AVANCÉE DES EMAILS
    validateEmailAdvanced(email) {
        const errors = [];
        
        // Regex stricte
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!emailRegex.test(email)) {
            errors.push('Format d\'email invalide');
        }
        
        // Vérifier la longueur
        if (email.length > 320 || email.length < 5) {
            errors.push('Longueur d\'email invalide');
        }
        
        // Blacklist des domaines suspects
        const suspiciousDomains = [
            'tempmail', '10minutemail', 'guerrillamail', 'mailinator',
            'throwaway', 'temp-mail', 'fakemailgenerator', 'yopmail'
        ];
        
        const domain = email.split('@')[1]?.toLowerCase();
        if (domain && suspiciousDomains.some(sus => domain.includes(sus))) {
            errors.push('Domaine email non autorisé');
        }
        
        // Détecter les patterns suspects
        if (email.match(/(.)\1{4,}/)) { // Plus de 4 caractères consécutifs identiques
            errors.push('Format d\'email suspect');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // 8. CHIFFREMENT CÔTÉ CLIENT (pour données sensibles)
    async encryptSensitiveData(data) {
        if (!window.crypto?.subtle) {
            console.warn('Crypto API non disponible, données non chiffrées');
            return data;
        }
        
        try {
            const encoder = new TextEncoder();
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                encoder.encode('opentalent-2025-key'),
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );
            
            const key = await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: encoder.encode('opentalent-salt'),
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt']
            );
            
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encoder.encode(JSON.stringify(data))
            );
            
            return {
                encrypted: Array.from(new Uint8Array(encrypted)),
                iv: Array.from(iv)
            };
        } catch (error) {
            console.warn('Erreur de chiffrement:', error);
            return data;
        }
    }

    // 9. UTILITAIRES DE SÉCURITÉ
    generateSecureToken() {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    generateFingerprint() {
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
        
        return this.hashString(fingerprint);
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    // 10. LOGGING ET REPORTING
    logSuspiciousActivity(type, details = {}) {
        const logEntry = {
            type: type,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            fingerprint: this.generateFingerprint(),
            details: details
        };
        
        console.warn('Activité suspecte détectée:', logEntry);
        
        // Envoyer au serveur si possible
        if (window.supabase) {
            window.supabase
                .from('analytics_events')
                .insert({
                    event_type: 'security_alert',
                    user_fingerprint: logEntry.fingerprint,
                    event_data: logEntry
                })
                .then(result => {
                    if (result.error) {
                        console.warn('Erreur lors de l\'envoi du log de sécurité:', result.error);
                    }
                });
        }
    }

    showSecurityWarning(message) {
        // Créer une notification discrète
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // 11. MÉTHODE POUR VALIDER AVANT SOUMISSION
    validateFormSecurity(formData) {
        const issues = [];
        
        // Vérifier le token CSRF
        if (formData.get('csrf_token') !== sessionStorage.getItem('csrf_token')) {
            issues.push('Token de sécurité invalide');
        }
        
        // Vérifier les limites de rate
        if (this.suspiciousActivity.formSubmissions > 5) {
            issues.push('Trop de soumissions rapides');
        }
        
        // Valider l'email si présent
        const email = formData.get('email');
        if (email) {
            const emailValidation = this.validateEmailAdvanced(email);
            if (!emailValidation.valid) {
                issues.push(...emailValidation.errors);
            }
        }
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
}

// Initialiser le gestionnaire de sécurité
document.addEventListener('DOMContentLoaded', () => {
    window.securityManager = new SecurityManager();
    console.log('🔒 Gestionnaire de sécurité OpenTalent initialisé');
});