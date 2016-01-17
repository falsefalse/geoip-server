var config = require('./config.json')
var express = require('express')
var dns = require('dns')
var geoip = require('geoip')
var geoCity = new geoip.City(config.db.path)

var app = express()

app.get('/', function(req, res) {
  res.send(['Hello', geoip.versions])
})

app
  // IPs, match 4 groups of 3 integers exactly
  .use(/\/((\d{1,3}\.){3}\d+)$/, function(req, res, next) {
    res.locals.ips = [req.params[0]]
    next()
  })

  // Domains
  .use('/:domain', function(req, res, next) {
    dns.resolve4(req.params.domain, function(err, ips) {
      if (err)
        return res.status(404)
          .send('"%s" was not resolved'.replace('%s', req.params.domain))

      res.locals.ips = ips
      next()
    })
  })

  // Read geo data
  .use(function(req, res, next) {
    var ip = res.locals.ips[0]
    geoCity.lookup(ip, function(err, geoData) {
      if (err || !geoData)
        return res.status(404)
          .send(err || 'IP %s was not found in database'.replace('%s', ip))

      geoData.ip = ip
      res.status(200).send(geoData)
    })
  })

app.listen(config.port,
           console.log.bind(console, 'Listening on port ' + config.port))
