const express = require('express')
const maxmind = require('maxmind')
const cors = require('cors')
const dns = require('dns')
const fs = require('fs')

const { prepareGeo, error } = require('./util.js')

const mmCity = new maxmind.Reader(fs.readFileSync('./db/GeoLite2-City.mmdb'))

const CORS = {
  origin: '*'
}

const app = express()

app.get('/', (req, res) => {
  res.send('<code>EHLO</code>')
})

app.use(cors(CORS))

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

    return res.status(200).send(prepareGeo(byCity[0], ips))
  })

let [_node, _script, ...[port = 8080]] = process.argv
app.listen(port, console.log.bind(console, 'Listening on port ' + port))
