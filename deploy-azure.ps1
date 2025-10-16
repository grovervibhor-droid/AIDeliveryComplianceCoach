# Azure Deployment Script for AI Delivery Compliance Coach (PowerShell)
# This script deploys the application to Azure App Service

Write-Host "🚀 Starting Azure deployment for AI Delivery Compliance Coach" -ForegroundColor Green

# Configuration
$RESOURCE_GROUP = "rg-ai-compliance-coach"
$APP_SERVICE_PLAN = "asp-ai-compliance-coach"
$WEB_APP_NAME = "ai-delivery-compliance-coach"
$LOCATION = "East US"
$RUNTIME = "NODE:18-lts"

function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if user is logged in
try {
    az account show | Out-Null
    Write-Status "Already logged into Azure"
} catch {
    Write-Warning "Not logged into Azure. Please log in."
    az login
}

Write-Status "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION --output table

Write-Status "Creating App Service Plan..."
az appservice plan create --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --sku B1 --is-linux --output table

Write-Status "Creating Production Web App..."
az webapp create --resource-group $RESOURCE_GROUP --plan $APP_SERVICE_PLAN --name $WEB_APP_NAME --runtime $RUNTIME --output table

Write-Status "Creating Staging Web App..."
az webapp create --resource-group $RESOURCE_GROUP --plan $APP_SERVICE_PLAN --name "$WEB_APP_NAME-staging" --runtime $RUNTIME --output table

Write-Status "Configuring production application settings..."
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --settings NODE_ENV=production WEBSITE_NODE_DEFAULT_VERSION=18.17.0 SCM_DO_BUILD_DURING_DEPLOYMENT=true --output table

Write-Status "Configuring staging application settings..."
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name "$WEB_APP_NAME-staging" --settings NODE_ENV=staging WEBSITE_NODE_DEFAULT_VERSION=18.17.0 SCM_DO_BUILD_DURING_DEPLOYMENT=true --output table

# Set up environment variables
Write-Status "Setting up environment variables..."
$AZURE_OPENAI_KEY = $env:AZURE_OPENAI_KEY
if (-not $AZURE_OPENAI_KEY) {
    Write-Warning "AZURE_OPENAI_KEY environment variable not set"
    $AZURE_OPENAI_KEY = Read-Host "Enter your Azure OpenAI API key" -AsSecureString
    $AZURE_OPENAI_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($AZURE_OPENAI_KEY))
}

az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --settings "AZURE_OPENAI_KEY=$AZURE_OPENAI_KEY" --output table
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name "$WEB_APP_NAME-staging" --settings "AZURE_OPENAI_KEY=$AZURE_OPENAI_KEY" --output table

Write-Status "Configuring startup command for production..."
az webapp config set --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --startup-file "backend/server.js" --output table

Write-Status "Configuring startup command for staging..."
az webapp config set --resource-group $RESOURCE_GROUP --name "$WEB_APP_NAME-staging" --startup-file "backend/server.js" --output table

Write-Status "Deployment setup completed successfully! 🎉"
Write-Status "Your apps will be available at:"
Write-Host "  Production: https://$WEB_APP_NAME.azurewebsites.net" -ForegroundColor Cyan
Write-Host "  Staging: https://$WEB_APP_NAME-staging.azurewebsites.net" -ForegroundColor Cyan

Write-Status "Next steps:"
Write-Host "1. Download publish profiles from Azure Portal for both apps" -ForegroundColor Yellow
Write-Host "2. Add publish profiles to GitHub Secrets" -ForegroundColor Yellow
Write-Host "3. Push code to trigger CI/CD pipeline" -ForegroundColor Yellow
Write-Host "4. Monitor deployments in GitHub Actions" -ForegroundColor Yellow

Write-Status "Azure resources created successfully!"