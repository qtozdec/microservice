#!/bin/bash

echo "🔧 Preparing Microservices Platform for GitHub Publication"
echo "==========================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if file contains secrets
check_for_secrets() {
    local file=$1
    local found_secrets=false
    
    # Common secret patterns
    patterns=(
        "password.*=.*[^example]"
        "secret.*=.*[^example]"
        "token.*=.*[^example]"
        "key.*=.*[^example]"
        "api[_-]key.*=.*[^example]"
        "private[_-]key"
        "-----BEGIN"
    )
    
    for pattern in "${patterns[@]}"; do
        if grep -i "$pattern" "$file" >/dev/null 2>&1; then
            echo "  ❌ Found potential secret in $file"
            found_secrets=true
        fi
    done
    
    return $found_secrets
}

# Function to verify .env.example files exist
verify_env_examples() {
    print_info "Verifying .env.example files exist..."
    
    local missing_files=()
    local expected_files=(
        ".env.example"
        "applications/user-service/.env.example"
        "applications/order-service/.env.example"
        "applications/notification-service/.env.example"
        "applications/inventory-service/.env.example" 
        "applications/audit-service/.env.example"
        "applications/frontend/.env.example"
        "devops-infrastructure/.env.example"
    )
    
    for file in "${expected_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        print_status "All .env.example files exist"
    else
        print_error "Missing .env.example files:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        return 1
    fi
}

# Function to check .gitignore is comprehensive
verify_gitignore() {
    print_info "Verifying .gitignore configuration..."
    
    local required_patterns=(
        ".env"
        "*.key"
        "*.pem" 
        "*secret*"
        "*password*"
        "target/"
        "node_modules/"
        ".DS_Store"
    )
    
    for pattern in "${required_patterns[@]}"; do
        if ! grep -F "$pattern" .gitignore >/dev/null 2>&1; then
            print_warning ".gitignore missing pattern: $pattern"
        fi
    done
    
    print_status ".gitignore verification complete"
}

# Function to scan for accidentally committed secrets
scan_for_secrets() {
    print_info "Scanning for accidentally committed secrets..."
    
    local found_secrets=false
    
    # Check tracked files for secrets
    while IFS= read -r -d '' file; do
        if [[ "$file" == *.example ]] || [[ "$file" == *.template ]]; then
            continue # Skip example files
        fi
        
        if check_for_secrets "$file"; then
            found_secrets=true
        fi
    done < <(find . -type f -name "*.yml" -o -name "*.yaml" -o -name "*.properties" -o -name "*.conf" -o -name "*.env" | grep -v ".git" | tr '\n' '\0')
    
    if [ "$found_secrets" = false ]; then
        print_status "No secrets found in tracked files"
    else
        print_error "Potential secrets found! Review and fix before committing."
        return 1
    fi
}

# Function to verify documentation exists
verify_documentation() {
    print_info "Verifying documentation files..."
    
    local required_docs=(
        "README.md"
        "SECURITY.md"
        "CONTRIBUTING.md"
        ".gitignore"
    )
    
    for doc in "${required_docs[@]}"; do
        if [ ! -f "$doc" ]; then
            print_error "Missing documentation file: $doc"
            return 1
        fi
    done
    
    print_status "All documentation files exist"
}

# Function to create initial git setup
setup_git() {
    print_info "Setting up Git repository..."
    
    if [ ! -d ".git" ]; then
        git init
        print_status "Git repository initialized"
    else
        print_info "Git repository already exists"
    fi
    
    # Add gitignore and commit it first
    git add .gitignore
    git commit -m "feat: add comprehensive .gitignore for microservices platform" 2>/dev/null || true
    
    # Add documentation
    git add README.md SECURITY.md CONTRIBUTING.md
    git commit -m "docs: add project documentation and security guidelines" 2>/dev/null || true
    
    # Add .env.example files
    git add .env.example
    find . -name "*.env.example" -exec git add {} \;
    git commit -m "feat: add environment variable templates" 2>/dev/null || true
    
    print_status "Initial Git setup complete"
}

# Function to show final checklist
show_final_checklist() {
    echo ""
    echo "🔍 Final Checklist Before GitHub Publication"
    echo "=============================================="
    echo ""
    echo "✅ Environment Setup:"
    echo "   - .env.example files created for all services"
    echo "   - .gitignore configured to prevent secret leaks"
    echo "   - Documentation files created (README, SECURITY, CONTRIBUTING)"
    echo ""
    echo "⚠️  Before Publishing to GitHub:"
    echo "   1. Review all .env.example files for sensitive data"
    echo "   2. Ensure no actual passwords/secrets are in any file"
    echo "   3. Test local deployment with example configurations"
    echo "   4. Update repository URL in ArgoCD applications"
    echo ""
    echo "📋 Required Manual Steps:"
    echo "   1. Create GitHub repository"
    echo "   2. Update repository URLs in:"
    echo "      - devops-infrastructure/ci-cd/argocd/applications.yaml"
    echo "      - README.md (clone URL)"
    echo "      - CI/CD pipeline configurations"
    echo "   3. Configure GitHub secrets for CI/CD"
    echo "   4. Set up branch protection rules"
    echo ""
    echo "🚀 Ready to push:"
    echo "   git remote add origin https://github.com/your-username/microservices-platform.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
    print_status "Platform is ready for GitHub publication!"
}

# Main execution
main() {
    echo ""
    print_info "Starting GitHub preparation process..."
    echo ""
    
    # Run all verification steps
    if verify_env_examples && verify_gitignore && verify_documentation && scan_for_secrets; then
        setup_git
        show_final_checklist
        
        echo ""
        print_status "✅ Platform successfully prepared for GitHub! 🎉"
        echo ""
    else
        print_error "❌ Issues found. Please fix them before publishing to GitHub."
        echo ""
        echo "Common fixes:"
        echo "- Remove any hardcoded passwords or secrets"
        echo "- Add missing .env.example files"  
        echo "- Update .gitignore patterns"
        echo "- Create missing documentation"
        exit 1
    fi
}

# Show warning about secrets
echo ""
print_warning "⚠️  SECURITY WARNING ⚠️"
echo "Before publishing to GitHub:"
echo "1. Ensure NO actual passwords, tokens, or secrets are committed"
echo "2. Only .env.example files should be committed (not .env files)"
echo "3. Review all configuration files for sensitive data"
echo "4. Use placeholder values in example files"
echo ""
read -p "Have you reviewed all files for secrets? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    main
else
    print_info "Please review your files and run this script again when ready."
    exit 0
fi