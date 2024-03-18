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

const dbInfo = {
  created: buildEpoch,
  updated: ctimeDb,
  lastCheck: ctimeLock
}

const stats = {
  ipRequests: 0,
  domainRequests: 0,
  dnsResolved: 0,
  dnsNotFound: 0,
  geoResolved: 0,
  geoNotFound: 0
}

const dbInfoTemplate = dbInfoHtml => `
  <details open>
    <summary>maxmind database 🌍</summary>

    <pre>${dbInfoHtml}</pre>
  </details>
`

const statsTemplate = statsHtml => `
  <details open>
    <summary>last day usage 📋</summary>

    <pre>${statsHtml}</pre>
  </details>
`

const recordToText = (record, valueFn) =>
  Object.entries(record)
    .map(([key, value]) => `${key}:\t${valueFn ? valueFn(value) : value}`)
    .join('\n')

const indexContentTemplate = ({ dbInfo, stats }) =>
  [
    dbInfoTemplate(recordToText(dbInfo, v => new Date(v).toUTCString())),
    statsTemplate(recordToText(stats))
  ].join('\n')

const storeLink =
  'https://chrome.google.com/webstore/detail/dmchcmgddbhmbkakammmklpoonoiiomk'
const indexTemplate = content => `
  <title>EHLO</title>

  <code>
    <h3>YES</h3>

    <small>
      <p>This is <a href="${storeLink}" target="_blank">Yet Another Flags</a> back end service.</p>

      ${content}
    </small>
  </code>
`

const app = express()

app.get('/', (_req, res) => {
  res.send(indexTemplate(indexContentTemplate({ dbInfo, stats })))
})

const CORS = {
  origin: '*'
}

app.use(cors(CORS))

app
  // IPs, match 4 groups of 3 integers exactly
  .get(/\/((\d{1,3}\.){3}\d{1,3})$/, (req, res, next) => {
    res.locals.ips = [req.params[0]]
    stats.ipRequests++
    next()
  })

  // Domains
  .get('/:domain', (req, res, next) => {
    if (res.locals.ips) return next()

    stats.domainRequests++
    dns.resolve4(req.params.domain, (err, ips) => {
      if (err) {
        stats.dnsNotFound++
        return res
          .status(404)
          .send(
            error(
              'Domain "%s" was not resolved'.replace('%s', req.params.domain)
            )
          )
      }

      stats.dnsResolved++
      res.locals.ips = ips
      next()
    })
  })

  // Read geo data
  .use((_req, res) => {
    const ips = res.locals.ips

    if (!ips) {
      return res.status(404).send(error('Could not parse domain or IP address'))
    }

    const [cityData, ..._] = ips.map(ip => mmCity.get(ip)).filter(Boolean)

    if (!cityData) {
      stats.geoNotFound++
      return res.status(404).send({
        ip: ips[0],
        ...error('IP address was not found in database')
      })
    }

    stats.geoResolved++
    return res.status(200).send(prepareGeo(cityData, ips))
  })

// we are behind nginx anyway
const [host, port] = ['0.0.0.0', 8080]
app.listen(port, host, () => {
  console.log()
  console.log('Started at', new Date().toUTCString())
  console.log('Listening on %s:%s', host, port)
})
