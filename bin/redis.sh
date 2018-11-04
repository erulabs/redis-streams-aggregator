#!/usr/bin/env bash
set -e
source ./bin/_variables.sh

# A helper script to easily run queries / log-in to the local Dockerized Redis containers
USAGE="./bin/redis.sh [common] \"[command]\""

source ./bin/_find_compose_services.sh

REDIS_TARGET="${REDIS_PORT}"

if [[ "$@" != "" ]]; then
  redis-cli -h ${DOCKER_SRV} -p ${REDIS_TARGET} $@
else
  redis-cli -h ${DOCKER_SRV} -p ${REDIS_TARGET}
fi
