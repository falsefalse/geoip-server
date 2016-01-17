## geoip-server

Express.js app that resolves domains and IP address to geo data.
It uses [geoip](https://github.com/kuno/GeoIP) and free GeoLite database.

## Install

### node, npm

    # provides add-apt-repository
    $ sudo apt-get install python-software-properties

    # https://launchpad.net/~chris-lea/+archive/node.js/
    $ sudo add-apt-repository ppa:chris-lea/node.js
    $ sudo apt-get update

    # we need to build geoip package
    $ sudo apt-get install nodejs nodejs-dev

### Database

Install `geoipupdate`.

    $ sudo add-apt-repository ppa:maxmind/ppa
    $ sudo apt-get update
    $ sudo apt-get install geoipupdate

or compile from [source](https://github.com/maxmind/geoipupdate)

    $ git clone https://github.com/maxmind/geoipupdate
    $ cd geoipupdate
    $ ./bootstrap
    $ make
    $ [sudo] make install

### Update GeoLite database

    $ mkdir ./db
    $ geoipupdate -f geoipupdate.conf -d ./db/


## Run
    $ npm install .
    $ cp config.json.example config.json
    $ npm start


## Running constantly

I use upstart job (Ubuntu) and `monit` for that. Make sure you have `dbus` package installed, this job somehow needs it.

### Allow `node` to bind to port 80

    $ sudo apt-get install libcap2-bin
    $ sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``


### /etc/init/node-geoip.conf
    description "geoip node.js server"
    author      "false"

    start on started mountall
    stop on shutdown

    script
      # doesn't work without it
      export HOME="root"

      cd /home/false/workspace/geoip-server
      exec sudo -u www-data /usr/bin/npm start >> /var/log/node/geoip.log 2>&1
    end script

To check if it works

    initctl list | grep node-geoip
    sudo start node-geoip
    initctl status node-geoip


### /etc/monit/monitrc
Just enable one of predefined configurations.

    set daemon  60
    set httpd port 2812 and
        use address localhost  # only accept connection from localhost
        allow localhost        # allow localhost to connect to the server and
        allow admin:monit      # require user 'admin' with password 'monit'
        allow @monit           # allow users of group 'monit' to connect (rw)
        allow @users readonly  # allow users of group 'users' to connect readonly
    include /etc/monit/conf.d/*

### /etc/monit/conf.d/node-geoip
    set logfile /var/log/monit/monit.log

    check host nodejs with address 127.0.0.1
      start program = "/sbin/start node-geoip"
      stop program = "/sbin/stop node-geoip"

      if failed port 8080 protocol http
        request /
        with timeout 10 seconds
        then restart
