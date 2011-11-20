#!/usr/bin/env coffee

DATABASE_PATH = "./database"

http = require "http"
city = new (require "geoip").City "#{DATABASE_PATH}/GeoLiteCity.dat"

server = http.createServer (request, response) ->
    # console.log request.method, request.url
    domain = request.url[1..]

    city.lookup domain, (err, data) ->
        if err
            response.writeHead 500,
                'Content-Type': 'text/plain'
                'Content-Length': err.toString().length
            response.end err.toString()
        
        json = JSON.stringify data
        response.writeHead 200,
            'Content-Type': 'text/javascript'
            'Content-Length': json.length
        response.end json

server.listen 8001