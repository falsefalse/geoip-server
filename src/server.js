const express = require('express')
const dns = require('dns')
const fs = require('fs')
const maxmind = require('maxmind')

const mmCity = new maxmind.Reader(fs.readFileSync('./db/GeoLite2-City.mmdb'))

function prepareResponse(geoData, ips) {
  const response = []

  let { city, subdivisions, postal, country, registered_country } = geoData

  city && response.push(['city', city.names.en])

  country = country || registered_country
  if (country) {
    response.push(['country_code', country.iso_code])
    response.push(['country_name', country.names.en])
  }

  subdivisions && response.push(['region', subdivisions[0].names.en])

  postal && response.push(['postal_code', postal.code])

  response.push(['ip', ips[0]])

  return response.reduce((acc, pair) => {
    if (pair[1]) acc[pair[0]] = pair[1]
    return acc
  }, {})
}

function error(message) {
  return { error: message }
}

const app = express()

app.get('/', (req, res) => {
  res.send('<code>EHLO</code>')
})

app
  // IPs, match 4 groups of 3 integers exactly
  .get(/\/((\d{1,3}\.){3}\d+)$/, (req, res, next) => {
    res.locals.ips = [req.params[0]]
    next()
  })

  // Domains
  .get('/:domain', (req, res, next) => {
    if (res.locals.ips) return next()

    dns.resolve4(req.params.domain, (err, ips) => {
      if (err)
        return res
          .status(404)
          .send(error('"%s" was not resolved'.replace('%s', req.params.domain)))

      res.locals.ips = ips
      next()
    })
  })

  // Read geo data
  .use((req, res) => {
    const ips = res.locals.ips

    if (!ips) {
      return res.status(404).send(error('Could not parse domain or IP address'))
    }

    const byCity = ips.map(ip => mmCity.get(ip)).filter(Boolean)

    if (!byCity.length) {
      return res.status(404).send({
        ip: ips[0],
        ...error('IP address was not found in database')
      })
    }

    return res.status(200).send(prepareResponse(byCity[0], ips))
  })

let [_node, _script, ...[port = 8080]] = process.argv
app.listen(port, console.log.bind(console, 'Listening on port ' + port))
