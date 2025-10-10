#!/bin/bash

rm -rf /srv/http/dasherr
cp -r ./www /srv/http/dasherr
chown -R http:http /srv/http/dasherr/
chmod -R 775 /srv/http/dasherr/
 
cp -f ./www/settings.json ./www/settings.sample.json
