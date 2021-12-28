#!/bin/bash

git pull
npm install
pm2 reload ecosystem.config.js --env production

# EOF
