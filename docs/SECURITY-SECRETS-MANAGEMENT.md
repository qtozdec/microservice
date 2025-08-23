# 🔐 Security: Secrets Management

## ⚠️ CRITICAL SECURITY WARNING

**NEVER COMMIT ACTUAL SECRETS TO GIT REPOSITORY!**

This document explains how to securely manage secrets in the microservices platform.

## 🎯 Overview

This platform uses a secure secrets management system that separates templates from actual secret values:

- **Templates** (`.template` files) - Safe to commit to git, contain placeholders
- **Actual secrets** - Generated locally, never committed to git
- **Environment-specific** - Different secrets for dev/staging/production

## 📋 Quick Start

### 1. Generate Secure Secrets

```bash
# Generate secrets for development environment
./scripts/generate-secrets.sh development

# Generate secrets for production environment  
./scripts/generate-secrets.sh production
```

### 2. Apply to Kubernetes

```bash
# Apply generated secrets
kubectl apply -f k8s/secrets/development/
# or for production
kubectl apply -f k8s/secrets/production/
```

## 🔧 Detailed Process

### Secret Generation

The `generate-secrets.sh` script creates cryptographically secure secrets:

- **JWT Secret**: 512-bit key for token signing
- **Database Passwords**: 32-character random passwords
- **Encryption Keys**: 256-bit keys for data encryption
- **API Keys**: Secure random keys for external services

### Directory Structure

```
k8s/secrets/
├── *.template                    # Templates (safe to commit)
├── development/                  # Dev secrets (gitignored)
├── staging/                      # Staging secrets (gitignored) 
├── production/                   # Prod secrets (gitignored)
└── monitoring-secret.yaml        # Monitoring credentials
```

### Security Features

- **Cryptographically secure random generation**
- **Base64 encoding for Kubernetes**
- **Environment-specific configurations**
- **No secrets in source code**
- **Git protection with .gitignore rules**

## 🛡️ Security Best Practices

### DO ✅

1. **Always use generated scripts** to create secrets
2. **Rotate secrets regularly** (every 90 days minimum)
3. **Use different secrets** for each environment
4. **Store production secrets** in secure password manager
5. **Verify .gitignore** before committing changes
6. **Use strong passwords** (32+ characters)
7. **Enable 2FA** on all accounts with secret access

### DON'T ❌

1. **Never commit** actual secret values to git
2. **Never reuse** secrets across environments
3. **Never share** secrets in plaintext (email, chat, etc.)
4. **Never hardcode** secrets in application code
5. **Never use** default/weak passwords
6. **Never log** secret values in application logs
7. **Never store** secrets in container images

## 🔄 Secret Rotation Process

### Regular Rotation (Every 90 Days)

1. Generate new secrets:
   ```bash
   ./scripts/generate-secrets.sh production
   ```

2. Apply to Kubernetes:
   ```bash
   kubectl apply -f k8s/secrets/production/
   ```

3. Restart services to use new secrets:
   ```bash
   kubectl rollout restart deployment -n microservices
   ```

4. Verify services are healthy:
   ```bash
   kubectl get pods -n microservices
   ```

### Emergency Rotation (Compromised Secrets)

1. **Immediately** generate new secrets
2. Apply new secrets to cluster
3. Restart all affected services
4. Revoke compromised credentials
5. Audit access logs for unauthorized usage
6. Update incident response documentation

## 🔍 Monitoring & Auditing

### Secret Usage Monitoring

- Monitor failed authentication attempts
- Audit secret access patterns  
- Set up alerts for suspicious activity
- Log secret rotation events

### Regular Security Reviews

- **Weekly**: Review access logs
- **Monthly**: Audit secret permissions
- **Quarterly**: Rotate all secrets
- **Annually**: Full security assessment

## 🚨 Incident Response

### If Secrets Are Compromised

1. **IMMEDIATE**: Rotate affected secrets
2. **IMMEDIATE**: Restart affected services
3. **URGENT**: Review access logs
4. **URGENT**: Notify security team
5. **Follow-up**: Update procedures

### If Secrets Are Accidentally Committed

1. **STOP**: Do not push to remote repository
2. **REMOVE**: Use `git rm --cached` to untrack files
3. **REWRITE**: Consider git history rewriting if already pushed
4. **ROTATE**: Generate and deploy new secrets immediately
5. **AUDIT**: Check if any systems accessed the committed secrets

## 📚 References

### Tools Used

- **OpenSSL**: Cryptographically secure random generation
- **Base64**: Kubernetes secret encoding
- **Kubernetes Secrets**: Native secret storage
- **Git .gitignore**: Prevent accidental commits

### Related Documentation

- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [OpenSSL Random Generation](https://www.openssl.org/docs/man1.1.1/man1/openssl-rand.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

## 🎓 Training

### For Developers

- Never commit secrets to git
- Always use environment variables
- Understand secret rotation process
- Know incident response procedures

### For DevOps

- Regular secret rotation schedule
- Monitor secret usage patterns
- Maintain secure secret storage
- Implement secret scanning tools

---

## 🔒 Remember

**Security is everyone's responsibility. When in doubt, ask the security team!**

*Last updated: $(date)*