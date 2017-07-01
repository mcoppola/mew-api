#!/bin/sh

## CHANGE 'WEBSITE' to project name
## CHANGE port number

echo ""
echo "Deploying MEW-api on prod server 104.236.220.177"
echo "-------------------------------------------------"
ssh nodeapps@104.236.220.177 '
eval `ssh-agent` && ssh-add ~/.ssh/id_rsa
cd ~/sites/mew/api
git pull origin master
forever stop mew-api
npm install
PORT=3011 IP=127.0.0.1 MONGO_URI=mongodb://127.0.0.1/mew-dev NODE_ENV=production forever start -a --uid "mew-api" index.js
'
