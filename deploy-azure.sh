#!/bin/bash

# Azure Deployment Script for AI Delivery Compliance Coach
# This script deploys the application to Azure App Service

set -e

echo "🚀 Starting Azure deployment for AI Delivery Compliance Coach"

# Configuration
RESOURCE_GROUP="rg-ai-compliance-coach"
APP_SERVICE_PLAN="asp-ai-compliance-coach"
WEB_APP_NAME="ai-delivery-compliance-coach"
LOCATION="East US"
RUNTIME="NODE|18-lts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    print_warning "Not logged into Azure. Please log in."
    az login
fi

print_status "Creating resource group..."
az group create \
    --name $RESOURCE_GROUP \
    --location "$LOCATION" \
    --output table

print_status "Creating App Service Plan..."
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku B1 \
    --is-linux \
    --output table

print_status "Creating Web App..."
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --name $WEB_APP_NAME \
    --runtime "$RUNTIME" \
    --output table

print_status "Configuring application settings..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --settings \
        NODE_ENV=production \
        WEBSITE_NODE_DEFAULT_VERSION=18.17.0 \
        SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    --output table

# Set up environment variables
print_status "Setting up environment variables..."
if [ -z "$AZURE_OPENAI_KEY" ]; then
    print_warning "AZURE_OPENAI_KEY environment variable not set"
    read -p "Enter your Azure OpenAI API key: " -s AZURE_OPENAI_KEY
    echo
fi

az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --settings AZURE_OPENAI_KEY="$AZURE_OPENAI_KEY" \
    --output table

print_status "Configuring startup command..."
az webapp config set \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --startup-file "backend/server.js" \
    --output table

print_status "Building and deploying application..."
# Build the React app
npm run build

# Create deployment package
tar -czf deployment.tar.gz build/ backend/ package.json

# Deploy using ZIP deployment
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --src deployment.tar.gz

# Clean up
rm deployment.tar.gz

print_status "Deployment completed successfully! 🎉"
print_status "Your app is available at: https://$WEB_APP_NAME.azurewebsites.net"

# Optional: Set up custom domain and SSL
read -p "Would you like to configure a custom domain? (y/n): " configure_domain
if [ "$configure_domain" = "y" ]; then
    read -p "Enter your custom domain (e.g., compliance-coach.yourdomain.com): " custom_domain
    
    print_status "Configuring custom domain..."
    az webapp config hostname add \
        --resource-group $RESOURCE_GROUP \
        --webapp-name $WEB_APP_NAME \
        --hostname $custom_domain
    
    print_status "Custom domain configured. Don't forget to:"
    print_status "1. Add a CNAME record in your DNS: $custom_domain -> $WEB_APP_NAME.azurewebsites.net"
    print_status "2. Configure SSL certificate in Azure Portal"
fi

print_status "Deployment script completed!"
print_status "Next steps:"
echo "1. Monitor your application in Azure Portal"
echo "2. Set up Application Insights for monitoring"
echo "3. Configure backup and disaster recovery"
echo "4. Set up staging slots for blue-green deployments"