#!/usr/bin/env bash

# Super basic service discovery!

# getPort returns the dynamically allocated port that docker assigned to a container
# this means the port the service runs on will differ between installations
# this is by design, intended to prevent usage of non-configurable services
# (ie: you must load via environment variables)

# getPort $containerName $containerPort
function getPort {
  docker inspect --format="{{(index (index .NetworkSettings.Ports \"${2}\") 0).HostPort}}" redisstreamsaggregator_${1}_1
}

REDIS_PORT="$(getPort redis 6379/tcp)"
