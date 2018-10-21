#!/usr/bin/env bash

# Project wide variables and helper functions
PROJECT="redisstreamsaggregator"

# If you're using docker-machine, override host and dockerhost addresses
DOCKER_SRV="localhost"
DOCKER_MACHINE_HOST=$(docker-machine ip 2> /dev/null || echo "noDocker")

if [ "${DOCKER_MACHINE_HOST}" != "noDocker" ]; then
  DOCKER_SRV=${DOCKER_MACHINE_HOST}
  # If we're using docker machine, lets set up the environment (basically, a windows helper)
  eval $(docker-machine env)
fi

function error {
  echo "$1"
  exit 1
}

function linesOfCode {
  for js in `find src -name "*.js" -or -name "*.jsx"`; do cat $js | wc -l ; done | awk '{s+=$1} END {print s}'
}
