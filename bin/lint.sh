#!/usr/bin/env bash
set -e

echo -e "\nESLINT (src):"
./node_modules/.bin/eslint index.js

echo -e "\nESLINT (test):"
./node_modules/.bin/eslint test

echo -e "\nFlow:"
./node_modules/.bin/flow check

echo -e "\nLint OK"
