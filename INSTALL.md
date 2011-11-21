## Prerequisites

### nodejs
    # provides add-apt-repository
    sudo apt-get install python-software-properties
    # https://launchpad.net/~chris-lea/+archive/node.js/
    sudo add-apt-repository ppa:chris-lea/node.js
    sudo apt-get update
    # we need to build geoip package
    sudo apt-get install nodejs nodejs-dev

### npm
Install `npm`

    curl http://npmjs.org/install.sh | sudo sh

Fix `$NODE_PATH`

    sudo vim /etc/profile.d/nodejs.sh
    # comment out existing line and add instead
    NODE_PATH=`npm -g root`

### libgeoip
Manually build 1.4.8.
Versions older then 1.4.7 are unsupported by node bindings.

    wget http://geolite.maxmind.com/download/geoip/api/c/GeoIP-1.4.8.tar.gz
    tar -xzvf GeoIP-1.4.8.tar.gz
    cd GeoIP-1.4.8.tar
    ./configure --prefix=/usr # important!
    make
    sudo make install

### packages
See [geoip install section](https://github.com/falsefalse/geoip-server/blob/master/INSTALL.md) to pick up your `geoip` version

    npm install geoip[@0.4.4] bogart
