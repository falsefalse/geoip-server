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
cp db_update.example.conf db_update.conf

yarn db:load
yarn
```

## Run

In development mode, with filewatcher and exposed debugger.

```bash
yarn start
```

It uses [forever] to run as a daemon.

```bash
yarn forever

# to stop the daemon
yarn stop
# forever list, forever restartall, etc
```

### Running constantly

```bash
crontab -e
# paste this
@reboot cd /root/geoip-server && yarn forever
@daily cd /root/geoip-server && yarn db:load && forever restartall
```

[Yet Another Flags]: https://chrome.google.com/webstore/detail/yet-another-flags/dmchcmgddbhmbkakammmklpoonoiiomk
[extension code]: https://github.com/falsefalse/yaf-extension
[maxmind]: https://github.com/runk/node-maxmind
[forever]: https://github.com/foreversd/forever
