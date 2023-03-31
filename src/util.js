const error = message => ({ error: message })

function prepareGeo(geoData, ips) {
  const response = []

  let { city, subdivisions, postal, country, registered_country } = geoData

  if (city) {
    city = city.names.en
    response.push(['city', city])
  }

  country = country || registered_country
  if (country) {
    response.push(['country_code', country.iso_code])
    response.push(['country_name', country.names.en])
  }

  if (subdivisions) {
    const region = subdivisions[0].names.en
    // don't need regions same as city and number-only ones
    if (city != region && !/^\d+$/.test(region)) {
      response.push(['region', region])
    }
  }

  postal && response.push(['postal_code', postal.code])

  response.push(['ip', ips[0]])

  return response
    .filter(([, value]) => Boolean(value))
    .reduce((_, [key, value]) => ({ ..._, [key]: value }), {})
}

module.exports = { prepareGeo, error }
