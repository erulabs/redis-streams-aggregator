#!/usr/bin/env bash
set -e
source ./bin/_startup_local.sh

TARGET="${1:-local}"
TEST_TARGET="${2:-index.js}"
PROJECT="RedisStreamsAggregator"

if [[ ! -d test/integration/${TEST_TARGET} && ! -f test/integration/${TEST_TARGET} ]]; then
  echo "no test named '${TEST_TARGET}'"
  exit 1
fi

# Generate TAG from git commit
if [ -z "${TAG}" ]; then
  COMMIT_HASH=$(git log -1 | head -n1 | awk '{print $2}')
  TAG=$(echo $COMMIT_HASH | cut -c1-7)
fi

echo "${DOCKER_SRV}:${REDIS_PORT}"

if [ "${3}" == "--compose-link" ]; then
  echo "Deploying local integration test container, linking via compose"
  docker run --rm -it \
    --name ${PROJECT}_integration \
    --network ${PROJECT}_default \
    -e "REDIS_URI=redis:6379" \
    ${DOCKER_CONTAINER_NAME}:${TAG} \
    ./node_modules/.bin/mocha test/integration/${TEST_TARGET}
elif [ "${TARGET}" == "local" ]; then
  . ./bin/_find_compose_services.sh
  REDIS_URI="${DOCKER_SRV}:${REDIS_PORT}" \
  RSA_DEBUG="true" \
  ./node_modules/.bin/mocha test/integration/${TEST_TARGET}
else
  echo "not supported yet"
  exit 0
fi
