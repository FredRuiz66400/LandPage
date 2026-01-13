#!/bin/bash

# 🚀 Script de Pré-Déploiement Vercel - OpenTalent
# Vérifie que tout est prêt avant le déploiement

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 VÉRIFICATION PRÉ-DÉPLOIEMENT VERCEL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

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

check_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 1. Vérifier les fichiers essentiels
echo "📁 1. FICHIERS ESSENTIELS"
echo "─────────────────────────────────"

[ -f "index.html" ] && check_pass "index.html existe" || check_fail "index.html manquant"
[ -f "vercel.json" ] && check_pass "vercel.json existe" || check_fail "vercel.json manquant"
[ -f ".env" ] && check_pass ".env existe" || check_fail ".env manquant"
[ -f ".gitignore" ] && check_pass ".gitignore existe" || check_fail ".gitignore manquant"
[ -f "package.json" ] && check_pass "package.json existe" || check_warn "package.json manquant (optionnel)"

echo ""
echo "🔐 2. CONFIGURATION SUPABASE"
echo "─────────────────────────────────"

if [ -f ".env" ]; then
    if grep -q "jxgcpdgbtrhcltqrzxus" ".env"; then
        check_pass "Clés Supabase présentes dans .env"
        
        # Extraire les valeurs
        SUPABASE_URL=$(grep "SUPABASE_URL=" .env | cut -d'=' -f2)
        SUPABASE_ANON_KEY=$(grep "SUPABASE_ANON_KEY=" .env | cut -d'=' -f2 | head -c 20)
        
        check_info "URL: $SUPABASE_URL"
        check_info "ANON_KEY: ${SUPABASE_ANON_KEY}..."
    else
        check_warn "Clés Supabase personnalisées détectées"
    fi
    
    if grep -q ".env" ".gitignore" 2>/dev/null; then
        check_pass ".env est protégé par .gitignore"
    else
        check_fail ".env NON protégé - RISQUE DE SÉCURITÉ!"
    fi
else
    check_fail "Fichier .env manquant"
fi

echo ""
echo "🌐 3. CONFIGURATION VERCEL.JSON"
echo "─────────────────────────────────"

if [ -f "vercel.json" ]; then
    # Vérifier la syntaxe JSON
    if command -v python3 &> /dev/null; then
        if python3 -m json.tool vercel.json > /dev/null 2>&1; then
            check_pass "vercel.json a une syntaxe JSON valide"
        else
            check_fail "vercel.json a une syntaxe JSON invalide"
        fi
    fi
    
    # Vérifier les éléments importants
    if grep -q "Content-Security-Policy" "vercel.json"; then
        check_pass "Content Security Policy configurée"
    else
        check_warn "Content Security Policy manquante"
    fi
    
    if grep -q "supabase.co" "vercel.json"; then
        check_pass "Supabase autorisé dans CSP"
    else
        check_warn "Supabase pas explicitement autorisé dans CSP"
    fi
    
    if grep -q "cdn.skypack.dev" "vercel.json"; then
        check_pass "Skypack CDN autorisé"
    else
        check_warn "Skypack CDN pas autorisé dans CSP"
    fi
    
    if grep -q "Strict-Transport-Security" "vercel.json"; then
        check_pass "HSTS configuré"
    else
        check_warn "HSTS non configuré"
    fi
fi

echo ""
echo "📦 4. STRUCTURE DES FICHIERS"
echo "─────────────────────────────────"

[ -d "scripts" ] && check_pass "Dossier scripts/ existe" || check_fail "Dossier scripts/ manquant"
[ -d "styles" ] && check_pass "Dossier styles/ existe" || check_fail "Dossier styles/ manquant"
[ -d "database" ] && check_pass "Dossier database/ existe" || check_warn "Dossier database/ manquant"

if [ -d "scripts" ]; then
    [ -f "scripts/database.js" ] && check_pass "database.js existe" || check_fail "database.js manquant"
    [ -f "scripts/forms-supabase.js" ] && check_pass "forms-supabase.js existe" || check_fail "forms-supabase.js manquant"
    [ -f "scripts/supabase-config-production.js" ] && check_pass "supabase-config-production.js existe" || check_warn "supabase-config-production.js manquant"
fi

echo ""
echo "🔍 5. VÉRIFICATION HTML"
echo "─────────────────────────────────"

if [ -f "index.html" ]; then
    if grep -q "@supabase/supabase-js" "index.html"; then
        check_pass "Bibliothèque Supabase importée"
    else
        check_fail "Bibliothèque Supabase NON importée"
    fi
    
    if grep -q "forms-supabase.js" "index.html"; then
        check_pass "forms-supabase.js référencé"
    else
        check_fail "forms-supabase.js NON référencé"
    fi
    
    if grep -q 'type="module"' "index.html"; then
        check_pass "Modules ES6 configurés"
    else
        check_warn "Modules ES6 non détectés"
    fi
fi

echo ""
echo "🛠️ 6. OUTILS DE DÉPLOIEMENT"
echo "─────────────────────────────────"

if command -v vercel &> /dev/null; then
    check_pass "Vercel CLI installé ($(vercel --version))"
else
    check_warn "Vercel CLI non installé - installer avec: npm i -g vercel"
fi

if command -v git &> /dev/null; then
    check_pass "Git installé"
    
    if git rev-parse --git-dir > /dev/null 2>&1; then
        check_pass "Repository Git initialisé"
        
        # Vérifier si .env est tracké
        if git ls-files --error-unmatch .env > /dev/null 2>&1; then
            check_fail ".env EST TRACKÉ PAR GIT - DANGER!"
            echo "   ${RED}→ Exécuter: git rm --cached .env && git commit -m 'Remove .env'${NC}"
        else
            check_pass ".env n'est pas tracké par Git"
        fi
    else
        check_warn "Pas de repository Git (optionnel pour Vercel)"
    fi
else
    check_warn "Git non installé"
fi

echo ""
echo "📋 7. BASE DE DONNÉES SUPABASE"
echo "─────────────────────────────────"

[ -f "database/schema.sql" ] && check_pass "schema.sql existe" || check_fail "schema.sql manquant"
[ -f "database/security.sql" ] && check_pass "security.sql existe" || check_warn "security.sql manquant"

check_info "N'oubliez pas d'exécuter ces scripts dans Supabase SQL Editor!"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RÉSUMÉ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Projet prêt pour le déploiement Vercel!${NC}"
    echo ""
    echo "🚀 Commandes de déploiement:"
    echo ""
    echo "   # Preview"
    echo "   vercel"
    echo ""
    echo "   # Production"
    echo "   vercel --prod"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Projet déployable avec $WARNINGS avertissement(s)${NC}"
    echo ""
    echo "Vous pouvez déployer mais considérez les avertissements."
    echo ""
    echo "Pour déployer: vercel --prod"
    exit 0
else
    echo -e "${RED}✗ Projet non prêt: $ERRORS erreur(s), $WARNINGS avertissement(s)${NC}"
    echo ""
    echo "❌ Actions requises:"
    echo "   1. Corrigez les erreurs ci-dessus"
    echo "   2. Consultez VERCEL_DEPLOYMENT.md"
    echo "   3. Relancez: ./pre-deploy-vercel.sh"
    exit 1
fi
