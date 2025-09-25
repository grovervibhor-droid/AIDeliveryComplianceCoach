# CI/CD Pipeline Setup Guide

This guide explains how to set up Continuous Integration and Continuous Deployment (CI/CD) for the AI-Delivery Compliance Coach project.

## Overview

The CI/CD pipeline includes:
- **Continuous Integration (CI)**: Automated testing, building, and security scanning
- **Continuous Deployment (CD)**: Automated deployment to staging and production environments
- **Containerization**: Docker support for consistent deployments
- **Monitoring**: Health checks and application monitoring

## Pipeline Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   Code      │    │   Build &    │    │   Security  │    │   Deploy     │
│   Commit    │───▶│   Test       │───▶│   Scan      │───▶│   to Azure   │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

## Files Created

### 1. GitHub Actions Workflows

#### `.github/workflows/ci-cd.yml`
- **Full CI/CD pipeline** for production deployments
- Includes: Build, Test, Security Scan, Deploy to Staging/Production
- **Triggers**: Push to `main` and `develop` branches
- **Features**: 
  - Multi-environment deployment
  - Automated release creation
  - Smoke tests after deployment

#### `.github/workflows/ci.yml`
- **Lightweight CI pipeline** for feature branches
- Includes: Build, Test across multiple Node.js versions
- **Triggers**: All branches and pull requests
- **Features**:
  - Matrix testing (Node.js 16, 18, 20)
  - Code coverage reporting
  - Fast feedback for developers

### 2. Docker Configuration

#### `Dockerfile`
- **Multi-stage build** for production deployment
- Optimized for size and security
- **Features**:
  - Separate build stages for frontend and backend
  - Health checks included
  - Production-ready configuration

#### `docker-compose.yml`
- **Local development environment**
- Includes backend, frontend, and Redis
- **Features**:
  - Hot reload for development
  - Network isolation
  - Easy environment management

### 3. Deployment Scripts

#### `deploy-azure.sh`
- **Azure App Service deployment script**
- Automated resource creation and configuration
- **Features**:
  - Resource group and App Service creation
  - Environment variable configuration
  - Custom domain setup option

## Setup Instructions

### Prerequisites

1. **Azure Account**: Active Azure subscription
2. **GitHub Account**: Repository with admin access
3. **Azure OpenAI**: Deployed Azure OpenAI service
4. **Node.js**: Version 16 or higher

### Step 1: Configure GitHub Secrets

Add these secrets to your GitHub repository:

```
Settings → Secrets and Variables → Actions → New repository secret
```

**Required Secrets:**
- `AZURE_WEBAPP_PUBLISH_PROFILE_STAGING`: Download from Azure App Service (Staging)
- `AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION`: Download from Azure App Service (Production)
- `AZURE_OPENAI_KEY`: Your Azure OpenAI API key
- `CODECOV_TOKEN`: (Optional) For code coverage reporting

### Step 2: Set up Azure Resources

#### Option A: Using the deployment script
```bash
chmod +x deploy-azure.sh
./deploy-azure.sh
```

#### Option B: Manual setup via Azure Portal
1. Create Resource Group: `rg-ai-compliance-coach`
2. Create App Service Plan: `asp-ai-compliance-coach` (Linux, B1)
3. Create App Services: 
   - Production: `ai-delivery-compliance-coach`
   - Staging: `ai-delivery-compliance-coach-staging`

### Step 3: Configure Environment Variables

In Azure App Service → Configuration → Application Settings:

```
NODE_ENV=production
WEBSITE_NODE_DEFAULT_VERSION=18.17.0
SCM_DO_BUILD_DURING_DEPLOYMENT=true
AZURE_OPENAI_KEY=<your-azure-openai-key>
```

### Step 4: Set up Branch Protection

In GitHub → Settings → Branches → Add rule:

```
Branch name pattern: main
☑ Require status checks to pass before merging
☑ Require branches to be up to date before merging
  - CI - Build and Test
☑ Require pull request reviews before merging
☑ Restrict pushes
```

