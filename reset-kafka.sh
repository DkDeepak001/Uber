#!/bin/bash

# Script to reset Kafka and ZooKeeper volumes to fix cluster ID mismatches
# Usage: ./reset-kafka.sh

echo "Stopping all services..."
docker-compose down

echo "Removing Kafka and ZooKeeper volumes..."
docker volume rm uber_kafka_data 2>/dev/null || echo "Kafka volume not found or already removed"
docker volume rm uber_zookeeper_data 2>/dev/null || echo "ZooKeeper volume not found or already removed"

echo "Starting services with fresh volumes..."
docker-compose up -d

echo "Waiting for Kafka to be healthy..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if docker-compose ps kafka | grep -q "healthy"; then
        echo "Kafka is healthy!"
        break
    fi
    sleep 2
    counter=$((counter + 2))
    echo "Waiting for Kafka... ($counter/$timeout seconds)"
done

if [ $counter -ge $timeout ]; then
    echo "Warning: Kafka did not become healthy within $timeout seconds"
    echo "Check logs with: docker-compose logs kafka"
else
    echo "Kafka reset complete!"
    echo "Check topics with: docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list"
fi
