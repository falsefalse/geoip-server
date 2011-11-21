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

app.get /((\d{1,3}\.?){4})/, (req, ip) ->
    lookup ip, bogart.response()

app.get "/:domain", (req, domain) ->
    # console.log "dns lookup:", domain
    res = bogart.response()
    dns.resolve4 domain, (err, address) ->
        unless err
            lookup address[0], res
        else
            not_found err, res
    res

bogart.start app, { port: 8001 }

lookup = (ip, res) ->
    # console.log "geo lookup:", ip
    city.lookup ip, (err, data) ->
        data.ip = ip
        unless err then found data, res else not_found err, res
    res

not_found = (err, res) ->
    res.status 404
    res.send err.message
    res.end()

found = (data, res) ->
    res.status 200
    res.send JSON.stringify data
    res.end()
