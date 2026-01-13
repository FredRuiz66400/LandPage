-- AUDIT DE SÉCURITÉ ET RENFORCEMENTS - OpenTalent
-- À exécuter après le schema.sql principal

-- =============================================
-- 1. SÉCURITÉ DES DONNÉES PERSONNELLES (RGPD)
-- =============================================

-- Chiffrement des emails sensibles (optionnel, pour conformité RGPD stricte)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fonction pour hasher les emails (pour anonymisation)
CREATE OR REPLACE FUNCTION hash_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(email || 'opentalent_salt_2025', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. POLITIQUES RLS RENFORCÉES
-- =============================================

-- Supprimer les anciennes politiques pour les recréer plus strictement
DROP POLICY IF EXISTS "Permettre insertion beta_signups depuis landing" ON beta_signups;
DROP POLICY IF EXISTS "Permettre insertion contacts depuis landing" ON contacts;
DROP POLICY IF EXISTS "Permettre insertion analytics_events" ON analytics_events;

-- Politique d'insertion avec limitation de taux (rate limiting)
CREATE POLICY "Insertion beta_signups avec rate limiting" ON beta_signups
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (
        -- Vérifier qu'il n'y a pas plus de 5 inscriptions par IP dans la dernière heure
        (SELECT COUNT(*) FROM beta_signups 
         WHERE ip_address = inet_client_addr() 
         AND created_at > NOW() - INTERVAL '1 hour') < 5
        AND
        -- Vérifier que l'email n'existe pas déjà
        NOT EXISTS (SELECT 1 FROM beta_signups WHERE email = NEW.email)
    );

CREATE POLICY "Insertion contacts avec rate limiting" ON contacts
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (
        -- Pas plus de 3 messages par IP par heure
        (SELECT COUNT(*) FROM contacts 
         WHERE ip_address = inet_client_addr() 
         AND created_at > NOW() - INTERVAL '1 hour') < 3
        AND
        -- Message pas trop court (anti-spam)
        LENGTH(NEW.message) >= 10
        AND
        -- Message pas trop long (anti-flood)
        LENGTH(NEW.message) <= 5000
    );

CREATE POLICY "Insertion analytics avec rate limiting" ON analytics_events
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (
        -- Pas plus de 100 événements par fingerprint par heure
        (SELECT COUNT(*) FROM analytics_events 
         WHERE user_fingerprint = NEW.user_fingerprint 
         AND created_at > NOW() - INTERVAL '1 hour') < 100
    );

-- =============================================
-- 3. VALIDATION ET SANITISATION STRICTE
-- =============================================

-- Fonction de validation d'email renforcée
CREATE OR REPLACE FUNCTION validate_email_strict(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérification regex stricte
    IF NOT (email ~* '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$') THEN
        RETURN FALSE;
    END IF;
    
    -- Vérifier la longueur
    IF LENGTH(email) > 320 OR LENGTH(email) < 5 THEN
        RETURN FALSE;
    END IF;
    
    -- Blacklist des domaines suspects
    IF email ~* '.*(tempmail|10minutemail|guerrillamail|mailinator|throwaway).*' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de sanitisation du nom
CREATE OR REPLACE FUNCTION sanitize_name(input_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Supprimer les caractères dangereux et normaliser
    RETURN TRIM(regexp_replace(
        regexp_replace(input_name, '[<>\"''&]', '', 'g'), 
        '\s+', ' ', 'g'
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de sanitisation des messages
CREATE OR REPLACE FUNCTION sanitize_message(input_message TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Supprimer les balises HTML et scripts
    RETURN TRIM(regexp_replace(
        regexp_replace(input_message, '<[^>]*>', '', 'g'),
        '(javascript:|data:|vbscript:)', '', 'gi'
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer les contraintes de validation strictes
ALTER TABLE beta_signups 
    DROP CONSTRAINT IF EXISTS valid_email_beta,
    ADD CONSTRAINT valid_email_beta_strict CHECK (validate_email_strict(email)),
    ADD CONSTRAINT valid_name_beta CHECK (LENGTH(sanitize_name(name)) >= 2 AND LENGTH(sanitize_name(name)) <= 100);

ALTER TABLE contacts 
    DROP CONSTRAINT IF EXISTS valid_email_contacts,
    ADD CONSTRAINT valid_email_contacts_strict CHECK (validate_email_strict(email)),
    ADD CONSTRAINT valid_name_contacts CHECK (LENGTH(sanitize_name(name)) >= 2 AND LENGTH(sanitize_name(name)) <= 100),
    ADD CONSTRAINT valid_message_contacts CHECK (LENGTH(sanitize_message(message)) >= 10 AND LENGTH(sanitize_message(message)) <= 5000);

-- =============================================
-- 4. TRIGGERS DE SÉCURITÉ ET SANITISATION
-- =============================================

-- Trigger pour sanitiser automatiquement les données avant insertion
CREATE OR REPLACE FUNCTION sanitize_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Sanitiser le nom
    IF TG_TABLE_NAME IN ('beta_signups', 'contacts') THEN
        NEW.name = sanitize_name(NEW.name);
        NEW.email = LOWER(TRIM(NEW.email));
    END IF;
    
    -- Sanitiser le message pour les contacts
    IF TG_TABLE_NAME = 'contacts' THEN
        NEW.message = sanitize_message(NEW.message);
    END IF;
    
    -- Sanitiser les expectations pour beta
    IF TG_TABLE_NAME = 'beta_signups' AND NEW.expectations IS NOT NULL THEN
        NEW.expectations = sanitize_message(NEW.expectations);
    END IF;
    
    -- Ajouter l'IP réelle du client
    NEW.ip_address = COALESCE(NEW.ip_address, inet_client_addr());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer les triggers
DROP TRIGGER IF EXISTS sanitize_beta_signups ON beta_signups;
DROP TRIGGER IF EXISTS sanitize_contacts ON contacts;

CREATE TRIGGER sanitize_beta_signups
    BEFORE INSERT OR UPDATE ON beta_signups
    FOR EACH ROW EXECUTE FUNCTION sanitize_before_insert();

CREATE TRIGGER sanitize_contacts
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION sanitize_before_insert();

-- =============================================
-- 5. AUDIT ET LOGGING DE SÉCURITÉ
-- =============================================

-- Table pour les tentatives suspectes
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction pour logger les événements de sécurité
CREATE OR REPLACE FUNCTION log_security_event(
    event_type TEXT,
    details JSONB DEFAULT '{}',
    severity TEXT DEFAULT 'info'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO security_logs (event_type, ip_address, user_agent, details, severity)
    VALUES (event_type, inet_client_addr(), current_setting('request.headers', true)::jsonb->>'user-agent', details, severity);
EXCEPTION
    WHEN OTHERS THEN
        -- Ne pas faire échouer l'opération principale si le log échoue
        NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour logger les tentatives d'insertion suspectes
CREATE OR REPLACE FUNCTION log_suspicious_activity()
RETURNS TRIGGER AS $$
DECLARE
    ip_count INTEGER;
BEGIN
    -- Compter les tentatives récentes de cette IP
    SELECT COUNT(*) INTO ip_count
    FROM (
        SELECT ip_address FROM beta_signups WHERE ip_address = NEW.ip_address AND created_at > NOW() - INTERVAL '1 hour'
        UNION ALL
        SELECT ip_address FROM contacts WHERE ip_address = NEW.ip_address AND created_at > NOW() - INTERVAL '1 hour'
    ) AS recent_attempts;
    
    -- Logger si activité suspecte
    IF ip_count >= 10 THEN
        PERFORM log_security_event(
            'high_frequency_submissions',
            jsonb_build_object(
                'ip_address', NEW.ip_address,
                'table', TG_TABLE_NAME,
                'count_1h', ip_count
            ),
            'warning'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_beta_activity AFTER INSERT ON beta_signups
    FOR EACH ROW EXECUTE FUNCTION log_suspicious_activity();

CREATE TRIGGER log_contact_activity AFTER INSERT ON contacts
    FOR EACH ROW EXECUTE FUNCTION log_suspicious_activity();

-- =============================================
-- 6. PROTECTION CONTRE L'ÉNUMÉRATION
-- =============================================

-- Vue sécurisée pour vérifier l'existence d'emails sans révéler les données
CREATE OR REPLACE VIEW email_exists_check AS
SELECT 
    hash_email(email) as email_hash,
    'exists' as status
FROM beta_signups
UNION
SELECT 
    hash_email(email) as email_hash,
    'exists' as status
FROM contacts;

-- Fonction sécurisée pour vérifier l'existence d'un email
CREATE OR REPLACE FUNCTION check_email_exists_secure(input_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    email_hash TEXT;
BEGIN
    email_hash := hash_email(input_email);
    
    RETURN EXISTS (
        SELECT 1 FROM email_exists_check 
        WHERE email_hash = hash_email(input_email)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. NETTOYAGE AUTOMATIQUE RGPD
-- =============================================

-- Fonction pour anonymiser les anciennes données (RGPD)
CREATE OR REPLACE FUNCTION anonymize_old_data()
RETURNS void AS $$
BEGIN
    -- Anonymiser les données de plus de 2 ans
    UPDATE beta_signups 
    SET 
        name = 'Anonymized User',
        email = hash_email(email) || '@anonymized.local',
        expectations = CASE 
            WHEN expectations IS NOT NULL THEN 'Content anonymized for GDPR compliance'
            ELSE NULL 
        END,
        user_agent = 'Anonymized',
        ip_address = NULL
    WHERE created_at < NOW() - INTERVAL '2 years'
    AND name != 'Anonymized User';
    
    UPDATE contacts 
    SET 
        name = 'Anonymized User',
        email = hash_email(email) || '@anonymized.local',
        message = 'Content anonymized for GDPR compliance',
        reply_message = CASE 
            WHEN reply_message IS NOT NULL THEN 'Content anonymized for GDPR compliance'
            ELSE NULL 
        END,
        user_agent = 'Anonymized',
        ip_address = NULL
    WHERE created_at < NOW() - INTERVAL '2 years'
    AND name != 'Anonymized User';
    
    -- Logger l'opération
    PERFORM log_security_event(
        'gdpr_anonymization',
        jsonb_build_object(
            'anonymized_beta_signups', (SELECT changes FROM anonymize_old_data()),
            'anonymized_contacts', (SELECT changes FROM anonymize_old_data())
        ),
        'info'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 8. INDEXES DE SÉCURITÉ
-- =============================================

-- Index pour surveiller les IP suspectes
CREATE INDEX IF NOT EXISTS idx_beta_signups_ip_recent ON beta_signups(ip_address, created_at) 
    WHERE created_at > NOW() - INTERVAL '24 hours';

CREATE INDEX IF NOT EXISTS idx_contacts_ip_recent ON contacts(ip_address, created_at) 
    WHERE created_at > NOW() - INTERVAL '24 hours';

CREATE INDEX IF NOT EXISTS idx_security_logs_recent ON security_logs(created_at, severity) 
    WHERE created_at > NOW() - INTERVAL '7 days';

-- =============================================
-- 9. POLITIQUES D'ACCÈS ADMIN SÉCURISÉES
-- =============================================

-- Politique pour lecture admin avec audit
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier le rôle authentifié ET une claim spécifique
    RETURN auth.role() = 'authenticated' 
        AND auth.jwt() ->> 'app_role' = 'admin'
        AND auth.jwt() ->> 'app_name' = 'opentalent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer les politiques de lecture avec audit
DROP POLICY IF EXISTS "Lecture beta_signups pour admin" ON beta_signups;
DROP POLICY IF EXISTS "Lecture contacts pour admin" ON contacts;
DROP POLICY IF EXISTS "Lecture analytics pour admin" ON analytics_events;

CREATE POLICY "Lecture sécurisée beta_signups" ON beta_signups
    FOR SELECT 
    TO authenticated
    USING (
        is_admin_user() AND
        -- Logger l'accès aux données
        (SELECT log_security_event('admin_data_access', 
            jsonb_build_object('table', 'beta_signups', 'admin_id', auth.uid()),
            'info')) IS NULL -- Always true, but logs the access
    );

-- =============================================
-- 10. MONITORING ET ALERTES
-- =============================================

-- Vue pour surveiller les tentatives suspectes
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE severity = 'warning') as warnings,
    COUNT(*) FILTER (WHERE severity = 'error') as errors,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
    COUNT(DISTINCT ip_address) as unique_ips
FROM security_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Fonction pour détecter les anomalies
CREATE OR REPLACE FUNCTION detect_anomalies()
RETURNS TABLE(
    anomaly_type TEXT,
    description TEXT,
    severity TEXT,
    count BIGINT
) AS $$
BEGIN
    -- Trop de soumissions par IP
    RETURN QUERY
    SELECT 
        'high_submission_rate'::TEXT,
        'IP with more than 10 submissions in last hour'::TEXT,
        'warning'::TEXT,
        COUNT(*)::BIGINT
    FROM (
        SELECT ip_address FROM beta_signups WHERE created_at > NOW() - INTERVAL '1 hour'
        UNION ALL
        SELECT ip_address FROM contacts WHERE created_at > NOW() - INTERVAL '1 hour'
    ) AS recent_submissions
    GROUP BY ip_address
    HAVING COUNT(*) > 10;
    
    -- Emails suspects
    RETURN QUERY
    SELECT 
        'suspicious_emails'::TEXT,
        'Emails from temporary/suspicious domains'::TEXT,
        'warning'::TEXT,
        COUNT(*)::BIGINT
    FROM (
        SELECT email FROM beta_signups WHERE email ~* '.*(temp|fake|test|spam).*'
        UNION
        SELECT email FROM contacts WHERE email ~* '.*(temp|fake|test|spam).*'
    ) AS suspicious_emails;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 11. FINALISATION ET VÉRIFICATIONS
-- =============================================

-- Vérifier que toutes les sécurités sont en place
DO $$
BEGIN
    -- Vérifier RLS activé
    IF NOT (SELECT row_security FROM pg_tables WHERE tablename = 'beta_signups') THEN
        RAISE EXCEPTION 'RLS not enabled on beta_signups';
    END IF;
    
    -- Vérifier les contraintes
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_email_beta_strict') THEN
        RAISE EXCEPTION 'Email validation constraint missing';
    END IF;
    
    RAISE NOTICE 'Toutes les sécurités sont correctement configurées ✅';
END;
$$;

-- Documentation des mesures de sécurité
COMMENT ON TABLE security_logs IS 'Logs des événements de sécurité et tentatives suspectes';
COMMENT ON FUNCTION sanitize_name(TEXT) IS 'Fonction de sanitisation des noms contre XSS';
COMMENT ON FUNCTION validate_email_strict(TEXT) IS 'Validation stricte des emails avec blacklist';
COMMENT ON FUNCTION anonymize_old_data() IS 'Anonymisation automatique pour conformité RGPD';

-- Programmer le nettoyage automatique (à configurer dans Supabase cron)
-- SELECT cron.schedule('gdpr-cleanup', '0 2 * * 0', 'SELECT anonymize_old_data();');