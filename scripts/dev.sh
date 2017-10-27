#!/bin/sh

# PREPARE
rm -rf ./dest && ./node_modules/.bin/tsc;
# ENV
[[ ! $NODE_ENV ]] && NODE_ENV='development' && export NODE_ENV;
# RUN
./node_modules/.bin/tsc --watch --pretty &
./node_modules/.bin/onchange 'dest/**/*' -i -- node dest/index.js

wait
