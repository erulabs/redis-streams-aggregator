#!/usr/bin/env bash
source ./bin/_variables.sh

set -e

echo -e "\nESLINT (src):"
./node_modules/.bin/eslint src

echo -e "\nESLINT (service):"
./node_modules/.bin/eslint service

echo -e "\nFlow:"
./node_modules/.bin/flow check

echo -e "\nLint OK"
