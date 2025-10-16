#!/bin/bash
# Azure Web App Build Script
# This script runs on Azure during deployment

echo "Starting deployment build..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Build React frontend
echo "Building React frontend..."
npm run build

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install --production

echo "Build complete!"
