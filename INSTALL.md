# How to install geoip server

## Prerequisites

### Node
    # provides add-apt-repository
    sudo apt-get install python-software-properties
    # https://launchpad.net/~chris-lea/+archive/node.js/
    sudo add-apt-repository ppa:chris-lea/node.js
    sudo apt-get update
    # we need to build geoip package
    sudo apt-get install nodejs nodejs-dev

### npm
After `npm` is installed

    sudo vim /etc/profile.d/nodejs.sh
    # comment out existing line and add instead
    NODE_PATH=`npm -g root`

### Maxmind GeoIP C lib
Manually building latest, package repositories provide unsupported (1.4.6) versions

    wget http://geolite.maxmind.com/download/geoip/api/c/GeoIP-1.4.8.tar.gz
    tar -xzvf GeoIP-1.4.8.tar.gz
    cd GeoIP-1.4.8.tar
    ./configure --prefix=/usr # important!
    make
    sudo make install

### Install geoip node package

#### node 0.4.9, cygwin
Install to global to not collide with VM
    
    npm -g install geoip@0.4.4

#### Ubuntu
    [sudo] npm [-g] install geoip
