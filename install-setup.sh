#!/bin/bash

# FuseFlow / LinQSynQ One-Click Setup Script

echo "🚀 Starting FuseFlow System Setup..."
echo "======================================="

# Function to check command existence
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ Error: $1 is not installed. Please install it first."
        exit 1
    else
        echo "✅ Found $1"
    fi
}

# 1. Check Prerequisites
echo ""
echo "🔍 Checking Prerequisites..."
check_command node
check_command npm
check_command docker

# 2. MongoDB Setup (Docker)
echo ""
echo "📦 Setting up MongoDB (Docker)..."

# Check if container is running
if [ "$(docker ps -q -f name=fuseflow-mongo)" ]; then
    echo "✅ MongoDB container 'fuseflow-mongo' is already running."
else
    # Check if container exists but is stopped
    if [ "$(docker ps -aq -f name=fuseflow-mongo)" ]; then
        echo "🔄 Starting existing 'fuseflow-mongo' container..."
        docker start fuseflow-mongo
    else
        # Run new container
        echo "⬇️  Pulling and starting new MongoDB container..."
        docker run -d --name fuseflow-mongo -p 27017:27017 --restart unless-stopped mongo:latest
        
        if [ $? -eq 0 ]; then
            echo "✅ MongoDB container started successfully."
        else
            echo "❌ Failed to start MongoDB. Please check if Docker is running."
            exit 1
        fi
    fi
fi

# 3. Backend Dependencies
echo ""
echo "📦 Installing Backend Dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed."
else
    echo "❌ Failed to install backend dependencies."
    exit 1
fi

# 4. Frontend Dependencies
echo ""
echo "📦 Installing Frontend Dependencies..."
cd client
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed."
else
    echo "❌ Failed to install frontend dependencies."
    exit 1
fi
cd ..

# 5. Node-RED Dependencies (Optional but good to have if user runs it)
# Assuming node-red is managed via package.json dependencies, which it is.

echo ""
echo "======================================="
echo "🎉 Setup Complete! You are ready to go."
echo "======================================="
echo "To start the full stack (OPC UA + UI + Node-RED), run:"
echo "👉 ./restart-opcua.sh"
echo "   OR"
echo "👉 npm run dev:opcua"
echo ""
