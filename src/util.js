const error = message => ({ error: message })

function prepareGeo(geoData, ips) {
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

module.exports = { prepareGeo, error }
