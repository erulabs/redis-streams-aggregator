#!/usr/bin/env bash
set -e
source ./bin/_startup_local.sh

TARGET="${TARGET:=local}"

set -a
source "inf/env/${TARGET}/api.env.plain"
set +a

REDIS_URIS="${DOCKER_SRV}:${REDIS_PORT}" \
RSA_DEBUG="true" \
./node_modules/.bin/nodemon --inspect index.js
