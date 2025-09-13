import { performAgentHealthCheck } from '@/lib/utils/healthCheck'
import { formatList, formatScore, createSectionHeader, formatMetrics } from '@/lib/utils/formatOutput'
import { truncateToWordLimit } from '@/lib/utils/wordCount'

/**
 * Weather Agent - Fetches weather data for event planning using OpenWeatherMap API
 * @param payload - Contains location, date, and event details
 * @returns Weather analysis and recommendations
 */
export async function run(payload: any): Promise<any> {
  const { location, date, eventType } = payload

  if (!location || !date) {
    throw new Error('Location and date are required for weather analysis')
  }

  const weatherApiKey = process.env.WEATHER_API_KEY
  if (!weatherApiKey) {
    console.warn('WEATHER_API_KEY not configured - using fallback weather analysis')
    return generateFallbackWeatherAnalysis(payload)
  }

  try {
    // First, get coordinates for the location using OpenWeatherMap Geocoding API
    const geocodeResponse = await fetchWithRetry(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${weatherApiKey}`,
      2,
      8000
    )

    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding API error: ${geocodeResponse.status}`)
    }

    const geocodeData = await geocodeResponse.json()
    if (!geocodeData || geocodeData.length === 0) {
      throw new Error(`Location "${location}" not found`)
    }

    const { lat, lon } = geocodeData[0]

    // Get current weather and forecast data
    const weatherResponse = await fetchWithRetry(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`,
      2,
      8000
    )

    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`)
    }

    const weatherData = await weatherResponse.json()
    
    // Find the forecast closest to the event date
    const eventDate = new Date(date)
    const eventTimestamp = eventDate.getTime()
    
    let closestForecast = weatherData.list[0]
    let minTimeDiff = Math.abs(new Date(closestForecast.dt * 1000).getTime() - eventTimestamp)
    
    for (const forecast of weatherData.list) {
      const forecastTime = new Date(forecast.dt * 1000).getTime()
      const timeDiff = Math.abs(forecastTime - eventTimestamp)
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff
        closestForecast = forecast
      }
    }

    const { main, weather, wind } = closestForecast
    const temperature = main.temp
    const humidity = main.humidity
    const condition = weather[0].main
    const description = weather[0].description
    const windSpeed = wind.speed

    // Generate recommendations based on weather
    let recommendations = []
    
    // Temperature-based recommendations
    if (temperature < 10) {
      recommendations.push("Consider indoor venue or provide heating")
    } else if (temperature > 30) {
      recommendations.push("Ensure adequate shade and hydration stations")
    } else if (temperature >= 10 && temperature <= 30) {
      recommendations.push("Temperature is ideal for outdoor events")
    }

    // Humidity-based recommendations
    if (humidity > 80) {
      recommendations.push("High humidity expected - consider ventilation")
    } else if (humidity < 40) {
      recommendations.push("Low humidity - ensure hydration stations are available")
    } else {
      recommendations.push("Humidity levels are comfortable for outdoor activities")
    }

    // Wind-based recommendations
    if (windSpeed > 10) {
      recommendations.push("High winds expected - secure outdoor equipment and decorations")
    } else if (windSpeed > 5) {
      recommendations.push("Moderate winds - secure lightweight items and decorations")
    } else {
      recommendations.push("Light winds - minimal impact on outdoor setup")
    }

    // Weather condition recommendations
    if (condition.toLowerCase().includes('rain')) {
      recommendations.push("Rain expected - prepare backup indoor plan")
    } else if (condition.toLowerCase().includes('snow')) {
      recommendations.push("Snow expected - ensure safe pathways and parking")
    } else if (condition.toLowerCase().includes('thunderstorm')) {
      recommendations.push("Thunderstorms possible - consider postponing outdoor activities")
    } else if (condition.toLowerCase().includes('clear') || condition.toLowerCase().includes('sunny')) {
      recommendations.push("Clear skies expected - ideal conditions for outdoor events")
    } else if (condition.toLowerCase().includes('cloudy') || condition.toLowerCase().includes('partly')) {
      recommendations.push("Cloudy conditions - good for outdoor events with some shade")
    }

    // Always ensure we have at least 2 recommendations
    if (recommendations.length < 2) {
      recommendations.push("Monitor weather forecasts closer to event date")
      recommendations.push("Have contingency plans ready for unexpected weather changes")
    }

    // Format the analysis as clean markdown
    const analysis = `Location: ${location}
Date: ${date}

## Current Forecast

Temperature: ${temperature.toFixed(1)}°C (${temperature < 10 ? 'Cold' : temperature > 30 ? 'Hot' : 'Comfortable'})
Conditions: ${condition} - ${description}
Wind: ${windSpeed} m/s (${windSpeed > 10 ? 'Strong' : windSpeed > 5 ? 'Moderate' : 'Light'})
Humidity: ${humidity}% (${humidity > 80 ? 'High' : humidity < 40 ? 'Low' : 'Moderate'})

## Impact Assessment

Overall Suitability: ${getWeatherSuitability(temperature, humidity, windSpeed, condition)}
Risk Level: ${getRiskLevel(condition, windSpeed)}

## Key Recommendations

${recommendations.slice(0, 2).join('\n')}`

    return {
      location,
      date,
      analysis: truncateToWordLimit(analysis, 250),
      metadata: {
        dataSource: 'OpenWeatherMap API',
        timestamp: new Date().toISOString(),
        confidence: 95
      }
    }
  } catch (error) {
    console.error('Weather agent error:', error)
    return {
      location,
      date,
      error: `Unable to fetch weather data for ${location}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      fallback: true,
      metadata: {
        dataSource: 'Fallback Analysis',
        timestamp: new Date().toISOString(),
        confidence: 60
      }
    }
  }
}

/**
 * Fetch with retry logic and timeout
 */
async function fetchWithRetry(url: string, maxRetries: number, timeout: number): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  throw new Error('Max retries exceeded')
}

/**
 * Get weather suitability rating
 */
function getWeatherSuitability(temp: number, humidity: number, windSpeed: number, condition: string): string {
  let score = 0
  
  // Temperature scoring
  if (temp >= 15 && temp <= 25) score += 3
  else if (temp >= 10 && temp <= 30) score += 2
  else if (temp >= 5 && temp <= 35) score += 1
  
  // Humidity scoring
  if (humidity >= 40 && humidity <= 70) score += 2
  else if (humidity >= 30 && humidity <= 80) score += 1
  
  // Wind scoring
  if (windSpeed <= 5) score += 2
  else if (windSpeed <= 10) score += 1
  
  // Condition scoring
  if (condition.toLowerCase().includes('clear') || condition.toLowerCase().includes('sunny')) score += 2
  else if (condition.toLowerCase().includes('cloudy') || condition.toLowerCase().includes('partly')) score += 1
  else if (condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('storm')) score -= 2
  
  if (score >= 7) return 'Excellent'
  if (score >= 5) return 'Good'
  if (score >= 3) return 'Fair'
  if (score >= 1) return 'Poor'
  return 'Very Poor'
}

/**
 * Get risk level assessment
 */
function getRiskLevel(condition: string, windSpeed: number): string {
  if (condition.toLowerCase().includes('thunderstorm') || windSpeed > 15) return 'High'
  if (condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('snow') || windSpeed > 10) return 'Medium'
  return 'Low'
}

/**
 * Get comfort index (1-10)
 */
function getComfortIndex(temp: number, humidity: number, windSpeed: number): number {
  let index = 5 // Base score
  
  // Temperature adjustment
  if (temp >= 18 && temp <= 24) index += 2
  else if (temp >= 15 && temp <= 27) index += 1
  else if (temp < 10 || temp > 32) index -= 2
  else if (temp < 15 || temp > 28) index -= 1
  
  // Humidity adjustment
  if (humidity >= 40 && humidity <= 60) index += 1
  else if (humidity > 80 || humidity < 30) index -= 1
  
  // Wind adjustment
  if (windSpeed <= 3) index += 1
  else if (windSpeed > 10) index -= 1
  
  return Math.max(1, Math.min(10, index))
}

/**
 * Get best time of day recommendation
 */
function getBestTimeOfDay(temp: number, condition: string): string {
  if (condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('storm')) {
    return 'Indoor venue recommended'
  }
  if (temp > 30) {
    return 'Early morning or late afternoon (avoid 12-4 PM)'
  }
  if (temp < 10) {
    return 'Midday when temperatures are warmest'
  }
  return 'Any time of day should be comfortable'
}

/**
 * Get equipment needs
 */
function getEquipmentNeeds(condition: string, windSpeed: number): string {
  const needs = []
  
  if (condition.toLowerCase().includes('rain')) needs.push('Covered areas or tents')
  if (condition.toLowerCase().includes('sun')) needs.push('Shade structures')
  if (windSpeed > 5) needs.push('Wind barriers or secure equipment')
  if (condition.toLowerCase().includes('snow')) needs.push('Heating and snow removal equipment')
  
  return needs.length > 0 ? needs.join(', ') : 'Standard outdoor equipment'
}

/**
 * Get backup plan recommendation
 */
function getBackupPlan(condition: string): string {
  if (condition.toLowerCase().includes('thunderstorm')) {
    return 'Indoor venue or postponement strongly recommended'
  }
  if (condition.toLowerCase().includes('rain')) {
    return 'Covered areas or indoor backup venue'
  }
  if (condition.toLowerCase().includes('snow')) {
    return 'Indoor venue or heated outdoor areas'
  }
  return 'Current conditions should be manageable'
}

/**
 * Get most common element in array
 */
function getMostCommon(arr: string[]): string {
  const counts: { [key: string]: number } = {}
  arr.forEach(item => {
    counts[item] = (counts[item] || 0) + 1
  })
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
}

/**
 * Generate fallback weather analysis when API is unavailable
 */
function generateFallbackWeatherAnalysis(payload: any): string {
  const { location, date, eventType } = payload
  
  // Generate reasonable fallback weather data based on location and season
  const eventDate = new Date(date)
  const month = eventDate.getMonth()
  const isSummer = month >= 5 && month <= 8
  const isWinter = month >= 11 || month <= 2
  
  // Estimate temperature based on season and location
  let estimatedTemp = 20 // Default moderate temperature
  if (isSummer) estimatedTemp = 25
  else if (isWinter) estimatedTemp = 10
  
  // Adjust for location (rough estimates)
  if (location.toLowerCase().includes('new york') || location.toLowerCase().includes('nyc')) {
    if (isSummer) estimatedTemp = 28
    else if (isWinter) estimatedTemp = 5
  } else if (location.toLowerCase().includes('california') || location.toLowerCase().includes('los angeles')) {
    if (isSummer) estimatedTemp = 30
    else if (isWinter) estimatedTemp = 18
  }
  
  const estimatedHumidity = isSummer ? 65 : 55
  const estimatedWindSpeed = 3
  const estimatedCondition = isSummer ? 'Clear' : 'Partly Cloudy'
  const estimatedDescription = isSummer ? 'clear sky' : 'partly cloudy'
  
  return `Location: ${location}  
Date: ${date}  
Event Type: ${eventType}

## Estimated Forecast

Temperature: ${estimatedTemp}°C (${estimatedTemp < 10 ? 'Cold' : estimatedTemp > 30 ? 'Hot' : 'Comfortable'})
Conditions: ${estimatedCondition} - ${estimatedDescription}
Wind: ${estimatedWindSpeed} m/s (${estimatedWindSpeed > 10 ? 'Strong' : estimatedWindSpeed > 5 ? 'Moderate' : 'Light'})
Humidity: ${estimatedHumidity}% (${estimatedHumidity > 80 ? 'High' : estimatedHumidity < 40 ? 'Low' : 'Moderate'})

## Impact Assessment

Overall Suitability: ${getWeatherSuitability(estimatedTemp, estimatedHumidity, estimatedWindSpeed, estimatedCondition)}
Risk Level: ${getRiskLevel(estimatedCondition, estimatedWindSpeed)}

## Key Recommendations

Monitor local weather forecasts closer to event date
Prepare backup plans for unexpected weather changes
Consider indoor venue options for weather contingency
Plan for temperature-appropriate clothing and equipment
Establish communication plan for weather-related updates

Note: This is estimated data. Configure WEATHER_API_KEY for real-time forecasts.`
}

/**
 * Health check for Weather Agent
 */
export async function healthCheck() {
  return await performAgentHealthCheck('weather')
}
