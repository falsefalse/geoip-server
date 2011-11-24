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

*TODO:* Figure out how to make it available for `root` as well

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
See [geoip install section](https://github.com/kuno/GeoIP) to pick up your `geoip` version.
Both `geoip` and `bogart` build bindings and extensions, make sure you have `node-dev` package.

    sudo npm -g install coffee
    npm install geoip[@0.4.4]
    npm install bogart

### Running

    git clone git://github.com/falsefalse/geoip-server.git
    cd geoip-server
    ./server-coffee

It uses 8080 port currently. It probably should be taken to parameter.
Ctrl+C to stop server.

### Running constantly

I use upstart job (Ubuntu) and `monit` for that.

#### /etc/init/node-geoip.conf
    description "geoip node.js server"
    author      "false"

    start on started mountall
    stop on shutdown

    script
      # doesn't work without it
      export HOME="root"

      exec sudo -u false /usr/bin/coffee /home/false/workspace/geoip-server/server.coffee >> /var/log/node/geoip.log 2>&1
    end script

    $ start node-geoip
    $ ps ax | grep node
    $ start node-geoip
    $ ps ax | grep node


#### /etc/monit/monitrc
Just enable one of predefined configurations.

    set daemon  60
    set httpd port 2812 and
        use address localhost  # only accept connection from localhost
        allow localhost        # allow localhost to connect to the server and
        allow admin:monit      # require user 'admin' with password 'monit'
        allow @monit           # allow users of group 'monit' to connect (rw)
        allow @users readonly  # allow users of group 'users' to connect readonly
    include /etc/monit/conf.d/*

#### /etc/monit/conf.d/node-geoip
    set logfile /var/log/monit/monit.log

    check host nodejs with address 127.0.0.1
      start program = "/sbin/start node-geoip"
      stop program = "/sbin/stop node-geoip"

      if failed port 8080 protocol http
        request /
        with timeout 10 seconds
        then restart
