#!/bin/bash

# Clean restart script for FuseFlow OPC UA

echo "🧹 Cleaning up old processes..."
killall node 2>/dev/null
sleep 2

echo "🚀 Starting FuseFlow with OPC UA..."
cd /Users/admin/Desktop/Fuseflow
npm run dev:opcua
