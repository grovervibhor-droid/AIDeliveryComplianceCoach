# Azure Web App Deployment Script
# Run this in PowerShell with Azure CLI installed

# Login to Azure
az login

# Set variables
$RESOURCE_GROUP = "ComplianceCoachRG"
$APP_NAME = "compliance-coach-app"  # Change to unique name
$LOCATION = "eastus"
$PLAN_NAME = "ComplianceCoachPlan"
$RUNTIME = "NODE:20-lts"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service plan
az appservice plan create `
  --name $PLAN_NAME `
  --resource-group $RESOURCE_GROUP `
  --sku B1 `
  --is-linux

# Create Web App
az webapp create `
  --resource-group $RESOURCE_GROUP `
  --plan $PLAN_NAME `
  --name $APP_NAME `
  --runtime $RUNTIME

# Configure environment variables
az webapp config appsettings set `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME `
  --settings `
    AZURE_OPENAI_KEY="your-api-key-here" `
    NODE_ENV="production" `
    ALLOWED_ORIGINS="https://$APP_NAME.azurewebsites.net" `
    PORT="8080" `
    RATE_LIMIT="100" `
    LOG_LEVEL="info" `
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" `
    WEBSITE_NODE_DEFAULT_VERSION="20-lts"

# Set startup command
az webapp config set `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME `
  --startup-file "cd backend && npm install && node server.js"

# Configure GitHub deployment
az webapp deployment source config `
  --name $APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --repo-url https://github.com/grovervibhor-droid/NEW_REPO_NAME `
  --branch main `
  --manual-integration

Write-Host "Deployment complete!"
Write-Host "Your app is available at: https://$APP_NAME.azurewebsites.net"
Write-Host "Health check: https://$APP_NAME.azurewebsites.net/api/health"
