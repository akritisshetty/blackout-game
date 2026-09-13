#!/usr/bin/env bash
set -euo pipefail

echo "Building blackout..."
mvn clean package -DskipTests -q

echo "Starting Blackout server on http://127.0.0.1:8080"
java -jar target/blackout-1.0.0.jar
