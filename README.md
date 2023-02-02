# geoip-server

Express.js app that resolves domains and IP address to geo data.
It uses [maxmind] and free GeoLite database.

Used as a backend for [Yet Another Flags], checkout the [extension code] as well!

## Install

### node, yarn, geoipupdate, forever

```bash
# add node sources
curl -sL https://deb.nodesource.com/setup_18.x | bash -
# add yarn sources
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

apt update
apt install nodejs yarn geoipupdate

yarn global add forever
```

### GeoLite license and DB

Needs `AccountID` and `LicenseKey` from MaxMind, free license works.

```bash
# update the file with your AccountID and LicenseKey values
cp maxmind.example.conf maxmind.conf

yarn db:load
yarn
```

### nginx and certbot

```bash
apt install nginx
snap install --classic certbot

service nginx start

# generate certificate
certbot certonly

# copy ngnix configuration
# ⚠️ this overwrites your existing config, assumign fresh VM
cp nginx.conf /etc/nginx/sites-available/default
```

## Run

In development mode, with filewatcher and exposed debugger.

```bash
yarn start
```

It uses [forever] to run as a daemon on 8080.

```bash
yarn forever

# check the logs
yarn logs

# to stop the daemon
yarn stop
# restart
yarn restart
```

### Running constantly

Server runs behind nginx which does TLS termination.

```bash
crontab -e
# paste this
@reboot cd /root/geoip-server && yarn forever
@daily cd /root/geoip-server && yarn db:load && forever restartall

yarn forever
```

### Legacy support

Production runs version 0.0.3, [f64f10c].

[Legacy updates] for `GeoLiteCity.dat`, we need IPv4.

```bash
aria2c https://dl.miyuru.lk/geoip/maxmind/city/maxmind4.dat.gz
scp ./maxmind4.dat.gz furman.im:~/workspace/exp/database

# ssh furman.im
# ~/workspace/exp has a copy of `node_modules`` of the running server
cd ~/workspace/exp/database
gunzip maxmind4.dat.gz
mv maxmind4.dat GeoLiteCity.dat
cd ..

coffe server.coffee # exp runs on 8090
curl http://geo.furman.im:8090/furman.im

# if it works - copy db over and restart
cp database/GeoLiteCity.dat ../geoip-server/database
monit restart nodejs

curl http://geo.furman.im:8080/furman.im
```

[Yet Another Flags]: https://chrome.google.com/webstore/detail/yet-another-flags/dmchcmgddbhmbkakammmklpoonoiiomk
[extension code]: https://github.com/falsefalse/yaf-extension
[maxmind]: https://github.com/runk/node-maxmind
[forever]: https://github.com/foreversd/forever
[Legacy updates]: https://www.miyuru.lk/geoiplegacy
[f64f10c]: https://github.com/falsefalse/geoip-server/commit/f64f10cdf8f09483e35511208484b4f7476957da
