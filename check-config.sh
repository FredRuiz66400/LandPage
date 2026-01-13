#!/bin/bash

# 🔍 Script de Vérification de Configuration Supabase - OpenTalent
# Ce script vérifie que tous les éléments nécessaires sont configurés

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VÉRIFICATION DE CONFIGURATION SUPABASE - OpenTalent"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Fonction pour afficher les résultats
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "📋 1. FICHIERS DE CONFIGURATION"
echo "─────────────────────────────────"

# Vérifier l'existence des fichiers essentiels
if [ -f ".env" ]; then
    check_pass "Fichier .env existe"
    
    # Vérifier le contenu du .env
    if grep -q "SUPABASE_URL=" ".env" && ! grep -q "votre-projet" ".env"; then
        check_pass "SUPABASE_URL est configuré"
    elif grep -q "votre-projet" ".env"; then
        check_fail "SUPABASE_URL contient encore les valeurs par défaut"
    else
        check_fail "SUPABASE_URL n'est pas défini dans .env"
    fi
    
    if grep -q "SUPABASE_ANON_KEY=" ".env" && ! grep -q "votre-anon-key" ".env"; then
        check_pass "SUPABASE_ANON_KEY est configuré"
    elif grep -q "votre-anon-key" ".env"; then
        check_fail "SUPABASE_ANON_KEY contient encore les valeurs par défaut"
    else
        check_fail "SUPABASE_ANON_KEY n'est pas défini dans .env"
    fi
    
    if grep -q "SUPABASE_SERVICE_ROLE_KEY=" ".env"; then
        check_pass "SUPABASE_SERVICE_ROLE_KEY est défini"
    else
        check_warn "SUPABASE_SERVICE_ROLE_KEY n'est pas défini (optionnel pour le frontend)"
    fi
else
    check_fail "Fichier .env manquant"
fi

if [ -f ".gitignore" ]; then
    check_pass "Fichier .gitignore existe"
    
    if grep -q ".env" ".gitignore"; then
        check_pass ".env est ignoré par git"
    else
        check_fail ".env n'est PAS ignoré par git - RISQUE DE SÉCURITÉ!"
    fi
else
    check_fail "Fichier .gitignore manquant - RISQUE DE SÉCURITÉ!"
fi

echo ""
echo "📂 2. STRUCTURE DES FICHIERS"
echo "─────────────────────────────────"

# Vérifier les scripts JavaScript
[ -f "scripts/supabase-config.js" ] && check_pass "supabase-config.js existe" || check_fail "supabase-config.js manquant"
[ -f "scripts/supabase-config-production.js" ] && check_pass "supabase-config-production.js existe" || check_fail "supabase-config-production.js manquant"
[ -f "scripts/database.js" ] && check_pass "database.js existe" || check_fail "database.js manquant"
[ -f "scripts/forms-supabase.js" ] && check_pass "forms-supabase.js existe" || check_fail "forms-supabase.js manquant"

echo ""
echo "🗄️  3. BASE DE DONNÉES"
echo "─────────────────────────────────"

# Vérifier les fichiers SQL
[ -f "database/schema.sql" ] && check_pass "schema.sql existe" || check_fail "schema.sql manquant"
[ -f "database/security.sql" ] && check_pass "security.sql existe" || check_warn "security.sql manquant (recommandé pour la sécurité)"

echo ""
echo "🌐 4. INTÉGRATION HTML"
echo "─────────────────────────────────"

if [ -f "index.html" ]; then
    check_pass "index.html existe"
    
    # Vérifier les imports Supabase
    if grep -q "@supabase/supabase-js" "index.html"; then
        check_pass "Bibliothèque Supabase importée"
    else
        check_fail "Bibliothèque Supabase NON importée"
    fi
    
    if grep -q "forms-supabase.js" "index.html"; then
        check_pass "forms-supabase.js est référencé"
    else
        check_fail "forms-supabase.js n'est PAS référencé"
    fi
    
    if grep -q "database.js" "index.html"; then
        check_pass "database.js est référencé"
    else
        check_fail "database.js n'est PAS référencé"
    fi
else
    check_fail "index.html manquant"
fi

echo ""
echo "🔐 5. SÉCURITÉ"
echo "─────────────────────────────────"

# Vérifier les credentials dans les fichiers JS
if grep -q "jxgcpdgbtrhcltqrzxus" "scripts/supabase-config-production.js"; then
    check_warn "Les clés Supabase dans supabase-config-production.js sont les clés de démo"
    echo "   → Remplacez-les par vos vraies clés de production"
fi

if [ -f "vercel.json" ]; then
    check_pass "vercel.json existe (configuration déploiement)"
    
    if grep -q "Content-Security-Policy" "vercel.json"; then
        check_pass "Content Security Policy configurée"
    else
        check_warn "Content Security Policy non configurée"
    fi
else
    check_warn "vercel.json manquant (requis pour Vercel)"
fi

echo ""
echo "📚 6. DOCUMENTATION"
echo "─────────────────────────────────"

[ -f "DEPLOYMENT.md" ] && check_pass "DEPLOYMENT.md existe" || check_warn "DEPLOYMENT.md manquant"
[ -f "SETUP_SUPABASE.md" ] && check_pass "SETUP_SUPABASE.md existe" || check_warn "SETUP_SUPABASE.md manquant"
[ -f "README.md" ] && check_pass "README.md existe" || check_warn "README.md manquant"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RÉSUMÉ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Configuration complète - Prêt pour le déploiement!${NC}"
    echo ""
    echo "🚀 Prochaines étapes:"
    echo "   1. Vérifiez vos clés Supabase dans .env"
    echo "   2. Testez localement avec un serveur HTTP"
    echo "   3. Déployez sur Vercel/Netlify"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Configuration fonctionnelle avec $WARNINGS avertissement(s)${NC}"
    echo ""
    echo "Vous pouvez continuer mais considérez les avertissements ci-dessus."
    exit 0
else
    echo -e "${RED}✗ Configuration incomplète: $ERRORS erreur(s), $WARNINGS avertissement(s)${NC}"
    echo ""
    echo "❌ Actions requises:"
    echo "   1. Corrigez les erreurs ci-dessus"
    echo "   2. Consultez DEPLOYMENT.md pour l'aide"
    echo "   3. Relancez ce script pour vérifier"
    exit 1
fi
