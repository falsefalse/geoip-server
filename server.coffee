#!/usr/bin/env coffee

DATABASE_PATH = "#{__dirname}/database"

http = require "http"
dns = require "dns"
city = new (require "geoip").City "#{DATABASE_PATH}/GeoLiteCity.dat"

re = /(\d{1,3}\.?){4}/

lookup = (ip, response) ->
    # console.log "geo lookup:", ip
    city.lookup ip, (error, data) ->
        if error
            not_found response, error
        else
            found response, data

not_found = (response, error) ->
    response.writeHead 500,
        'Content-Type': 'text/plain'
        'Content-Length': error.message.length
    response.end error.message

found = (response, data) ->
    json = JSON.stringify data

    response.writeHead 200,
        'Content-Type': 'text/plain'
        'Content-Length': json.length
    response.end json

server = http.createServer (request, response) ->
    # console.log request.method, request.url
    domain = request.url[1..]

    if domain == ''
        response.writeHead 200,
            'Content-Type': 'text/plain'
        response.end "Hello world!\n"
        return


    if domain == 'favicon.ico'
        return not_found response, new Error "Fuck you"

    if re.test domain
        lookup domain, response
    else
        # console.log "dns:", domain
        dns.resolve4 domain, (error, address) ->
            unless error
                # console.log "resolved:", address
                lookup address[0], response
            else
                not_found response, error

server.listen 8001
console.log "geoip-server running on port 8001"