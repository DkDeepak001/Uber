#!/bin/bash

# Script to build entity service and publish to Maven local
# This should be run before building Docker images
# Also copies entity artifacts to locations accessible by Docker builds

set -e

echo "Building entity service..."

cd entity

# Build and publish entity to Maven local (skip tests for faster builds)
gradle clean build --no-daemon -x test
gradle publish 

echo "Entity service built and published to Maven local successfully!"

# Build all services
cd ..
echo "================================================"
echo "Building auth service..."
echo "================================================"

cd auth-service
echo "================================================"
echo "Building auth service..."
gradle clean build --no-daemon -x test
cd ..

cd location-service
echo "================================================"
echo "Building location service..."
gradle clean build --no-daemon -x test
cd ..

cd booking-service
echo "================================================"
echo "Building booking service..."
gradle clean build --no-daemon -x test
cd ..

cd review-service
echo "================================================"
echo "Building review service..."
gradle clean build --no-daemon -x test
cd ..


echo "All services built successfully!"