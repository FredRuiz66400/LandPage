-- Schema SQL pour OpenTalent sur Supabase
-- Exécuter ces commandes dans l'éditeur SQL de Supabase

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table pour les inscriptions Beta
CREATE TABLE beta_signups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    profile VARCHAR(50) NOT NULL CHECK (profile IN ('developer', 'recruiter', 'both', 'other')),
    expectations TEXT,
    source VARCHAR(100) DEFAULT 'landing_page',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_confirmed BOOLEAN DEFAULT FALSE,
    confirmation_token UUID DEFAULT uuid_generate_v4()
);

-- Table pour les messages de contact
CREATE TABLE contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100) DEFAULT 'landing_page',
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    replied_at TIMESTAMP WITH TIME ZONE,
    reply_message TEXT
);

-- Table pour les événements analytics
CREATE TABLE analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    event_data JSONB,
    user_fingerprint VARCHAR(255),
    session_id UUID,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices pour optimiser les performances
CREATE INDEX idx_beta_signups_email ON beta_signups(email);
CREATE INDEX idx_beta_signups_created_at ON beta_signups(created_at DESC);
CREATE INDEX idx_beta_signups_profile ON beta_signups(profile);
CREATE INDEX idx_beta_signups_confirmed ON beta_signups(is_confirmed);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_contacts_status ON contacts(status);

CREATE INDEX idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_fingerprint ON analytics_events(user_fingerprint);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_beta_signups_updated_at 
    BEFORE UPDATE ON beta_signups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques de sécurité RLS (Row Level Security)
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre les insertions depuis la landing page (anonyme)
CREATE POLICY "Permettre insertion beta_signups depuis landing" ON beta_signups
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Permettre insertion contacts depuis landing" ON contacts
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Permettre insertion analytics_events" ON analytics_events
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- Politique pour lecture (seulement pour les utilisateurs authentifiés/admin)
CREATE POLICY "Lecture beta_signups pour admin" ON beta_signups
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "Lecture contacts pour admin" ON contacts
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "Lecture analytics pour admin" ON analytics_events
    FOR SELECT 
    TO authenticated
    USING (true);

-- Vue pour les statistiques publiques (sans données personnelles)
CREATE VIEW public_stats AS
SELECT 
    'beta_signups' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as week_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as day_count
FROM beta_signups
UNION ALL
SELECT 
    'contacts' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as week_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as day_count
FROM contacts;

-- Fonction pour obtenir les statistiques par profil
CREATE OR REPLACE FUNCTION get_beta_stats_by_profile()
RETURNS TABLE(profile VARCHAR, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bs.profile,
        COUNT(*) as count
    FROM beta_signups bs
    GROUP BY bs.profile
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour valider un email
CREATE OR REPLACE FUNCTION validate_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Contrainte pour valider les emails
ALTER TABLE beta_signups ADD CONSTRAINT valid_email_beta CHECK (validate_email(email));
ALTER TABLE contacts ADD CONSTRAINT valid_email_contacts CHECK (validate_email(email));

-- Fonction pour nettoyer les anciennes données analytics (GDPR)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
    DELETE FROM analytics_events 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour la documentation
COMMENT ON TABLE beta_signups IS 'Inscriptions au programme beta d''OpenTalent';
COMMENT ON TABLE contacts IS 'Messages de contact depuis la landing page';
COMMENT ON TABLE analytics_events IS 'Événements analytics et tracking utilisateur';

COMMENT ON COLUMN beta_signups.profile IS 'Type d''utilisateur: developer, recruiter, both, other';
COMMENT ON COLUMN beta_signups.is_confirmed IS 'Email confirmé par l''utilisateur';
COMMENT ON COLUMN contacts.status IS 'Statut du message: new, read, replied, closed';

-- Insertion de données de test (optionnel pour le développement)
-- INSERT INTO beta_signups (name, email, profile, expectations) VALUES
-- ('John Doe', 'john@example.com', 'developer', 'Interested in React opportunities'),
-- ('Jane Smith', 'jane@example.com', 'recruiter', 'Looking for junior developers');

-- INSERT INTO contacts (name, email, subject, message) VALUES
-- ('Alice Johnson', 'alice@example.com', 'general', 'Great platform concept!'),
-- ('Bob Wilson', 'bob@example.com', 'partnership', 'Interested in partnering with you');

-- Vérification que tout est bien créé
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('beta_signups', 'contacts', 'analytics_events')
ORDER BY table_name;