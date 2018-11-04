#!/usr/bin/env bash
set -e
source ./bin/_variables.sh
source ./bin/_startup_local.sh

# Generate TAG from git commit
if [ -z "${TAG}" ]; then
  COMMIT_HASH=$(git log -1 | head -n1 | awk '{print $2}')
  TAG=$(echo $COMMIT_HASH | cut -c1-7)
fi

echo "${DOCKER_SRV}:${REDIS_PORT}"

if [ "${1}" == "--compose-link" ]; then
  echo "Deploying local integration test container, linking via compose"
  docker run --rm -it \
    --name ${PROJECT}_integration \
    --network ${PROJECT}_default \
    -e "REDIS_URI=redis:6379" \
    ${PROJECT} \
    ./node_modules/.bin/mocha test/integration
elif [ "${TARGET:=local}" == "local" ]; then
  . ./bin/_find_compose_services.sh
  REDIS_URI="${DOCKER_SRV}:${REDIS_PORT}" \
  DEBUG="ioredis:*" \
  RSA_DEBUG="true" \
  ./node_modules/.bin/mocha test/integration
else
  echo "not supported yet"
  exit 0
fi
