#!/usr/bin/env coffee

DATABASE_PATH = "#{__dirname}/database"

bogart = require "bogart"
dns = require "dns"
city = new (require "geoip").City "#{DATABASE_PATH}/GeoLiteCity.dat"

app = bogart.router()
app.get "/", (req) ->
    bogart.html "Hello, world!\n"

app.get "/favicon.ico", (req) ->
    bogart.html "Nope", { status: 404 }

# match 4 groups of 3 digits separated by 3 dots
app.get /((\d{1,3}(\.|$)){4})/, (req) ->
    res = bogart.res()
    lookup res, req.params.splat[0]
    res

app.get "/:domain", (req) ->
    # console.log "dns lookup:", domain
    res = bogart.res()
    domain = req.params.domain
    dns.resolve4 domain, (err, address) ->
        unless err
            lookup res, address[0]
        else
            not_found.call res, "Domain #{domain} wasn't resolved", err
    res

bogart.start app, { port: 8080 }

lookup = (res, ip) ->
    # console.log "geo lookup:", ip
    city.lookup ip, (err, data) ->
        unless err
            data.ip = ip
            got_data.call res, data
        else not_found.call res, "IP #{ip} wasn't found in database", err

not_found = (message, err) ->
    @status 404
    @send "#{message}\n"
    @end()

got_data = (geodata) ->
    @status 200
    @send JSON.stringify geodata
    @end()
