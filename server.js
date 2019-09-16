var express = require('express')
var dns = require('dns')
var fs = require('fs')
var maxmind = require('maxmind')

var config = require('./config.json')

var city = new maxmind.Reader(fs.readFileSync(config.db.city))

function prepareResponse(geoData, ips) {
  var response = []

  geoData.city &&
    response.push(['city', geoData.city.names.en])

  if (geoData.country) {
    response.push(['country_code', geoData.country.iso_code])
    response.push(['country_name', geoData.country.names.en])
  }

  geoData.subdivisions &&
    response.push(['region', geoData.subdivisions[0].names.en])

  geoData.postal &&
    response.push(['postal_code', geoData.postal.code])

  response.push(['ip', ips[0]])

  return response.reduce((acc, pair) => {
    acc[pair[0]] = pair[1]
    return acc
  }, {})
}

var app = express()

app.get('/', function(req, res) {
  res.send('EHLO')
})

app
  // IPs, match 4 groups of 3 integers exactly
  .get(/\/((\d{1,3}\.){3}\d+)$/, function(req, res, next) {
    res.locals.ips = [req.params[0]]
    next()
  })

  // Domains
  .get('/:domain', function(req, res, next) {
    if (res.locals.ips) return next()

    dns.resolve4(req.params.domain, function(err, ips) {
      if (err)
        return res.status(404)
          .send({ error: '"%s" was not resolved'.replace('%s', req.params.domain) })

      res.locals.ips = ips
      next()
    })
  })

  // Read geo data
  .use(function(req, res, next) {
    var ips = res.locals.ips
    var byCity = ips.map(ip => city.get(ip)).filter(Boolean)

    if (!byCity.length) {
      return res.status(404)
        .send({
          ip: ips[0],
          error: 'IP address was not found in database')
        })
    }

    return res
      .status(200)
      .send(
        JSON.stringify(prepareResponse(byCity[0], ips))
      )
  })

app.listen(config.port,
           console.log.bind(console, 'Listening on port ' + config.port))
