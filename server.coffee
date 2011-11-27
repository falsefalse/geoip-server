#!/usr/bin/env coffee

DATABASE_PATH = "#{__dirname}/database"

bogart = require "bogart"
dns = require "dns"
city = new (require "geoip").City "#{DATABASE_PATH}/GeoLiteCity.dat"

app = bogart.router()
app.get "/", (req) ->
    bogart.html "Hello, world!"

app.get "/favicon.ico", (req) ->
    bogart.html "Nope", { status: 404 }

# match 4 groups of 3 digits separated by 3 commas
app.get /((\d{1,3}(\.|$)){4})/, (req, ip) ->
    res = bogart.response()
    lookup res, ip
    res

app.get "/:domain", (req, domain) ->
    # console.log "dns lookup:", domain
    res = bogart.response()
    dns.resolve4 domain, (err, address) ->
        unless err
            lookup res, address[0]
        else
            not_found.call res, err
    res

bogart.start app, { port: 8080 }

lookup = (res, ip) ->
    # console.log "geo lookup:", ip
    city.lookup ip, (err, data) ->
        unless err
            data.ip = ip
            got_data.call res, data
        else not_found.call res, err

not_found = (err) ->
    @status 404
    @send err.message
    @end()

got_data = (geodata) ->
    @status 200
    @send JSON.stringify geodata
    @end()
