#!/bin/bash

echo "🚀 Deploying ArgoCD for GitOps..."

# Create ArgoCD namespace and deploy RBAC
echo "Creating ArgoCD namespace and RBAC..."
kubectl apply -f rbac.yaml

# Deploy ArgoCD components
echo "Deploying ArgoCD components..."
kubectl apply -f deployment.yaml

# Wait for ArgoCD to be ready
echo "Waiting for ArgoCD server to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

echo "Waiting for ArgoCD repo server to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-repo-server -n argocd

echo "Waiting for ArgoCD application controller to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-application-controller -n argocd

# Get initial admin password
echo "Getting initial admin password..."
INITIAL_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d 2>/dev/null || echo "admin")

# Deploy applications
echo "Deploying ArgoCD applications..."
kubectl apply -f applications.yaml

# Show access information
echo ""
echo "✅ ArgoCD deployed successfully!"
echo ""
echo "🌐 Access Information:"
echo "ArgoCD UI: kubectl port-forward svc/argocd-server 8080:443 -n argocd"
echo "Access URL: https://localhost:8080"
echo "Username: admin"
echo "Password: $INITIAL_PASSWORD"
echo ""
echo "🔧 Verify deployment:"
echo "kubectl get pods -n argocd"
echo "kubectl get applications -n argocd"
echo ""
echo "📝 Next steps:"
echo "1. Access ArgoCD UI and change the admin password"
echo "2. Configure your Git repository credentials"
echo "3. Update the repository URLs in applications.yaml"
echo "4. Sync your applications"