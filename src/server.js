const express = require('express')
const maxmind = require('maxmind')
const cors = require('cors')
const dns = require('dns')
const fs = require('fs')

const { prepareGeo, error } = require('./util.js')

const db = './db/GeoLite2-City.mmdb'
const lockfile = 'db/.geoipupdate.lock'
const mmCity = new maxmind.Reader(fs.readFileSync(db))

const { buildEpoch } = mmCity.metadata
const { ctime: ctimeDb } = fs.statSync(db)
const { ctime: ctimeLock } = fs.statSync(lockfile)

let meta = Object.entries({
  created: buildEpoch,
  updated: ctimeDb,
  last_check: ctimeLock
})
  .map(([key, value]) => `${key}: ${new Date(value).toUTCString()}`)
  .join('\n')
meta = `<details><summary>db info</summary><pre>${meta}</pre></details>`

const app = express()

app.get('/', (req, res) => {
  res.send(
    `<title>EHLO</title><code><h3>YES</h3> <small>${meta}</small></code>`
  )
})

const CORS = {
  origin: '*'
}

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

    const [cityData, ..._] = ips.map(ip => mmCity.get(ip)).filter(Boolean)

    if (!cityData) {
      return res.status(404).send({
        ip: ips[0],
        ...error('IP address was not found in database')
      })
    }

    return res.status(200).send(prepareGeo(cityData, ips))
  })

// we are behind nginx anyway
const [host, port] = ['localhost', 8080]
app.listen(port, host, () => {
  console.log()
  console.log('Started at', new Date().toUTCString())
  console.log('Listening on port ', port)
})
