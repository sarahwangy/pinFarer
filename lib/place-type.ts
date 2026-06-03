const PROPERTY_PATTERNS = [
  /\d+/,
  /\b(street|st|avenue|ave|road|rd|drive|dr|court|ct|lane|ln|way|place|pl|crescent|cres|boulevard|blvd|terrace|tce|close|cl|grove|gr)\b/i,
  /[号室栋]/,
]

export function detectPlaceType(name: string): 'city' | 'property' {
  return PROPERTY_PATTERNS.some(re => re.test(name)) ? 'property' : 'city'
}