## Pipeline Stages

### 1. Continuous Integration (CI)

**Triggers**: All pushes and pull requests

**Steps**:
1. **Code Checkout**: Get latest code
2. **Dependencies**: Install npm packages
3. **Linting**: Code quality checks
4. **Testing**: Run unit and integration tests
5. **Build**: Create production build
6. **Artifacts**: Store build for deployment

**Matrix Testing**: Tests across Node.js versions 16.x, 18.x, 20.x

### 2. Security Scanning

**Steps**:
1. **Dependency Audit**: Check for vulnerable packages
2. **CodeQL Analysis**: Static code security analysis
3. **License Compliance**: Verify license compatibility

### 3. Continuous Deployment (CD)

#### Staging Deployment
**Trigger**: Push to `develop` branch
**Environment**: `ai-delivery-compliance-coach-staging.azurewebsites.net`
**Steps**:
1. Deploy to staging environment
2. Run smoke tests
3. Notify team of deployment status

#### Production Deployment
**Trigger**: Push to `main` branch
**Environment**: `ai-delivery-compliance-coach.azurewebsites.net`
**Steps**:
1. Deploy to production environment
2. Run production smoke tests
3. Create GitHub release
4. Notify team of deployment status

## Monitoring and Health Checks

### Health Endpoint
- **URL**: `/api/health`
- **Response**: System status, timestamp, version info
- **Monitoring**: Used by Azure App Service health checks

### Application Insights
Configure in Azure Portal for:
- Performance monitoring
- Error tracking
- Usage analytics
- Custom telemetry

## Environment Strategy

### Branch Strategy
```
main (production)     ←── merge ←── develop (staging)     ←── merge ←── feature/* (CI only)
```

### Deployment Strategy
- **Feature branches**: CI only (build + test)
- **Develop branch**: Deploy to staging
- **Main branch**: Deploy to production
- **Hotfixes**: Direct to main with approval

## Docker Deployment

### Local Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment
```bash
# Build production image
docker build -t ai-compliance-coach .

# Run production container
docker run -d -p 3000:3000 -p 5000:5000 \
  -e AZURE_OPENAI_KEY=<your-key> \
  ai-compliance-coach
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are properly listed
   - Review build logs for specific errors

2. **Deployment Failures**
   - Verify Azure publish profiles are current
   - Check Azure App Service logs
   - Ensure environment variables are set

3. **Health Check Failures**
   - Verify backend server is running
   - Check Azure OpenAI key configuration
   - Review application logs

### Useful Commands

```bash
# Check CI status
gh run list

# View specific workflow run
gh run view <run-id>

# Trigger manual deployment
gh workflow run ci-cd.yml

# Check Azure App Service logs
az webapp log tail --name ai-delivery-compliance-coach --resource-group rg-ai-compliance-coach
```

## Best Practices

1. **Security**:
   - Never commit secrets to repository
   - Use GitHub secrets for sensitive data
   - Regularly update dependencies

2. **Testing**:
   - Write tests for critical functionality
   - Maintain test coverage above 80%
   - Run tests locally before pushing

3. **Deployment**:
   - Always test in staging before production
   - Use feature flags for risky changes
   - Monitor application after deployments

4. **Monitoring**:
   - Set up alerts for critical failures
   - Monitor performance metrics
   - Review logs regularly

## Support and Maintenance

### Regular Tasks
- **Weekly**: Review failed builds and deployments
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize pipeline performance

### Contact Information
- **DevOps Team**: devops@yourcompany.com
- **Application Owner**: vibhorgrover@microsoft.com
- **Azure Support**: [Azure Support Portal](https://portal.azure.com)

---

This CI/CD setup provides a robust foundation for deploying and maintaining the AI-Delivery Compliance Coach application with automated testing, security scanning, and multi-environment deployment capabilities.