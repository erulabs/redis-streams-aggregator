#!/usr/bin/env bash
source ./bin/_variables.sh

if ! [ -f "package.json" ]; then
  error "This script needs to be run from the root of the repository"
fi

NODE_ENV="development" yarn --no-progress --no-emoji --prefer-offline

COMPOSE_CMD="docker-compose -p '${PROJECT}' up -d --remove-orphans redis"

DOCKER_CONTAINER_NAME=${DOCKER_CONTAINER_NAME} \
TAG=${TAG:-:"dev"} \
TARGET=${TARGET:-"local"} \
docker-compose -p "${PROJECT}" build

echo "$COMPOSE_CMD"

set -e
DOCKER_CONTAINER_NAME=${DOCKER_CONTAINER_NAME} \
TAG=${TAG:-:"dev"} \
TARGET=${TARGET:-"local"} \
${COMPOSE_CMD} 2>&1 | tee .devlog.plain
. ./bin/_find_compose_services.sh

if fgrep "Creating " .devlog.plain > /dev/null; then
  echo "Waiting for services to be ready"
  sleep 5
fi
